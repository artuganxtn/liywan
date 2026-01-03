/**
 * Image Cache Utility
 * Caches images in browser for faster subsequent loads
 */

class ImageCache {
  private cache: Map<string, string> = new Map();
  private maxSize: number = 50; // Maximum number of cached images

  /**
   * Get cached image or load and cache it
   */
  async getImage(src: string): Promise<string> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Load image
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Create canvas to convert to data URL
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Cache the image
            this.setCache(src, dataUrl);
            resolve(dataUrl);
          } else {
            resolve(src);
          }
        } catch (error) {
          // If caching fails, return original src
          resolve(src);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }

  /**
   * Set cache with size limit
   */
  private setCache(key: string, value: string) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Preload images
   */
  async preloadImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.getImage(url).catch(() => {})));
  }
}

export const imageCache = new ImageCache();

