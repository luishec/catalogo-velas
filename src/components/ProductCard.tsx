import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { optimizeImageUrl } from '../lib/supabase';

interface ProductCardProduct {
  id: string;
  code: string;
  name: string;
  is_bestseller: boolean;
  image_url: string | null;
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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentImageRaw = selectedVariantIndex === -1
    ? (mainImage || product.image_url)
    : (variants[selectedVariantIndex]?.imageUrl || product.image_url);

  const currentImage = optimizeImageUrl(currentImageRaw, 70);

  const variantNames = variants
    .map(v => v.variantName)
    .filter(Boolean);

  const handleVariantClick = (index: number) => {
    setSelectedVariantIndex(index);
    setImageLoaded(false);
    setImageError(false);
  };

  const handleMainImageClick = () => {
    setSelectedVariantIndex(-1);
    setImageLoaded(false);
    setImageError(false);
  };

  return (
    <>
      <div className="group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl active:shadow-xl transition-all duration-300 overflow-hidden touch-manipulation">
        <div className="aspect-square relative overflow-hidden bg-white group/image">
          {currentImage && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-400 border-t-transparent"></div>
                </div>
              )}
              <img
                src={currentImage}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-contain p-2 transition-all duration-300 ${
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

          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20">
            <span className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
              {product.code}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {variantNames.length > 0 && (
            <div>
              <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3 flex items-center gap-1.5">
                <span>🎨</span>
                <span className="font-semibold">Variantes:</span>
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {mainImage && (
                  <button
                    onClick={handleMainImageClick}
                    aria-label={`Ver imagen principal de ${product.name}`}
                    aria-pressed={selectedVariantIndex === -1}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 touch-manipulation ${
                      selectedVariantIndex === -1
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                  >
                    Principal
                  </button>
                )}
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
