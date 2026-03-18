import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  priority: number;
  emoji?: string;
}

interface CatalogHeaderProps {
  categories?: Category[];
  onSelectCategory?: (categoryId: string) => void;
  productCounts?: Record<string, number>;
}

export function CatalogHeader({ categories = [], onSelectCategory, productCounts = {} }: CatalogHeaderProps) {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (clickCount >= 3) {
      navigate('/admin');
      setClickCount(0);
    }
  }, [clickCount, navigate]);

  useEffect(() => {
    if (clickCount > 0) {
      const timer = setTimeout(() => setClickCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
  };

  const handleCategoryClick = (categoryId: string) => {
    onSelectCategory?.(categoryId);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 py-3 sm:py-4 px-3 sm:px-6 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-center relative">
          <button
            onClick={() => setMenuOpen(true)}
            className="absolute left-0 p-2 sm:p-3 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl transition-all touch-manipulation"
            aria-label="Abrir menú de categorías"
          >
            <Menu className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </button>

          <img
            src="https://vivid-panda-934.convex.cloud/api/storage/2699258e-274d-42a7-b958-7bdc2e6b4847"
            alt="Magic Party"
            loading="eager"
            onClick={handleLogoClick}
            className="h-14 sm:h-16 lg:h-20 w-auto object-contain cursor-pointer select-none active:scale-95 transition-transform"
          />
        </div>
      </header>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-cyan-400 to-blue-500">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            ⭐ Productos
          </h2>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <nav className="p-3 sm:p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
              className="w-full px-4 py-3 sm:py-4 rounded-xl font-bold text-center transition-all duration-200 bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <span className="text-sm sm:text-base">{category.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
