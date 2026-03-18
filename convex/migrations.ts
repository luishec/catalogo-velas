import { internalMutation } from "./_generated/server";

const categoryEmojiMap: Record<string, string> = {
  'NÚMEROS': '🔢',
  'LETRAS': '🔤',
  'FIGURAS': '🎭',
  'MINI VELAS': '🕯️',
  'VELITAS LARGAS': '🕯️',
  'VOLCÁN': '🌋',
};

export const migrateCategoryEmojis = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    let migrated = 0;
    for (const category of categories) {
      const emoji = categoryEmojiMap[category.name];
      if (emoji && !category.emoji) {
        await ctx.db.patch(category._id, { emoji });
        migrated++;
      }
    }
    return { migrated };
  },
});

export const migrateProductsOrderAndVisibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();

    // Group products by categoryId
    const byCategory: Record<string, typeof products> = {};
    for (const product of products) {
      const key = product.categoryId ?? "__none__";
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(product);
    }

    // For each category (ordered by priority), sort products: bestsellers first, then alphabetical
    let migrated = 0;
    const categoryOrder = categories.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    for (const category of categoryOrder) {
      const catProducts = byCategory[category._id] ?? [];
      const sorted = catProducts.sort((a, b) => {
        if (a.isBestseller && !b.isBestseller) return -1;
        if (!a.isBestseller && b.isBestseller) return 1;
        return a.name.localeCompare(b.name);
      });

      let order = 1000;
      for (const product of sorted) {
        await ctx.db.patch(product._id, {
          order,
          isVisible: product.isVisible ?? true,
        });
        order += 1000;
        migrated++;
      }
    }

    // Handle products without category
    const uncategorized = byCategory["__none__"] ?? [];
    let order = 1000;
    for (const product of uncategorized) {
      await ctx.db.patch(product._id, {
        order,
        isVisible: product.isVisible ?? true,
      });
      order += 1000;
      migrated++;
    }

    return { migrated };
  },
});
