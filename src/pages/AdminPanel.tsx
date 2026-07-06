import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut, Image as ImageIcon, Plus, Search, Eye, LayoutGrid, List, Settings,
} from 'lucide-react';
import type { Product, Category } from '../types';
import { Id } from '../../convex/_generated/dataModel';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { getImageUrl } from '../components/admin/helpers';
import { SortableProductCard } from '../components/admin/SortableProductCard';
import { SortableListRow } from '../components/admin/SortableListRow';
import { EditProductModal } from '../components/admin/EditProductModal';
import { AddProductModal } from '../components/admin/AddProductModal';
import { AddCategoryModal } from '../components/admin/AddCategoryModal';
import { ManageCategoriesModal } from '../components/admin/ManageCategoriesModal';
import { DeleteProductModal } from '../components/admin/DeleteProductModal';

export function AdminPanel() {
  const { user, signOut, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const productsData = useQuery(api.products.listAdmin, token ? { token } : "skip");
  const categoriesData = useQuery(api.categories.list);

  const addProduct = useMutation(api.products.add);
  const removeProduct = useMutation(api.products.remove);
  const toggleBestsellerMut = useMutation(api.products.toggleBestseller);
  const toggleVisibilityMut = useMutation(api.products.toggleVisibility);
  const reorderMut = useMutation(api.products.reorder);
  const updateSubcategoriesMut = useMutation(api.products.updateSubcategories);
  const updateProductImageMut = useMutation(api.products.updateProductImage);
  const updateProductMut = useMutation(api.products.updateProduct);
  const deleteProductImageMut = useMutation(api.products.deleteProductImage);
  const addCategoryMut = useMutation(api.categories.add);
  const updateCategoryMut = useMutation(api.categories.update);
  const removeCategoryMut = useMutation(api.categories.remove);
  const reorderCategoriesMut = useMutation(api.categories.reorder);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const products = useMemo(() => (productsData as Product[] | undefined) ?? [], [productsData]);
  const categories = useMemo(() => (categoriesData as Category[] | undefined) ?? [], [categoriesData]);
  const dataLoading = productsData === undefined || categoriesData === undefined;

  const allStorageIds = useMemo(
    () => products.flatMap((p) => (p.imageStorageIds ?? []).filter(Boolean)),
    [products]
  );
  const imageSizesGlobal = useQuery(
    api.files.getImageSizes,
    token && allStorageIds.length > 0 ? { token, storageIds: allStorageIds } : "skip"
  );

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<Id<'products'> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);

  // Derivado de los datos reactivos: el modal refleja al instante
  // subidas y borrados de imágenes sin cerrar y reabrir
  const editingProduct = useMemo(
    () => (editingProductId ? products.find((p) => p._id === editingProductId) ?? null : null),
    [editingProductId, products]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Autoguardado con debounce: cambios pendientes por entidad. Si llega una
  // edición de OTRA entidad, se guarda la pendiente de inmediato (flush) en
  // vez de cancelarla — así nunca se pierde un cambio.
  const productPendingRef = useRef<{
    id: Id<'products'>;
    fields: { name?: string; code?: string; categoryId?: string };
  } | null>(null);
  const productTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subcatPendingRef = useRef<{ id: Id<'products'>; values: string[] } | null>(null);
  const subcatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryPendingRef = useRef<{
    id: Id<'categories'>;
    fields: { name?: string; emoji?: string };
  } | null>(null);
  const categoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const flushSubcatSave = useCallback(async () => {
    if (subcatTimerRef.current) {
      clearTimeout(subcatTimerRef.current);
      subcatTimerRef.current = null;
    }
    const pending = subcatPendingRef.current;
    subcatPendingRef.current = null;
    if (!pending || !token) return;
    try {
      await updateSubcategoriesMut({
        token,
        productId: pending.id,
        subcategories: pending.values,
      });
    } catch (error) {
      console.error('Error updating subcategories:', error);
      showMessage('error', 'Error al actualizar las subcategorías');
    }
  }, [token, updateSubcategoriesMut, showMessage]);

  const autoSaveSubcategories = useCallback((productId: Id<'products'>, values: string[]) => {
    if (subcatPendingRef.current && subcatPendingRef.current.id !== productId) {
      void flushSubcatSave();
    }
    subcatPendingRef.current = { id: productId, values };
    if (subcatTimerRef.current) clearTimeout(subcatTimerRef.current);
    subcatTimerRef.current = setTimeout(() => void flushSubcatSave(), 500);
  }, [flushSubcatSave]);

  const flushProductSave = useCallback(async () => {
    if (productTimerRef.current) {
      clearTimeout(productTimerRef.current);
      productTimerRef.current = null;
    }
    const pending = productPendingRef.current;
    productPendingRef.current = null;
    if (!pending || !token) return;
    try {
      await updateProductMut({
        token,
        productId: pending.id,
        ...(pending.fields.name !== undefined ? { name: pending.fields.name } : {}),
        ...(pending.fields.code !== undefined ? { code: pending.fields.code } : {}),
        ...(pending.fields.categoryId !== undefined
          ? { categoryId: pending.fields.categoryId as Id<'categories'> }
          : {}),
      });
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Error al actualizar producto');
    }
  }, [token, updateProductMut, showMessage]);

  const autoSaveProduct = useCallback((
    productId: Id<'products'>,
    fields: { name?: string; code?: string; categoryId?: string },
  ) => {
    if (productPendingRef.current && productPendingRef.current.id !== productId) {
      void flushProductSave();
    }
    const prevFields = productPendingRef.current?.fields ?? {};
    productPendingRef.current = { id: productId, fields: { ...prevFields, ...fields } };
    if (productTimerRef.current) clearTimeout(productTimerRef.current);
    productTimerRef.current = setTimeout(() => void flushProductSave(), 500);
  }, [flushProductSave]);

  const flushCategorySave = useCallback(async () => {
    if (categoryTimerRef.current) {
      clearTimeout(categoryTimerRef.current);
      categoryTimerRef.current = null;
    }
    const pending = categoryPendingRef.current;
    categoryPendingRef.current = null;
    if (!pending || !token) return;
    try {
      await updateCategoryMut({
        token,
        categoryId: pending.id,
        ...(pending.fields.name !== undefined ? { name: pending.fields.name } : {}),
        ...(pending.fields.emoji !== undefined ? { emoji: pending.fields.emoji } : {}),
      });
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Error al actualizar categoría');
    }
  }, [token, updateCategoryMut, showMessage]);

  const autoSaveCategory = useCallback((cat: Category, fields: { name?: string; emoji?: string }) => {
    if (categoryPendingRef.current && categoryPendingRef.current.id !== cat._id) {
      void flushCategorySave();
    }
    const prevFields = categoryPendingRef.current?.fields ?? {};
    categoryPendingRef.current = { id: cat._id, fields: { ...prevFields, ...fields } };
    if (categoryTimerRef.current) clearTimeout(categoryTimerRef.current);
    categoryTimerRef.current = setTimeout(() => void flushCategorySave(), 500);
  }, [flushCategorySave]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verificando sesión...</div>
      </div>
    );
  }

  // === Filtering & Stats ===
  const hasActiveFilter = searchTerm !== '';

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const hiddenCount = products.filter((p) => p.isVisible === false).length;
  const stats = {
    total: products.length,
    missingImages: products.filter((p) => !p.imageUrls?.some(Boolean)).length,
    bestsellers: products.filter((p) => p.isBestseller).length,
    hidden: hiddenCount,
  };

  const productCountsByCategory: Record<string, number> = {};
  products.forEach((p) => {
    if (p.categoryId) {
      productCountsByCategory[p.categoryId] = (productCountsByCategory[p.categoryId] || 0) + 1;
    }
  });

  // === Handlers ===
  const handleImageUpload = async (productId: Id<'products'>, file: File, imageIndex: number) => {
    if (!file.type.startsWith('image/') || !token) {
      showMessage('error', 'Por favor selecciona un archivo de imagen válido');
      return;
    }
    setUploading(`${productId}-${imageIndex}`);
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateProductImageMut({ token, productId, imageIndex, storageId });
      showMessage('success', `Imagen ${imageIndex + 1} subida exitosamente`);
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Error al subir la imagen');
    } finally {
      setUploading(null);
    }
  };

  const toggleBestseller = async (productId: Id<'products'>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await toggleBestsellerMut({ token, productId });
      showMessage('success', 'Estado actualizado');
    } catch (error) {
      console.error('Error updating bestseller:', error);
      showMessage('error', 'Error al actualizar');
    }
  };

  const handleToggleVisibility = async (productId: Id<'products'>, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await toggleVisibilityMut({ token, productId });
      showMessage('success', 'Visibilidad actualizada');
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showMessage('error', 'Error al cambiar visibilidad');
    }
  };

  const handleDeleteProduct = async () => {
    if (!token || !deletingProduct) return;
    try {
      await removeProduct({ token, productId: deletingProduct._id });
      setDeletingProduct(null);
      showMessage('success', 'Producto eliminado');
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('error', 'Error al eliminar el producto');
    }
  };

  const handleAddProduct = async (code: string, name: string, categoryId: string) => {
    if (!token) return;
    try {
      await addProduct({
        token,
        code,
        name,
        categoryId: categoryId as Id<'categories'>,
      });
      setShowAddModal(false);
      showMessage('success', 'Producto agregado');
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', 'Error al agregar el producto');
    }
  };

  const handleDeleteImage = async (productId: Id<'products'>, imageIndex: number, silent = false) => {
    if (!token) return;
    try {
      await deleteProductImageMut({ token, productId, imageIndex });
      if (!silent) showMessage('success', 'Imagen eliminada');
    } catch (error) {
      console.error('Error deleting image:', error);
      if (!silent) showMessage('error', 'Error al eliminar la imagen');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!token) return;
    const catProducts = products.filter((p) => p.categoryId === cat._id);
    if (catProducts.length > 0) {
      showMessage('error', `No se puede eliminar: tiene ${catProducts.length} producto(s) asignado(s)`);
      return;
    }
    try {
      await removeCategoryMut({ token, categoryId: cat._id });
      showMessage('success', 'Categoría eliminada');
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('error', 'Error al eliminar categoría');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getCategoryName = (categoryId?: Id<'categories'>): string => {
    if (!categoryId) return 'Sin categoría';
    return categories.find((c) => c._id === categoryId)?.name || 'Sin categoría';
  };

  const handleAddCategory = async (name: string, emoji: string, priority: number) => {
    if (!token || !name.trim()) return;
    try {
      await addCategoryMut({
        token,
        name,
        emoji: emoji || undefined,
        priority,
      });
      setShowAddCategoryModal(false);
      showMessage('success', 'Categoría agregada');
    } catch (error) {
      console.error('Error adding category:', error);
      showMessage('error', error instanceof Error ? error.message : 'Error al agregar categoría');
    }
  };

  // === Products grouped by category ===
  // El grupo con category null recoge productos sin categoría (o con una
  // categoría borrada) para que nunca queden invisibles en el panel
  const knownCategoryIds = new Set<string>(categories.map((c) => c._id));
  const orphanProducts = filteredProducts.filter(
    (p) => !p.categoryId || !knownCategoryIds.has(p.categoryId)
  );
  const productsByCategory: { category: Category | null; products: Product[] }[] = [
    ...categories.map((category) => ({
      category,
      products: filteredProducts.filter((p) => p.categoryId === category._id),
    })),
    { category: null, products: orphanProducts },
  ].filter((group) => group.products.length > 0);

  // === Drag & Drop ===
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;

    // Find which category this drag belongs to
    const activeProduct = filteredProducts.find((p) => p._id === active.id);
    if (!activeProduct) return;

    const categoryProducts = filteredProducts.filter(
      (p) => p.categoryId === activeProduct.categoryId
    );

    const oldIndex = categoryProducts.findIndex((p) => p._id === active.id);
    const newIndex = categoryProducts.findIndex((p) => p._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryProducts, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({
      productId: p._id,
      order: (i + 1) * 1000,
    }));

    try {
      await reorderMut({ token, updates });
    } catch (error) {
      console.error('Error reordering:', error);
      showMessage('error', 'Error al reordenar productos');
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !token) return;
    const oldIndex = categories.findIndex((c) => c._id === active.id);
    const newIndex = categories.findIndex((c) => c._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    const updates = reordered.map((c, i) => ({ categoryId: c._id, priority: i + 1 }));
    try {
      await reorderCategoriesMut({ token, updates });
    } catch (error) {
      console.error('Error reordering categories:', error);
      showMessage('error', error instanceof Error ? error.message : 'Error al reordenar categorías');
    }
  };

  const activeProduct = activeId ? filteredProducts.find((p) => p._id === activeId) : null;

  // === Loading state ===
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  // === RENDER ===
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {message && (
        <div className="fixed top-4 right-4 z-[60] animate-fade-in">
          <div
            className={`px-5 py-3 rounded-lg shadow-lg border-l-4 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-red-50 border-red-400 text-red-700'
            }`}
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b-4 border-cyan-400 shadow-lg sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Panel de Administración</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">{user.email}</p>
            </div>
            <div className="flex-1 max-w-md mx-2 sm:mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Catálogo</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Category pills */}
            <div className="flex-1 overflow-x-auto pb-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === null
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat._id
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        selectedCategory === cat._id ? 'bg-white/30 text-white' : 'bg-cyan-100 text-cyan-700'
                      }`}
                    >
                      {productCountsByCategory[cat._id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Add buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {/* View mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-cyan-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vista tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-cyan-600 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vista lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setShowManageCategoriesModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Categorías</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar Producto</span>
              </button>
            </div>
          </div>
          {/* Stats */}
          <div className="flex gap-3 sm:gap-4 mt-3 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-500">
            <span>{stats.total} productos</span>
            <span className="text-gray-300">·</span>
            <span className={stats.missingImages > 0 ? 'text-orange-500 font-medium' : ''}>
              {stats.missingImages} sin imagen
            </span>
            <span className="text-gray-300">·</span>
            <span>{stats.bestsellers} más vendidos</span>
            {stats.hidden > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-red-500 font-medium">{stats.hidden} ocultos</span>
              </>
            )}
          </div>
          {/* Drag disabled notice */}
          {hasActiveFilter && (
            <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Reordenar deshabilitado mientras hay búsqueda activa. Quita la búsqueda para reordenar.
            </div>
          )}
        </div>

        {/* Product Grid - grouped by category */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No se encontraron productos</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-cyan-500 hover:text-cyan-600 text-sm"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {productsByCategory.map(({ category, products: catProducts }) => {
              const dndDisabled = hasActiveFilter;
              return (
                <section key={category?._id ?? 'sin-categoria'}>
                  {/* Category header - only when showing all categories */}
                  {selectedCategory === null && (
                    <div className="mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-md flex items-center justify-center gap-3">
                      <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        {category ? category.name : 'Sin categoría'}
                      </h2>
                      <span className="bg-white/25 text-white text-sm font-bold px-3 py-1 rounded-full">
                        {catProducts.length}
                      </span>
                      <button
                        onClick={() => setShowManageCategoriesModal(true)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                        title="Gestionar categorías"
                      >
                        <Settings className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext
                      items={catProducts.map((p) => p._id)}
                      strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                    >
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                          {catProducts.map((product) => (
                            <SortableProductCard
                              key={product._id}
                              product={product}
                              disabled={dndDisabled}
                              getCategoryName={getCategoryName}
                              onToggleBestseller={toggleBestseller}
                              onToggleVisibility={handleToggleVisibility}
                              onEdit={(p) => setEditingProductId(p._id)}
                              onDelete={setDeletingProduct}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {catProducts.map((product, idx) => (
                            <SortableListRow
                              key={product._id}
                              product={product}
                              index={idx}
                              disabled={dndDisabled}
                              getCategoryName={getCategoryName}
                              onToggleVisibility={handleToggleVisibility}
                              onEdit={(p) => setEditingProductId(p._id)}
                              onDelete={setDeletingProduct}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                    <DragOverlay>
                      {activeProduct && viewMode === 'grid' && (
                        <div className="bg-white rounded-xl shadow-2xl overflow-hidden opacity-90 rotate-2 w-[280px]">
                          <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                            {getImageUrl(activeProduct, 0) ? (
                              <img
                                src={getImageUrl(activeProduct, 0)!}
                                alt={activeProduct.name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
                                <ImageIcon className="w-12 h-12 text-orange-300" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-gray-800 text-sm">{activeProduct.name}</h3>
                            <p className="text-xs text-gray-500">{activeProduct.code}</p>
                          </div>
                        </div>
                      )}
                      {activeProduct && viewMode === 'list' && (
                        <div className="flex items-center gap-3 bg-white rounded-xl shadow-2xl px-3 py-2 opacity-90 rotate-1">
                          <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                            {getImageUrl(activeProduct, 0) ? (
                              <img src={getImageUrl(activeProduct, 0)!} alt={activeProduct.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{activeProduct.name}</p>
                            <p className="text-xs text-gray-500">{activeProduct.code}</p>
                          </div>
                        </div>
                      )}
                    </DragOverlay>
                  </DndContext>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* === MODALES === */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          uploading={uploading}
          imageSizes={imageSizesGlobal}
          onAutoSaveProduct={autoSaveProduct}
          onAutoSaveSubcategories={autoSaveSubcategories}
          onUploadImage={handleImageUpload}
          onDeleteImage={handleDeleteImage}
          onClose={() => setEditingProductId(null)}
          onDelete={() => {
            setDeletingProduct(editingProduct);
            setEditingProductId(null);
          }}
        />
      )}

      {showAddModal && (
        <AddProductModal
          categories={categories}
          products={products}
          onAdd={handleAddProduct}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showAddCategoryModal && (
        <AddCategoryModal
          categories={categories}
          onAdd={handleAddCategory}
          onClose={() => setShowAddCategoryModal(false)}
        />
      )}

      {showManageCategoriesModal && (
        <ManageCategoriesModal
          categories={categories}
          products={products}
          onAutoSaveCategory={autoSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onReorder={handleCategoryDragEnd}
          onAddNew={() => setShowAddCategoryModal(true)}
          onClose={() => setShowManageCategoriesModal(false)}
        />
      )}

      {deletingProduct && (
        <DeleteProductModal
          product={deletingProduct}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
