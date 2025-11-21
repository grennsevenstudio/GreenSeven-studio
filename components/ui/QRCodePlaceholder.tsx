import React from 'react';

const QRCodePlaceholder: React.FC<{ size?: number }> = ({ size = 200 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="bg-white p-2 rounded-lg mx-auto">
      <rect x="10" y="10" width="20" height="20" fill="#0D0D0D" />
      <rect x="15" y="15" width="10" height="10" fill="white" />
      <rect x="70" y="10" width="20" height="20" fill="#0D0D0D" />
      <rect x="75" y="15" width="10" height="10" fill="white" />
      <rect x="10" y="70" width="20" height="20" fill="#0D0D0D" />
      <rect x="15" y="75" width="10" height="10" fill="white" />
      <path
        fill="#0D0D0D"
        d="M40 10h10v10H40z M50 20h10v10H50z M60 10h10v10H60z M40 30h10v10H40z M50 40h10v10H50z M60 30h10v10H60z M70 40h10v10H70z M80 50h10v10H80z M70 60h10v10H70z M60 70h10v10H60z M50 80h10v10H50z M40 70h10v10H40z M30 60h10v10H30z M20 50h10v10H20z M30 40h10v10H30z M40 50h10v10H40z M50 60h10v10H50z M60 50h10v10H60z M70 80h10v10H70z M80 70h10v10H80z M10 40h10v10H10z M20 30h10v10H20z M30 20h10v10H30z"
      />
    </svg>
  );
};

export default QRCodePlaceholder;
