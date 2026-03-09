import { useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CatalogHeader } from '../components/CatalogHeader';
import { ProductGrid } from '../components/ProductGrid';
import type { Product, Category } from '../types';

export function Catalog() {
  const productsData = useQuery(api.products.list);
  const categoriesData = useQuery(api.categories.list);

  const products = (productsData as Product[] | undefined) ?? [];
  const categories = (categoriesData as Category[] | undefined) ?? [];
  const loading = productsData === undefined || categoriesData === undefined;

  const productsByCategory = useMemo(() => {
    return categories.map((category) => ({
      category,
      products: products.filter(p => p.categoryId === category._id),
    })).filter(group => group.products.length > 0);
  }, [categories, products]);

  const productCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category._id] = products.filter(p => p.categoryId === category._id).length;
      return acc;
    }, {} as Record<string, number>);
  }, [categories, products]);

  const handleScrollToCategory = useCallback((categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CatalogHeader
        categories={categories}
        onSelectCategory={handleScrollToCategory}
        productCounts={productCounts}
      />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {productsByCategory.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {productsByCategory.map(({ category, products: catProducts }) => (
              <section key={category._id} id={`category-${category._id}`} className="scroll-mt-24">
                <ProductGrid
                  products={catProducts}
                  categoryName={category.name}
                />
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t-4 border-cyan-400 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p className="font-semibold">Catálogo Profesional de Velas de Cumpleaños</p>
          <p className="text-sm text-gray-500 mt-1">Para distribuidores y fiesterías</p>
        </div>
      </footer>
    </div>
  );
}
