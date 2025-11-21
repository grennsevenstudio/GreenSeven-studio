import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth = false, className = '', isLoading = false, ...props }) => {
  const baseStyles = 'px-6 py-3 font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-black flex items-center justify-center gap-2 transform';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-brand-green to-brand-blue text-brand-black shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 hover:-translate-y-0.5 focus:ring-brand-green',
    secondary: 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30 focus:ring-brand-blue',
    ghost: 'text-gray-400 hover:text-brand-green hover:bg-brand-gray',
  };

  const widthStyle = fullWidth ? 'w-full' : 'w-auto';
  
  const loadingStyles = isLoading ? 'opacity-70 cursor-not-allowed' : '';
  
  const spinner = (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${loadingStyles} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? spinner : children}
    </button>
  );
};

export default Button;