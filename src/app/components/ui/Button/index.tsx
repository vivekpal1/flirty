import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  className = '', 
  ...props 
}) => {
  const baseClasses = 'font-bold rounded focus:outline-none focus:ring-2 focus:ring-opacity-50 transition duration-200';
  
  const variantClasses = {
    primary: 'bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-500',
    secondary: 'bg-pink-500 hover:bg-pink-600 text-white focus:ring-pink-500',
    outline: 'bg-transparent hover:bg-gray-100 text-purple-500 border border-purple-500 focus:ring-purple-500',
  }[variant];

  const sizeClasses = {
    small: 'py-1 px-2 text-sm',
    medium: 'py-2 px-4 text-base',
    large: 'py-3 px-6 text-lg',
  }[size];

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;