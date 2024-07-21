import React from 'react';

interface TextProps {
  variant?: 'body' | 'heading' | 'subheading' | 'caption';
  children: React.ReactNode;
  className?: string;
}

const Text: React.FC<TextProps> = ({ variant = 'body', children, className = '' }) => {
  const baseClasses = 'text-gray-900';
  
  const variantClasses = {
    body: 'text-base',
    heading: 'text-2xl font-bold',
    subheading: 'text-xl font-semibold',
    caption: 'text-sm text-gray-600',
  }[variant];

  const Component = variant === 'heading' ? 'h1' : variant === 'subheading' ? 'h2' : 'p';

  return (
    <Component className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </Component>
  );
};

export default Text;