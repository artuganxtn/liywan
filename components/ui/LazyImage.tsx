import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  className?: string;
  aspectRatio?: number;
  showSkeleton?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback = '/logo.png',
  className = '',
  aspectRatio,
  showSkeleton = true,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.1 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isIntersecting && !imageSrc) {
      // Start loading image
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
      };
      img.onerror = () => {
        setHasError(true);
        setImageSrc(fallback);
      };
      img.src = src;
    }
  }, [isIntersecting, src, fallback, imageSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallback);
  };

  const displaySrc = imageSrc || placeholder || fallback;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${aspectRatio ? 'aspect-[${aspectRatio}]' : ''} ${className}`}
      style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
    >
      {showSkeleton && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <AnimatePresence mode="wait">
        {displaySrc && (
          <motion.img
            ref={imgRef}
            src={displaySrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full object-cover ${isLoaded ? '' : 'opacity-0'}`}
            loading="lazy"
            {...props}
          />
        )}
      </AnimatePresence>

      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};

