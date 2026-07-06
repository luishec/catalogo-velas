import { v } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
  internalMutation,
  QueryCtx,
  MutationCtx,
} from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { assertAdmin } from "./auth";

async function findOrphanFiles(ctx: QueryCtx | MutationCtx) {
  const products = await ctx.db.query("products").collect();
  const referencedIds = new Set<string>();
  const referencedUrls = new Set<string>();
  for (const product of products) {
    for (const id of product.imageStorageIds ?? []) if (id) referencedIds.add(id);
    for (const url of product.imageUrls ?? []) if (url) referencedUrls.add(url);
  }

  const files = await ctx.db.system.query("_storage").collect();
  const orphans: {
    storageId: Id<"_storage">;
    url: string | null;
    size: number;
    contentType: string | null;
    uploadedAt: number;
  }[] = [];

  for (const file of files) {
    if (referencedIds.has(file._id)) continue;
    const url = await ctx.storage.getUrl(file._id);
    if (url && referencedUrls.has(url)) continue;
    orphans.push({
      storageId: file._id,
      url,
      size: file.size,
      contentType: file.contentType ?? null,
      uploadedAt: file._creationTime,
    });
  }

  return { totalFiles: files.length, orphans };
}

// Ejecutar con: npx convex run files:orphansReport
export const orphansReport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const { totalFiles, orphans } = await findOrphanFiles(ctx);
    const orphanBytes = orphans.reduce((sum, o) => sum + o.size, 0);
    return {
      totalFiles,
      referencedFiles: totalFiles - orphans.length,
      orphanCount: orphans.length,
      orphanMB: Math.round((orphanBytes / (1024 * 1024)) * 100) / 100,
      orphans,
    };
  },
});

// Ejecutar con: npx convex run files:deleteOrphans
// Recalcula los huérfanos en el momento de borrar, así nunca toca
// archivos referenciados por productos ni el logo
export const deleteOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { orphans } = await findOrphanFiles(ctx);
    let freedBytes = 0;
    for (const orphan of orphans) {
      await ctx.storage.delete(orphan.storageId);
      freedBytes += orphan.size;
    }
    return {
      deleted: orphans.length,
      freedMB: Math.round((freedBytes / (1024 * 1024)) * 100) / 100,
    };
  },
});

export const getImageSizes = query({
  args: { token: v.string(), storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.token);
    const sizes: Record<string, number> = {};
    for (const id of args.storageIds) {
      if (!id) continue;
      try {
        const meta = await ctx.storage.getMetadata(id as Id<"_storage">);
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
