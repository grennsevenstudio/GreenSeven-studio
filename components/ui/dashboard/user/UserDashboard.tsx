
import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage } from '../../../../types';
import Sidebar from '../../../layout/Sidebar';
import Header from '../../../layout/Header';
import BottomNavBar from '../../../layout/BottomNavBar';
import { ICONS } from '../../../../constants';

// Import pages
import DashboardHome from './pages/DashboardHome';
import Plans from './pages/Plans';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import CareerPlan from './pages/CareerPlan';
import SupportChat from './pages/SupportChat';

interface UserDashboardProps {
  user: User;
  adminUser: User;
  transactions: Transaction[];
  allUsers: User[];
  allTransactions: Transaction[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  onLogout: () => void;
  onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => void;
  onMarkAllNotificationsAsRead: () => void;
  onSendMessage: (senderId: string, receiverId: string, text: string, attachment?: File) => void;
  onUpdateUser: (updatedUser: User) => void;
  onUpdatePassword: (userId: string, newPassword: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const SIDEBAR_NAV_ITEMS = [
  { label: 'Dashboard', icon: ICONS.dashboard, view: 'dashboard' },
  { label: 'Planos', icon: ICONS.plans, view: 'plans' },
  { label: 'Plano de Carreira', icon: ICONS.career, view: 'career' },
  { label: 'Movimentações', icon: ICONS.transactions, view: 'transactions' },
  { label: 'Meu Perfil', icon: ICONS.profile, view: 'profile' },
  { label: 'Suporte', icon: ICONS.support, view: 'support' },
];

const BOTTOM_NAV_ITEMS = [
    { label: 'Dashboard', icon: ICONS.dashboard, view: 'dashboard' },
    { label: 'Planos', icon: ICONS.plans, view: 'plans' },
    { label: 'Movimentações', icon: ICONS.transactions, view: 'transactions' },
    { label: 'Perfil', icon: ICONS.profile, view: 'profile' },
];

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
    <div className="space-y-3">
        <div className="h-8 w-1/3 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700"></div>
         ))}
    </div>

    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700"></div>
    
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700"></div>
         ))}
    </div>

    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700"></div>
  </div>
);

const UserDashboard: React.FC<UserDashboardProps> = (props) => {
  const { user, adminUser, transactions, allUsers, allTransactions, notifications, chatMessages, onLogout, onAddTransaction, onMarkAllNotificationsAsRead, onSendMessage, onUpdateUser, onUpdatePassword, isDarkMode, toggleTheme } = props;
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a subtle data fetching delay for better UX smoothness
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome 
                    user={user} 
                    transactions={transactions} 
                    onAddTransaction={onAddTransaction}
                    setActiveView={setActiveView}
                />;
      case 'plans':
        return <Plans user={user} onUpdateUser={onUpdateUser} />;
      case 'career':
        return <CareerPlan user={user} allUsers={allUsers} allTransactions={allTransactions} />;
      case 'transactions':
        return <Transactions transactions={transactions} />;
      case 'profile':
        return <Profile user={user} onUpdateUser={onUpdateUser} onUpdatePassword={onUpdatePassword} allTransactions={allTransactions} setActiveView={setActiveView} />;
      case 'support':
        const userChatMessages = chatMessages
            .filter(m => (m.senderId === user.id && m.receiverId === adminUser.id) || (m.senderId === adminUser.id && m.receiverId === user.id))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return <SupportChat user={user} admin={adminUser} messages={userChatMessages} onSendMessage={onSendMessage} />;
      default:
        return <DashboardHome 
                    user={user} 
                    transactions={transactions} 
                    onAddTransaction={onAddTransaction}
                    setActiveView={setActiveView}
                />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar
        user={user}
        navItems={SIDEBAR_NAV_ITEMS}
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        <Header 
            user={user} 
            onLogout={onLogout} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            notifications={notifications}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {isLoading ? <DashboardSkeleton /> : renderContent()}
        </main>
      </div>
       <BottomNavBar
        navItems={BOTTOM_NAV_ITEMS}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default UserDashboard;
