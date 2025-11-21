import React from 'react';

interface PasswordStrengthIndicatorProps {
  strength: number; // 0 to 4
}

const strengthLevels = [
  { text: '', color: '', width: '0%' }, // 0
  { text: 'Fraca', color: 'bg-red-500', width: '25%' }, // 1
  { text: 'Média', color: 'bg-yellow-500', width: '50%' }, // 2
  { text: 'Forte', color: 'bg-brand-green-light', width: '75%' }, // 3
  { text: 'Muito Forte', color: 'bg-brand-green', width: '100%' } // 4
];

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
  if (strength === 0) return null;

  const currentStrength = strengthLevels[strength];

  return (
    <div className="mt-2">
      <div className="w-full bg-brand-black rounded-full h-1.5">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${currentStrength.color}`}
          style={{ width: currentStrength.width }}
        ></div>
      </div>
      <p className="text-right text-xs mt-1 font-medium text-gray-400">{currentStrength.text}</p>
    </div>
  );
};

export default PasswordStrengthIndicator;
