import { X, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Product, Category } from '../../types';
import { SortableCategoryRow } from './SortableCategoryRow';

interface ManageCategoriesModalProps {
  categories: Category[];
  products: Product[];
  onAutoSaveCategory: (cat: Category, fields: { name?: string; emoji?: string }) => void;
  onDeleteCategory: (cat: Category) => void;
  onReorder: (event: DragEndEvent) => void;
  onAddNew: () => void;
  onClose: () => void;
}

export function ManageCategoriesModal({
  categories, products, onAutoSaveCategory, onDeleteCategory, onReorder, onAddNew, onClose,
}: ManageCategoriesModalProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Gestionar Categorías</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Arrastra <GripVertical className="inline w-3 h-3" /> para cambiar el orden. Los cambios de nombre y emoji se guardan automáticamente.
          </p>
          {categories.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No hay categorías todavía
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onReorder}
            >
              <SortableContext
                items={categories.map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categories.map((category) => (
                    <SortableCategoryRow
                      key={category._id}
                      category={category}
                      productCount={products.filter((p) => p.categoryId === category._id).length}
                      onChangeName={(cat, name) => onAutoSaveCategory(cat, { name })}
                      onChangeEmoji={(cat, emoji) => onAutoSaveCategory(cat, { emoji })}
                      onDelete={onDeleteCategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onAddNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold text-sm flex-1"
          >
            <Plus className="w-4 h-4" />
            Agregar nueva
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
