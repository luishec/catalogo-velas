import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ProductCardProduct {
  _id: string;
  code: string;
  name: string;
  isBestseller: boolean;
  imageUrl: string | null;
}

interface ProductCardVariant {
  variantName: string;
  imageUrl: string | null;
}

interface ProductCardProps {
  product: ProductCardProduct;
  variants?: ProductCardVariant[];
  mainImage?: string | null;
}

export function ProductCard({ product, variants = [], mainImage }: ProductCardProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(variants.length > 0 ? 0 : -1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [bestsellerTooltipState, setBestsellerTooltipState] = useState<'hidden' | 'visible' | 'fading'>('hidden');
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const fadeTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const currentImage = selectedVariantIndex === -1
    ? (mainImage || product.imageUrl)
    : (variants[selectedVariantIndex]?.imageUrl || product.imageUrl);

  const variantNames = variants
    .map(v => v.variantName)
    .filter(Boolean);

  const handleVariantClick = (index: number) => {
    const newIndex = index === selectedVariantIndex ? -1 : index;
    const newImage = newIndex === -1
      ? (mainImage || product.imageUrl)
      : (variants[newIndex]?.imageUrl || product.imageUrl);
    setSelectedVariantIndex(newIndex);
    if (newImage !== currentImage) {
      setImageLoaded(false);
      setImageError(false);
    }
  };

  const handleMainImageClick = () => {
    const newImage = mainImage || product.imageUrl;
    setSelectedVariantIndex(-1);
    if (newImage !== currentImage) {
      setImageLoaded(false);
      setImageError(false);
    }
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl active:shadow-xl transition-all duration-300 overflow-hidden touch-manipulation">
        <div className="aspect-square relative overflow-hidden bg-white group/image">
          {currentImage && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-white" />
              )}
              <img
                key={currentImage}
                src={currentImage}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain p-2 transition-opacity duration-500 ease-in-out ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } group-hover/image:scale-105`}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="w-12 h-12 sm:w-20 sm:h-20 text-gray-300 mb-2 sm:mb-3" />
              <span className="text-gray-400 text-xs sm:text-sm">Sin imagen</span>
            </div>
          )}

          {product.isBestseller && (
            <div className="absolute top-4 sm:top-5 left-4 sm:left-5 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                  if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
                  setBestsellerTooltipState('visible');
                  tooltipTimeout.current = setTimeout(() => {
                    setBestsellerTooltipState('fading');
                    fadeTimeout.current = setTimeout(() => setBestsellerTooltipState('hidden'), 800);
                  }, 2000);
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              </button>
              {bestsellerTooltipState !== 'hidden' && (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 left-full ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap transition-opacity duration-700 ease-out ${
                    bestsellerTooltipState === 'fading' ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  Mas vendido
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20">
            <span className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
              {product.code}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 text-center">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {variantNames.length > 0 && (
            <div>
              <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 font-semibold">
                Variantes:
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5">
                {variants.map((variant, index) => (
                  variant.variantName && (
                    <button
                      key={index}
                      onClick={() => handleVariantClick(index)}
                      aria-label={`Ver variante ${variant.variantName} de ${product.name}`}
                      aria-pressed={selectedVariantIndex === index}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                        selectedVariantIndex === index
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                      }`}
                    >
                      {variant.variantName}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
