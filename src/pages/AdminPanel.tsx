import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, optimizeImageUrl } from '../lib/supabase';
import { LogOut, Upload, Save, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { Product, Category } from '../types';

export function AdminPanel() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSubcategories, setEditingSubcategories] = useState<string | null>(null);
  const [subcategoryValues, setSubcategoryValues] = useState<string[]>(['', '', '', '', '', '', '']);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: '', name: '', category_id: '' });
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string; category_id?: string }>({});

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }
    loadProducts();
  }, [user, navigate]);

  const loadProducts = async () => {
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase.from('products').select('*').order('code'),
        supabase.from('categories').select('*').order('priority')
      ]);

      if (productsResult.error) throw productsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (productId: string, file: File, imageIndex: number) => {
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Por favor selecciona un archivo de imagen válido');
      return;
    }

    setUploading(`${productId}-${imageIndex}`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${imageIndex}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const imageField = imageIndex === 0 ? 'image_url' : `image_url_${imageIndex + 1}`;
      const { error: updateError } = await supabase
        .from('products')
        .update({ [imageField]: publicUrl })
        .eq('id', productId);

      if (updateError) throw updateError;

      setProducts(products.map(p =>
        p.id === productId ? { ...p, [imageField]: publicUrl } : p
      ));

      showMessage('success', `Imagen ${imageIndex + 1} subida exitosamente`);
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', 'Error al subir la imagen');
    } finally {
      setUploading(null);
    }
  };

  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/<[^>]*>/g, '');
  };

  const validateProduct = (): boolean => {
    const errors: { code?: string; name?: string; category_id?: string } = {};

    const sanitizedCode = sanitizeInput(newProduct.code);
    const sanitizedName = sanitizeInput(newProduct.name);

    if (!sanitizedCode) {
      errors.code = 'El código es requerido';
    } else if (sanitizedCode.length < 2) {
      errors.code = 'El código debe tener al menos 2 caracteres';
    } else if (sanitizedCode.length > 20) {
      errors.code = 'El código no puede tener más de 20 caracteres';
    } else if (products.some(p => p.code.toLowerCase() === sanitizedCode.toLowerCase())) {
      errors.code = 'Ya existe un producto con este código';
    }

    if (!sanitizedName) {
      errors.name = 'El nombre es requerido';
    } else if (sanitizedName.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (sanitizedName.length > 100) {
      errors.name = 'El nombre no puede tener más de 100 caracteres';
    }

    if (!newProduct.category_id) {
      errors.category_id = 'Selecciona una categoría';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async () => {
    if (!validateProduct()) {
      return;
    }

    const sanitizedCode = sanitizeInput(newProduct.code);
    const sanitizedName = sanitizeInput(newProduct.name);

    try {
      const { data, error } = await (supabase
        .from('products') as any)
        .insert({
          code: sanitizedCode,
          name: sanitizedName,
          category_id: newProduct.category_id,
          is_bestseller: false
        })
        .select();

      if (error) throw error;

      if (data) {
        setProducts([...products, data[0]]);
        setShowAddProduct(false);
        setNewProduct({ code: '', name: '', category_id: '' });
        setFormErrors({});
        showMessage('success', 'Producto agregado exitosamente');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showMessage('error', 'Error al agregar el producto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      setDeletingProduct(null);
      showMessage('success', 'Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      showMessage('error', 'Error al eliminar el producto');
    }
  };

  const toggleBestseller = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_bestseller: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_bestseller: !currentStatus } : p
      ));

      showMessage('success', 'Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating bestseller:', error);
      showMessage('error', 'Error al actualizar el estado');
    }
  };

  const handleUpdateSubcategories = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          subcategory: subcategoryValues[0] || null,
          subcategory_2: subcategoryValues[1] || null,
          subcategory_3: subcategoryValues[2] || null,
          subcategory_4: subcategoryValues[3] || null,
          subcategory_5: subcategoryValues[4] || null,
          subcategory_6: subcategoryValues[5] || null,
          subcategory_7: subcategoryValues[6] || null,
        })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === productId ? {
          ...p,
          subcategory: subcategoryValues[0] || null,
          subcategory_2: subcategoryValues[1] || null,
          subcategory_3: subcategoryValues[2] || null,
          subcategory_4: subcategoryValues[3] || null,
          subcategory_5: subcategoryValues[4] || null,
          subcategory_6: subcategoryValues[5] || null,
          subcategory_7: subcategoryValues[6] || null,
        } : p
      ));

      setEditingSubcategories(null);
      setSubcategoryValues(['', '', '', '', '', '', '']);
      showMessage('success', 'Subcategorías actualizadas exitosamente');
    } catch (error) {
      console.error('Error updating subcategories:', error);
      showMessage('error', 'Error al actualizar las subcategorías');
    }
  };

  const startEditingSubcategories = (product: Product) => {
    setEditingSubcategories(product.id);
    setSubcategoryValues([
      product.subcategory || '',
      product.subcategory_2 || '',
      product.subcategory_3 || '',
      product.subcategory_4 || '',
      product.subcategory_5 || '',
      product.subcategory_6 || '',
      product.subcategory_7 || '',
    ]);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getSubcategoriesDisplay = (product: Product): string => {
    const subcats = [
      product.subcategory,
      product.subcategory_2,
      product.subcategory_3,
      product.subcategory_4,
      product.subcategory_5,
      product.subcategory_6,
      product.subcategory_7,
    ].filter(Boolean);

    return subcats.length > 0 ? subcats.join(', ') : 'Ninguna';
  };

  const getImageUrl = (product: Product, index: number): string | null => {
    const urls = [
      product.image_url,
      product.image_url_2,
      product.image_url_3,
      product.image_url_4,
      product.image_url_5,
      product.image_url_6,
      product.image_url_7,
    ];
    return urls[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b-4 border-cyan-400 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
            <p className="text-sm text-gray-600 mt-1">Gestión de productos y categorías</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-400 text-green-700'
                : 'bg-red-50 border-red-400 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'products'
                  ? 'bg-cyan-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'categories'
                  ? 'bg-cyan-400 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Categorías
            </button>
          </div>
          {activeTab === 'products' && (
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Agregar Producto
            </button>
          )}
        </div>

        {activeTab === 'categories' ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gestión de Categorías</h2>
            <div className="space-y-3">
              {categories.map((category) => {
                const categoryProducts = products.filter(p => p.category_id === category.id);
                return (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                      <p className="text-sm text-gray-600">Prioridad: {category.priority} • {categoryProducts.length} productos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-cyan-400">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Subcategorías e Imágenes</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Más Vendido</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{product.code}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{product.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {categories.find(c => c.id === product.category_id)?.name || 'Sin categoría'}
                    </td>
                    <td className="px-4 py-4">
                      {editingSubcategories === product.id ? (
                        <div className="space-y-3">
                          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={subcategoryValues[index]}
                                  onChange={(e) => {
                                    const newValues = [...subcategoryValues];
                                    newValues[index] = e.target.value;
                                    setSubcategoryValues(newValues);
                                  }}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
                                  placeholder={`Subcategoría ${index + 1}`}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                {getImageUrl(product, index) ? (
                                  <img
                                    src={optimizeImageUrl(getImageUrl(product, index), 60) || ''}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-12 h-12 object-cover rounded border-2 border-cyan-200"
                                  />
                                ) : (
                                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>Sin imagen</span>
                                  </div>
                                )}
                                <label className="flex items-center gap-1 px-2 py-1 bg-cyan-400 text-white rounded text-xs hover:bg-cyan-500 transition-colors cursor-pointer">
                                  {uploading === `${product.id}-${index}` ? (
                                    <>Subiendo...</>
                                  ) : (
                                    <>
                                      <Upload className="w-3 h-3" />
                                      Subir
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(product.id, file, index);
                                    }}
                                    className="hidden"
                                    disabled={uploading === `${product.id}-${index}`}
                                  />
                                </label>
                              </div>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleUpdateSubcategories(product.id)}
                              className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                            >
                              <Save className="w-4 h-4" />
                              Guardar Todo
                            </button>
                            <button
                              onClick={() => setEditingSubcategories(null)}
                              className="flex items-center gap-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-sm"
                            >
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingSubcategories(product)}
                          className="text-sm text-cyan-600 hover:text-cyan-800 underline text-left"
                        >
                          {getSubcategoriesDisplay(product)}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleBestseller(product.id, product.is_bestseller)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                          product.is_bestseller
                            ? 'bg-pink-400 text-white hover:bg-pink-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {product.is_bestseller ? 'Sí' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      {deletingProduct === product.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeletingProduct(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingProduct(product.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Agregar Producto */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Agregar Producto</h2>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setNewProduct({ code: '', name: '', category_id: '' });
                    setFormErrors({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
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
                  {formErrors.code && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.code}</p>
                  )}
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
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => {
                      setNewProduct({ ...newProduct, category_id: e.target.value });
                      if (formErrors.category_id) setFormErrors({ ...formErrors, category_id: undefined });
                    }}
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none ${
                      formErrors.category_id ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-cyan-400'
                    }`}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
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
                      setShowAddProduct(false);
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
      </main>
    </div>
  );
}
