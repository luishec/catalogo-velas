import { Image as ImageIcon, Trash2, Star, Pencil, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product } from '../../types';
import { Id } from '../../../convex/_generated/dataModel';
import { getImageCount, getImageUrl } from './helpers';

interface SortableProductCardProps {
  product: Product;
  disabled: boolean;
  getCategoryName: (id?: Id<'categories'>) => string;
  onToggleBestseller: (id: Id<'products'>, e: React.MouseEvent) => void;
  onToggleVisibility: (id: Id<'products'>, e: React.MouseEvent) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function SortableProductCard({
  product, disabled, getCategoryName,
  onToggleBestseller, onToggleVisibility, onEdit, onDelete,
}: SortableProductCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: product._id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  const imgCount = getImageCount(product);
  const mainImg = getImageUrl(product, 0);
  const hasNoImages = imgCount === 0;
  const subcats = (product.subcategories ?? []).filter(Boolean);
  const isHidden = product.isVisible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        hasNoImages ? 'border-2 border-dashed border-orange-300' : ''
      } ${isHidden ? 'opacity-50 border-2 border-dashed border-red-400' : ''}`}
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

        {/* Drag handle - top left */}
        {!disabled && (
          <button
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-all cursor-grab active:cursor-grabbing"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Bestseller star */}
        <button
          onClick={(e) => onToggleBestseller(product._id, e)}
          className={`absolute top-2 ${disabled ? 'left-2' : 'left-10'} p-1.5 rounded-full transition-all ${
            product.isBestseller
              ? 'bg-yellow-400 text-white shadow-md'
              : 'bg-white/80 text-gray-400 hover:bg-yellow-100 hover:text-yellow-500'
          }`}
          title={product.isBestseller ? 'Quitar más vendido' : 'Marcar más vendido'}
        >
          <Star className="w-4 h-4" fill={product.isBestseller ? 'currentColor' : 'none'} />
        </button>

        {/* Visibility toggle */}
        <button
          onClick={(e) => onToggleVisibility(product._id, e)}
          className={`absolute top-2 ${disabled ? 'left-10' : 'left-[4.5rem]'} p-1.5 rounded-full transition-all ${
            isHidden
              ? 'bg-red-400 text-white shadow-md'
              : 'bg-white/80 text-green-500 hover:bg-green-100'
          }`}
          title={isHidden ? 'Mostrar en catálogo' : 'Ocultar del catálogo'}
        >
          {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
      <div className="p-3 text-center">
        <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          {getCategoryName(product.categoryId)}
        </p>

        {/* Subcategory pills */}
        {subcats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-3">
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
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors text-xs font-semibold"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => onDelete(product)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
