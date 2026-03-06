/**
 * Script de migración: Supabase -> Convex
 *
 * Migra categories, products e imágenes.
 *
 * Uso: node scripts/migrate.mjs
 *
 * Requiere:
 * - .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
 * - .env.local con VITE_CONVEX_URL
 * - Convex backend desplegado (npx convex dev --once)
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Parse env files
function parseEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

const env = { ...parseEnv(resolve(projectRoot, '.env')), ...parseEnv(resolve(projectRoot, '.env.local')) };

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const convexUrl = env.VITE_CONVEX_URL;

if (!supabaseUrl || !supabaseKey || !convexUrl) {
  console.error('Missing env vars. Need VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CONVEX_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const convex = new ConvexHttpClient(convexUrl);

async function uploadImageToConvex(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`  Failed to fetch image: ${imageUrl} (${response.status})`);
      return null;
    }
    const blob = await response.blob();

    // Get upload URL from Convex (using internal mutation without auth for migration)
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, { token: '__MIGRATION__' });

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'image/png' },
      body: blob,
    });

    if (!uploadResponse.ok) {
      console.warn(`  Failed to upload image to Convex: ${imageUrl}`);
      return null;
    }

    const { storageId } = await uploadResponse.json();
    return storageId;
  } catch (error) {
    console.warn(`  Error migrating image ${imageUrl}:`, error.message);
    return null;
  }
}

async function migrate() {
  console.log('=== Migración Supabase -> Convex ===\n');

  // 1. Migrate categories
  console.log('1. Migrando categorías...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('priority');

  if (catError) {
    console.error('Error loading categories:', catError);
    process.exit(1);
  }

  const categoryMap = {}; // old UUID -> new Convex ID

  for (const cat of categories) {
    const newId = await convex.mutation(api.categories.insert, {
      name: cat.name,
      priority: cat.priority,
    });
    categoryMap[cat.id] = newId;
    console.log(`  ✓ ${cat.name} (${cat.id} -> ${newId})`);
  }

  console.log(`  Total: ${categories.length} categorías\n`);

  // 2. Migrate products
  console.log('2. Migrando productos...');
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .order('code');

  if (prodError) {
    console.error('Error loading products:', prodError);
    process.exit(1);
  }

  let imageCount = 0;
  for (const product of products) {
    console.log(`  Producto: ${product.code} - ${product.name}`);

    // Collect image URLs and subcategories
    const oldImageUrls = [
      product.image_url,
      product.image_url_2,
      product.image_url_3,
      product.image_url_4,
      product.image_url_5,
      product.image_url_6,
      product.image_url_7,
    ];

    const subcategories = [
      product.subcategory || '',
      product.subcategory_2 || '',
      product.subcategory_3 || '',
      product.subcategory_4 || '',
      product.subcategory_5 || '',
      product.subcategory_6 || '',
      product.subcategory_7 || '',
    ];

    // Upload images to Convex
    const imageUrls = [];
    const imageStorageIds = [];

    for (let i = 0; i < oldImageUrls.length; i++) {
      const url = oldImageUrls[i];
      if (url) {
        console.log(`    Imagen ${i + 1}: subiendo...`);
        const storageId = await uploadImageToConvex(url);
        if (storageId) {
          imageStorageIds[i] = storageId;
          imageUrls[i] = ''; // Will be resolved by Convex
          imageCount++;
          console.log(`    Imagen ${i + 1}: ✓`);
        } else {
          imageStorageIds[i] = '';
          imageUrls[i] = '';
        }
      } else {
        imageStorageIds[i] = '';
        imageUrls[i] = '';
      }
    }

    // Insert product
    const newCategoryId = product.category_id ? categoryMap[product.category_id] : undefined;

    await convex.mutation(api.products.insertMigration, {
      code: product.code,
      name: product.name,
      categoryId: newCategoryId,
      isBestseller: product.is_bestseller || false,
      imageUrls,
      imageStorageIds,
      subcategories,
    });

    console.log(`  ✓ ${product.code}\n`);
  }

  console.log(`\nTotal: ${products.length} productos, ${imageCount} imágenes migradas`);
  console.log('\n=== Migración completada ===');
}

migrate().catch(console.error);
