import { internalMutation } from "./_generated/server";

export const migrateProductsOrderAndVisibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

    // Sort: bestsellers first, then alphabetical by name (same as catalog)
    const sorted = [...products].sort((a, b) => {
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
    }
    return { migrated: sorted.length };
  },
});
