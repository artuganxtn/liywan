import React from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none';
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  count = 1,
}) => {
  const baseStyles = 'bg-gray-200';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    shimmer: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const skeletonElement = (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          {skeletonElement}
        </motion.div>
      ))}
    </div>
  );
};

// Pre-built skeleton components
export const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <Skeleton variant="rectangular" height={24} width="60%" />
    <Skeleton variant="rectangular" height={16} width="80%" />
    <Skeleton variant="rectangular" height={16} width="40%" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <Skeleton variant="rectangular" height={20} width="30%" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="rectangular" height={16} width="40%" />
            <Skeleton variant="rectangular" height={12} width="60%" />
          </div>
          <Skeleton variant="rectangular" height={24} width={80} />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="rectangular" height={18} width="50%" />
          <Skeleton variant="rectangular" height={14} width="70%" />
        </div>
        <Skeleton variant="rectangular" height={32} width={100} />
      </div>
    ))}
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
    <Skeleton variant="rectangular" height={24} width="40%" />
    <Skeleton variant="rectangular" height={200} width="100%" />
  </div>
);
