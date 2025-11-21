
import React, { useState } from 'react';
import type { User, Notification } from '../../types';
import { ICONS, RANK_COLORS } from '../../constants';
import Button from '../ui/Button';

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

const NotificationDropdown: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
    const recentNotifications = notifications.slice(0, 5);

    return (
        <>
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 animate-fade-in-down">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {recentNotifications.length > 0 ? (
                    recentNotifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-brand-black/50 ${!n.isRead ? 'bg-brand-blue/10' : ''}`}>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{n.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{timeAgo(new Date(n.date))}</p>
                        </div>
                    ))
                ) : (
                    <p className="p-4 text-sm text-center text-gray-500">Nenhuma notificação nova.</p>
                )}
            </div>
            {notifications.length > 5 && (
                <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                    <a href="#" className="text-sm text-brand-green hover:underline">Ver todas</a>
                </div>
            )}
        </div>
        <style>{`
            @keyframes fade-in-down {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
        `}</style>
        </>
    );
};


interface HeaderProps {
  user: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  notifications?: Notification[];
  onMarkAllAsRead?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar, notifications = [], onMarkAllAsRead, isDarkMode, toggleTheme }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleToggleDropdown = () => {
      if (!isDropdownOpen) {
          onMarkAllAsRead?.();
      }
      setDropdownOpen(prev => !prev);
  };
  
  return (
    <header className="bg-white dark:bg-brand-gray/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          {ICONS.menu}
        </button>
        <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Bem-vindo, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.isAdmin ? 'Administrador' : 'Investidor'}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
        >
            {isDarkMode ? ICONS.sun : ICONS.moon}
        </button>

        {!user.isAdmin && (
             <div className="relative">
                <button onClick={handleToggleDropdown} className="text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors">
                    {ICONS.bell}
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-brand-gray"></span>
                    )}
                </button>
                {isDropdownOpen && <NotificationDropdown notifications={notifications} />}
            </div>
        )}
        <div className={`px-3 py-1 text-sm font-semibold rounded-full ${RANK_COLORS[user.rank]}`}>
          {user.rank}
        </div>
        <div className="flex items-center gap-2">
          <img src={user.avatarUrl} alt="User Avatar" className="w-10 h-10 rounded-full border-2 border-brand-green object-cover" />
        </div>
        <button onClick={onLogout} className="text-gray-500 dark:text-gray-400 hover:text-brand-green transition-colors">
          {ICONS.logout}
        </button>
      </div>
    </header>
  );
};

export default Header;
