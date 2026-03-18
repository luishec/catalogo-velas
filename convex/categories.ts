import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertAdmin } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").withIndex("by_priority").collect();
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const categories = await ctx.db.query("categories").collect();
    const duplicate = categories.find(
      (c) => c.name.toUpperCase() === args.name.trim().toUpperCase()
    );
    if (duplicate) throw new Error("Ya existe una categoría con ese nombre");
    await ctx.db.insert("categories", {
      name: args.name.trim().toUpperCase(),
      priority: args.priority,
      emoji: args.emoji || undefined,
    });
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
