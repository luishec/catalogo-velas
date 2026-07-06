import { Image as ImageIcon, Trash2, Star, Pencil, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product } from '../../types';
import { Id } from '../../../convex/_generated/dataModel';
import { getImageUrl } from './helpers';

interface SortableListRowProps {
  product: Product;
  index: number;
  disabled: boolean;
  getCategoryName: (id?: Id<'categories'>) => string;
  onToggleVisibility: (id: Id<'products'>, e: React.MouseEvent) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function SortableListRow({
  product, index, disabled, getCategoryName, onToggleVisibility, onEdit, onDelete,
}: SortableListRowProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: product._id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const mainImg = getImageUrl(product, 0);
  const isHidden = product.isVisible === false;

  // Slots 1-6: cada uno emparejado con su subcategoría
  const variants = [1, 2, 3, 4, 5, 6]
    .map((i) => ({
      index: i,
      name: product.subcategories?.[i] ?? null,
      img: getImageUrl(product, i),
    }))
    .filter((v) => v.name || v.img);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isHidden ? 'opacity-50 border border-dashed border-red-400' : 'border border-gray-100'
      }`}
    >
      {/* Fila principal: foto + nombre + acciones */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Número */}
        <span className="text-xs font-bold text-gray-400 w-5 text-center flex-shrink-0">
          {index + 1}
        </span>

        {/* Handle de arrastre */}
        {!disabled && (
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Foto principal */}
        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
          {mainImg ? (
            <img src={mainImg} alt={product.name} className="w-full h-full object-contain p-1" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>

        {/* Nombre + código + categoría */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
              {product.code}
            </span>
            {product.isBestseller && (
              <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" />
            )}
            {isHidden && (
              <EyeOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
          <span className="text-[11px] text-gray-400">
            {getCategoryName(product.categoryId)}
          </span>
        </div>

        {/* Acciones */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => onToggleVisibility(product._id, e)}
            className={`p-2 rounded-lg transition-colors ${
              isHidden
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
            title={isHidden ? 'Mostrar en catálogo' : 'Ocultar del catálogo'}
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Variantes: subcategoría + imagen correspondiente */}
      {variants.length > 0 && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap border-t border-gray-50 pt-2">
          {variants.map((v) => (
            <div
              key={v.index}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5"
            >
              <div className="w-9 h-9 flex-shrink-0 rounded-md overflow-hidden bg-white border border-gray-200">
                {v.img ? (
                  <img src={v.img} alt={v.name ?? ''} className="w-full h-full object-contain p-0.5" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-3 h-3 text-gray-300" />
                  </div>
                )}
              </div>
              {v.name && (
                <span className="text-xs text-gray-600 font-medium">{v.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
