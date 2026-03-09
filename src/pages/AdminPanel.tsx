import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut, Upload, Save, X, Image as ImageIcon, Plus,
  Trash2, Search, Star, Pencil
} from 'lucide-react';
import type { Product, Category } from '../types';
import { Id } from '../../convex/_generated/dataModel';

const categoryEmojis: Record<string, string> = {
  'NÚMEROS': '🔢',
  'LETRAS': '🔤',
  'FIGURAS': '🎭',
  'MINI VELAS': '🕯️',
  'VELITAS LARGAS': '🕯️',
  'VOLCÁN': '🌋',
};

export function AdminPanel() {
  const { user, signOut, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const productsData = useQuery(api.products.list);
  const categoriesData = useQuery(api.categories.list);

  const addProduct = useMutation(api.products.add);
  const removeProduct = useMutation(api.products.remove);
  const toggleBestsellerMut = useMutation(api.products.toggleBestseller);
  const updateSubcategoriesMut = useMutation(api.products.updateSubcategories);
  const updateProductImageMut = useMutation(api.products.updateProductImage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const products = (productsData as Product[] | undefined) ?? [];
  const categories = (categoriesData as Category[] | undefined) ?? [];
  const dataLoading = productsData === undefined || categoriesData === undefined;

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add product form
  const [newProduct, setNewProduct] = useState({ code: '', name: '', category_id: '' });
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string; category_id?: string }>({});

  // Subcategory editing
  const [subcategoryValues, setSubcategoryValues] = useState<string[]>(['', '', '', '', '', '', '']);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Verificando sesión...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/admin/login');
    return null;
  }

  // === Filtering & Stats ===
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: products.length,
    missingImages: products.filter((p) => !p.imageUrls?.some(Boolean)).length,
    bestsellers: products.filter((p) => p.isBestseller).length,
  };

  const productCountsByCategory: Record<string, number> = {};
  products.forEach((p) => {
    if (p.categoryId) {
      productCountsByCategory[p.categoryId] = (productCountsByCategory[p.categoryId] || 0) + 1;
    }
  });

  // === Handlers ===
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/<[^>]*>/g, '');
  };

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

  const validateProduct = (): boolean => {
    const errors: { code?: string; name?: string; category_id?: string } = {};
    const sanitizedCode = sanitizeInput(newProduct.code);
    const sanitizedName = sanitizeInput(newProduct.name);

    if (!sanitizedCode) errors.code = 'El código es requerido';
    else if (sanitizedCode.length < 2) errors.code = 'Mínimo 2 caracteres';
    else if (sanitizedCode.length > 20) errors.code = 'Máximo 20 caracteres';
    else if (products.some((p) => p.code.toLowerCase() === sanitizedCode.toLowerCase()))
      errors.code = 'Ya existe un producto con este código';

    if (!sanitizedName) errors.name = 'El nombre es requerido';
    else if (sanitizedName.length < 3) errors.name = 'Mínimo 3 caracteres';
    else if (sanitizedName.length > 100) errors.name = 'Máximo 100 caracteres';

    if (!newProduct.category_id) errors.category_id = 'Selecciona una categoría';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateProduct() || !token) return;
    try {
      await addProduct({
        token,
        code: sanitizeInput(newProduct.code),
        name: sanitizeInput(newProduct.name),
        categoryId: newProduct.category_id as Id<'categories'>,
      });
      setShowAddModal(false);
      setNewProduct({ code: '', name: '', category_id: '' });
      setFormErrors({});
      showMessage('success', 'Producto agregado');
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', 'Error al agregar el producto');
    }
  };

  const handleUpdateSubcategories = async () => {
    if (!token || !editingProduct) return;
    try {
      await updateSubcategoriesMut({
        token,
        productId: editingProduct._id,
        subcategories: subcategoryValues,
      });
      setEditingProduct(null);
      showMessage('success', 'Subcategorías actualizadas');
    } catch (error) {
      console.error('Error updating subcategories:', error);
      showMessage('error', 'Error al actualizar las subcategorías');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const subs = product.subcategories ?? [];
    setSubcategoryValues([
      subs[0] || '', subs[1] || '', subs[2] || '',
      subs[3] || '', subs[4] || '', subs[5] || '', subs[6] || '',
    ]);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getImageUrl = (product: Product, index: number): string | null => {
    return product.imageUrls?.[index] ?? null;
  };

  const getImageCount = (product: Product): number => {
    return (product.imageUrls ?? []).filter(Boolean).length;
  };

  const getCategoryName = (categoryId?: Id<'categories'>): string => {
    if (!categoryId) return 'Sin categoría';
    return categories.find((c) => c._id === categoryId)?.name || 'Sin categoría';
  };

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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
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
                    <span>{categoryEmojis[cat.name] || '🎂'}</span>
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
            {/* Add button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Agregar Producto
            </button>
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
          </div>
        </div>

        {/* Product Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {filteredProducts.map((product) => {
              const imgCount = getImageCount(product);
              const mainImg = getImageUrl(product, 0);
              const hasNoImages = imgCount === 0;
              const subcats = (product.subcategories ?? []).filter(Boolean);

              return (
                <div
                  key={product._id}
                  className={`group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                    hasNoImages ? 'border-2 border-dashed border-orange-300' : ''
                  }`}
                >
                  {/* Image area */}
                  <div className="aspect-[4/3] relative overflow-hidden bg-gray-50">
                    {mainImg ? (
                      <img
                        src={mainImg}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
                        <ImageIcon className="w-12 h-12 text-orange-300 mb-2" />
                        <span className="text-orange-400 text-xs font-medium">Sin imagen</span>
                      </div>
                    )}

                    {/* Bestseller star - top left */}
                    <button
                      onClick={(e) => toggleBestseller(product._id, e)}
                      className={`absolute top-2 left-2 p-1.5 rounded-full transition-all ${
                        product.isBestseller
                          ? 'bg-yellow-400 text-white shadow-md'
                          : 'bg-white/80 text-gray-400 hover:bg-yellow-100 hover:text-yellow-500'
                      }`}
                      title={product.isBestseller ? 'Quitar más vendido' : 'Marcar más vendido'}
                    >
                      <Star className="w-4 h-4" fill={product.isBestseller ? 'currentColor' : 'none'} />
                    </button>

                    {/* Image count - top right */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                        imgCount === 7
                          ? 'bg-green-100 text-green-700'
                          : imgCount > 0
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {imgCount}/7
                    </div>

                    {/* Code badge - bottom right */}
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-md">
                        {product.code}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {categoryEmojis[getCategoryName(product.categoryId)] || '🎂'}{' '}
                      {getCategoryName(product.categoryId)}
                    </p>

                    {/* Subcategory pills */}
                    {subcats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {subcats.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-xs font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => setDeletingProduct(product)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* === EDIT MODAL === */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Editar: {editingProduct.name}
                </h2>
                <span className="inline-block mt-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                  {editingProduct.code}
                </span>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-4 space-y-6">
              {/* Images section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Imágenes del Producto
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                    const imgUrl = getImageUrl(editingProduct, index);
                    const isUploading = uploading === `${editingProduct._id}-${index}`;
                    return (
                      <label
                        key={index}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group/slot transition-all ${
                          imgUrl
                            ? 'border-2 border-cyan-200 hover:border-cyan-400'
                            : 'border-2 border-dashed border-gray-300 hover:border-cyan-400 bg-gray-50'
                        }`}
                      >
                        {isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <div className="animate-spin rounded-full h-6 w-6 border-3 border-cyan-400 border-t-transparent"></div>
                          </div>
                        ) : imgUrl ? (
                          <>
                            <img
                              src={imgUrl}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-full object-contain p-1"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/slot:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="w-5 h-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">Subir</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(editingProduct._id, file, index);
                            e.target.value = '';
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                        {/* Slot label */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5 font-medium">
                          {index === 0 ? 'Principal' : subcategoryValues[index] || `Slot ${index}`}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subcategories section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🎨 Subcategorías (variantes)
                </h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((index) => {
                    const imgUrl = getImageUrl(editingProduct, index);
                    return (
                      <div key={index} className="flex items-center gap-2 sm:gap-3">
                        {/* Mini thumbnail */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                        {/* Input */}
                        <input
                          type="text"
                          value={subcategoryValues[index]}
                          onChange={(e) => {
                            const newValues = [...subcategoryValues];
                            newValues[index] = e.target.value;
                            setSubcategoryValues(newValues);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                          placeholder={`Subcategoría ${index}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={handleUpdateSubcategories}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm"
              >
                <Save className="w-4 h-4" />
                Guardar Subcategorías
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === ADD PRODUCT MODAL === */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Agregar Producto</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProduct({ code: '', name: '', category_id: '' });
                  setFormErrors({});
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código del Producto
                </label>
                <input
                  type="text"
                  value={newProduct.code}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, code: e.target.value });
                    if (formErrors.code) setFormErrors({ ...formErrors, code: undefined });
                  }}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    formErrors.code ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-cyan-400'
                  }`}
                  placeholder="Ej: LICOO"
                  maxLength={20}
                />
                {formErrors.code && <p className="mt-1 text-sm text-red-500">{formErrors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                  }}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    formErrors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-cyan-400'
                  }`}
                  placeholder="Ej: BOTELLAS LICORES"
                  maxLength={100}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categoría</label>
                <select
                  value={newProduct.category_id}
                  onChange={(e) => {
                    setNewProduct({ ...newProduct, category_id: e.target.value });
                    if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: undefined });
                  }}
                  className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                    formErrors.category_id
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-cyan-400'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.category_id}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddProduct}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewProduct({ code: '', name: '', category_id: '' });
                    setFormErrors({});
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar producto?</h2>
            <p className="text-sm text-gray-600 mb-1">{deletingProduct.name}</p>
            <p className="text-xs text-gray-400 mb-6">Código: {deletingProduct.code}</p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteProduct}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeletingProduct(null)}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
