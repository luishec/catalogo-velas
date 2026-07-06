import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category } from '../../types';

interface SortableCategoryRowProps {
  category: Category;
  productCount: number;
  onChangeName: (cat: Category, name: string) => void;
  onChangeEmoji: (cat: Category, emoji: string) => void;
  onDelete: (cat: Category) => void;
}

export function SortableCategoryRow({
  category, productCount, onChangeName, onChangeEmoji, onDelete,
}: SortableCategoryRowProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: category._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200"
    >
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <input
        type="text"
        value={category.emoji || ''}
        onChange={(e) => onChangeEmoji(category, e.target.value)}
        maxLength={4}
        className="w-12 px-2 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm text-center bg-white"
        placeholder="🎂"
      />
      <input
        type="text"
        value={category.name}
        onChange={(e) => onChangeName(category, e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm bg-white font-semibold"
      />
      <span className="text-xs text-gray-500 px-2 whitespace-nowrap">
        {productCount}
      </span>
      <button
        onClick={() => onDelete(category)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar categoría"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
