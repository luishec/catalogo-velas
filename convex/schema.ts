import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    priority: v.number(),
    emoji: v.optional(v.string()),
  }).index("by_priority", ["priority"]),

  products: defineTable({
    code: v.string(),
    name: v.string(),
    categoryId: v.optional(v.id("categories")),
    isBestseller: v.boolean(),
    imageUrls: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.string())),
    subcategories: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
  })
    .index("by_code", ["code"])
    .index("by_category", ["categoryId"])
    .index("by_order", ["order"]),

  admins: defineTable({
    email: v.string(),
    passwordHash: v.string(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    adminId: v.id("admins"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
