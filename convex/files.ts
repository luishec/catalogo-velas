import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertAdmin } from "./auth";

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});
