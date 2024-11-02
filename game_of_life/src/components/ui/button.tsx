// src/components/ui/button.tsx
import React from 'react';

export const Button = ({ onClick, children, variant = 'primary', className }) => {
  const variantStyles = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-500 text-white',
    outline: 'border border-gray-300 text-gray-700',
  };

  return (
    <button
      onClick={onClick}
      className={`${variantStyles[variant]} rounded px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
};
