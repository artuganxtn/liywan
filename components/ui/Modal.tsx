import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-2 sm:mx-4',
};

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  className = '',
}) => {
  if (typeof document === 'undefined') return null;

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Prevent iOS bounce scroll
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />
          <div 
            className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-2 md:p-4 pointer-events-none ${className}`}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: size === 'full' ? '100%' : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: size === 'full' ? '100%' : 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`w-full ${sizeClasses[size]} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[95vh] sm:max-h-[90vh]`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar for mobile */}
              <div className="sm:hidden flex justify-center pt-2 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50 flex-shrink-0 sticky top-0 z-10">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 pr-2 truncate flex-1">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors touch-manipulation flex-shrink-0 active:scale-95"
                  aria-label="Close modal"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};


