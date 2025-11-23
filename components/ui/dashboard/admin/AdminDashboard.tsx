

import React, { useState } from 'react';
import type { User, Transaction, ChatMessage, PlatformSettings, AdminActionLog, Language } from '../../../../types';
import { TransactionStatus, UserStatus } from '../../../../types';
import Sidebar from '../../../layout/Sidebar';
import Header from '../../../layout/Header';
import { ICONS } from '../../../../constants';
import { TRANSLATIONS } from '../../../../lib/translations';

// Import admin pages
import AdminDashboardHome from './pages/AdminDashboardHome';
import ManageUsers from './pages/ManageUsers';
import ManageTransactions from './pages/ManageTransactions';
import ManagePlans from './pages/ManagePlans';
import Settings from './pages/Settings';
import ManageSupport from './pages/ManageSupport';
import AdminActionLogs from './pages/AdminActionLogs';

interface AdminDashboardProps {
  user: User;
  allUsers: User[];
  allTransactions: Transaction[];
  chatMessages: ChatMessage[];
  platformSettings: PlatformSettings;
  adminActionLogs: AdminActionLog[];
  onLogout: () => void;
  onUpdateTransaction: (transactionId: string, newStatus: TransactionStatus) => void;
  onUpdateUserStatus: (userId: string, newStatus: UserStatus, reason?: string) => void;
  onPayoutBonus: (depositTransaction: Transaction) => void;
  onSendMessage: (senderId: string, receiverId: string, text: string, attachment?: File) => void;
  onUpdateSettings: (newSettings: PlatformSettings) => void;
  onAdminUpdateUserBalance: (userId: string, newBalance: number) => void;
  onUpdateUser: (updatedUser: User) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onRefreshData: () => void;
  onBroadcastNotification: (message: string) => void;
  referralRates?: {[key:number]: number};
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { user, allUsers, allTransactions, chatMessages, platformSettings, adminActionLogs, onLogout, onUpdateTransaction, onUpdateUserStatus, onPayoutBonus, onSendMessage, onUpdateSettings, onAdminUpdateUserBalance, onUpdateUser, isDarkMode, toggleTheme, language, setLanguage, onRefreshData, onBroadcastNotification, referralRates } = props;
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const t = TRANSLATIONS[language];

  const navItems = [
    { label: t.dashboard, icon: ICONS.dashboard, view: 'dashboard' },
    { label: t.users, icon: ICONS.adminUsers, view: 'users' },
    { label: t.transactions, icon: ICONS.transactions, view: 'transactions' },
    { label: t.logs, icon: ICONS.history, view: 'logs' },
    { label: t.support, icon: ICONS.support, view: 'support' },
    { label: t.plans, icon: ICONS.plans, view: 'plans' },
    { label: t.settings, icon: ICONS.adminSettings, view: 'settings' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboardHome allUsers={allUsers} allTransactions={allTransactions} onBroadcastNotification={onBroadcastNotification} />;
      case 'users':
        return <ManageUsers allUsers={allUsers} onAdminUpdateUserBalance={onAdminUpdateUserBalance} onUpdateUserStatus={onUpdateUserStatus} />;
      case 'transactions':
        return <ManageTransactions allUsers={allUsers} transactions={allTransactions} onUpdateTransaction={onUpdateTransaction} onPayoutBonus={onPayoutBonus} referralRates={referralRates} />;
      case 'logs':
        return <AdminActionLogs adminActionLogs={adminActionLogs} />;
      case 'support':
        return <ManageSupport adminUser={user} allUsers={allUsers} allMessages={chatMessages} onSendMessage={onSendMessage} onUpdateUser={onUpdateUser} />;
      case 'plans':
        return <ManagePlans />;
      case 'settings':
        return <Settings platformSettings={platformSettings} onUpdateSettings={onUpdateSettings} allUsers={allUsers} />;
      default:
        return <AdminDashboardHome allUsers={allUsers} allTransactions={allTransactions} onBroadcastNotification={onBroadcastNotification} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar
        user={user}
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logoUrl={platformSettings.logoUrl}
      />
      <div className="flex-1 lg:pl-64">
        <Header 
            user={user} 
            onLogout={onLogout} 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            language={language}
            setLanguage={setLanguage}
            onRefreshData={onRefreshData}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
