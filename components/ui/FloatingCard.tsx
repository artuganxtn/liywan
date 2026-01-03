import React from 'react';

export interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({ children, className = '', delay = 0 }) => (
  <div
    className={`bg-white rounded-2xl shadow-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-t-4 border-qatar ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);


