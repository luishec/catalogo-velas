import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CatalogHeader() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (clickCount >= 10) {
      navigate('/admin/login');
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

  return (
    <header className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 py-4 sm:py-6 lg:py-8 px-3 sm:px-6 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 lg:gap-6">
        <img
          src="https://i.imgur.com/OAczh24.png"
          alt="Logo"
          loading="eager"
          onClick={handleLogoClick}
          className="h-16 sm:h-20 lg:h-24 w-auto object-contain bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg cursor-pointer select-none active:scale-95 transition-transform"
        />
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <span>🎂</span>
            <span>Catálogo de Velas</span>
            <span>🕯️</span>
          </h1>
          <p className="text-cyan-50 text-xs sm:text-sm lg:text-lg flex items-center gap-1 sm:gap-2">
            <span>✨</span>
            <span className="hidden sm:inline">Productos para distribuidores y fiesterías</span>
            <span className="sm:hidden">Para distribuidores</span>
          </p>
        </div>
      </div>
    </header>
  );
}
