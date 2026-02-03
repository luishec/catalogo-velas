import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClose = () => {
    setIsExpanded(false);
    onSearchChange('');
  };

  return (
    <>
      {/* Ícono flotante cuando está colapsado */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-6 sm:top-8 lg:top-10 right-3 sm:right-6 z-40 bg-white text-cyan-500 p-3 sm:p-4 rounded-full shadow-2xl border-2 border-cyan-400 hover:bg-cyan-50 active:scale-95 transition-all duration-300 touch-manipulation"
          aria-label="Abrir búsqueda"
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Barra de búsqueda expandida */}
      {isExpanded && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-2xl border-b-4 border-cyan-400 animate-slideDown">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div role="search" className="relative flex items-center gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <label htmlFor="product-search" className="sr-only">Buscar productos</label>
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="text-cyan-500 w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                </div>
                <input
                  id="product-search"
                  type="search"
                  inputMode="search"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar por código o nombre..."
                  autoFocus
                  aria-label="Buscar productos por código o nombre"
                  className="w-full pl-11 sm:pl-14 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none transition-all duration-300 text-gray-800 placeholder-gray-400 text-base sm:text-lg font-medium touch-manipulation"
                />
              </div>
              <button
                onClick={handleClose}
                className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 p-3 sm:p-4 rounded-xl transition-all duration-200 touch-manipulation"
                aria-label="Cerrar búsqueda"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600 px-1">
                🔍 Buscando: <span className="font-semibold">{searchTerm}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
