
import React, { useState, useRef, useEffect } from 'react';
import type { User, Notification, Language } from '../../types';
import { ICONS, RANK_COLORS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';

// Helper function for relative time
function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "agora mesmo";
    
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

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
];

interface HeaderProps {
  user: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  notifications?: Notification[];
  onMarkAllAsRead?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language?: Language;
  setLanguage?: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    user, 
    onLogout, 
    toggleSidebar, 
    notifications = [], 
    onMarkAllAsRead,
    isDarkMode,
    toggleTheme,
    language = 'pt',
    setLanguage
}) => {
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLangOpen, setLangOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const t = TRANSLATIONS[language];

  // Click outside handler
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setNotificationsOpen(false);
          }
          if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
              setProfileOpen(false);
          }
          if (langRef.current && !langRef.current.contains(event.target as Node)) {
              setLangOpen(false);
          }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-brand-gray border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 lg:px-8 transition-colors duration-300 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-brand-green"
        >
          {ICONS.menu}
        </button>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
           {t.welcome}, <span className="text-brand-green">{user.name.split(' ')[0]}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Language Selector */}
        {setLanguage && (
            <div className="relative" ref={langRef}>
                <button 
                    onClick={() => setLangOpen(!isLangOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <span className="text-xl">{LANGUAGES.find(l => l.code === language)?.flag}</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                        {LANGUAGES.find(l => l.code === language)?.label}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {isLangOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setLangOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${language === lang.code ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                {lang.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Theme Toggle */}
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isDarkMode ? t.theme_light : t.theme_dark}
        >
            {isDarkMode ? ICONS.sun : ICONS.moon}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors"
          >
            {ICONS.bell}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-brand-gray"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white">Notificações</h3>
                {unreadCount > 0 && onMarkAllAsRead && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-brand-green hover:underline">
                        Marcar lidas
                    </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(new Date(notif.date))}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Nenhuma notificação no momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={`h-9 w-9 rounded-full object-cover border-2 ${user.isAdmin ? 'border-brand-blue' : 'border-brand-green'}`}
            />
            <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${user.isAdmin ? 'bg-brand-blue/20 text-brand-blue' : RANK_COLORS[user.rank] || 'bg-gray-700 text-gray-300'}`}>
                    {user.isAdmin ? t.admin : user.rank}
                </span>
            </div>
            <svg className="w-4 h-4 text-gray-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
                 <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
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
