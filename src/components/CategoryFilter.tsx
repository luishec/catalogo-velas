interface Category {
  id: string;
  name: string;
  priority: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  productCounts: Record<string, number>;
}

const categoryEmojis: Record<string, string> = {
  'NÚMEROS': '🔢',
  'LETRAS': '🔤',
  'FIGURAS': '🎭',
  'MINI VELAS': '🕯️',
  'VELITAS LARGAS': '🕯️',
  'MÁS VENDIDO': '⭐',
  'VOLCÁN': '🌋'
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts
}: CategoryFilterProps) {
  const getEmoji = (name: string) => {
    return categoryEmojis[name] || '🎂';
  };

  return (
    <aside
      className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 h-fit lg:sticky lg:top-4 w-full lg:w-64 flex-shrink-0"
      aria-label="Filtro de categorías"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gradient-to-r from-cyan-400 to-blue-500">
        <span className="text-xl sm:text-2xl" aria-hidden="true">🏷️</span>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Categorías</h2>
      </div>

      <nav role="navigation" aria-label="Categorías de productos">
        <div className="flex lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              aria-label={`Filtrar por ${category.name}, ${productCounts[category.id] || 0} productos`}
              aria-pressed={selectedCategory === category.id}
              className={`px-3 sm:px-5 py-3 sm:py-4 rounded-xl font-semibold text-left transition-all duration-300 whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-700 active:bg-gray-200 lg:hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center gap-2">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-xl" aria-hidden="true">{getEmoji(category.name)}</span>
                  <span className="text-xs sm:text-sm">{category.name}</span>
                </span>
                <span
                  className={`text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold ${
                    selectedCategory === category.id
                      ? 'bg-white/30 text-white'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}
                  aria-hidden="true"
                >
                  {productCounts[category.id] || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
