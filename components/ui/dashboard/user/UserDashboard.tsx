






import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage, InvestmentPlan, Language, SyncStatus, PlatformSettings } from '../../../../types';
import Sidebar from '../../../layout/Sidebar';
import Header from '../../../layout/Header';
import BottomNavBar from '../../../layout/BottomNavBar';
import { ICONS } from '../../../../constants';
import { TRANSLATIONS } from '../../../../lib/translations';

// Import Pages
import DashboardHome from './pages/DashboardHome';
import Transactions from './pages/Transactions';
import Plans from './pages/Plans';
import CareerPlan from './pages/CareerPlan';
import Profile from './pages/Profile';
import SupportChat from './pages/SupportChat';
import FAQPage from './pages/FAQPage';
import WelcomePopup from './WelcomePopup';
import ProfitCalculator from './pages/ProfitCalculator';

interface UserDashboardProps {
  user: User;
  adminUser: User;
  transactions: Transaction[];
  allUsers: User[];
  allTransactions: Transaction[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  onLogout: () => void;
  onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>, userUpdate?: Partial<User>) => void;
  onMarkAllNotificationsAsRead: () => void;
  onSendMessage: (senderId: string, receiverId: string, text: string, attachment?: File) => void;
  onUpdateUser: (updatedUser: User) => void;
  onUpdatePassword: (userId: string, newPassword: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onRefreshData: () => Promise<void>;
  investmentPlans: InvestmentPlan[];
  syncStatus: SyncStatus;
  platformSettings: PlatformSettings;
}

const UserDashboard: React.FC<UserDashboardProps> = (props) => {
  const {
    user,
    adminUser,
    transactions,
    allUsers,
    allTransactions,
    notifications,
    chatMessages,
    onLogout,
    onAddTransaction,
    onMarkAllNotificationsAsRead,
    onSendMessage,
    onUpdateUser,
    onUpdatePassword,
    isDarkMode,
    toggleTheme,
    language,
    setLanguage,
    onRefreshData,
    investmentPlans,
    syncStatus,
    platformSettings
  } = props;

  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
  const [welcomePopupType, setWelcomePopupType] = useState<'new' | 'returning' | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Use a short delay to let the dashboard render first, making the popup feel less intrusive.
    const timer = setTimeout(() => {
        if (user.hasSeenWelcomePopup === false) {
            setWelcomePopupType('new');
            setIsWelcomePopupOpen(true);
        } else if (!sessionStorage.getItem('welcomePopupShownThisSession')) {
            setWelcomePopupType('returning');
            setIsWelcomePopupOpen(true);
        }
    }, 1000); // 1-second delay

    return () => clearTimeout(timer);
  }, [user.hasSeenWelcomePopup]);

  const handleCloseWelcomePopup = () => {
      setIsWelcomePopupOpen(false);
      if (welcomePopupType === 'new') {
          onUpdateUser({ ...user, hasSeenWelcomePopup: true });
      }
      // Set session storage for both types to avoid showing again on refresh
      sessionStorage.setItem('welcomePopupShownThisSession', 'true');
  };

  const navItems = [
    { label: t.dashboard, icon: ICONS.dashboard, view: 'dashboard' },
    { label: t.transactions, icon: ICONS.transactions, view: 'transactions' },
    { label: t.plans, icon: ICONS.plans, view: 'plans' },
    { label: t.calculator, icon: ICONS.calculator, view: 'calculator' },
    { label: t.career, icon: ICONS.career, view: 'career' },
    { label: t.profile, icon: ICONS.profile, view: 'profile' },
    { label: t.support, icon: ICONS.support, view: 'support' },
    { label: t.faq_menu, icon: ICONS.question, view: 'faq' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardHome
            user={user}
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            setActiveView={setActiveView}
            language={language}
            onRefreshData={onRefreshData}
            platformSettings={platformSettings}
          />
        );
      case 'transactions':
        return <Transactions transactions={transactions} />;
      case 'plans':
        return <Plans user={user} onUpdateUser={onUpdateUser} language={language} investmentPlans={investmentPlans} />;
      case 'calculator':
        return <ProfitCalculator investmentPlans={investmentPlans} platformSettings={platformSettings} />;
      case 'career':
        return <CareerPlan user={user} allUsers={allUsers} allTransactions={allTransactions} language={language} />;
      case 'profile':
        return (
          <Profile
            user={user}
            onUpdateUser={onUpdateUser}
            onUpdatePassword={onUpdatePassword}
            allTransactions={allTransactions}
            setActiveView={setActiveView}
          />
        );
      case 'faq':
        return <FAQPage language={language} setActiveView={setActiveView} />;
      case 'support':
        const userChatMessages = chatMessages
          .filter(
            (m) =>
              (m.senderId === user.id && m.receiverId === adminUser.id) ||
              (m.senderId === adminUser.id && m.receiverId === user.id)
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return (
          <SupportChat
            user={user}
            admin={adminUser}
            messages={userChatMessages}
            onSendMessage={onSendMessage}
          />
        );
      default:
        return (
          <DashboardHome
            user={user}
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            setActiveView={setActiveView}
            language={language}
            onRefreshData={onRefreshData}
            platformSettings={platformSettings}
          />
        );
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white transition-colors duration-300">
      <WelcomePopup
        isOpen={isWelcomePopupOpen}
        onClose={handleCloseWelcomePopup}
        userName={user.name.split(' ')[0]}
        type={welcomePopupType}
        onCallToAction={() => {
            handleCloseWelcomePopup();
            setActiveView('dashboard');
        }}
      />
      <Sidebar
        user={user}
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        language={language}
        platformSettings={platformSettings}
      />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <Header
          user={user}
          onLogout={onLogout}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          onMarkAllAsRead={onMarkAllNotificationsAsRead}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          onRefreshData={async () => { if (onRefreshData) await onRefreshData(); }}
          syncStatus={syncStatus}
        />
        <main className="flex-1 w-full p-0 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {renderContent()}
        </main>
      </div>
      <BottomNavBar
        navItems={navItems.slice(0, 5)}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default UserDashboard;