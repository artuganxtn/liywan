/**
 * Mobile Helper Utilities
 * Utilities for better mobile experience
 */

/**
 * Check if device is mobile
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= 768 && width < 1024;
};

/**
 * Check if device is desktop
 */
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
};

/**
 * Get responsive padding classes
 */
export const getResponsivePadding = (variant: 'section' | 'card' | 'container' = 'section'): string => {
  switch (variant) {
    case 'section':
      return 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12';
    case 'card':
      return 'p-4 sm:p-5 lg:p-6';
    case 'container':
      return 'px-3 sm:px-4 md:px-6 lg:px-8';
    default:
      return 'p-4 sm:p-6 lg:p-8';
  }
};

/**
 * Get responsive grid classes
 */
export const getResponsiveGrid = (cols: { mobile: number; tablet: number; desktop: number }): string => {
  return `grid grid-cols-${cols.mobile} md:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
};

/**
 * Get responsive text size
 */
export const getResponsiveText = (variant: 'heading' | 'body' | 'small' = 'body'): string => {
  switch (variant) {
    case 'heading':
      return 'text-xl sm:text-2xl md:text-3xl lg:text-4xl';
    case 'body':
      return 'text-sm sm:text-base lg:text-lg';
    case 'small':
      return 'text-xs sm:text-sm';
    default:
      return 'text-base';
  }
};

/**
 * Handle touch events for better mobile UX
 */
export const handleTouchStart = (e: React.TouchEvent) => {
  // Add touch feedback
  const target = e.currentTarget as HTMLElement;
  target.style.opacity = '0.7';
};

export const handleTouchEnd = (e: React.TouchEvent) => {
  const target = e.currentTarget as HTMLElement;
  target.style.opacity = '1';
};

/**
 * Prevent zoom on input focus (iOS)
 */
export const preventZoomOnFocus = () => {
  if (typeof window === 'undefined') return;
  
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    // Re-enable zoom after a delay
    setTimeout(() => {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }, 1000);
  }
};

