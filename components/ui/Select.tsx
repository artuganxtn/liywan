import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', error, value, ...props }) => {
  // Use the provided value, or empty string if not provided (don't auto-select first option)
  const selectValue = value !== undefined && value !== null ? value : '';
  
  return (
    <div className="w-full group">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full bg-white border ${
            error ? 'border-red-500' : 'border-gray-200'
          } rounded-xl px-4 py-3.5 text-gray-900 appearance-none focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500/10 focus:border-red-500' : 'focus:ring-qatar/10 focus:border-qatar'
          } transition-all shadow-sm ${className}`}
          value={selectValue}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};


