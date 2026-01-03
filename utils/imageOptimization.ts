/**
 * Image Optimization Utilities
 */

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(src: string, widths: number[] = [400, 800, 1200, 1600]): string {
  return widths.map(width => `${src}?w=${width} ${width}w`).join(', ');
}

/**
 * Lazy load image with placeholder
 */
export function createLazyImage(src: string, alt: string, className: string = ''): string {
  return `
    <img
      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
      data-src="${src}"
      alt="${alt}"
      class="lazy-image ${className}"
      loading="lazy"
    />
  `;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Convert image to WebP format (if supported)
 */
export function getOptimizedImageUrl(src: string, format: 'webp' | 'avif' = 'webp'): string {
  if (typeof window === 'undefined') return src;
  
  // Check if browser supports the format
  const canvas = document.createElement('canvas');
  const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  const supportsAVIF = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

  if (format === 'webp' && supportsWebP) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  
  if (format === 'avif' && supportsAVIF) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
  }

  return src;
}

