import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Product, Category } from '../../types';
import { sanitizeInput } from './helpers';

interface AddProductModalProps {
  categories: Category[];
  products: Product[];
  onAdd: (code: string, name: string, categoryId: string) => void;
  onClose: () => void;
}

export function AddProductModal({ categories, products, onAdd, onClose }: AddProductModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string; category_id?: string }>({});

  const handleSubmit = () => {
    const errors: { code?: string; name?: string; category_id?: string } = {};
    const sanitizedCode = sanitizeInput(code);
    const sanitizedName = sanitizeInput(name);

    if (!sanitizedCode) errors.code = 'El código es requerido';
    else if (sanitizedCode.length < 2) errors.code = 'Mínimo 2 caracteres';
    else if (sanitizedCode.length > 20) errors.code = 'Máximo 20 caracteres';
    else if (products.some((p) => p.code.toLowerCase() === sanitizedCode.toLowerCase()))
      errors.code = 'Ya existe un producto con este código';

    if (!sanitizedName) errors.name = 'El nombre es requerido';
    else if (sanitizedName.length < 3) errors.name = 'Mínimo 3 caracteres';
    else if (sanitizedName.length > 100) errors.name = 'Máximo 100 caracteres';

    if (!categoryId) errors.category_id = 'Selecciona una categoría';

    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      onAdd(sanitizedCode, sanitizedName, categoryId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Agregar Producto</h2>
          <button
            onClick={onClose}
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
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
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
              value={name}
              onChange={(e) => {
                setName(e.target.value);
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
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
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
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
