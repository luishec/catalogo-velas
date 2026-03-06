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

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

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

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  const salt = generateToken().slice(0, 32);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return salt + ":" + hashHex;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
}
