import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { ChevronRight } from 'lucide-react';

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  description,
  image,
  badge,
  actions,
  onClick,
  className = '',
  children,
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Card
        className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              {badge && <div className="flex-shrink-0">{badge}</div>}
            </div>
            {description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>
            )}
            {children && <div className="mt-2">{children}</div>}
            {actions && (
              <div className="mt-3 flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          {onClick && (
            <ChevronRight
              size={18}
              className="text-gray-400 flex-shrink-0 mt-1"
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
};

