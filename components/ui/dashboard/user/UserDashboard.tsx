
import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage, InvestmentPlan, Language, SyncStatus, PlatformSettings, WithdrawalDetails } from '../../../../types';
import { TransactionType, TransactionStatus } from '../../../../types';
import Sidebar from '../../../layout/Sidebar';
import { Header } from '../../../layout/Header';
import BottomNavBar from '../../../layout/BottomNavBar';
import { ICONS, INVESTMENT_PLANS } from '../../../../constants';
import { TRANSLATIONS } from '../../../../lib/translations';
import Modal from '../../../layout/Modal';
import Input from '../../../ui/Input';
import Button from '../../../ui/Button';
import { formatCurrency } from '../../../../lib/utils';

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
import DeleteAccountPage from './pages/DeleteAccountPage';

// --- MODAL SUB-COMPONENTS (LIFTED FROM DASHBOARDHOME) ---

const SuccessDisplay: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; }> = ({ title, children, onClose }) => {
    return (
        <div className="text-center animate-scale-in">
            <style>{`
                @keyframes draw-circle { from { stroke-dashoffset: 264; } to { stroke-dashoffset: 0; } }
                @keyframes draw-check { from { stroke-dashoffset: 48; } to { stroke-dashoffset: 0; } }
                .success-circle-anim {
                    stroke-dasharray: 264;
                    stroke-dashoffset: 264;
                    animation: draw-circle 0.8s ease-out forwards;
                }
                .success-check-anim {
                    stroke-dasharray: 48;
                    stroke-dashoffset: 48;
                    animation: draw-check 0.4s ease-out 0.5s forwards; /* Delay to start after circle */
                }
            `}</style>
            <svg className="h-24 w-24 mx-auto mb-4" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <circle className="success-circle-anim" cx="44" cy="44" r="42" stroke="url(#success-gradient)" strokeWidth="4" />
                <path className="success-check-anim" d="M25 45l14 14 24-24" stroke="#00FF9C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF9C" />
                  <stop offset="100%" stopColor="#00B2FF" />
                </linearGradient>
              </defs>
            </svg>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <div className="text-gray-400 mt-2">{children}</div>
            <Button onClick={onClose} className="mt-8" fullWidth>Fechar</Button>
        </div>
    );
};

