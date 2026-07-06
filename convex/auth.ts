import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

export const signup = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const existingAdmin = await ctx.db.query("admins").first();
    if (existingAdmin) throw new Error("Admin already configured");

    const passwordHash = await hashPassword(args.password);
    await ctx.db.insert("admins", {
      email: args.email,
      passwordHash,
    });
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!admin) throw new Error("Invalid credentials");

    const isValid = await verifyPassword(args.password, admin.passwordHash);
    if (!isValid) throw new Error("Invalid credentials");

    // Re-hash transparente: migra hashes legados (SHA-256) a PBKDF2
    if (!admin.passwordHash.startsWith("pbkdf2:")) {
      await ctx.db.patch(admin._id, {
        passwordHash: await hashPassword(args.password),
      });
    }

    // Aprovechar el login para purgar sesiones expiradas
    const now = Date.now();
    const allSessions = await ctx.db.query("sessions").collect();
    for (const session of allSessions) {
      if (session.expiresAt < now) await ctx.db.delete(session._id);
    }

    const token = generateToken();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert("sessions", {
      adminId: admin._id,
      token,
      expiresAt,
    });

    return { token, email: admin.email };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) await ctx.db.delete(session._id);
  },
});

export const validateSession = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    const admin = await ctx.db.get(session.adminId);
    if (!admin) return null;
    return { email: admin.email };
  },
});

export async function assertAdmin(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
}

// Iteraciones PBKDF2-SHA256. Debe completarse holgadamente dentro del
// límite de ejecución de mutaciones de Convex (~1s)
const PBKDF2_ITERATIONS = 310000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
}

async function pbkdf2Hex(
  password: string,
  saltHex: string,
  iterations: number
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

// Formato almacenado: pbkdf2:<iteraciones>:<saltHex>:<hashHex>
async function hashPassword(password: string): Promise<string> {
  const saltHex = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2Hex(password, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hash}`;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(new Uint8Array(hashBuffer));
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts[0] === "pbkdf2" && parts.length === 4) {
    const computed = await pbkdf2Hex(password, parts[2], parseInt(parts[1], 10));
    return timingSafeEqualHex(computed, parts[3]);
  }
  // Formato legado: <salt>:<sha256(salt + password)>
  const [salt, hash] = parts;
  const computed = await sha256Hex(salt + password);
  return timingSafeEqualHex(computed, hash);
}
