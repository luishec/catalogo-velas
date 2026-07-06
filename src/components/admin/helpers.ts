import type { Product } from '../../types';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileSizeColor(bytes: number) {
  if (bytes < 100 * 1024) return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-400' };
  if (bytes < 200 * 1024) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-400' };
  return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-400' };
}

export function getImageUrl(product: Product, index: number): string | null {
  return product.imageUrls?.[index] ?? null;
}

export function getImageCount(product: Product): number {
  return (product.imageUrls ?? []).filter(Boolean).length;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '');
}
