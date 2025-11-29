import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage, Language, InvestmentPlan } from '../../../../types';
import Sidebar from '../../../layout/Sidebar';
import Header from '../../../layout/Header';
import BottomNavBar from '../../../layout/BottomNavBar';
import { ICONS } from '../../../../constants';
import Modal from '../../../layout/Modal';
import Button from '../../../ui/Button';
import { TRANSLATIONS } from '../../../../lib/translations';

// Import pages
// FIX: Changed to a default import to match the export from DashboardHome.
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
  language: Language;
  setLanguage: (lang: Language) => void;
  onRefreshData?: () => void;
  investmentPlans?: InvestmentPlan[];
}

const MOTIVATIONAL_QUOTES = [
  { text: "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora.", author: "Provérbio Chinês" },
  { text: "Não trabalhe pelo dinheiro, faça o dinheiro trabalhar por você.", author: "Robert Kiyosaki" },
  { text: "O risco vem de você não saber o que está fazendo.", author: "Warren Buffett" },
  { text: "Investir em conhecimento rende sempre os melhores juros.", author: "Benjamin Franklin" },
  { text: "A riqueza não consiste em ter grandes possessões, mas em ter poucas necessidades.", author: "Epicteto" },
  { text: "O segredo para ficar à frente é começar.", author: "Mark Twain" },
  { text: "Não espere para comprar ativos. Compre ativos e espere.", author: "Will Rogers" },
  { text: "Se você não encontrar um jeito de ganhar dinheiro enquanto dorme, vai trabalhar até morrer.", author: "Warren Buffett" },
  { text: "Oportunidades não surgem. É você que as cria.", author: "Chris Grosser" },
  { text: "Sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" }
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
  const { user, adminUser, transactions, allUsers, allTransactions, notifications, chatMessages, onLogout, onAddTransaction, onMarkAllNotificationsAsRead, onSendMessage, onUpdateUser, onUpdatePassword, isDarkMode, toggleTheme, language, setLanguage, onRefreshData, investmentPlans } = props;
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Welcome Modal State
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [dailyQuote, setDailyQuote] = useState({ text: "", author: "" });

  const t = TRANSLATIONS[language] || TRANSLATIONS['pt'];

  const sidebarNavItems = [
    { label: t.dashboard, icon: ICONS.dashboard, view: 'dashboard' },
    { label: t.plans, icon: ICONS.plans, view: 'plans' },
    { label: t.career, icon: ICONS.career, view: 'career' },
    { label: t.transactions, icon: ICONS.transactions, view: 'transactions' },
    { label: t.profile, icon: ICONS.profile, view: 'profile' },
    { label: t.support, icon: ICONS.support, view: 'support' },
  ];

  const bottomNavItems = [
      { label: t.dashboard, icon: ICONS.dashboard, view: 'dashboard' },
      { label: t.plans, icon: ICONS.plans, view: 'plans' },
      { label: t.transactions, icon: ICONS.transactions, view: 'transactions' },
      { label: t.profile, icon: ICONS.profile, view: 'profile' },
  ];

  useEffect(() => {
    // Simulate a subtle data fetching delay for better UX smoothness
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Effect for Welcome Modal
  useEffect(() => {
    const sessionKey = `hasSeenWelcome_${user.id}`;
    const hasSeen = sessionStorage.getItem(sessionKey);

    if (!hasSeen) {
      const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
      setDailyQuote(randomQuote);
      // Small delay to ensure the dashboard is visible behind the modal
      setTimeout(() => {
          setShowWelcomeModal(true);
          sessionStorage.setItem(sessionKey, 'true');
      }, 1500);
    }
  }, [user.id]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome 
                    user={user} 
                    transactions={transactions} 
                    onAddTransaction={onAddTransaction}
                    setActiveView={setActiveView}
                    language={language}
                    onRefreshData={onRefreshData}
                />;
      case 'plans':
        return <Plans user={user} onUpdateUser={onUpdateUser} language={language} />;
      case 'career':
        return <CareerPlan user={user} allUsers={allUsers} allTransactions={allTransactions} language={language} />;
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
                    language={language}
                    onRefreshData={onRefreshData}
                />;
    }
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white transition-colors duration-300">
      
      <Modal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        title={t.welcome + "!"}
      >
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="h-20 w-20 bg-gradient-to-tr from-brand-green to-brand-blue rounded-full flex items-center justify-center shadow-lg shadow-brand-green/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </div>
            
            <h3 className="text-xl font-bold text-white">
                {t.welcome}, {user.name.split(' ')[0]}!
            </h3>
            
            <div className="bg-brand-black/50 p-6 rounded-xl border border-gray-700 relative">
                <span className="absolute top-2 left-4 text-4xl text-brand-green opacity-50">“</span>
                <p className="text-lg text-gray-300 italic font-medium relative z-10 px-2">
                    {dailyQuote.text}
                </p>
                <p className="text-right text-sm text-brand-green mt-4 font-bold">— {dailyQuote.author}</p>
            </div>

            <p className="text-gray-400 text-sm">
                {language === 'pt' ? 'Seus investimentos estão trabalhando por você. Vamos conferir seus resultados de hoje?' : 'Your investments are working for you. Let\'s check your results today?'}
            </p>
            
            <Button fullWidth onClick={() => setShowWelcomeModal(false)}>
                {language === 'pt' ? 'Acessar Meu Dashboard' : 'Access My Dashboard'}
            </Button>
        </div>
      </Modal>

      <Sidebar
        user={user}
        navItems={sidebarNavItems}
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
            language={language}
            setLanguage={setLanguage}
            onRefreshData={onRefreshData}
        />
        <main className="p-2 sm:p-6 lg:p-8">
          {isLoading ? <DashboardSkeleton /> : renderContent()}
        </main>
      </div>
       <BottomNavBar
        navItems={bottomNavItems}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default UserDashboard;
