
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-brand-gray border border-gray-800 rounded-2xl p-4 md:p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export default Card;
