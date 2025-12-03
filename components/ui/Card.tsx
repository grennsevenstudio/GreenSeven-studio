
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-800 rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-lg text-gray-900 dark:text-gray-100 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;