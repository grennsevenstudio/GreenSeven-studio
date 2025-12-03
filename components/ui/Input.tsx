import React, { useState } from 'react';
import { ICONS } from '../../constants';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: boolean | string;
}

const Input: React.FC<InputProps> = ({ label, id, type = 'text', icon, error, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const isPasswordField = type === 'password';
  const currentType = isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type;

  const baseClasses = `w-full bg-gray-50 dark:bg-brand-black border rounded-lg py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-300 ${icon ? 'pl-10' : 'px-4'} ${isPasswordField ? 'pr-12' : ''}`;
  
  const stateClasses = error 
    ? 'border-red-500 focus:ring-red-500 animate-shake' 
    : 'border-gray-300 dark:border-gray-700 focus:ring-brand-green';

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 transition-colors">
        {label}
      </label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">{icon}</div>}
        <input
          type={currentType}
          id={id}
          className={`${baseClasses} ${stateClasses}`}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors"
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {isPasswordVisible ? ICONS.eyeSlash : ICONS.eye}
          </button>
        )}
      </div>
      {typeof error === 'string' && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;