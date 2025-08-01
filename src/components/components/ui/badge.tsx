import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-blue-100 text-blue-800': variant === 'default',
          'bg-gray-100 text-gray-800': variant === 'secondary',
          'border border-gray-200 bg-white text-gray-700': variant === 'outline',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};