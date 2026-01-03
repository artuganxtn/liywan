import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface IventiaLogoProps {
  className?: string;
  color?: string;
  showTextFallback?: boolean;
  variant?: 'default' | 'compact' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export const IventiaLogo: React.FC<IventiaLogoProps> = ({ 
  className = '', 
  showTextFallback = true,
  variant = 'default',
  size = 'md',
}) => {
  const [imageError, setImageError] = useState(false);
  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  // Determine if we should show text fallback
  const shouldShowText = imageError && showTextFallback;

  return (
    <motion.div 
      className={`${sizeClass} ${className} flex items-center justify-center relative`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {shouldShowText ? (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <motion.span 
            className={`font-extrabold tracking-tight text-center leading-none ${textSizeClass}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-black">LIY</span>
            <span className="text-[#8A1538]">W</span>
            <span className="text-black">AN</span>
          </motion.span>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center group">
          <motion.img
            src="/logo.png"
            alt="LIYWAN - Elite Event & Staff Management Platform in Qatar"
            className="object-contain w-full h-full drop-shadow-sm group-hover:drop-shadow-md transition-all"
            loading="lazy"
            onError={() => setImageError(true)}
            width="200"
            height="200"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-qatar/0 via-transparent to-qatar/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-full blur-xl pointer-events-none" />
          
          {/* Loading shimmer effect */}
          {!imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          )}
        </div>
      )}
    </motion.div>
  );
};
