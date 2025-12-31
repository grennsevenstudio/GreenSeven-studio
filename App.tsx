
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
    fetchInvestmentPlansFromSupabase,
    syncInvestmentPlanToSupabase,
    checkSupabaseConnection,
    deleteTransactionById,
    deleteUserById,
    deleteNotificationById,
} from './lib/supabase';
import { requestNotificationPermission, showSystemNotification, formatCurrency } from './lib/utils';
import { faker } from '@faker-js/faker';

import HomePage from './components/views/HomePage';
import LoginPage from './components/views/LoginPage';
import RegisterPage, { type ExtendedRegisterData } from './components/views/RegisterPage';
import ForgotPasswordPage from './components/views/ForgotPasswordPage';
import UserDashboard from './components/ui/dashboard/user/UserDashboard';
import AdminDashboard from './components/ui/dashboard/admin/AdminDashboard';
import MaintenancePage from './components/views/MaintenancePage';

// Initialize local storage cleanup
initializeDB();

const calculateRank = (balance: number): InvestorRank => {
  if (balance >= 100000) return InvestorRank.Diamond;
  if (balance >= 20000) return InvestorRank.Platinum;
  if (balance >= 5000) return InvestorRank.Gold;
  if (balance >= 1000) return InvestorRank.Silver;
  return InvestorRank.Bronze;
};

