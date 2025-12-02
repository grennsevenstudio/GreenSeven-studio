


import React, { useState, useEffect, useRef } from 'react';
import type { User, Transaction, Notification, ChatMessage, PlatformSettings, AdminActionLog, Language, InvestmentPlan, SyncStatus } from './types';
import { View, TransactionStatus, TransactionType, AdminActionType, UserStatus, InvestorRank } from './types';
import { REFERRAL_BONUS_RATES, INVESTMENT_PLANS as DEFAULT_PLANS } from './constants';
import { initializeDB, getAllData, saveAllData, type AppDB, getSessionUser, setSessionUser, clearSessionUser } from './lib/db';
import { 
    syncUserToSupabase, 
    syncTransactionToSupabase, 
    syncMessageToSupabase, 
    syncSettingsToSupabase, 
    syncAdminLogToSupabase, 
    fetchUsersFromSupabase, 
    fetchTransactionsFromSupabase, 
    fetchMessagesFromSupabase, 
    fetchCareerPlanConfig, 
    fetchSettingsFromSupabase, 
    fetchAdminLogsFromSupabase,
    fetchNotificationsFromSupabase,
    syncNotificationToSupabase,
    syncNotificationsToSupabase,
    fetchInvestmentPlansFromSupabase,
    syncInvestmentPlanToSupabase,
    supabase
} from './lib/supabase';
import { requestNotificationPermission, showSystemNotification, formatCurrency } from './lib/utils';
import { faker } from '@faker-js/faker';

import HomePage from './components/views/HomePage';
import LoginPage from './components/views/LoginPage';
import RegisterPage, { type ExtendedRegisterData } from './components/views/RegisterPage';
import ForgotPasswordPage from './components/views/ForgotPasswordPage';
import UserDashboard from './components/ui/dashboard/user/UserDashboard';
import AdminDashboard from './components/ui/dashboard/admin/AdminDashboard';

// Initialize local storage cleanup
initializeDB();

const calculateRank = (balance: number): InvestorRank => {
  if (balance >= 100000) return InvestorRank.Diamond;
  if (balance >= 20000) return InvestorRank.Platinum;
  if (balance >= 5000) return InvestorRank.Gold;
  if (balance >= 1000) return InvestorRank.Silver;
  return InvestorRank.Bronze;
};

const calculateProfit = (investedCapital: number, planName: string = 'Conservador', plans: InvestmentPlan[] = DEFAULT_PLANS): number => {
    if (!plans || plans.length === 0) plans = DEFAULT_PLANS;
    const plan = plans.find(p => p.name.toLowerCase() === (planName || '').toLowerCase()) || plans[0];
    return investedCapital * plan.returnRate;
};

