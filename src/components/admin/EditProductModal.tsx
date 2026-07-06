import { useState } from 'react';
import { Upload, X, Trash2, Pencil, RefreshCw } from 'lucide-react';
import type { Product, Category } from '../../types';
import { Id } from '../../../convex/_generated/dataModel';
import { formatFileSize, getFileSizeColor, getImageUrl } from './helpers';

interface EditProductModalProps {
  product: Product;
  categories: Category[];
  uploading: string | null;
  imageSizes: Record<string, number> | undefined;
  onAutoSaveProduct: (
    productId: Id<'products'>,
    fields: { name?: string; code?: string; categoryId?: string },
  ) => void;
  onAutoSaveSubcategories: (productId: Id<'products'>, values: string[]) => void;
  onUploadImage: (productId: Id<'products'>, file: File, imageIndex: number) => void;
  onDeleteImage: (productId: Id<'products'>, imageIndex: number, silent?: boolean) => void;
  onClose: () => void;
  onDelete: () => void;
}

export function EditProductModal({
  product, categories, uploading, imageSizes,
  onAutoSaveProduct, onAutoSaveSubcategories, onUploadImage, onDeleteImage,
  onClose, onDelete,
}: EditProductModalProps) {
  // Estado local de los campos de texto; las imágenes vienen del producto
  // reactivo, así que subidas y borrados se reflejan al instante
  const [editName, setEditName] = useState(product.name);
  const [editCode, setEditCode] = useState(product.code);
  const [editCategoryId, setEditCategoryId] = useState<string>(product.categoryId ?? '');
  const [subcategoryValues, setSubcategoryValues] = useState<string[]>(() => {
    const subs = product.subcategories ?? [];
    return [0, 1, 2, 3, 4, 5, 6].map((i) => subs[i] || '');
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Editar Producto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 space-y-6">
          {/* Product info section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Datos del Producto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Código</label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => {
                    setEditCode(e.target.value);
                    onAutoSaveProduct(product._id, { code: e.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => {
                    setEditCategoryId(e.target.value);
                    // '' no es un Id válido en Convex; solo se guarda al elegir una categoría real
                    if (e.target.value) {
                      onAutoSaveProduct(product._id, { categoryId: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                >
                  {editCategoryId === '' && (
                    <option value="" disabled>Sin categoría — selecciona una</option>
                  )}
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista unificada: foto + nombre por fila */}
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5, 6].map((index) => {
              const imgUrl = getImageUrl(product, index);
              const isUploading = uploading === `${product._id}-${index}`;
              const storageId = product.imageStorageIds?.[index];
              const fileSize = storageId && imageSizes?.[storageId];
              const isMain = index === 0;

              return (
                <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                  {/* Foto — clic para subir/reemplazar */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <label
                      className={`block w-full h-full cursor-pointer rounded-xl overflow-hidden transition-all ${
                        imgUrl
                          ? 'border-2 border-cyan-200 hover:border-cyan-400'
                          : 'border-2 border-dashed border-gray-300 hover:border-cyan-400 bg-white'
                      }`}
                    >
                      {isUploading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-400 border-t-transparent" />
                        </div>
                      ) : imgUrl ? (
                        <>
                          <img src={imgUrl} alt="" className="w-full h-full object-contain p-1" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <RefreshCw className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <Upload className="w-4 h-4 mb-0.5" />
                          <span className="text-[9px]">Subir</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadImage(product._id, file, index);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    {/* Borrar imagen */}
                    {imgUrl && !isUploading && (
                      <button
                        onClick={() => onDeleteImage(product._id, index)}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                        title="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {/* Tamaño del archivo */}
                    {fileSize && (
                      <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 ${getFileSizeColor(fileSize).bg} text-white px-1.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap`}>
                        {formatFileSize(fileSize)}
                      </div>
                    )}
                  </div>

                  {/* Nombre editable */}
                  <div className="flex-1 min-w-0">
                    {isMain ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          onAutoSaveProduct(product._id, { name: e.target.value });
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm font-semibold bg-white"
                        placeholder="Nombre del producto"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={subcategoryValues[index]}
                          onChange={(e) => {
                            const newValues = [...subcategoryValues];
                            newValues[index] = e.target.value;
                            setSubcategoryValues(newValues);
                            onAutoSaveSubcategories(product._id, newValues);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm bg-white"
                          placeholder={`Variante ${index}`}
                        />
                        {(subcategoryValues[index] || imgUrl) && (
                          <button
                            onClick={() => {
                              // Limpiar nombre siempre
                              const newValues = [...subcategoryValues];
                              newValues[index] = '';
                              setSubcategoryValues(newValues);
                              onAutoSaveSubcategories(product._id, newValues);
                              // Eliminar imagen en paralelo si existe (silencioso si falla)
                              if (imgUrl) {
                                onDeleteImage(product._id, index, true);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Eliminar variante"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex gap-3 rounded-b-2xl">
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar producto
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
