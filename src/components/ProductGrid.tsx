import { ProductCard } from './ProductCard';
import type { Product, ProductGroup } from '../types';

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
        isBestseller: product.isBestseller,
        mainImage: product.imageUrls?.[0] ?? null,
        variants: []
      };
    }

    const subcategories = product.subcategories ?? [];
    const imageUrls = product.imageUrls ?? [];

    subcategories.forEach((subcat, index) => {
      if (subcat) {
        acc[mainName].variants.push({
          product,
          variantName: subcat,
          imageUrl: imageUrls[index] ?? null
        });
      }
    });

    if (acc[mainName].variants.length === 0) {
      acc[mainName].variants.push({
        product,
        variantName: '',
        imageUrl: imageUrls[0] ?? null
      });
    }

    return acc;
  }, {} as Record<string, ProductGroup>);

  const productGroups = Object.values(groupedProducts).sort((a, b) => {
    const orderA = a.variants[0]?.product.order;
    const orderB = b.variants[0]?.product.order;
    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    if (a.isBestseller && !b.isBestseller) return -1;
    if (!a.isBestseller && b.isBestseller) return 1;
    return a.mainName.localeCompare(b.mainName);
  });

  return (
    <div className="flex-1">
      {categoryName && (
        <div className="mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-md text-white text-center">
          <h2 className="text-xl sm:text-2xl font-bold">
            {categoryName}
          </h2>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {productGroups.map((group, groupIdx) => (
          <ProductCard
            key={`${group.mainName}-${groupIdx}`}
            product={{
              _id: group.variants[0].product._id,
              code: group.code,
              name: group.mainName,
              isBestseller: group.isBestseller,
              imageUrl: group.mainImage
            }}
            mainImage={group.mainImage}
            variants={group.variants}
          />
        ))}
      </div>
    </div>
  );
}
