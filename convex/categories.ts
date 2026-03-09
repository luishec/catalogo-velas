import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertAdmin } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_priority").collect();
  },
});

export const remove = mutation({
  args: { token: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const categories = await ctx.db.query("categories").collect();
    const category = categories.find((c) => c.name === args.name);
    if (!category) throw new Error("Category not found");
    await ctx.db.delete(category._id);
  },
});
