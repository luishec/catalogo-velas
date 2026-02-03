import { ProductCard } from './ProductCard';
import type { Product, ProductVariant, ProductGroup } from '../types';

interface ProductGridProps {
  products: Product[];
  categoryName: string | null;
}

export function ProductGrid({ products, categoryName }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-500 text-lg">No se encontraron productos en esta categoría</p>
      </div>
    );
  }

  const groupedProducts = products.reduce((acc, product) => {
    const mainName = product.name;

    if (!acc[mainName]) {
      acc[mainName] = {
        mainName,
        code: product.code,
        is_bestseller: product.is_bestseller,
        mainImage: product.image_url,
        variants: []
      };
    }

    const subcategories = [
      product.subcategory,
      product.subcategory_2,
      product.subcategory_3,
      product.subcategory_4,
      product.subcategory_5,
      product.subcategory_6,
      product.subcategory_7,
    ];

    const imageUrls = [
      product.image_url,
      product.image_url_2,
      product.image_url_3,
      product.image_url_4,
      product.image_url_5,
      product.image_url_6,
      product.image_url_7,
    ];

    subcategories.forEach((subcat, index) => {
      if (subcat) {
        acc[mainName].variants.push({
          product,
          variantName: subcat,
          imageUrl: imageUrls[index]
        });
      }
    });

    if (acc[mainName].variants.length === 0) {
      acc[mainName].variants.push({
        product,
        variantName: '',
        imageUrl: product.image_url
      });
    }

    return acc;
  }, {} as Record<string, ProductGroup>);

  const productGroups = Object.values(groupedProducts).sort((a, b) => {
    if (a.is_bestseller && !b.is_bestseller) return -1;
    if (!a.is_bestseller && b.is_bestseller) return 1;
    return a.mainName.localeCompare(b.mainName);
  });

  return (
    <div className="flex-1">
      {categoryName && (
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg text-white">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <span>🎉</span>
            {categoryName}
          </h2>
          <p className="mt-1 sm:mt-2 text-cyan-50 flex items-center gap-2 text-sm sm:text-base">
            <span>✨</span>
            {products.length} productos disponibles
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {productGroups.map((group, groupIdx) => (
          <ProductCard
            key={`${group.mainName}-${groupIdx}`}
            product={{
              id: group.variants[0].product.id,
              code: group.code,
              name: group.mainName,
              is_bestseller: group.is_bestseller,
              image_url: group.mainImage
            }}
            mainImage={group.mainImage}
            variants={group.variants}
          />
        ))}
      </div>
    </div>
  );
}
