import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 sm:py-12 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-qatar animate-spin mb-3`} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
};

