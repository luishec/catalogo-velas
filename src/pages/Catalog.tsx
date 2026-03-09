import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CatalogHeader } from '../components/CatalogHeader';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { ProductGrid } from '../components/ProductGrid';
import type { Product, Category } from '../types';

export function Catalog() {
  const productsData = useQuery(api.products.list);
  const categoriesData = useQuery(api.categories.list);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (categories.length > 0 && selectedCategory === null) {
      setSelectedCategory(categories[0]._id);
    }
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchTerm === '' ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === null) {
        return true;
      }

      const category = categories.find(c => c._id === selectedCategory);
      if (category?.name === 'MÁS VENDIDO') {
        return product.isBestseller;
      }

      return product.categoryId === selectedCategory;
    });
  }, [products, searchTerm, selectedCategory, categories]);

  const selectedCategoryName = useMemo(() => {
    return selectedCategory
      ? categories.find(c => c._id === selectedCategory)?.name || null
      : null;
  }, [selectedCategory, categories]);

  const productCounts = useMemo(() => {
    return categories.reduce((acc, category) => {
      if (category.name === 'MÁS VENDIDO') {
        acc[category._id] = products.filter(p => p.isBestseller).length;
      } else {
        acc[category._id] = products.filter(p => p.categoryId === category._id).length;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [categories, products]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
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
      <CatalogHeader />

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            productCounts={productCounts}
          />

          <ProductGrid
            products={filteredProducts}
            categoryName={selectedCategoryName}
          />
        </div>
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
