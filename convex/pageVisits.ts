import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const record = mutation({
  args: {
    userAgent: v.string(),
    pagePath: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pageVisits", {
      userAgent: args.userAgent,
      pagePath: args.pagePath,
    });
  },
});