const App: React.FC = () => {
  // Initialize state synchronously from LocalStorage to prevent login flash
  const initialLocalData = getAllData();

  const [dbState, setDbState] = useState<AppDB>({
      users: initialLocalData.users || [],
      transactions: initialLocalData.transactions || [],
      chatMessages: initialLocalData.chatMessages || [],
      notifications: initialLocalData.notifications || [],
      adminActionLogs: initialLocalData.adminActionLogs || [],
      platformSettings: initialLocalData.platformSettings || {} as any,
      investmentPlans: initialLocalData.investmentPlans || DEFAULT_PLANS
  });

  const [loggedUser, setLoggedUser] = useState<User | null>(() => {
      const storedUserId = getSessionUser();
      if (storedUserId && initialLocalData.users) {
          return initialLocalData.users.find(u => u.id === storedUserId) || null;
      }
      return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [initialReferralCode, setInitialReferralCode] = useState<string | null>(null);

  // View State - Synchronously check session on initialization
  const [view, setView] = useState<View>(() => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path.includes('/register') || params.has('ref')) return View.Register;
      if (path.includes('/login')) return View.Login;
      
      const storedUserId = getSessionUser();
      if (storedUserId && initialLocalData.users) {
          const user = initialLocalData.users.find(u => u.id === storedUserId);
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
  
  // This useEffect will run only once on mount to capture referral codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
        localStorage.setItem('referral_code', refCode);
        setInitialReferralCode(refCode);
        // Force view to register page if ref link is used
        setView(View.Register);
        // Clean the URL to avoid confusion on refresh, keeping the path
        window.history.replaceState({}, document.title, '/register');
    } else {
        const storedCode = localStorage.getItem('referral_code');
        if (storedCode) {
            setInitialReferralCode(storedCode);
        }
    }
  }, []); // Empty dependency array means it runs once on mount

  useEffect(() => {
      requestNotificationPermission();
  }, []);

  // Sync loggedUser state with dbState updates
  useEffect(() => {
      if (loggedUser && dbState.users.length > 0) {
          const updatedUser = dbState.users.find(u => u.id === loggedUser.id);
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

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
  }

  // Data Loading from Supabase
  const loadRemoteData = async () => {
    setSyncStatus('syncing');
    try {
        const connectionCheck = await checkSupabaseConnection();
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

        if (!usersError && !txsError) {
             setSyncStatus('online');
        } else {
             setSyncStatus('error');
        }

        if (remoteCareerPlan) setReferralRates(remoteCareerPlan);

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
        const storedUserId = getSessionUser();
        if (storedUserId) {
            const users = remoteUsers || localData.users;
            const user = users.find((u: User) => u.id === storedUserId);
            if (user) setLoggedUser(user);
        }
        setIsLoading(false);
    } catch (e) {
        console.error("Error loading remote data:", e);
        setSyncStatus('error');
        setIsLoading(false);
    }
  };

  useEffect(() => {
      loadRemoteData();
  }, []);

  const handleLogin = (email: string, password?: string): Promise<{ success: boolean; message?: string; }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const user = dbState.users.find(u => u.email === email);
            
            if (!user || (password && user.password && user.password !== password)) {
                resolve({ success: false, message: 'Credenciais inválidas. Verifique seu email e senha.' });
                return;
            }

            // Admin can always log in regardless of status (useful for recovery)
            if (user.isAdmin) {
                setLoggedUser(user);
                setSessionUser(user.id);
                setView(View.AdminDashboard);
                resolve({ success: true });
                return;
            }
            
            // Check user status for non-admins
            switch (user.status) {
                case UserStatus.Approved:
                    setLoggedUser(user);
                    setSessionUser(user.id);
                    setView(View.UserDashboard);
                    resolve({ success: true });
                    break;
                case UserStatus.Pending:
                    resolve({ success: false, message: 'Sua conta está em análise. Você será notificado após a aprovação.' });
                    break;
                case UserStatus.Rejected:
                    resolve({ success: false, message: `Seu cadastro foi rejeitado. Motivo: ${user.rejectionReason || 'Não especificado'}` });
                    break;
                default:
                    resolve({ success: false, message: 'Status de conta desconhecido. Contate o suporte.' });
                    break;
            }
        }, 1500);
    });
};

  const handleRegister = async (data: ExtendedRegisterData): Promise<{ success: boolean; message?: string; }> => {
      // 1. Validate referral code if provided
      if (data.referralCode) {
          const referrer = dbState.users.find(u => u.referralCode?.toUpperCase() === data.referralCode?.toUpperCase());
          if (!referrer) {
              return { success: false, message: 'Código de indicação inválido.' };
          }
      }

      // 2. Generate unique referral code for the new user
      let newReferralCode = '';
      let isUnique = false;
      while (!isUnique) {
          newReferralCode = faker.string.alphanumeric(8).toUpperCase();
          if (!dbState.users.some(u => u.referralCode === newReferralCode)) {
              isUnique = true;
          }
      }
      
      const newUser: User = {
          id: faker.string.uuid(),
          name: data.name,
          email: data.email,
          password: data.password,
          cpf: data.cpf,
          phone: data.phone,
          address: data.address,
          documents: data.documents,
          status: UserStatus.Pending,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=00FF9C&color=000`,
          rank: InvestorRank.Bronze,
          plan: 'Conservador',
          balanceUSD: dbState.platformSettings.signupBonusUSD || 0,
          capitalInvestedUSD: 0,
          monthlyProfitUSD: 0,
          dailyWithdrawableUSD: 0,
          bonusBalanceUSD: dbState.platformSettings.signupBonusUSD || 0,
          isAdmin: false,
          joinedDate: new Date().toISOString(),
          lastProfitUpdate: new Date().toISOString(),
          referralCode: newReferralCode, // Use the unique code
          kycAnalysis: data.kycAnalysis,
          hasSeenWelcomePopup: false,
      };

      if (data.referralCode) {
          const referrer = dbState.users.find(u => u.referralCode?.toUpperCase() === data.referralCode?.toUpperCase());
          if (referrer) newUser.referredById = referrer.id;
      }

      const updatedUsers = [...dbState.users, newUser];
      const newDbState = { ...dbState, users: updatedUsers };
      setDbState(newDbState);
      saveAllData(newDbState);
      await syncUserToSupabase(newUser, data.password);

      const admin = dbState.users.find(u => u.isAdmin);
      if (admin) {
          const notif: Notification = {
              id: faker.string.uuid(),
              userId: admin.id,
              message: `Novo usuário registrado: ${newUser.name}. Verifique os documentos.`,
              date: new Date().toISOString(),
              isRead: false,
              isAdmin: true,
          };
          const updatedNotifs = [...dbState.notifications, notif];
          setDbState(prev => ({...prev, notifications: updatedNotifs}));
          saveAllData({...newDbState, notifications: updatedNotifs});
          await syncNotificationToSupabase(notif);
      }
      
      // Clear the referral code from storage after successful registration
      localStorage.removeItem('referral_code');
      setInitialReferralCode(null);

      return { success: true };
  };

  const handleLogout = () => {
      setLoggedUser(null);
      clearSessionUser();
      setView(View.Login);
  };

  // --- Transaction Handlers ---

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>, userUpdate?: Partial<User>) => {
      const transaction: Transaction = {
          id: faker.string.uuid(),
          date: new Date().toISOString(),
          bonusPayoutHandled: false,
          ...newTx,
          status: TransactionStatus.Pending // User creations always start as Pending
      };
      
      let updatedUsers = [...dbState.users];
      
      if (transaction.type === TransactionType.Withdrawal) {
          const userIndex = updatedUsers.findIndex(u => u.id === transaction.userId);
          if (userIndex !== -1) {
              let user = updatedUsers[userIndex];
              const amount = Math.abs(transaction.amountUSD);
              if (userUpdate) user = { ...user, ...userUpdate };
              if (transaction.walletSource === 'bonus') {
                  user.bonusBalanceUSD = Math.max(0, user.bonusBalanceUSD - amount);
              } else {
                  user.dailyWithdrawableUSD = Math.max(0, user.dailyWithdrawableUSD - amount);
              }
              user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
              user.rank = calculateRank(user.balanceUSD);
              updatedUsers[userIndex] = user;
              await syncUserToSupabase(user);
          }
      }

      let adminNotif: Notification | null = null;
      const admin = dbState.users.find(u => u.isAdmin);
      const user = dbState.users.find(u => u.id === newTx.userId);

      if (admin && user) {
          let message = '';
          if (transaction.type === TransactionType.Deposit) {
              message = `Novo depósito de ${formatCurrency(transaction.amountUSD, 'USD')} solicitado por ${user.name}.`;
          } else if (transaction.type === TransactionType.Withdrawal) {
              message = `Novo saque de ${formatCurrency(Math.abs(transaction.amountUSD), 'USD')} solicitado por ${user.name}.`;
          }

          if (message) {
              adminNotif = {
                  id: faker.string.uuid(),
                  userId: admin.id,
                  message,
                  date: new Date().toISOString(),
                  isRead: false,
                  isAdmin: true,
              };
          }
      }

      const updatedTxs = [...dbState.transactions, transaction];
      const updatedNotifs = adminNotif ? [...dbState.notifications, adminNotif] : dbState.notifications;
      
      const newDbState = {
          ...dbState,
          transactions: updatedTxs,
          users: updatedUsers,
          notifications: updatedNotifs,
      };

      setDbState(newDbState);
      saveAllData(newDbState);
      
      await syncTransactionToSupabase(transaction);
      if (adminNotif) {
          await syncNotificationToSupabase(adminNotif);
      }
  };

  const handleUpdateTransaction = async (txId: string, newStatus: TransactionStatus) => {
      const txIndex = dbState.transactions.findIndex(t => t.id === txId);
      if (txIndex === -1) return;

      const tx = dbState.transactions[txIndex];
      if (tx.status === newStatus) return;

      const updatedTx = { ...tx, status: newStatus };
      const updatedTxs = [...dbState.transactions];
      updatedTxs[txIndex] = updatedTx;

      let updatedUsers = [...dbState.users];
      const userIndex = updatedUsers.findIndex(u => u.id === tx.userId);
      let notifMessage = '';

      if (userIndex !== -1) {
          const user = updatedUsers[userIndex];
          if (tx.type === TransactionType.Deposit) {
              if (newStatus === TransactionStatus.Completed) {
                  user.capitalInvestedUSD += tx.amountUSD;
                  const plan = dbState.investmentPlans.find(p => p.name === user.plan) || dbState.investmentPlans[0];
                  user.monthlyProfitUSD = user.capitalInvestedUSD * plan.returnRate;
                  user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
                  user.rank = calculateRank(user.balanceUSD);
                  notifMessage = `Depósito de ${formatCurrency(tx.amountUSD, 'USD')} confirmado! O valor já está no seu saldo.`;

                  // NEW LOGIC: Trigger bonus payout on first completed deposit
                  if (user.referredById) {
                      const priorCompletedDeposits = dbState.transactions.filter(
                          t => t.userId === user.id && t.type === TransactionType.Deposit && t.status === TransactionStatus.Completed
                      );
                      // If there are no previously completed deposits (in the old state), this is the first one.
                      if (priorCompletedDeposits.length === 0) {
                          await handlePayoutBonus(updatedTx);
                      }
                  }

              } else if (newStatus === TransactionStatus.Failed) {
                  notifMessage = `Depósito de ${formatCurrency(tx.amountUSD, 'USD')} rejeitado.`;
              }
          } else if (tx.type === TransactionType.Withdrawal) {
              const amount = Math.abs(tx.amountUSD);
              if (newStatus === TransactionStatus.Failed) {
                  if (tx.walletSource === 'bonus') {
                      user.bonusBalanceUSD += amount;
                  } else {
                      user.dailyWithdrawableUSD += amount;
                  }
                  user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
                  user.rank = calculateRank(user.balanceUSD);
                  notifMessage = `Saque de ${formatCurrency(amount, 'USD')} rejeitado. Valor estornado.`;
              } else if (newStatus === TransactionStatus.Completed) {
                  notifMessage = `Saque de ${formatCurrency(amount, 'USD')} concluído com sucesso.`;
              }
          }
          updatedUsers[userIndex] = user;
          await syncUserToSupabase(user);
      }

      let updatedNotifs = [...dbState.notifications];
      if (notifMessage && userIndex !== -1) {
           const notif: Notification = {
              id: faker.string.uuid(),
              userId: tx.userId,
              message: notifMessage,
              date: new Date().toISOString(),
              isRead: false
          };
          updatedNotifs = [...updatedNotifs, notif];
          syncNotificationToSupabase(notif);
      }

      // Log Admin Action
      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: newStatus === TransactionStatus.Completed ? AdminActionType.TransactionApprove : AdminActionType.TransactionReject,
          description: `${newStatus === TransactionStatus.Completed ? 'Aprovou' : 'Recusou'} transação ${tx.type} de US$ ${tx.amountUSD.toFixed(2)}`,
          targetId: tx.id
      };
      const updatedLogs = [adminLog, ...dbState.adminActionLogs];

      setDbState(prev => ({ 
          ...prev, 
          transactions: updatedTxs, 
          users: updatedUsers, 
          notifications: updatedNotifs,
          adminActionLogs: updatedLogs
      }));
      saveAllData({ ...dbState, transactions: updatedTxs, users: updatedUsers, notifications: updatedNotifs, adminActionLogs: updatedLogs });
      await syncTransactionToSupabase(updatedTx);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleDeleteTransaction = async (txId: string) => {
      // 1. Remove from local state
      const updatedTransactions = dbState.transactions.filter(tx => tx.id !== txId);
      const tx = dbState.transactions.find(t => t.id === txId);
      
      // 2. Log action
      const user = tx ? dbState.users.find(u => u.id === tx.userId) : null;
      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: AdminActionType.TransactionDelete,
          description: `Excluiu transação ${txId.slice(0,8)} de ${user?.name || 'desconhecido'}`,
          targetId: txId
      };
      const updatedLogs = [adminLog, ...dbState.adminActionLogs];

      setDbState(prev => ({
          ...prev,
          transactions: updatedTransactions,
          adminActionLogs: updatedLogs
      }));
      saveAllData({ ...dbState, transactions: updatedTransactions, adminActionLogs: updatedLogs });

      // 3. Sync with Supabase
      await deleteTransactionById(txId);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleAdminUpdateUserBonus = async (userId: string, amount: number, operation: 'add' | 'remove') => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;
      
      const user = dbState.users[userIndex];
      const actualAmount = Math.abs(amount);
      let newBonusBalance = user.bonusBalanceUSD;
      
      if (operation === 'add') {
          newBonusBalance += actualAmount;
      } else {
          newBonusBalance = Math.max(0, newBonusBalance - actualAmount);
      }

      const updatedUser = { 
          ...user, 
          bonusBalanceUSD: newBonusBalance,
          balanceUSD: user.capitalInvestedUSD + user.dailyWithdrawableUSD + newBonusBalance,
          rank: calculateRank(user.capitalInvestedUSD + user.dailyWithdrawableUSD + newBonusBalance)
      };

      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;

      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: AdminActionType.UserBonusEdit,
          description: `${operation === 'add' ? 'Adicionou' : 'Removeu'} US$ ${actualAmount.toFixed(2)} de bônus para ${user.name}`,
          targetId: userId
      };
      
      const updatedLogs = [adminLog, ...dbState.adminActionLogs];

      setDbState(prev => ({ ...prev, users: updatedUsers, adminActionLogs: updatedLogs }));
      saveAllData({ ...dbState, users: updatedUsers, adminActionLogs: updatedLogs });
      await syncUserToSupabase(updatedUser);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleAdminUpdateUserCapital = async (userId: string, amount: number, operation: 'add' | 'remove') => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;
      
      const user = dbState.users[userIndex];
      const actualAmount = Math.abs(amount);
      let newCapital = user.capitalInvestedUSD;
      
      if (operation === 'add') {
          newCapital += actualAmount;
      } else {
          newCapital = Math.max(0, newCapital - actualAmount);
      }

      const updatedUser = { 
          ...user, 
          capitalInvestedUSD: newCapital,
          monthlyProfitUSD: newCapital * ((dbState.investmentPlans.find(p => p.name === user.plan) || dbState.investmentPlans[0]).returnRate),
          balanceUSD: newCapital + user.dailyWithdrawableUSD + user.bonusBalanceUSD,
          rank: calculateRank(newCapital + user.dailyWithdrawableUSD + user.bonusBalanceUSD)
      };

      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;

      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: AdminActionType.UserCapitalEdit,
          description: `${operation === 'add' ? 'Adicionou' : 'Removeu'} US$ ${actualAmount.toFixed(2)} de capital investido para ${user.name}`,
          targetId: userId
      };
      
      const updatedLogs = [adminLog, ...dbState.adminActionLogs];

      setDbState(prev => ({ ...prev, users: updatedUsers, adminActionLogs: updatedLogs }));
      saveAllData({ ...dbState, users: updatedUsers, adminActionLogs: updatedLogs });
      await syncUserToSupabase(updatedUser);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleAdminUpdateUserProfit = async (userId: string, newProfit: number) => {
    const userIndex = dbState.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    const user = dbState.users[userIndex];
    const updatedUser = { 
        ...user, 
        monthlyProfitUSD: newProfit
    };

    const updatedUsers = [...dbState.users];
    updatedUsers[userIndex] = updatedUser;

    const adminLog: AdminActionLog = {
        id: faker.string.uuid(),
        timestamp: new Date().toISOString(),
        adminId: loggedUser?.id || 'system',
        adminName: loggedUser?.name || 'Sistema',
        actionType: AdminActionType.UserProfitEdit,
        description: `Ajustou a projeção de lucro de ${user.name} para ${formatCurrency(newProfit, 'USD')}/mês`,
        targetId: userId
    };
    
    const updatedLogs = [adminLog, ...dbState.adminActionLogs];

    setDbState(prev => ({ ...prev, users: updatedUsers, adminActionLogs: updatedLogs }));
    saveAllData({ ...dbState, users: updatedUsers, adminActionLogs: updatedLogs });
    await syncUserToSupabase(updatedUser);
    await syncAdminLogToSupabase(adminLog);
  };

  const handlePayoutBonus = async (depositTx: Transaction) => {
      if (depositTx.bonusPayoutHandled) return;
      const user = dbState.users.find(u => u.id === depositTx.userId);
      if (!user || !user.referredById) return;

      const newTransactions: Transaction[] = [];
      const updatedUsers = [...dbState.users];
      const notifications: Notification[] = []; // For users
      const adminNotifications: Notification[] = []; // For admin
      const admin = dbState.users.find(u => u.isAdmin);
      let currentUser = user;

      for (let level = 1; level <= 3 && currentUser.referredById; level++) {
          const referrerIdx = updatedUsers.findIndex(u => u.id === currentUser.referredById);
          if (referrerIdx === -1) break;
          const referrer = updatedUsers[referrerIdx];
          const rate = referralRates[level] || 0;
          if (rate > 0) {
              const bonusAmount = depositTx.amountUSD * rate;
              referrer.bonusBalanceUSD += bonusAmount;
              referrer.balanceUSD = referrer.capitalInvestedUSD + referrer.dailyWithdrawableUSD + referrer.bonusBalanceUSD;
              referrer.rank = calculateRank(referrer.balanceUSD);
              
              const bonusTx: Transaction = {
                  id: faker.string.uuid(),
                  userId: referrer.id,
                  type: TransactionType.Bonus,
                  status: TransactionStatus.Completed,
                  amountUSD: bonusAmount,
                  date: new Date().toISOString(),
                  referralLevel: level as 1|2|3,
                  sourceUserId: user.id
              };
              newTransactions.push(bonusTx);
              
              const notif: Notification = {
                  id: faker.string.uuid(),
                  userId: referrer.id,
                  message: `Bônus de ${formatCurrency(bonusAmount, 'USD')} recebido (Depósito de ${user.name}, Nível ${level}).`,
                  date: new Date().toISOString(),
                  isRead: false
              };
              notifications.push(notif);
              
              // Admin Notification
              if (admin) {
                  const adminNotif: Notification = {
                      id: faker.string.uuid(),
                      userId: admin.id,
                      message: `Bônus Nv.${level} (${formatCurrency(bonusAmount, 'USD')}) pago a ${referrer.name} (Ref: ${user.name}).`,
                      date: new Date().toISOString(),
                      isRead: false,
                      isAdmin: true
                  };
                  adminNotifications.push(adminNotif);
              }

              updatedUsers[referrerIdx] = referrer;
              await syncUserToSupabase(referrer);
              await syncTransactionToSupabase(bonusTx);
              await syncNotificationToSupabase(notif);
          }
          currentUser = referrer;
      }
      
      for (const n of adminNotifications) {
        await syncNotificationToSupabase(n);
      }

      const updatedDepositTx = { ...depositTx, bonusPayoutHandled: true };
      const txIndex = dbState.transactions.findIndex(t => t.id === depositTx.id);
      const updatedTxs = [...dbState.transactions];
      updatedTxs[txIndex] = updatedDepositTx;
      
      const allNewNotifications = [...notifications, ...adminNotifications];
      setDbState(prev => ({ ...prev, users: updatedUsers, transactions: [...updatedTxs, ...newTransactions], notifications: [...prev.notifications, ...allNewNotifications] }));
      saveAllData({ ...dbState, users: updatedUsers, transactions: [...updatedTxs, ...newTransactions], notifications: [...dbState.notifications, ...allNewNotifications] });
      await syncTransactionToSupabase(updatedDepositTx);
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus, reason?: string) => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;
      const user = dbState.users[userIndex];
      const updatedUser = { ...user, status: newStatus, rejectionReason: reason };
      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;
      const notif: Notification = {
          id: faker.string.uuid(),
          userId: userId,
          message: newStatus === UserStatus.Approved ? 'Seu cadastro foi aprovado!' : `Cadastro rejeitado. Motivo: ${reason}`,
          date: new Date().toISOString(),
          isRead: false
      };
      setDbState(prev => ({ ...prev, users: updatedUsers, notifications: [...prev.notifications, notif] }));
      saveAllData({ ...dbState, users: updatedUsers, notifications: [...dbState.notifications, notif] });
      await syncUserToSupabase(updatedUser);
      await syncNotificationToSupabase(notif);
  };

  const handleUpdateUser = async (updatedUser: User) => {
      const userIndex = dbState.users.findIndex(u => u.id === updatedUser.id);
      if (userIndex === -1) return;
      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;
      setDbState(prev => ({ ...prev, users: updatedUsers }));
      saveAllData({ ...dbState, users: updatedUsers });
      await syncUserToSupabase(updatedUser);
  };

  const handleUpdatePassword = async (userId: string, newPass: string) => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;
      const updatedUser = { ...dbState.users[userIndex], password: newPass };
      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;
      setDbState(prev => ({ ...prev, users: updatedUsers }));
      saveAllData({ ...dbState, users: updatedUsers });
      await syncUserToSupabase(updatedUser, newPass);
  };

  const handleAdminUpdateUserBalance = async (userId: string, newBalance: number) => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;
      const diff = newBalance - dbState.users[userIndex].balanceUSD;
      const updatedUser = { 
          ...dbState.users[userIndex], 
          balanceUSD: newBalance, 
          capitalInvestedUSD: dbState.users[userIndex].capitalInvestedUSD + diff,
          rank: calculateRank(newBalance) 
      };
      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;
      setDbState(prev => ({ ...prev, users: updatedUsers }));
      saveAllData({ ...dbState, users: updatedUsers });
      await syncUserToSupabase(updatedUser);
  };

  const handleSendMessage = async (senderId: string, receiverId: string, text: string, attachment?: File) => {
      let attachmentData = undefined;
      if (attachment) {
          attachmentData = { fileName: attachment.name, fileUrl: URL.createObjectURL(attachment), fileType: attachment.type };
      }
      const newMessage: ChatMessage = { id: faker.string.uuid(), senderId, receiverId, text, timestamp: new Date().toISOString(), isRead: false, attachment: attachmentData };
      const updatedMessages = [...dbState.chatMessages, newMessage];
      
      let updatedNotifs = [...dbState.notifications];
      const sender = dbState.users.find(u => u.id === senderId);
      const receiver = dbState.users.find(u => u.id === receiverId);

      // Notify Admin if User sends a message
      if (receiver && receiver.isAdmin && sender && !sender.isAdmin) {
          const adminNotif: Notification = {
              id: faker.string.uuid(),
              userId: receiver.id,
              message: `Suporte: Nova mensagem de ${sender.name}.`,
              date: new Date().toISOString(),
              isRead: false,
              isAdmin: true
          };
          updatedNotifs.push(adminNotif);
          await syncNotificationToSupabase(adminNotif);
          // High Priority Browser notification
          showSystemNotification('Suporte GreennSeven', `Nova mensagem de ${sender.name}: ${text.slice(0, 50)}...`);
      }

      setDbState(prev => ({ ...prev, chatMessages: updatedMessages, notifications: updatedNotifs }));
      saveAllData({ ...dbState, chatMessages: updatedMessages, notifications: updatedNotifs });
      await syncMessageToSupabase(newMessage);
  };

  const handleUpdateSettings = async (newSettings: PlatformSettings) => {
      setDbState(prev => ({ ...prev, platformSettings: newSettings }));
      saveAllData({ ...dbState, platformSettings: newSettings });
      await syncSettingsToSupabase(newSettings);
  };

  const handleMarkAllNotificationsAsRead = async () => {
      if (!loggedUser) return;
      const updatedNotifs = dbState.notifications.map(n => n.userId === loggedUser.id ? { ...n, isRead: true } : n);
      setDbState(prev => ({ ...prev, notifications: updatedNotifs }));
      saveAllData({ ...dbState, notifications: updatedNotifs });
      for (const n of updatedNotifs.filter(notif => notif.userId === loggedUser.id)) {
          await syncNotificationToSupabase(n);
      }
  };

  const handleAddNotification = async (targetUserIds: string[], message: string) => {
      const newNotifications: Notification[] = targetUserIds.map(userId => ({
          id: faker.string.uuid(),
          userId,
          message,
          date: new Date().toISOString(),
          isRead: false
      }));

      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: AdminActionType.NotificationAdd,
          description: `Enviou notificação "${message.slice(0, 30)}..." para ${targetUserIds.length} usuário(s).`,
          targetId: targetUserIds.join(',')
      };

      setDbState(prev => ({
          ...prev,
          notifications: [...prev.notifications, ...newNotifications],
          adminActionLogs: [adminLog, ...prev.adminActionLogs]
      }));
      saveAllData({ ...dbState, notifications: [...dbState.notifications, ...newNotifications], adminActionLogs: [adminLog, ...dbState.adminActionLogs] });

      for (const n of newNotifications) await syncNotificationToSupabase(n);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleDeleteNotification = async (notificationId: string) => {
      const adminLog: AdminActionLog = {
          id: faker.string.uuid(),
          timestamp: new Date().toISOString(),
          adminId: loggedUser?.id || 'system',
          adminName: loggedUser?.name || 'Sistema',
          actionType: AdminActionType.NotificationDelete,
          description: `Excluiu notificação ID: ${notificationId.slice(0, 8)}`,
          targetId: notificationId
      };

      setDbState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId),
          adminActionLogs: [adminLog, ...prev.adminActionLogs]
      }));
      saveAllData({ ...dbState, notifications: dbState.notifications.filter(n => n.id !== notificationId), adminActionLogs: [adminLog, ...dbState.adminActionLogs] });
      await deleteNotificationById(notificationId);
      await syncAdminLogToSupabase(adminLog);
  };

  const handleUpdatePlan = async (updatedPlan: InvestmentPlan) => {
    setDbState(prevState => {
      const planIndex = prevState.investmentPlans.findIndex(p => p.id === updatedPlan.id);
      const newPlans = [...prevState.investmentPlans];
      if (planIndex !== -1) {
        newPlans[planIndex] = updatedPlan;
      } else {
        newPlans.push(updatedPlan);
      }
      const newDbState = { ...prevState, investmentPlans: newPlans };
      saveAllData(newDbState);
      return newDbState;
    });
    await syncInvestmentPlanToSupabase(updatedPlan);
  };

  const handleDeleteUser = async (userId: string, password?: string, isSelfDelete: boolean = false): Promise<{ success: boolean; message?: string; }> => {
    const userToDelete = dbState.users.find(u => u.id === userId);
    if (!userToDelete) {
        return { success: false, message: "Usuário não encontrado." };
    }

    if (userToDelete.isAdmin) {
        alert("A conta de administrador não pode ser excluída.");
        return { success: false, message: "A conta de administrador não pode ser excluída." };
    }

    // Password validation for self-delete
    if (isSelfDelete && password) {
        if (userToDelete.password !== password) {
            return { success: false, message: "Senha incorreta. A exclusão foi cancelada." };
        }
    } else if (isSelfDelete && !password) {
        // Password is required for self-delete
        return { success: false, message: "Senha é obrigatória para auto-exclusão." };
    }
    
    const adminLog: AdminActionLog = {
        id: faker.string.uuid(),
        timestamp: new Date().toISOString(),
        adminId: isSelfDelete ? userId : (loggedUser?.id || 'system_delete'),
        adminName: isSelfDelete ? userToDelete.name : (loggedUser?.name || 'Sistema'),
        actionType: isSelfDelete ? AdminActionType.UserSelfDelete : AdminActionType.UserDelete,
        description: isSelfDelete ? `Usuário ${userToDelete.name} auto-excluiu a conta.` : `Excluiu o usuário ${userToDelete.name} (ID: ${userToDelete.id.slice(0, 8)})`,
        targetId: userId
    };

    setDbState(prev => {
        const newState = {
            ...prev,
            users: prev.users.filter(u => u.id !== userId),
            transactions: prev.transactions.filter(t => t.userId !== userId),
            notifications: prev.notifications.filter(n => n.userId !== userId),
            chatMessages: prev.chatMessages.filter(m => m.senderId !== userId && m.receiverId !== userId),
            adminActionLogs: [adminLog, ...prev.adminActionLogs],
        };
        saveAllData(newState);
        return newState;
    });

    await deleteUserById(userId);
    await syncAdminLogToSupabase(adminLog);
    
    if (isSelfDelete && loggedUser?.id === userId) {
        handleLogout();
    }

    return { success: true };
  };

  if (dbState.platformSettings.isMaintenanceMode && (!loggedUser || !loggedUser.isAdmin)) {
      return <MaintenancePage endTime={dbState.platformSettings.maintenanceEndTime} />;
  }

  return (
    <>
      {view === View.Home && <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} investmentPlans={dbState.investmentPlans} />}
      {view === View.Login && <LoginPage setView={setView} onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />}
      {view === View.Register && <RegisterPage setView={setView} onRegister={handleRegister} language={language} setLanguage={handleSetLanguage} initialReferralCode={initialReferralCode} />}
      {view === View.ForgotPassword && <ForgotPasswordPage setView={setView} language={language} setLanguage={handleSetLanguage} />}
      {view === View.UserDashboard && loggedUser && (
        <UserDashboard
          user={loggedUser}
          adminUser={dbState.users.find(u => u.isAdmin)!}
          transactions={dbState.transactions.filter(t => t.userId === loggedUser.id)}
          allUsers={dbState.users}
          allTransactions={dbState.transactions}
          notifications={dbState.notifications.filter(n => n.userId === loggedUser.id)}
          chatMessages={dbState.chatMessages}
          onLogout={handleLogout}
          onAddTransaction={handleAddTransaction}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onSendMessage={handleSendMessage}
          onUpdateUser={handleUpdateUser}
          onUpdatePassword={handleUpdatePassword}
          onDeleteAccount={handleDeleteUser}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={handleSetLanguage}
          onRefreshData={loadRemoteData}
          investmentPlans={dbState.investmentPlans}
          syncStatus={syncStatus}
          platformSettings={dbState.platformSettings}
          referralRates={referralRates}
        />
      )}
      {view === View.AdminDashboard && loggedUser && loggedUser.isAdmin && (
        <AdminDashboard
          user={loggedUser}
          allUsers={dbState.users}
          allTransactions={dbState.transactions}
          chatMessages={dbState.chatMessages}
          platformSettings={dbState.platformSettings}
          adminActionLogs={dbState.adminActionLogs}
          notifications={dbState.notifications}
          onLogout={handleLogout}
          onUpdateTransaction={handleUpdateTransaction}
          onUpdateUserStatus={handleUpdateUserStatus}
          onSendMessage={handleSendMessage}
          onUpdateSettings={handleUpdateSettings}
          onAdminUpdateUserBalance={handleAdminUpdateUserBalance}
          onAdminUpdateUserBonus={handleAdminUpdateUserBonus}
          onAdminUpdateUserCapital={handleAdminUpdateUserCapital}
          onAdminUpdateUserProfit={handleAdminUpdateUserProfit}
          onUpdateUser={handleUpdateUser}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onAddNotification={handleAddNotification}
          onDeleteNotification={handleDeleteNotification}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={handleSetLanguage}
          onRefreshData={loadRemoteData}
          referralRates={referralRates}
          investmentPlans={dbState.investmentPlans}
          onUpdatePlan={handleUpdatePlan}
          syncStatus={syncStatus}
          onDeleteTransaction={handleDeleteTransaction}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </>
  );
};

export default App;
