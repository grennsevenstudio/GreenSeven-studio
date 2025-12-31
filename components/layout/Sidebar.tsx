
import React, { useState } from 'react';
import type { User, Language, PlatformSettings } from '../../types';
import { InvestorRank } from '../../types';
import { ICONS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';
import { formatCurrency } from '../../lib/utils';
import Button from '../ui/Button';

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
  platformSettings?: PlatformSettings;
  onDepositClick?: () => void;
  onWithdrawClick?: () => void;
}

const RANK_GRADIENT_STOPS = {
  [InvestorRank.Bronze]: { from: '#f97316', to: '#b45309', shadow: 'shadow-orange-700/30' },
  [InvestorRank.Silver]: { from: '#94a3b8', to: '#64748b', shadow: 'shadow-slate-500/30' },
  [InvestorRank.Gold]: { from: '#facc15', to: '#d97706', shadow: 'shadow-yellow-500/30' },
  [InvestorRank.Platinum]: { from: '#22d3ee', to: '#0284c7', shadow: 'shadow-cyan-500/30' },
  [InvestorRank.Diamond]: { from: '#00FF9C', to: '#059669', shadow: 'shadow-green-500/30' },
};

const RankShield: React.FC<{ rank: InvestorRank }> = ({ rank }) => {
    const style = RANK_GRADIENT_STOPS[rank] || RANK_GRADIENT_STOPS[InvestorRank.Bronze];
    const gradientId = `shield-grad-${rank}`;
  
    return (
        <div className="px-4 py-8 flex justify-center items-center">
            <div className={`w-20 h-24 animate-spin-slow drop-shadow-lg ${style.shadow}`}>
                <svg viewBox="0 0 100 125" className="w-full h-full">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: style.from }} />
                            <stop offset="100%" style={{ stopColor: style.to }} />
                        </linearGradient>
                    </defs>
                    <path
                        d="M50 0 L95 15 V 60 C 95 95, 50 125, 50 125 C 50 125, 5 95, 5 60 V 15 Z"
                        fill={`url(#${gradientId})`}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="2"
                    />
                    {/* Inner highlight */}
                    <path
                        d="M50 5 L90 18 V 60 C 90 90, 50 118, 50 118 C 50 118, 10 90, 10 60 V 18 Z"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1.5"
                    />
                </svg>
            </div>
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ user, navItems, activeView, setActiveView, isOpen, onClose, logoUrl, onLogout, language, platformSettings, onDepositClick, onWithdrawClick }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);

  const handleRating = (rating: number) => {
    // In a real app, this would send data to an analytics service
    console.log(`User rated the experience: ${rating}/5`);
    setIsRatingSubmitted(true);
  };

  const ratings = [
    { rating: 1, emoji: '😠', label: 'Péssimo' },
    { rating: 2, emoji: '😟', label: 'Ruim' },
    { rating: 3, emoji: '😐', label: 'Ok' },
    { rating: 4, emoji: '🙂', label: 'Bom' },
    { rating: 5, emoji: '😍', label: 'Excelente' },
  ];

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

        {!user.isAdmin && <RankShield rank={user.rank} />}

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
        
        {/* QUICK ACTIONS */}
        {onDepositClick && onWithdrawClick && !user.isAdmin && (
            <div className="px-4 py-4 space-y-3 border-t border-gray-200 dark:border-gray-800">
                <Button onClick={() => { onDepositClick(); onClose(); }} fullWidth>
                    {ICONS.deposit} Depositar
                </Button>
                <Button onClick={() => { onWithdrawClick(); onClose(); }} variant="secondary" fullWidth>
                    {ICONS.withdraw} Sacar
                </Button>
            </div>
        )}

        {/* SATISFACTION RATING */}
        {!user.isAdmin && (
            <div className="px-4 py-4 space-y-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-center font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Avalie sua experiência</p>
                {isRatingSubmitted ? (
                    <div className="text-center py-4 text-brand-green font-bold animate-fade-in">
                        Obrigado pelo seu feedback!
                    </div>
                ) : (
                    <div className="flex justify-around items-center pt-2">
                        {ratings.map(r => (
                            <button 
                                key={r.rating} 
                                title={r.label}
                                onClick={() => handleRating(r.rating)}
                                className="text-3xl grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-125 transition-all duration-200 focus:outline-none"
                            >
                                {r.emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Dollar Rate Display for non-admins */}
        {!user.isAdmin && platformSettings && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cotação do Dólar</p>
                <p className="text-lg font-bold text-brand-green mt-1">{formatCurrency(platformSettings.dollarRate, 'BRL')}</p>
            </div>
        )}

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
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
