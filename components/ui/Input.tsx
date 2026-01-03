import React from 'react';
import { sanitizeInput } from '../../utils/security';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = React.memo(({ label, icon, className = '', error, value, onChange, ...props }) => {
  // Ensure value is never undefined for controlled inputs
  const inputValue = value ?? '';
  
  const inputId = props.id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random().toString(36).substr(2, 9)}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // Don't sanitize during typing - only sanitize on submit
      // Sanitizing during typing breaks input for special characters
      // Pass the original event directly
      onChange(e);
    }
  };

  return (
    <div className="w-full group">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-qatar transition-colors">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-xl px-4 py-3 sm:py-3.5 min-h-[44px] sm:min-h-[40px] ${icon ? 'pl-10 sm:pl-11' : ''} text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500/10 focus:border-red-500' : 'focus:ring-qatar/10 focus:border-qatar'
          } transition-all shadow-sm hover:border-gray-300 touch-manipulation ${className}`}
          value={inputValue}
          onChange={handleChange}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';


