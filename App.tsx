
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
        // Explicitly check connection first
        const connectionCheck = await checkSupabaseConnection();
        if (!connectionCheck.success) {
            console.warn("Supabase connection check failed:", connectionCheck.message);
            // Proceed to try fetches anyway, as they might provide more detail or cached data
        }

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
             
             // Check if it's purely a network/offline issue to avoid spamming console errors
             const isOffline = [usersError, txsError, msgError, settingsError, logsError, notifError, careerError, plansError].some(e => e?.isNetwork || e?.message?.includes('Failed to fetch'));
             
             if (isOffline) {
                 console.warn("Supabase unreachable (Offline Mode). Using local data.");
             } else {
                 // Only log distinct API errors
                 if (usersError && !usersError.isNetwork) console.error("Supabase fetch user error:", usersError.message);
                 if (txsError && !txsError.isNetwork) console.error("Supabase fetch txs error:", txsError.message);
                 if (msgError && !msgError.isNetwork) console.error("Supabase fetch msg error:", msgError.message);
             }
        } else {
             setSyncStatus('online');
        }

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
        if (storedUserId && (remoteUsers || localData.users)) {
            const users = remoteUsers || localData.users;
            const user = users.find((u: User) => u.id === storedUserId);
            if (user) {
                setLoggedUser(user);
                // Ensure view is consistent with user role
                if (view === View.Home || view === View.Login) {
                    setView(user.isAdmin ? View.AdminDashboard : View.UserDashboard);
                }
            }
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

  const handleLogin = (email: string, password?: string) => {
      const user = dbState.users.find(u => u.email === email);
      if (user) {
          if (password && user.password && user.password !== password) {
              return false;
          }
          setLoggedUser(user);
          setSessionUser(user.id);
          setView(user.isAdmin ? View.AdminDashboard : View.UserDashboard);
          return true;
      }
      return false;
  };

  const handleRegister = async (data: ExtendedRegisterData) => {
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
          bonusBalanceUSD: dbState.platformSettings.signupBonusUSD || 0, // Bonus goes to bonus wallet or direct balance? Usually Bonus Wallet.
          isAdmin: false,
          joinedDate: new Date().toISOString(),
          lastProfitUpdate: new Date().toISOString(),
          referralCode: faker.string.alphanumeric(8).toUpperCase(),
          kycAnalysis: data.kycAnalysis
      };

      if (data.referralCode) {
          const referrer = dbState.users.find(u => u.referralCode === data.referralCode);
          if (referrer) {
              newUser.referredById = referrer.id;
          }
      }

      const updatedUsers = [...dbState.users, newUser];
      const newDbState = { ...dbState, users: updatedUsers };
      setDbState(newDbState);
      saveAllData(newDbState);
      
      // Sync
      await syncUserToSupabase(newUser, data.password);

      // Notify Admin
      const admin = dbState.users.find(u => u.isAdmin);
      if (admin) {
          const notif: Notification = {
              id: faker.string.uuid(),
              userId: admin.id,
              message: `Novo usuário registrado: ${newUser.name}. Verifique os documentos.`,
              date: new Date().toISOString(),
              isRead: false
          };
          const updatedNotifs = [...dbState.notifications, notif];
          setDbState(prev => ({...prev, notifications: updatedNotifs}));
          saveAllData({...newDbState, notifications: updatedNotifs});
          await syncNotificationToSupabase(notif);
      }
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
          ...newTx
      };
      
      let updatedUsers = [...dbState.users];
      
      // IMMEDIATE DEDUCTION LOGIC FOR WITHDRAWALS
      // This ensures double spending is prevented at the source.
      if (transaction.type === TransactionType.Withdrawal) {
          const userIndex = updatedUsers.findIndex(u => u.id === transaction.userId);
          if (userIndex !== -1) {
              let user = updatedUsers[userIndex];
              const amount = Math.abs(transaction.amountUSD);
              
              // Apply any updates FIRST (crystallizing the profit before withdrawal)
              if (userUpdate) {
                  user = { ...user, ...userUpdate };
              }

              // Determine source wallet and deduct
              if (transaction.walletSource === 'bonus') {
                  user.bonusBalanceUSD = Math.max(0, user.bonusBalanceUSD - amount);
              } else {
                  user.dailyWithdrawableUSD = Math.max(0, user.dailyWithdrawableUSD - amount);
              }
              
              // Deduct from total balance as well (Total = Capital + Profit + Bonus)
              user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
              
              // Recalculate rank based on new balance
              user.rank = calculateRank(user.balanceUSD);
              
              updatedUsers[userIndex] = user;
              
              // Sync User changes to Supabase immediately
              await syncUserToSupabase(user);
          }
      }

      const updatedTxs = [...dbState.transactions, transaction];
      setDbState(prev => ({ ...prev, transactions: updatedTxs, users: updatedUsers }));
      saveAllData({ ...dbState, transactions: updatedTxs, users: updatedUsers });
      await syncTransactionToSupabase(transaction);
  };

  const handleUpdateTransaction = async (txId: string, newStatus: TransactionStatus) => {
      const txIndex = dbState.transactions.findIndex(t => t.id === txId);
      if (txIndex === -1) return;

      const tx = dbState.transactions[txIndex];
      // Prevent redundant updates
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
              // Deposit Logic: Only add funds if approved (Completed)
              if (newStatus === TransactionStatus.Completed && tx.status !== TransactionStatus.Completed) {
                  user.capitalInvestedUSD += tx.amountUSD;
                  user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
                  user.rank = calculateRank(user.balanceUSD);
                  notifMessage = `Depósito de ${formatCurrency(tx.amountUSD, 'USD')} confirmado!`;
              } else if (newStatus === TransactionStatus.Failed) {
                  notifMessage = `Depósito de ${formatCurrency(tx.amountUSD, 'USD')} rejeitado.`;
              }
          } else if (tx.type === TransactionType.Withdrawal) {
              // Withdrawal Logic:
              // Funds are deducted at creation (Pending).
              // If Completed: Funds stay deducted. Just update status.
              // If Failed (Rejected): REFUND the amount to user's wallet.
              
              const amount = Math.abs(tx.amountUSD);
              
              if (newStatus === TransactionStatus.Failed && tx.status !== TransactionStatus.Failed) {
                  // REFUND LOGIC
                  if (tx.walletSource === 'bonus') {
                      user.bonusBalanceUSD += amount;
                  } else {
                      user.dailyWithdrawableUSD += amount;
                  }
                  user.balanceUSD = user.capitalInvestedUSD + user.dailyWithdrawableUSD + user.bonusBalanceUSD;
                  user.rank = calculateRank(user.balanceUSD);
                  notifMessage = `Saque de ${formatCurrency(amount, 'USD')} rejeitado. Valor estornado para sua carteira.`;
              } else if (newStatus === TransactionStatus.Completed) {
                  notifMessage = `Saque de ${formatCurrency(amount, 'USD')} aprovado e enviado!`;
              }
          }
          updatedUsers[userIndex] = user;
          await syncUserToSupabase(user);
      }

      // Create Notification
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
          await syncNotificationToSupabase(notif);
      }

      setDbState(prev => ({ ...prev, transactions: updatedTxs, users: updatedUsers, notifications: updatedNotifs }));
      saveAllData({ ...dbState, transactions: updatedTxs, users: updatedUsers, notifications: updatedNotifs });
      await syncTransactionToSupabase(updatedTx);
  };

  const handlePayoutBonus = async (depositTx: Transaction) => {
      if (depositTx.bonusPayoutHandled) return;

      const user = dbState.users.find(u => u.id === depositTx.userId);
      if (!user || !user.referredById) return;

      const newTransactions: Transaction[] = [];
      const updatedUsers = [...dbState.users];
      const notifications: Notification[] = [];

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
                  message: `Você recebeu um bônus de US$ ${bonusAmount.toFixed(2)} pelo depósito de ${user.name} (Nível ${level}).`,
                  date: new Date().toISOString(),
                  isRead: false
              };
              notifications.push(notif);
              
              // Update referrer in array
              updatedUsers[referrerIdx] = referrer;
              await syncUserToSupabase(referrer);
              await syncTransactionToSupabase(bonusTx);
              await syncNotificationToSupabase(notif);
          }
          
          currentUser = referrer;
      }

      // Mark deposit as handled
      const updatedDepositTx = { ...depositTx, bonusPayoutHandled: true };
      const txIndex = dbState.transactions.findIndex(t => t.id === depositTx.id);
      const updatedTxs = [...dbState.transactions];
      updatedTxs[txIndex] = updatedDepositTx;
      
      const finalTxs = [...updatedTxs, ...newTransactions];
      const finalNotifs = [...dbState.notifications, ...notifications];

      setDbState(prev => ({
          ...prev,
          users: updatedUsers,
          transactions: finalTxs,
          notifications: finalNotifs
      }));
      saveAllData({ ...dbState, users: updatedUsers, transactions: finalTxs, notifications: finalNotifs });
      await syncTransactionToSupabase(updatedDepositTx);
  };

  // --- User Management Handlers ---

  const handleUpdateUserStatus = async (userId: string, newStatus: UserStatus, reason?: string) => {
      const userIndex = dbState.users.findIndex(u => u.id === userId);
      if (userIndex === -1) return;

      const user = dbState.users[userIndex];
      const updatedUser = { 
          ...user, 
          status: newStatus, 
          rejectionReason: reason 
      };
      
      const updatedUsers = [...dbState.users];
      updatedUsers[userIndex] = updatedUser;

      const notif: Notification = {
          id: faker.string.uuid(),
          userId: userId,
          message: newStatus === UserStatus.Approved 
              ? 'Seu cadastro foi aprovado! Agora você pode realizar depósitos.' 
              : `Seu cadastro foi rejeitado. Motivo: ${reason}`,
          date: new Date().toISOString(),
          isRead: false
      };

      setDbState(prev => ({
          ...prev,
          users: updatedUsers,
          notifications: [...prev.notifications, notif]
      }));
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
      
      // Update balanceUSD - we also need to decide how this splits. 
      // For simplicity in admin edit, we just set total balance and maybe Capital.
      // But user.balanceUSD is usually derived. Let's force it here or update capital.
      // Let's assume Admin edits 'Capital' mostly.
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
      
      // Log Action
      if (loggedUser) {
          const log: AdminActionLog = {
              id: faker.string.uuid(),
              timestamp: new Date().toISOString(),
              adminId: loggedUser.id,
              adminName: loggedUser.name,
              actionType: AdminActionType.UserBalanceEdit,
              description: `Alterou saldo de ${dbState.users[userIndex].name} para $${newBalance}`,
              targetId: userId
          };
          const updatedLogs = [log, ...dbState.adminActionLogs];
          setDbState(prev => ({...prev, adminActionLogs: updatedLogs}));
          saveAllData({...dbState, users: updatedUsers, adminActionLogs: updatedLogs});
          await syncAdminLogToSupabase(log);
      }
  };

  // --- Other Handlers ---

  const handleSendMessage = async (senderId: string, receiverId: string, text: string, attachment?: File) => {
      // For now, attachment handling is mocked or simplified as we don't have storage setup in this snippet
      let attachmentData = undefined;
      if (attachment) {
          // Mock URL for demo
          attachmentData = {
              fileName: attachment.name,
              fileUrl: URL.createObjectURL(attachment),
              fileType: attachment.type
          };
      }

      const newMessage: ChatMessage = {
          id: faker.string.uuid(),
          senderId,
          receiverId,
          text,
          timestamp: new Date().toISOString(),
          isRead: false,
          attachment: attachmentData
      };

      const updatedMessages = [...dbState.chatMessages, newMessage];
      setDbState(prev => ({ ...prev, chatMessages: updatedMessages }));
      saveAllData({ ...dbState, chatMessages: updatedMessages });
      await syncMessageToSupabase(newMessage);
  };

  const handleUpdateSettings = async (newSettings: PlatformSettings) => {
      setDbState(prev => ({ ...prev, platformSettings: newSettings }));
      saveAllData({ ...dbState, platformSettings: newSettings });
      await syncSettingsToSupabase(newSettings);
      
      if (loggedUser) {
          const log: AdminActionLog = {
              id: faker.string.uuid(),
              timestamp: new Date().toISOString(),
              adminId: loggedUser.id,
              adminName: loggedUser.name,
              actionType: AdminActionType.SettingsUpdate,
              description: `Atualizou configurações da plataforma`,
          };
          const updatedLogs = [log, ...dbState.adminActionLogs];
          setDbState(prev => ({...prev, adminActionLogs: updatedLogs}));
          saveAllData({...dbState, platformSettings: newSettings, adminActionLogs: updatedLogs});
          await syncAdminLogToSupabase(log);
      }
  };

  const handleMarkAllNotificationsAsRead = async () => {
      if (!loggedUser) return;
      
      const updatedNotifs = dbState.notifications.map(n => 
          n.userId === loggedUser.id ? { ...n, isRead: true } : n
      );
      
      setDbState(prev => ({ ...prev, notifications: updatedNotifs }));
      saveAllData({ ...dbState, notifications: updatedNotifs });
      
      // Batch update supabase? Or individually. 
      // For simplicity in this fix, we just update local state visually or call sync individually.
      // Ideally backend handles this.
      const myNotifs = updatedNotifs.filter(n => n.userId === loggedUser.id);
      for (const n of myNotifs) {
          await syncNotificationToSupabase(n);
      }
  };

  const handleBroadcastNotification = async (message: string) => {
      const notifications: Notification[] = dbState.users.map(u => ({
          id: faker.string.uuid(),
          userId: u.id,
          message: message,
          date: new Date().toISOString(),
          isRead: false
      }));
      
      const updatedNotifs = [...dbState.notifications, ...notifications];
      setDbState(prev => ({ ...prev, notifications: updatedNotifs }));
      saveAllData({ ...dbState, notifications: updatedNotifs });
      
      // Sync loop
      for (const n of notifications) {
          await syncNotificationToSupabase(n);
      }
  };

  const handleUpdatePlan = async (updatedPlan: InvestmentPlan) => {
      const planIndex = dbState.investmentPlans.findIndex(p => p.id === updatedPlan.id);
      let newPlans = [...dbState.investmentPlans];
      
      if (planIndex !== -1) {
          newPlans[planIndex] = updatedPlan;
      } else {
          newPlans.push(updatedPlan);
      }
      
      setDbState(prev => ({ ...prev, investmentPlans: newPlans }));
      saveAllData({ ...dbState, investmentPlans: newPlans });
      await syncInvestmentPlanToSupabase(updatedPlan);
  };

  // Admin User Helper
  const adminUser = dbState.users.find(u => u.isAdmin);

  // Maintenance Mode Logic
  if (dbState.platformSettings.isMaintenanceMode) {
      // Allow access only to admin
      if (!loggedUser || !loggedUser.isAdmin) {
          return <MaintenancePage endTime={dbState.platformSettings.maintenanceEndTime} />;
      }
  }

  return (
    <>
      {view === View.Home && <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} />}
      
      {view === View.Login && <LoginPage setView={setView} onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />}
      
      {view === View.Register && <RegisterPage setView={setView} onRegister={handleRegister} language={language} setLanguage={handleSetLanguage} />}
      
      {view === View.ForgotPassword && <ForgotPasswordPage setView={setView} language={language} setLanguage={handleSetLanguage} />}
      
      {view === View.UserDashboard && loggedUser && adminUser && (
        <UserDashboard
          user={loggedUser}
          adminUser={adminUser}
          transactions={dbState.transactions.filter(t => t.userId === loggedUser.id)}
          allUsers={dbState.users} // For referral names etc
          allTransactions={dbState.transactions} // For career history
          notifications={dbState.notifications.filter(n => n.userId === loggedUser.id)}
          chatMessages={dbState.chatMessages}
          onLogout={handleLogout}
          onAddTransaction={handleAddTransaction}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          onSendMessage={handleSendMessage}
          onUpdateUser={handleUpdateUser}
          onUpdatePassword={handleUpdatePassword}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={handleSetLanguage}
          onRefreshData={loadRemoteData}
          investmentPlans={dbState.investmentPlans}
          syncStatus={syncStatus}
          platformSettings={dbState.platformSettings}
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
          notifications={dbState.notifications.filter(n => n.userId === loggedUser.id)}
          onLogout={handleLogout}
          onUpdateTransaction={handleUpdateTransaction}
          onUpdateUserStatus={handleUpdateUserStatus}
          onPayoutBonus={handlePayoutBonus}
          onSendMessage={handleSendMessage}
          onUpdateSettings={handleUpdateSettings}
          onAdminUpdateUserBalance={handleAdminUpdateUserBalance}
          onUpdateUser={handleUpdateUser}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={handleSetLanguage}
          onRefreshData={loadRemoteData}
          onBroadcastNotification={handleBroadcastNotification}
          referralRates={referralRates}
          investmentPlans={dbState.investmentPlans}
          onUpdatePlan={handleUpdatePlan}
          syncStatus={syncStatus}
        />
      )}
    </>
  );
};

export default App;