const DepositModalContent: React.FC<{
    user: User;
    onClose: () => void;
    onAddTransaction: (newTransaction: Pick<Transaction, Exclude<keyof Transaction, 'id' | 'date' | 'bonusPayoutHandled'>>) => void;
    platformSettings: PlatformSettings;
}> = ({ user, onClose, onAddTransaction, platformSettings }) => {
    const [step, setStep] = useState(1);
    const [amountBRL, setAmountBRL] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const dollarRate = platformSettings.dollarRate || 5.50;
    const adminPixKey = platformSettings.pixKey || "40b383be-3df8-4bc2-88a5-be6c7b0a55a0";
    const beneficiaryName = "GREENNSEVEN TECNOLOGIA LTDA";

    const handleGeneratePix = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseFloat(amountBRL) > 0) {
            setPixKey(adminPixKey); 
            setStep(2);
        }
    };

    const handleConfirmPayment = () => {
        const brl = parseFloat(amountBRL);
        const usd = brl / dollarRate;
        onAddTransaction({
            userId: user.id,
            type: TransactionType.Deposit,
            status: TransactionStatus.Pending, 
            amountUSD: usd,
            amountBRL: brl,
        });
        setStep(3);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixKey);
        alert('Chave PIX copiada!');
    };
    
    if (step === 3) {
        return (
            <SuccessDisplay title="Solicitação Enviada!" onClose={onClose}>
                <p>
                    Recebemos sua solicitação de depósito de {formatCurrency(parseFloat(amountBRL), 'BRL')}. 
                    <br/><br/>
                    <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">Valor pendente de aprovação.</span>
                    <br/><br/>
                    Assim que autorizado, o valor aparecerá como "Capital Investido" no seu dashboard.
                </p>
            </SuccessDisplay>
        );
    }
    
    if (step === 2) {
        return (
             <div className="space-y-4">
                <p className="text-center text-gray-400">Use a chave abaixo para pagar.</p>
                
                <p className="text-center text-lg font-bold text-brand-green">{formatCurrency(parseFloat(amountBRL), 'BRL')}</p>
                
                <div className="bg-brand-black p-4 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Dados do Recebedor</p>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white font-medium text-right">{beneficiaryName}</span>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-400 mb-1 block">Chave Aleatória (Copia e Cola)</label>
                    <div className="relative flex items-center">
                        <input type="text" readOnly value={pixKey} className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-3 text-sm text-gray-300 pr-12 font-mono"/>
                        <button onClick={copyToClipboard} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-brand-green transition-colors">
                            {ICONS.copy}
                        </button>
                    </div>
                </div>
                <Button onClick={handleConfirmPayment} fullWidth className="mt-4" isLoading={isLoading}>Já Efetuei o Pagamento</Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleGeneratePix} className="space-y-4">
            <Input 
                label="Valor do Depósito (BRL)"
                id="deposit-brl"
                type="number"
                placeholder="Ex: 500,00"
                value={amountBRL}
                onChange={(e) => setAmountBRL(e.target.value)}
                required
                step="0.01"
            />
            <p className="text-sm text-gray-400">
                Valor estimado em dólar (cotação {formatCurrency(dollarRate, 'BRL')}): 
                <span className="font-bold text-white"> {amountBRL ? formatCurrency(parseFloat(amountBRL) / dollarRate, 'USD') : formatCurrency(0, 'USD')}</span>
            </p>
            <div className="pt-2">
                <Button type="submit" fullWidth isLoading={isLoading}>Gerar Pagamento PIX</Button>
            </div>
        </form>
    );
};

