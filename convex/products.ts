import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").withIndex("by_order").collect();
  },
});

export const add = mutation({
  args: {
    token: v.string(),
    code: v.string(),
    name: v.string(),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);

    const existing = await ctx.db
      .query("products")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) throw new Error("Product code already exists");

    return await ctx.db.insert("products", {
      code: args.code,
      name: args.name,
      categoryId: args.categoryId,
      isBestseller: false,
      imageUrls: [],
      imageStorageIds: [],
      subcategories: [],
      order: Date.now(),
      isVisible: true,
    });
  },
});

export const remove = mutation({
  args: { token: v.string(), productId: v.id("products") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const product = await ctx.db.get(args.productId);
    if (product?.imageStorageIds) {
      for (const storageId of product.imageStorageIds) {
        if (storageId) {
          await ctx.storage.delete(storageId as any);
        }
      }
    }
    await ctx.db.delete(args.productId);
  },
});

export const toggleBestseller = mutation({
  args: { token: v.string(), productId: v.id("products") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.productId, { isBestseller: !product.isBestseller });
  },
});

export const updateSubcategories = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    subcategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    await ctx.db.patch(args.productId, {
      subcategories: args.subcategories,
    });
  },
});

export const toggleVisibility = mutation({
  args: { token: v.string(), productId: v.id("products") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    const currentlyVisible = product.isVisible !== false;
    await ctx.db.patch(args.productId, { isVisible: !currentlyVisible });
  },
});

export const reorder = mutation({
  args: {
    token: v.string(),
    updates: v.array(v.object({ productId: v.id("products"), order: v.number() })),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    for (const { productId, order } of args.updates) {
      await ctx.db.patch(productId, { order });
    }
  },
});

export const updateProductImage = mutation({
  args: {
    token: v.string(),
    productId: v.id("products"),
    imageIndex: v.number(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const storageIds = [...(product.imageStorageIds || [])];
    const urls = [...(product.imageUrls || [])];

    while (storageIds.length <= args.imageIndex) storageIds.push("");
    while (urls.length <= args.imageIndex) urls.push("");

    storageIds[args.imageIndex] = args.storageId;
    const url = await ctx.storage.getUrl(args.storageId as any);
    urls[args.imageIndex] = url || "";

    await ctx.db.patch(args.productId, {
      imageStorageIds: storageIds,
      imageUrls: urls,
    });
  },
});
