

import React from 'react';
import type { User, Language } from '../../types';
import { ICONS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';

interface NavItem {
  label: string;
  // FIX: Changed JSX.Element to React.ReactNode to resolve JSX namespace error.
  icon: React.ReactNode;
  view: string;
}

interface SidebarProps {
  user: User;
  navItems: NavItem[];
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  logoUrl?: string;
  onLogout?: () => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ user, navItems, activeView, setActiveView, isOpen, onClose, logoUrl, onLogout, language }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-brand-gray border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 z-40 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center gap-2 p-4 border-b border-gray-200 dark:border-gray-800 h-16">
          {logoUrl ? (
            <img src={logoUrl} alt="GreennSeven Logo" className="h-10" />
          ) : (
            <>
              <span className="text-xl font-bold">
                <span className="bg-gradient-to-r from-brand-green to-brand-blue text-transparent bg-clip-text">GreennSeven</span>
                <span className="text-gray-900 dark:text-white"> Invest</span>
              </span>
            </>
          )}
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView(item.view);
                onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                activeView === item.view
                  ? 'bg-brand-green text-brand-black font-bold shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className={activeView === item.view ? 'text-brand-black' : 'text-gray-500 dark:text-gray-400'}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
           <div className="flex items-center gap-3">
            <img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-brand-green" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.isAdmin ? 'Administrator' : 'Investor'}</p>
            </div>
           </div>
           {user.isAdmin && onLogout && (
                <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onLogout();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-500 hover:bg-red-500/10 mt-4`}
                >
                <div className={'text-red-500'}>
                    {ICONS.logout}
                </div>
                <span className="font-bold">{t.logout}</span>
                </a>
           )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;