const WithdrawModalContent: React.FC<{
    user: User;
    onClose: () => void;
    onAddTransaction: (newTransaction: Pick<Transaction, Exclude<keyof Transaction, 'id' | 'date' | 'bonusPayoutHandled'>>, userUpdate?: Partial<User>) => void;
    setActiveView: (view: string) => void;
    currentLiveProfit: number;
    platformSettings: PlatformSettings;
}> = ({ user, onClose, onAddTransaction, setActiveView, currentLiveProfit, platformSettings }) => {
    const [step, setStep] = useState(1);
    const [amountUSD, setAmountUSD] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [pixDetails, setPixDetails] = useState<WithdrawalDetails>({ pixKey: '', fullName: '', cpf: '', bank: '' });
    const [pixKeyError, setPixKeyError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [withdrawalSource, setWithdrawalSource] = useState<'yield' | 'bonus' | 'capital'>('yield');

    const withdrawalFeePercent = platformSettings.withdrawalFeePercent || 0;
    const dollarRate = platformSettings.dollarRate || 5.50;

    const fee = (parseFloat(amountUSD) || 0) * (withdrawalFeePercent / 100);
    const amountToReceiveUSD = (parseFloat(amountUSD) || 0) - fee;
    const amountToReceiveBRL = amountToReceiveUSD * dollarRate;
    
    const availableBalance = withdrawalSource === 'yield' 
        ? currentLiveProfit
        : withdrawalSource === 'bonus'
            ? (user.bonusBalanceUSD || 0)
            : (user.capitalInvestedUSD || 0);

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(amountUSD);
        if (isNaN(amount) || amount <= 0) {
            alert("Por favor, insira um valor de saque válido.");
            return;
        }
        if (amount > availableBalance) {
            const walletName = withdrawalSource === 'yield' ? 'Lucro Diário' : 'Bônus de Indicação';
            alert(`Saldo insuficiente na carteira de ${walletName}. Disponível: ${formatCurrency(availableBalance, 'USD')}.`);
            return;
        }
        setStep(2);
    }
    
    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPinError(false);
        if (pin === user.transactionPin) {
            setStep(3);
        } else {
            setPinError(true);
        }
    };

    const validatePixKey = (key: string): boolean => {
        const pixRegex = /^((\d{11})|(\d{14})|([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|(\+[0-9]{1,15})|([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}))$/;
        return pixRegex.test(key);
    };
    
    const handleConfirmWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePixKey(pixDetails.pixKey)) {
            setPixKeyError('Formato de chave PIX inválido. Verifique CPF, CNPJ, email, telefone ou chave aleatória.');
            return;
        }
        
        let userUpdate: Partial<User> | undefined = undefined;
        if (withdrawalSource === 'yield') {
            userUpdate = {
                dailyWithdrawableUSD: currentLiveProfit, 
                lastProfitUpdate: new Date().toISOString() 
            };
        }

        onAddTransaction({
            userId: user.id,
            type: TransactionType.Withdrawal,
            status: TransactionStatus.Pending,
            amountUSD: -Math.abs(parseFloat(amountUSD)),
            amountBRL: amountToReceiveBRL,
            withdrawalDetails: pixDetails,
            walletSource: withdrawalSource
        }, userUpdate);
        
        setStep(4);
    };

    if (step === 4) {
        return (
            <SuccessDisplay title="Saque em Processamento!" onClose={onClose}>
                <p>
                    Sua solicitação de saque de <span className="font-bold text-white">{formatCurrency(parseFloat(amountUSD), 'USD')}</span> foi enviada.
                    Assim que autorizada pelo administrador, o valor de <span className="font-bold text-white">{formatCurrency(amountToReceiveBRL, 'BRL')}</span> será enviado via PIX.
                </p>
            </SuccessDisplay>
        );
    }
    
    if (step === 3) {
        return (
            <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
                <p className="text-sm text-gray-300">Por favor, preencha seus dados para recebimento via PIX. Verifique as informações com atenção.</p>
                <Input label="Nome Completo" id="fullName" required value={pixDetails.fullName} onChange={e => setPixDetails({...pixDetails, fullName: e.target.value})} />
                <Input label="CPF" id="cpf" required value={pixDetails.cpf} onChange={e => setPixDetails({...pixDetails, cpf: e.target.value})} />
                <div className="relative">
                  <Input 
                    label="Chave PIX" 
                    id="pixKey" 
                    required 
                    value={pixDetails.pixKey} 
                    onChange={e => {
                        setPixDetails({...pixDetails, pixKey: e.target.value});
                        if (pixKeyError) setPixKeyError(null);
                    }}
                    error={!!pixKeyError}
                   />
                   {pixKeyError && <p className="text-red-500 text-xs mt-1">{pixKeyError}</p>}
                </div>
                <Input label="Nome do Banco" id="bank" required value={pixDetails.bank} onChange={e => setPixDetails({...pixDetails, bank: e.target.value})} />
                 <div className="pt-2">
                    <Button type="submit" fullWidth isLoading={isLoading}>Confirmar Solicitação de Saque</Button>
                </div>
            </form>
        )
    }

    if (step === 2) {
        if (!user.transactionPin) {
            return (
                <div className="text-center space-y-4">
                    <h3 className="text-lg font-bold text-yellow-400">PIN de Saque Necessário</h3>
                    <p className="text-gray-400">Para sua segurança, é necessário criar um PIN de 4 dígitos no seu perfil antes de solicitar o primeiro saque.</p>
                    <Button onClick={() => { onClose(); setActiveView('profile'); }} fullWidth>Criar PIN no Meu Perfil</Button>
                </div>
            );
        }
        return (
            <form onSubmit={handlePinSubmit} className="space-y-4">
                <p className="text-center text-gray-400">Insira seu PIN de segurança de 4 dígitos para continuar.</p>
                <Input
                    label="PIN de Saque"
                    id="pin"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ''));
                        if (pinError) setPinError(false);
                    }}
                    error={pinError}
                    required
                />
                {pinError && <p className="text-red-500 text-sm text-center">PIN incorreto. Tente novamente.</p>}
                <div className="pt-2">
                    <Button type="submit" fullWidth isLoading={isLoading}>Confirmar Saque</Button>
                </div>
            </form>
        );
    }
    
    return (
        <form onSubmit={handleAmountSubmit} className="space-y-5">
             <div className="grid grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => setWithdrawalSource('yield')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        withdrawalSource === 'yield' 
                        ? 'bg-brand-green/10 border-brand-green text-brand-green' 
                        : 'bg-brand-black border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                    <span className="text-xs font-bold uppercase">Rendimentos</span>
                    <span className="text-sm font-bold">{formatCurrency(currentLiveProfit || 0, 'USD')}</span>
                </button>
                
                <button
                    type="button"
                    onClick={() => setWithdrawalSource('bonus')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        withdrawalSource === 'bonus' 
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                        : 'bg-brand-black border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                    <span className="text-xs font-bold uppercase">Bônus</span>
                    <span className="text-sm font-bold">{formatCurrency(user.bonusBalanceUSD || 0, 'USD')}</span>
                </button>

                <button
                    type="button"
                    onClick={() => setWithdrawalSource('capital')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        withdrawalSource === 'capital' 
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                        : 'bg-brand-black border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                    <span className="text-xs font-bold uppercase">Capital</span>
                    <span className="text-sm font-bold">{formatCurrency(user.capitalInvestedUSD || 0, 'USD')}</span>
                </button>
            </div>
            
            <div>
                <Input 
                    label="Quanto deseja sacar? (USD)"
                    id="withdraw-usd"
                    type="number"
                    placeholder="Ex: 50.00"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    required
                    step="0.01"
                    max={availableBalance}
                />
            </div>

            <div className="bg-brand-gray/50 rounded-xl p-4 border border-gray-800 space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Taxa ({withdrawalFeePercent}%):</span>
                    <span className="text-red-400">- {formatCurrency(fee, 'USD')}</span>
                </div>
                <div className="h-px bg-gray-700"></div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Você recebe (PIX):</span>
                    <span className="text-xl font-bold text-brand-green">{formatCurrency(amountToReceiveBRL, 'BRL')}</span>
                </div>
                <p className="text-[10px] text-gray-500 text-right">Cotação: {formatCurrency(dollarRate, 'BRL')}</p>
            </div>

            <div className="flex gap-2 text-[10px] text-gray-400 bg-black/20 p-2 rounded-lg items-center">
                <div className="min-w-[4px] bg-brand-blue rounded-full"></div>
                <p>Atendimento para saques: Seg à Sex, 08:00 às 18:00.</p>
            </div>
            
            <div className="pt-2">
                <Button type="submit" fullWidth>Continuar</Button>
            </div>
        </form>
    );
};


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
  onDeleteAccount: (userId: string, password: string, isSelfDelete: boolean) => Promise<{ success: boolean; message?: string; }>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onRefreshData: () => Promise<void>;
  investmentPlans: InvestmentPlan[];
  syncStatus: SyncStatus;
  platformSettings: PlatformSettings;
  referralRates: { [key: number]: number };
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
    onDeleteAccount,
    isDarkMode,
    toggleTheme,
    language,
    setLanguage,
    onRefreshData,
    investmentPlans,
    syncStatus,
    platformSettings,
    referralRates,
  } = props;

  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false);
  const [welcomePopupType, setWelcomePopupType] = useState<'new' | 'returning' | null>(null);

  // --- LIFTED STATE FROM DASHBOARDHOME ---
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Live Oscillation State
  const [liveData, setLiveData] = useState({
      daily: user.dailyWithdrawableUSD,
      bonus: user.bonusBalanceUSD,
      today: 0,
      combinedDaily: user.dailyWithdrawableUSD
  });
  
  // Real-time calculation effect
  useEffect(() => {
      const calculateLiveProfit = () => {
          const plan = investmentPlans.find(p => p.name.toLowerCase() === (user.plan || 'conservador').toLowerCase()) || investmentPlans[0];
          const monthlyRate = plan.returnRate; 
          const invested = user.capitalInvestedUSD;
          const dailyProfitTotal = (invested * monthlyRate) / 30;
          const profitPerSecond = dailyProfitTotal / 86400;
          const now = new Date();
          const lastUpdate = new Date(user.lastProfitUpdate || user.joinedDate);
          let secondsPassed = (now.getTime() - lastUpdate.getTime()) / 1000;
          if (secondsPassed < 0) secondsPassed = 0;
          const generatedSinceLastUpdate = Math.max(0, profitPerSecond * secondsPassed);

          setLiveData({
              daily: user.dailyWithdrawableUSD, 
              bonus: user.bonusBalanceUSD,
              today: generatedSinceLastUpdate, 
              combinedDaily: user.dailyWithdrawableUSD + generatedSinceLastUpdate 
          });
      };

      calculateLiveProfit();
      const interval = setInterval(calculateLiveProfit, 2000);
      return () => clearInterval(interval);
  }, [user.capitalInvestedUSD, user.plan, user.dailyWithdrawableUSD, user.bonusBalanceUSD, user.lastProfitUpdate, user.joinedDate, investmentPlans]);


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
    { label: t.delete_account_menu, icon: ICONS.trash, view: 'delete_account' },
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
            onDepositClick={() => setIsDepositModalOpen(true)}
            onWithdrawClick={() => setIsWithdrawModalOpen(true)}
            liveDailyProfit={liveData.combinedDaily}
            liveBonus={liveData.bonus}
            liveTodayEarnings={liveData.today}
          />
        );
      case 'transactions':
        return <Transactions transactions={transactions} />;
      case 'plans':
        return <Plans user={user} onUpdateUser={onUpdateUser} language={language} investmentPlans={investmentPlans} />;
      case 'calculator':
        return <ProfitCalculator investmentPlans={investmentPlans} platformSettings={platformSettings} />;
      case 'career':
        return <CareerPlan user={user} allUsers={allUsers} allTransactions={allTransactions} language={language} referralRates={referralRates} />;
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
      case 'delete_account':
        return (
          <DeleteAccountPage
            user={user}
            onDeleteAccount={onDeleteAccount}
            language={language}
          />
        );
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
            onDepositClick={() => setIsDepositModalOpen(true)}
            onWithdrawClick={() => setIsWithdrawModalOpen(true)}
            liveDailyProfit={liveData.combinedDaily}
            liveBonus={liveData.bonus}
            liveTodayEarnings={liveData.today}
          />
        );
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full overflow-x-hidden bg-slate-50 dark:bg-brand-black text-slate-900 dark:text-white transition-colors duration-300">
      <WelcomePopup
        isOpen={isWelcomePopupOpen}
        onClose={handleCloseWelcomePopup}
        userName={user.name.split(' ')[0]}
        type={welcomePopupType}
        onCallToAction={() => {
            handleCloseWelcomePopup();
            setIsDepositModalOpen(true);
        }}
      />
       {/* MODALS */}
      <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Realizar Depósito">
          <DepositModalContent 
              user={user} 
              onClose={() => setIsDepositModalOpen(false)} 
              onAddTransaction={onAddTransaction} 
              platformSettings={platformSettings}
          />
      </Modal>

      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Solicitar Saque">
          <WithdrawModalContent 
              user={user} 
              onClose={() => setIsWithdrawModalOpen(false)} 
              onAddTransaction={onAddTransaction} 
              setActiveView={setActiveView} 
              currentLiveProfit={liveData.combinedDaily}
              platformSettings={platformSettings}
          />
      </Modal>

      <Sidebar
        user={user}
        navItems={navItems}
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        language={language}
        platformSettings={platformSettings}
        onDepositClick={() => setIsDepositModalOpen(true)}
        onWithdrawClick={() => setIsWithdrawModalOpen(true)}
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