const App: React.FC = () => {
  const [dbState, setDbState] = useState<AppDB>({
      users: [],
      transactions: [],
      chatMessages: [],
      notifications: [],
      adminActionLogs: [],
      platformSettings: {} as any,
      investmentPlans: DEFAULT_PLANS
  });

  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // View State - Synchronously check session on initialization
  const [view, setView] = useState<View>(() => {
      const path = window.location.pathname;
      if (path === '/register') return View.Register;
      if (path === '/login') return View.Login;
      
      // Check for session immediately to prevent flash
      const storedUserId = getSessionUser();
      if (storedUserId) {
          const localData = getAllData();
          const user = localData.users.find(u => u.id === storedUserId);
          if (user) {
              return user.isAdmin ? View.AdminDashboard : View.UserDashboard;
          }
      }
      return View.Home;
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [referralRates, setReferralRates] = useState<{[key:number]: number}>(REFERRAL_BONUS_RATES);

  const previousNotificationsCountRef = useRef(0);

  useEffect(() => {
      requestNotificationPermission();
  }, []);

  // Sync loggedUser state with dbState updates
  useEffect(() => {
      if (loggedUser && dbState.users.length > 0) {
          const updatedUser = dbState.users.find(u => u.id === loggedUser.id);
          // Deep compare using JSON stringify to avoid infinite loop on object reference change
          if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(loggedUser)) {
              setLoggedUser(updatedUser);
          }
      }
  }, [dbState.users, loggedUser]);

  // Notification watcher
  useEffect(() => {
      if (!loggedUser || !dbState.notifications) return;
      
      const userNotifications = dbState.notifications.filter(n => n.userId === loggedUser.id);
      
      if (userNotifications.length > previousNotificationsCountRef.current) {
          const latest = userNotifications[userNotifications.length - 1];
          const now = new Date().getTime();
          const notifTime = new Date(latest.date).getTime();
          
          // Only notify if it's recent (last 10 seconds)
          if (now - notifTime < 10000 && !latest.isRead) {
               showSystemNotification('GreennSeven Invest', latest.message);
          }
      }
      previousNotificationsCountRef.current = userNotifications.length;
  }, [dbState.notifications, loggedUser]);

  // Theme
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Language
  useEffect(() => {
      const savedLang = localStorage.getItem('app_language') as Language;
      if (savedLang && ['pt', 'en', 'es', 'fr', 'de'].includes(savedLang)) {
          setLanguage(savedLang);
      }
  }, []);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
  }

  // Data Loading from Supabase
  const loadRemoteData = async () => {
    setSyncStatus('syncing');
    try {
        const [
            { data: remoteUsers, error: usersError },
            { data: remoteTxs, error: txsError },
            { data: remoteMessages, error: msgError },
            { data: remoteSettings, error: settingsError },
            { data: remoteLogs, error: logsError },
            { data: remoteNotifications, error: notifError },
            { data: remoteCareerPlan, error: careerError },
            { data: remotePlans, error: plansError }
        ] = await Promise.all([
            fetchUsersFromSupabase(),
            fetchTransactionsFromSupabase(),
            fetchMessagesFromSupabase(),
            fetchSettingsFromSupabase(),
            fetchAdminLogsFromSupabase(),
            fetchNotificationsFromSupabase(),
            typeof fetchCareerPlanConfig === 'function' ? fetchCareerPlanConfig() : Promise.resolve({ data: null, error: null }),
            fetchInvestmentPlansFromSupabase()
        ]);

        if (usersError || txsError || msgError || settingsError || logsError || notifError || careerError || plansError) {
             setSyncStatus('error');
        } else {
             setSyncStatus('online');
        }

        if (usersError) console.error("Supabase fetch user error:", usersError.message);
        if (txsError) console.error("Supabase fetch txs error:", txsError.message);
        
        if (remoteCareerPlan && Object.keys(remoteCareerPlan).length > 0) {
            setReferralRates(remoteCareerPlan);
        }

        const localData = getAllData();

        setDbState(prev => ({
            ...prev,
            users: usersError ? localData.users : remoteUsers || [],
            transactions: txsError ? localData.transactions : remoteTxs || [],
            chatMessages: msgError ? localData.chatMessages : remoteMessages || [],
            notifications: notifError ? localData.notifications : remoteNotifications || [],
            adminActionLogs: logsError ? localData.adminActionLogs : remoteLogs || [],
            platformSettings: settingsError ? localData.platformSettings : remoteSettings || ({} as any),
            investmentPlans: plansError ? localData.investmentPlans : (remotePlans && remotePlans.length > 0) ? remotePlans : DEFAULT_PLANS
        }));
        
        saveAllData(dbState);

        // Session Restoration
        const storedUserId = getSessionUser();
        if (storedUserId && remoteUsers) {
            const user = remoteUsers.find((u: User) => u.id === storedUserId);
            if (user) {
                setLoggedUser(user);
                // Ensure view is consistent with user role
                if (view === View.Home || view === View.Login) {
                    setView(user.isAdmin ? View.AdminDashboard : View.UserDashboard);
                }
            }
        }

        setIsLoading(false);
        return true;
    } catch (e) {
        console.error("Error loading remote data", e);
        setIsLoading(false);
        setSyncStatus('error');
        return false;
    }
  };

  useEffect(() => {
      // 1. Load from cache immediately for instant UI
      const localData = getAllData();
      if (localData && localData.users && localData.users.length > 0) {
          setDbState(localData);
          const storedUserId = getSessionUser();
          if (storedUserId) {
              const user = localData.users.find((u: User) => u.id === storedUserId);
              if (user) {
                  setLoggedUser(user);
                  // We already set view in useState initializer, but this ensures consistency if loaded async
                  if (view === View.Home || view === View.Login) {
                      setView(user.isAdmin ? View.AdminDashboard : View.UserDashboard);
                  }
              }
          }
      }
      setIsLoading(false); // Render immediately with cached or default data

      // 2. Initial fetch from remote
      loadRemoteData();
      
      // 3. Subscribe to REALTIME changes.
      const channel = supabase.channel('global-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
              console.log('Realtime change received! Syncing data...', payload);
              loadRemoteData();
          })
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, []);
  
  // Yield Accumulation Logic
  useEffect(() => {
    if (!loggedUser || !dbState.investmentPlans) return;
    
    const processProfitAccumulation = () => {
        const lastUpdateStr = loggedUser.lastProfitUpdate || loggedUser.joinedDate;
        if (!lastUpdateStr) return;

        const lastUpdate = new Date(lastUpdateStr);
        const now = new Date();
        
        if (isNaN(lastUpdate.getTime())) return;

        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays >= 1 && loggedUser.status === UserStatus.Approved) {
            const userPlan = dbState.investmentPlans.find(p => p.name === loggedUser.plan) || dbState.investmentPlans[0];
            const monthlyProfit = (loggedUser.capitalInvestedUSD || 0) * (userPlan?.returnRate || 0);
            const dailyProfit = monthlyProfit / 30;

            const validDays = Math.min(diffDays, 60); 
            const profitToAdd = dailyProfit * validDays;
            const newAvailable = (loggedUser.dailyWithdrawableUSD || 0) + profitToAdd;
            const daysMs = validDays * 24 * 60 * 60 * 1000;
            const newLastUpdate = new Date(lastUpdate.getTime() + daysMs).toISOString();

            const updatedUser = {
                ...loggedUser,
                dailyWithdrawableUSD: newAvailable,
                balanceUSD: loggedUser.balanceUSD + profitToAdd,
                lastProfitUpdate: newLastUpdate
            };
            
            handleUpdateUser(updatedUser);
        }
    };
    
    processProfitAccumulation();
    const interval = setInterval(processProfitAccumulation, 60000); 
    return () => clearInterval(interval);
  }, [loggedUser, dbState.investmentPlans]); 

  const refreshData = async () => {
      await loadRemoteData();
  };

  const { users = [], transactions = [], notifications = [], chatMessages = [], platformSettings, adminActionLogs, investmentPlans } = dbState || {};
  
  const adminUser = users.find(u => u.isAdmin) || (users.length === 0 ? {
      id: 'admin-fallback', name: 'Admin System', email: 'admin@greennseven.com', cpf: '', phone: '', address: {} as any, documents: {} as any, status: UserStatus.Approved, avatarUrl: 'https://ui-avatars.com/api/?name=Admin', rank: InvestorRank.Diamond, balanceUSD: 0, capitalInvestedUSD: 0, monthlyProfitUSD: 0, dailyWithdrawableUSD: 0, bonusBalanceUSD: 0, isAdmin: true, joinedDate: new Date().toISOString(), referralCode: 'ADMIN', plan: 'Select'
  } : users[0]);

  const handleLogin = (email: string, password?: string) => {
    if (users.length === 0 && isLoading) {
         alert("Sistema conectando ao banco de dados... Aguarde.");
         return false;
    }
    
    const cleanEmail = email.trim().toLowerCase();
    const userToLogin = users.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (!userToLogin) {
        alert("Email não encontrado.");
        return false;
    }

    if (password) {
         if (userToLogin.password && userToLogin.password !== password) {
             alert("Senha incorreta. Tente novamente.");
             return false;
         }
    }

    if (userToLogin.isAdmin) {
        setLoggedUser(userToLogin);
        setView(View.AdminDashboard);
        setSessionUser(userToLogin.id);
        return true;
    }

    if (userToLogin.status === UserStatus.Pending) {
        alert("Sua conta está pendente de aprovação pelo administrador.");
        return false;
    }
    if (userToLogin.status === UserStatus.Rejected) {
        alert(`Sua conta foi rejeitada. Motivo: ${userToLogin.rejectionReason || 'Divergência de informações.'}.`);
        return false;
    }

    setLoggedUser(userToLogin);
    setView(View.UserDashboard);
    setSessionUser(userToLogin.id);
    return true;
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setView(View.Home);
    clearSessionUser();
    window.history.pushState({}, '', '/');
  };

  const handleRegister = async (userData: ExtendedRegisterData) => {
    let referredById: string | undefined = undefined;
    if (userData.referralCode && users) {
        const referrer = users.find(u => u.referralCode === userData.referralCode);
        if (referrer) referredById = referrer.id;
    }

    const newUser: User = {
        id: faker.string.uuid(), name: userData.name, email: userData.email, password: userData.password, cpf: userData.cpf, phone: userData.phone, address: userData.address, documents: userData.documents, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=00FF9C&color=000`, rank: InvestorRank.Bronze, balanceUSD: 0, capitalInvestedUSD: 0, monthlyProfitUSD: 0, dailyWithdrawableUSD: 0, bonusBalanceUSD: 0, isAdmin: false, joinedDate: new Date().toISOString().split('T')[0], referralCode: `${userData.name.split(' ')[0].toUpperCase()}${faker.string.numeric(4)}`, referredById: referredById, status: UserStatus.Pending, plan: 'Conservador', kycAnalysis: userData.kycAnalysis 
    };
    
    const adminNotification: Notification = {
        id: faker.string.uuid(), userId: adminUser.id, message: `Novo usuário registrado: ${newUser.name}. Pendente de aprovação.`, date: new Date().toISOString(), isRead: false
    };

    setDbState(prev => ({ ...prev, users: [...prev.users, newUser], notifications: [...prev.notifications, adminNotification] }));
    await syncUserToSupabase(newUser, userData.password);
    await syncNotificationToSupabase(adminNotification);
  };

  const handleAddAdminLog = (adminUser: User, actionType: AdminActionType, description: string, targetId?: string) => {
    const newLog: AdminActionLog = {
      id: faker.string.uuid(), timestamp: new Date().toISOString(), adminId: adminUser.id, adminName: adminUser.name, actionType, description, targetId,
    };
    setDbState(prev => ({ ...prev, adminActionLogs: [newLog, ...prev.adminActionLogs] }));
    syncAdminLogToSupabase(newLog);
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => {
    const tx: Transaction = {
        ...newTransaction, id: faker.string.uuid(), date: new Date().toISOString().split('T')[0], bonusPayoutHandled: false,
    };
    
    if (tx.type === TransactionType.Withdrawal) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour < 8 || currentHour >= 18) {
          alert("Horário de Saque: Os saques estão disponíveis apenas das 08:00 às 18:00.");
          return;
      }
      
      const today = tx.date;
      const hasWithdrawalToday = dbState.transactions.some(t => 
          t.userId === loggedUser?.id && t.type === TransactionType.Withdrawal && t.date === today && t.status !== TransactionStatus.Failed
      );

      if (hasWithdrawalToday) {
          alert("Você já solicitou um saque hoje. O limite é de 1 solicitação diária.");
          return;
      }
    }

    const adminNotif: Notification = {
        id: faker.string.uuid(), userId: adminUser.id, message: `Nova transação de ${tx.type} solicitada por ${users.find(u => u.id === tx.userId)?.name}.`, date: new Date().toISOString(), isRead: false
    };

    syncTransactionToSupabase(tx);
    syncNotificationToSupabase(adminNotif);
    setDbState(prev => ({ ...prev, transactions: [...prev.transactions, tx], notifications: [...prev.notifications, adminNotif] }));
  };

  const handleUpdateTransactionStatus = (transactionId: string, newStatus: TransactionStatus, scheduledDate?: string) => {
    const tx = dbState.transactions.find(t => t.id === transactionId);
    if (!tx || (tx.status === newStatus && tx.status !== TransactionStatus.Scheduled) || (tx.status === TransactionStatus.Completed && newStatus !== TransactionStatus.Scheduled)) return;
    
    const user = dbState.users.find(u => u.id === tx.userId);
    if (!user || !loggedUser?.isAdmin) return;

    let actionType: AdminActionType;
    let description: string;

    if (newStatus === TransactionStatus.Completed) {
        actionType = AdminActionType.TransactionApprove;
        description = `Aprovou transação de ${tx.type} para ${user.name}.`;
    } else if (newStatus === TransactionStatus.Failed) {
        actionType = AdminActionType.TransactionReject;
        description = `Rejeitou transação de ${tx.type} para ${user.name}.`;
    } else {
        actionType = AdminActionType.PaymentScheduled;
        description = `Agendou pagamento de ${tx.type} para ${user.name} em ${scheduledDate}.`;
    }
    handleAddAdminLog(loggedUser, actionType, description, transactionId);

    const notification: Notification = {
        id: faker.string.uuid(), userId: user.id, message: `Sua transação de ${tx.type} foi atualizada para: ${newStatus}.`, date: new Date().toISOString(), isRead: false
    };

    let bonusTransactions: Transaction[] = [];
    let referrersToUpdate: User[] = [];
    let shouldPayBonus = tx.type === TransactionType.Deposit && newStatus === TransactionStatus.Completed && !tx.bonusPayoutHandled;

    if (shouldPayBonus) {
        let currentUser = user;
        for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
            const referrer = dbState.users.find(u => u.id === currentUser.referredById);
            if (!referrer) break;

            const bonusRate = referralRates[level] || 0;
            if (bonusRate === 0) continue;
            
            const bonusAmount = tx.amountUSD * bonusRate;
            const bonusTx: Transaction = { id: faker.string.uuid(), userId: referrer.id, date: new Date().toISOString().split('T')[0], type: TransactionType.Bonus, status: TransactionStatus.Completed, amountUSD: bonusAmount, referralLevel: level as 1 | 2 | 3, sourceUserId: user.id, bonusPayoutHandled: true, walletSource: 'bonus' };
            bonusTransactions.push(bonusTx);
            syncTransactionToSupabase(bonusTx);
            
            const updatedReferrer = { ...referrer, balanceUSD: referrer.balanceUSD + bonusAmount, bonusBalanceUSD: (referrer.bonusBalanceUSD || 0) + bonusAmount, rank: calculateRank(referrer.balanceUSD + bonusAmount), monthlyProfitUSD: calculateProfit(referrer.capitalInvestedUSD, referrer.plan, investmentPlans) };
            syncUserToSupabase(updatedReferrer);
            referrersToUpdate.push(updatedReferrer);
            currentUser = referrer;
        }
    }
    
    const updatedTx = { ...tx, status: newStatus, scheduledDate: scheduledDate || tx.scheduledDate, bonusPayoutHandled: shouldPayBonus || tx.bonusPayoutHandled };
    syncTransactionToSupabase(updatedTx);

    const updatedTransactions = dbState.transactions.map(t => t.id === transactionId ? updatedTx : t);

    let updatedUsers = dbState.users.map(u => {
        if (u.id === user.id && newStatus === TransactionStatus.Completed) {
            let newBalance = u.balanceUSD;
            let newInvested = u.capitalInvestedUSD;
            let newDailyWithdrawable = u.dailyWithdrawableUSD || 0;
            let newBonusBalance = u.bonusBalanceUSD || 0;
            let newMonthlyProfit = u.monthlyProfitUSD || 0;

            if (tx.type === TransactionType.Deposit) {
                newBalance += tx.amountUSD;
                newInvested += tx.amountUSD;
                newMonthlyProfit = calculateProfit(newInvested, u.plan, investmentPlans);
            } else if (tx.type === TransactionType.Withdrawal) {
                newBalance += tx.amountUSD; 
                if (tx.walletSource === 'bonus') newBonusBalance = Math.max(0, newBonusBalance + tx.amountUSD);
                else {
                    newDailyWithdrawable = Math.max(0, newDailyWithdrawable + tx.amountUSD);
                    newMonthlyProfit = Math.max(0, newMonthlyProfit + tx.amountUSD);
                }
            }
            const updated = { ...u, balanceUSD: newBalance, capitalInvestedUSD: newInvested, dailyWithdrawableUSD: newDailyWithdrawable, bonusBalanceUSD: newBonusBalance, rank: calculateRank(newBalance), monthlyProfitUSD: newMonthlyProfit };
            syncUserToSupabase(updated);
            return updated;
        }
        const referrerUpdate = referrersToUpdate.find(ref => ref.id === u.id);
        return referrerUpdate || u;
    });
    
    const newNotifications = [notification, ...bonusTransactions.map(btx => ({ id: faker.string.uuid(), userId: btx.userId, message: `Bônus de indicação recebido: ${formatCurrency(btx.amountUSD, 'USD')}`, date: new Date().toISOString(), isRead: false }))];
    setDbState(prev => ({ ...prev, transactions: [...updatedTransactions, ...bonusTransactions], users: updatedUsers, notifications: [...prev.notifications, ...newNotifications] }));
    syncNotificationsToSupabase(newNotifications);
  };

  const handlePayoutBonus = (depositTx: Transaction) => { alert("Função disponível via API."); };
  const handleUpdateUserStatus = (userId: string, newStatus: UserStatus, reason?: string) => {
      const updatedUsers = dbState.users.map(u => u.id === userId ? { ...u, status: newStatus, rejectionReason: reason } : u);
      syncUserToSupabase(updatedUsers.find(u => u.id === userId)!);
      
      const notification: Notification = { id: faker.string.uuid(), userId: userId, message: newStatus === UserStatus.Approved ? "Sua conta foi APROVADA." : `Sua conta foi REJEITADA. Motivo: ${reason}`, date: new Date().toISOString(), isRead: false };
      setDbState(prev => ({ ...prev, users: [...prev.users, notification], notifications: [...prev.notifications, notification] }));
      syncNotificationToSupabase(notification);
  };
  const handleAdminUpdateUserBalance = (userId: string, newBalance: number) => {
      const updatedUsers = dbState.users.map(u => u.id === userId ? { ...u, balanceUSD: newBalance, rank: calculateRank(newBalance), monthlyProfitUSD: calculateProfit(u.capitalInvestedUSD, u.plan, investmentPlans) } : u);
      syncUserToSupabase(updatedUsers.find(u => u.id === userId)!);
      setDbState(prev => ({ ...prev, users: updatedUsers }));
  };
  const handleBroadcastNotification = (message: string) => {
      const newNotifications = users.filter(u => !u.isAdmin).map(u => ({ id: faker.string.uuid(), userId: u.id, message, date: new Date().toISOString(), isRead: false }));
      setDbState(prev => ({ ...prev, notifications: [...prev.notifications, ...newNotifications] }));
      syncNotificationsToSupabase(newNotifications);
  };
  const handleSendMessage = async (senderId: string, receiverId: string, text: string, attachment?: File) => {
      const newMessage: ChatMessage = { id: faker.string.uuid(), senderId, receiverId, text, timestamp: new Date().toISOString(), isRead: false, attachment: attachment ? { fileName: attachment.name, fileUrl: '', fileType: attachment.type } : undefined };
      syncMessageToSupabase(newMessage);
      setDbState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage] }));
  };
  const handleMarkAllNotificationsAsRead = () => {
      if (!loggedUser) return;
      const updated = dbState.notifications.map(n => n.userId === loggedUser.id ? { ...n, isRead: true } : n);
      setDbState(prev => ({ ...prev, notifications: updated }));
      syncNotificationsToSupabase(updated.filter(n => n.userId === loggedUser.id));
  };
  const handleUpdateSettings = (newSettings: PlatformSettings) => {
      if (!loggedUser?.isAdmin) return;
      setDbState(prev => ({ ...prev, platformSettings: newSettings }));
      handleAddAdminLog(loggedUser, AdminActionType.SettingsUpdate, "Atualizou as configurações da plataforma.");
      syncSettingsToSupabase(newSettings);
  };
  const handleUpdateUser = (updatedUser: User) => {
      setDbState(prev => ({ ...prev, users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u) }));
      if (loggedUser?.id === updatedUser.id) setLoggedUser(updatedUser);
      syncUserToSupabase(updatedUser);
  };
  const handleUpdatePassword = (userId: string, newPassword: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          handleUpdateUser({ ...user, password: newPassword });
          syncUserToSupabase({ ...user, password: newPassword }, newPassword);
      }
  };
  const handleUpdatePlan = (updatedPlan: InvestmentPlan) => {
      const updatedPlans = investmentPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
      setDbState(prev => ({ ...prev, investmentPlans: updatedPlans }));
      syncInvestmentPlanToSupabase(updatedPlan);
  };

  let content;
  if (view === View.Home) content = <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} />;
  else if (view === View.Login) content = <LoginPage setView={setView} onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
  else if (view === View.Register) content = <RegisterPage setView={setView} onRegister={handleRegister} language={language} setLanguage={handleSetLanguage} />;
  else if (view === View.ForgotPassword) content = <ForgotPasswordPage setView={setView} language={language} setLanguage={handleSetLanguage} />;
  else if (view === View.UserDashboard && loggedUser) content = <UserDashboard user={loggedUser} adminUser={adminUser} transactions={transactions.filter(t => t.userId === loggedUser.id)} allUsers={users} allTransactions={transactions} notifications={notifications.filter(n => n.userId === loggedUser.id)} chatMessages={chatMessages} onLogout={handleLogout} onAddTransaction={handleAddTransaction} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead} onSendMessage={handleSendMessage} onUpdateUser={handleUpdateUser} onUpdatePassword={handleUpdatePassword} isDarkMode={isDarkMode} toggleTheme={toggleTheme} language={language} setLanguage={handleSetLanguage} onRefreshData={refreshData} investmentPlans={investmentPlans} syncStatus={syncStatus} />;
  else if (view === View.AdminDashboard && loggedUser?.isAdmin) content = <AdminDashboard user={loggedUser} allUsers={users} allTransactions={transactions} chatMessages={chatMessages} platformSettings={platformSettings} adminActionLogs={adminActionLogs} notifications={notifications.filter(n => n.userId === loggedUser.id)} onLogout={handleLogout} onUpdateTransaction={handleUpdateTransactionStatus} onUpdateUserStatus={handleUpdateUserStatus} onPayoutBonus={handlePayoutBonus} onSendMessage={handleSendMessage} onUpdateSettings={handleUpdateSettings} onAdminUpdateUserBalance={handleAdminUpdateUserBalance} onUpdateUser={handleUpdateUser} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead} isDarkMode={isDarkMode} toggleTheme={toggleTheme} language={language} setLanguage={handleSetLanguage} onRefreshData={refreshData} onBroadcastNotification={handleBroadcastNotification} referralRates={referralRates} onUpdatePlan={handleUpdatePlan} investmentPlans={investmentPlans} syncStatus={syncStatus} />;
  else content = <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} />;

  return (
    <div className={`min-h-[100dvh] w-full overflow-x-hidden ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white`}>
        {content}
    </div>
  );
};

export default App;
