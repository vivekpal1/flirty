import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200"
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;