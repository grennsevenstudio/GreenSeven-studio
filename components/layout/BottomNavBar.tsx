
import React from 'react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: string;
}

interface BottomNavBarProps {
  navItems: NavItem[];
  activeView: string;
  setActiveView: (view: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ navItems, activeView, setActiveView }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-gray border-t border-gray-800 z-50 flex justify-around items-center h-16">
      {navItems.map((item) => (
        <a
          key={item.label}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView(item.view);
          }}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors text-xs ${
            activeView === item.view
              ? 'text-brand-green'
              : 'text-gray-500 hover:text-brand-green'
          }`}
        >
          {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'h-6 w-6 mb-1' })}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
};

export default BottomNavBar;