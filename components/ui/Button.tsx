import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = React.memo(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed rounded-xl touch-manipulation';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-qatar text-white hover:bg-qatar-light shadow-lg hover:shadow-qatar/30 active:shadow-md border border-transparent hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-white text-qatar hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-100 active:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
    outline: 'border-2 border-qatar text-qatar hover:bg-qatar-50 active:bg-qatar-100 hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'text-gray-600 hover:text-qatar hover:bg-qatar-50 active:bg-qatar-100 hover:scale-[1.02] active:scale-[0.98]',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 border border-transparent shadow-sm hover:shadow-md active:shadow-sm hover:scale-[1.02] active:scale-[0.98]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-2 text-xs min-h-[36px] sm:min-h-[32px]',
    md: 'px-6 py-3.5 text-sm min-h-[44px] sm:min-h-[40px]',
    lg: 'px-8 py-4 text-base min-h-[48px] sm:min-h-[44px]',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = 'Button';


