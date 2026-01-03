import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = React.memo(({ children, className = '', onClick }) => {
  // Remove duplicate hover classes from className if present
  const cleanClassName = className.replace(/hover:shadow-md\s*/g, '').replace(/hover:shadow-lg\s*/g, '').replace(/transition-all\s*/g, '').replace(/duration-\d+\s*/g, '').trim();
  
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-5 md:p-6 transition-all duration-300 hover:shadow-lg hover:border-gray-200 ${onClick ? 'cursor-pointer touch-manipulation active:scale-[0.98]' : ''} ${cleanClassName}`}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';


