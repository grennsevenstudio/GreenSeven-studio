
import React, { useState, useRef, useEffect } from 'react';
import type { User, Notification, Language } from '../../types';
import { ICONS, RANK_COLORS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';

// Helper function for relative time
function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return `há ${years} ${years > 1 ? 'anos' : 'ano'}`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return `há ${months} ${months > 1 ? 'meses' : 'mês'}`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return `há ${days} ${days > 1 ? 'dias' : 'dia'}`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return `há ${hours} ${hours > 1 ? 'horas' : 'hora'}`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return `há ${minutes} ${minutes > 1 ? 'minutos' : 'minuto'}`;
    }
    return "agora mesmo";
}

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
];

interface HeaderProps {
  user: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  notifications?: Notification[];
  onMarkAllAsRead?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onRefreshData?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar, notifications = [], onMarkAllAsRead, isDarkMode, toggleTheme, language, setLanguage, onRefreshData }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const t = TRANSLATIONS[language];
  const firstName = user.name.split(' ')[0];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = () => {
      setIsNotificationsOpen(!isNotificationsOpen);
  };
  
  const handleRefresh = () => {
      if (onRefreshData) {
          setIsRefreshing(true);
          onRefreshData();
          // Animate for at least 1s
          setTimeout(() => setIsRefreshing(false), 1000);
      }
  };

  return (
    <header className="h-16 bg-brand-gray border-b border-gray-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white lg:hidden focus:outline-none"
        >
          {ICONS.menu}
        </button>
        {/* Welcome Message - Visible on Mobile and Desktop (as per user screenshot) */}
        <div className="flex items-center gap-2">
             {/* Icon only on mobile to avoid duplicity with sidebar */}
            <div className="lg:hidden">
                {React.cloneElement(ICONS.logo as React.ReactElement<any>, {className: "h-6 w-6 text-brand-green"})}
            </div>
            <span className="font-bold text-white truncate max-w-[200px]">{t.welcome}, {firstName}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
         {/* Refresh Data Button (Hidden on small screens to match image minimalism, active on click) */}
         {onRefreshData && (
             <button 
                onClick={handleRefresh} 
                className={`text-gray-400 hover:text-brand-green transition-colors hidden md:block ${isRefreshing ? 'animate-spin text-brand-green' : ''}`}
                title="Atualizar Dados"
             >
                 {ICONS.refresh}
             </button>
         )}

         {/* Language Selector (Flag + Arrow) */}
         <div className="relative" ref={langMenuRef}>
            <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity"
            >
                <span className="text-2xl leading-none">{LANGUAGE_OPTIONS.find(l => l.code === language)?.flag}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            
            {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-brand-gray border border-gray-700 rounded-lg shadow-xl py-1 animate-fade-in-up z-50">
                    {LANGUAGE_OPTIONS.map((option) => (
                        <button
                            key={option.code}
                            onClick={() => {
                                setLanguage(option.code);
                                setIsLangMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 flex items-center gap-3 transition-colors ${language === option.code ? 'bg-gray-800/50 text-brand-green' : 'text-gray-300'}`}
                        >
                            <span className="text-lg">{option.flag}</span>
                            <span className="font-medium">{option.code.toUpperCase()}</span>
                        </button>
                    ))}
                </div>
            )}
         </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-gray-400 hover:text-white transition-colors"
          title={isDarkMode ? t.theme_light : t.theme_dark}
        >
          {isDarkMode ? ICONS.sun : ICONS.moon}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            className="text-gray-400 hover:text-white relative flex items-center"
            onClick={handleNotificationClick}
          >
            {ICONS.bell}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-brand-gray border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in-up z-50">
              <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-white">Notificações</h3>
                {unreadCount > 0 && onMarkAllAsRead && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-brand-green hover:underline">
                        Marcar todas como lidas
                    </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-sm">
                        Nenhuma notificação.
                    </div>
                ) : (
                    notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-700 hover:bg-gray-800 transition-colors ${!notification.isRead ? 'bg-gray-800/50' : ''}`}
                    >
                        <p className="text-sm text-gray-200">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{timeAgo(new Date(notification.date))}</p>
                    </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown (Image Only) */}
        <div className="relative" ref={profileRef}>
            <button 
                className="flex items-center focus:outline-none"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
                <img
                    src={user.avatarUrl}
                    alt="User Avatar"
                    className="h-10 w-10 rounded-full border-2 border-brand-green object-cover hover:border-white transition-colors"
                />
            </button>
            
            {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-brand-gray border border-gray-700 rounded-lg shadow-xl py-1 animate-fade-in-up z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className={`text-[10px] px-2 py-0.5 mt-1 rounded-full inline-block ${RANK_COLORS[user.rank]}`}>
                            {user.rank}
                        </p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                    >
                        {ICONS.logout}
                        {t.logout}
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
