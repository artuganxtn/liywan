import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'primary' | 'white' | 'gray';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  variant = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    primary: 'text-qatar',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`${sizeClasses[size]} ${colorClasses[variant]} ${className}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
};

