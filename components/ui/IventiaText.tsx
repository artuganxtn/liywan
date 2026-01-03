import React from 'react';

export interface IventiaTextProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

export const IventiaText: React.FC<IventiaTextProps> = ({ 
  size = 'md', 
  className = '', 
  children 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <span className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`}>
      {children || (
        <>
          <span className="text-black">LIY</span>
          <span className="text-[#8A1538]">W</span>
          <span className="text-black">AN</span>
        </>
      )}
    </span>
  );
};

