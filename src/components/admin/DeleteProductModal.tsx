import { Trash2 } from 'lucide-react';
import type { Product } from '../../types';

interface DeleteProductModalProps {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteProductModal({ product, onConfirm, onCancel }: DeleteProductModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar producto?</h2>
        <p className="text-sm text-gray-600 mb-1">{product.name}</p>
        <p className="text-xs text-gray-400 mb-6">Código: {product.code}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm"
          >
            Eliminar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
