import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./auth";

export const getImageSizes = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const sizes: Record<string, number> = {};
    for (const id of args.storageIds) {
      if (!id) continue;
      try {
        const meta = await ctx.storage.getMetadata(id as any);
        if (meta) {
          sizes[id] = meta.size;
        }
      } catch {
        // Skip invalid storage IDs
      }
    }
    return sizes;
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});
