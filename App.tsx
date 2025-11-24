import React, { useState, useEffect, useRef } from 'react';
import type { User, Transaction, Notification, ChatMessage, PlatformSettings, AdminActionLog, Language } from './types';
import { View, TransactionStatus, TransactionType, AdminActionType, UserStatus, InvestorRank } from './types';
import { REFERRAL_BONUS_RATES, INVESTMENT_PLANS } from './constants';
import { initializeDB, getAllData, saveAllData, type AppDB } from './lib/db';
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

// Initialize the database on first load
initializeDB();

const calculateRank = (balance: number): InvestorRank => {
  if (balance >= 100000) return InvestorRank.Diamond;
  if (balance >= 20000) return InvestorRank.Platinum;
  if (balance >= 5000) return InvestorRank.Gold;
  if (balance >= 1000) return InvestorRank.Silver;
  return InvestorRank.Bronze;
};

const calculateProfit = (balance: number, planName: string = 'Conservador'): number => {
    const plan = INVESTMENT_PLANS.find(p => p.name.toLowerCase() === planName.toLowerCase()) || INVESTMENT_PLANS[0];
    return balance * plan.returnRate;
};

const App: React.FC = () => {
  // 1. Initialize DB State first
  const [dbState, setDbState] = useState<AppDB>(() => {
      try {
          const data = getAllData();
          return {
              users: data?.users || [],
              transactions: data?.transactions || [],
              chatMessages: data?.chatMessages || [],
              notifications: data?.notifications || [],
              adminActionLogs: data?.adminActionLogs || [],
              platformSettings: data?.platformSettings || {} as any
          };
      } catch(e) {
          return { users: [], transactions: [], chatMessages: [], notifications: [], adminActionLogs: [], platformSettings: {} as any };
      }
  });

  // 2. Initialize Logged User from LocalStorage (Session Persistence)
  const [loggedUser, setLoggedUser] = useState<User | null>(() => {
      try {
          const storedUserId = localStorage.getItem('greennseven_session_user_id');
          if (storedUserId) {
              const data = getAllData();
              const user = data?.users?.find((u: User) => u.id === storedUserId);
              return user || null;
          }
      } catch (e) {
          console.error("Error restoring session", e);
      }
      return null;
  });

  // 3. Initialize View based on Session and URL Path
  const [view, setView] = useState<View>(() => {
      // Check session first
      const storedUserId = localStorage.getItem('greennseven_session_user_id');
      if (storedUserId) {
           const data = getAllData();
           const user = data?.users?.find((u: User) => u.id === storedUserId);
           if (user) {
               return user.isAdmin ? View.AdminDashboard : View.UserDashboard;
           }
      }

      // If no session, check URL path for routing
      const path = window.location.pathname;
      if (path === '/register') return View.Register;
      if (path === '/login') return View.Login;

      return View.Home;
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  
  // Dynamic Career Plan Rates State (loaded from Supabase)
  const [referralRates, setReferralRates] = useState<{[key:number]: number}>(REFERRAL_BONUS_RATES);

  // --- Notification System Logic ---
  const previousNotificationsCountRef = useRef(0);

  useEffect(() => {
      requestNotificationPermission();
  }, []);

  // Sync loggedUser with dbState updates (e.g. from Supabase background update)
  useEffect(() => {
      if (loggedUser) {
          const updatedUser = dbState.users.find(u => u.id === loggedUser.id);
          // Only update if the object reference is different (meaning it was updated in dbState)
          // Use JSON stringify to compare content, as object references change on every DB update
          if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(loggedUser)) {
              console.log("Syncing logged user with updated DB state...");
              setLoggedUser(updatedUser);
          }
      }
  }, [dbState.users, loggedUser]);

  // Watch for new notifications for the logged user and trigger "Push"
  useEffect(() => {
      if (!loggedUser) return;
      
      const userNotifications = dbState.notifications.filter(n => n.userId === loggedUser.id);
      
      // If we have more notifications than before, trigger the latest one
      if (userNotifications.length > previousNotificationsCountRef.current) {
          const latest = userNotifications[userNotifications.length - 1];
          
          // Ensure it's a fresh notification (created in the last 10 seconds) to avoid spam on reload
          const now = new Date().getTime();
          const notifTime = new Date(latest.date).getTime();
          
          if (now - notifTime < 10000 && !latest.isRead) {
               showSystemNotification('GreennSeven Invest', latest.message);
          }
      }
      
      previousNotificationsCountRef.current = userNotifications.length;
  }, [dbState.notifications, loggedUser]);


  useEffect(() => {
    if (dbState) {
        saveAllData(dbState);
    }
  }, [dbState]);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // --- FIX DE CONFLITO DE EMAIL/ID (Auto-Repair) ---
  useEffect(() => {
    if (!dbState?.users || dbState.users.length === 0) return;
    
    const admin = dbState.users.find(u => u.email === 'admin@greennseven.com' && u.isAdmin);
    
    if (admin) {
        syncUserToSupabase(admin, 'admin123').then(res => {
            if (res.resolvedId && res.resolvedId !== admin.id) {
                console.log(`[AUTO-FIX] Corrigindo ID do Admin: Local(${admin.id}) -> Remoto(${res.resolvedId})`);
                
                const oldId = admin.id;
                const newId = res.resolvedId;

                setDbState(prev => ({
                    ...prev,
                    users: prev.users.map(u => u.id === oldId ? { ...u, id: newId } : u),
                    transactions: prev.transactions.map(t => ({
                        ...t,
                        userId: t.userId === oldId ? newId : t.userId,
                        sourceUserId: t.sourceUserId === oldId ? newId : t.sourceUserId
                    })),
                    chatMessages: prev.chatMessages.map(m => ({
                        ...m,
                        senderId: m.senderId === oldId ? newId : m.senderId,
                        receiverId: m.receiverId === oldId ? newId : m.receiverId
                    })),
                    notifications: prev.notifications.map(n => ({
                        ...n,
                        userId: n.userId === oldId ? newId : n.userId
                    })),
                    adminActionLogs: prev.adminActionLogs.map(l => ({
                        ...l,
                        adminId: l.adminId === oldId ? newId : l.adminId
                    }))
                }));
                
                // Update session if it was the admin
                const currentSessionId = localStorage.getItem('greennseven_session_user_id');
                if (currentSessionId === oldId) {
                    localStorage.setItem('greennseven_session_user_id', newId);
                    setLoggedUser(prev => prev ? { ...prev, id: newId } : null);
                }
            }
        });
    }
  }, []);

  const loadRemoteData = async () => {
    try {
        // Fetch all data in parallel to reduce latency
        const [
            { data: remoteUsers },
            { data: remoteTxs },
            { data: remoteMessages },
            { data: remoteSettings },
            { data: remoteLogs },
            { data: remoteNotifications },
            { data: remoteCareerPlan }
        ] = await Promise.all([
            fetchUsersFromSupabase(),
            fetchTransactionsFromSupabase(),
            fetchMessagesFromSupabase(),
            fetchSettingsFromSupabase(),
            fetchAdminLogsFromSupabase(),
            fetchNotificationsFromSupabase(),
            // Safely call fetchCareerPlanConfig if it exists
            typeof fetchCareerPlanConfig === 'function' ? fetchCareerPlanConfig() : Promise.resolve({ data: null })
        ]);

        // Update career plan rates if available
        if (remoteCareerPlan && Object.keys(remoteCareerPlan).length > 0) {
            setReferralRates(remoteCareerPlan);
        }

        setDbState(prev => {
            let newState = { ...prev };
            
            // Only update if we actually got data back (avoiding overwrite with null on error)
            if (remoteUsers) newState.users = remoteUsers;
            if (remoteTxs) newState.transactions = remoteTxs;
            if (remoteMessages) newState.chatMessages = remoteMessages;
            if (remoteSettings) newState.platformSettings = remoteSettings;
            if (remoteLogs) newState.adminActionLogs = remoteLogs;
            if (remoteNotifications) newState.notifications = remoteNotifications;
            
            return newState;
        });
        return remoteUsers !== null;
    } catch (e) {
        console.error("Fatal error loading remote data", e);
        return false;
    }
  };

  useEffect(() => {
    // Initial load
    loadRemoteData();
    
    // Setup interval to refresh data periodically (fallback for redundancy)
    const interval = setInterval(loadRemoteData, 60000);

    // Supabase Realtime Subscription
    const channel = supabase.channel('global-changes')
        .on(
            'postgres_changes', 
            { event: '*', schema: 'public' }, 
            (payload) => {
                console.log('🔄 Realtime Update:', payload);
                loadRemoteData(); // Trigger fresh fetch on any DB change
            }
        )
        .subscribe();

    return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
    };
  }, []);
  
  // --- YIELD ACCUMULATION LOGIC ---
  // Checks if enough time has passed to accumulate daily profit into withdrawable balance
  useEffect(() => {
    if (!loggedUser) return;
    
    const processProfitAccumulation = () => {
        // Determine last update time safely
        const lastUpdateStr = loggedUser.lastProfitUpdate || loggedUser.joinedDate;
        if (!lastUpdateStr) return; // Sanity check

        const lastUpdate = new Date(lastUpdateStr);
        const now = new Date();
        
        // CRITICAL SAFETY CHECK: Guard against invalid dates (NaN) which cause infinite loops
        if (isNaN(lastUpdate.getTime())) {
            console.warn(`Invalid date detected for user ${loggedUser.id}. Yield accumulation skipped.`);
            return; 
        }

        const diffMs = now.getTime() - lastUpdate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // If at least 1 day passed and user is approved
        if (diffDays >= 1 && loggedUser.status === UserStatus.Approved) {
            const dailyProfit = (loggedUser.monthlyProfitUSD || 0) / 30;
            
            // Clamp diffDays to reasonable amount (e.g., max 30 days catch-up) to prevent massive jumps if user returns after a year
            const validDays = Math.min(diffDays, 60); 
            const profitToAdd = dailyProfit * validDays;
            
            const newAvailable = (loggedUser.dailyWithdrawableUSD || 0) + profitToAdd;
            
            // Advance time by exactly 'validDays' to keep cycle clean, or reset to now if gap was huge
            const daysMs = validDays * 24 * 60 * 60 * 1000;
            const newLastUpdate = new Date(lastUpdate.getTime() + daysMs).toISOString();

            const updatedUser = {
                ...loggedUser,
                dailyWithdrawableUSD: newAvailable,
                // Assuming yield also increases Total Balance if it's reinvested/compounded, 
                // but usually "Available" is a subset of "Total" or a separate bucket. 
                // Here we assume Total Balance represents (Capital + Accumulated Profit).
                balanceUSD: loggedUser.balanceUSD + profitToAdd,
                lastProfitUpdate: newLastUpdate
            };
            
            console.log(`Accumulating Profit for ${loggedUser.name}: ${validDays} days * ${dailyProfit} = ${profitToAdd}`);
            handleUpdateUser(updatedUser);
        }
    };
    
    processProfitAccumulation();
    // Check periodically while app is open (every minute)
    const interval = setInterval(processProfitAccumulation, 60000); 
    return () => clearInterval(interval);
  }, [loggedUser]); 

  const refreshData = async () => {
      const success = await loadRemoteData();
      if (success) {
          // Optional: Visual feedback handled in Header
      } else {
          console.warn("Falha ao atualizar dados em segundo plano (Modo Offline possível).");
      }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const { users = [], transactions = [], notifications = [], chatMessages = [], platformSettings, adminActionLogs } = dbState || {};
  
  const fallbackAdmin: User = {
      id: 'admin-fallback',
      name: 'Admin System',
      email: 'admin@greennseven.com',
      cpf: '', phone: '', address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
      documents: { idFrontUrl: '', idBackUrl: '', selfieUrl: '' },
      status: UserStatus.Approved,
      avatarUrl: 'https://via.placeholder.com/150',
      rank: InvestorRank.Diamond,
      balanceUSD: 0, capitalInvestedUSD: 0, monthlyProfitUSD: 0, dailyWithdrawableUSD: 0,
      isAdmin: true, joinedDate: new Date().toISOString(), referralCode: 'ADMIN', plan: 'Select'
  };
  
  const adminUser = (users && users.length > 0 ? users.find(u => u.isAdmin) : undefined) || fallbackAdmin;

  const handleLogin = (email: string, password?: string) => {
    if (!users) {
         alert("Sistema carregando, tente novamente em instantes.");
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
        localStorage.setItem('greennseven_session_user_id', userToLogin.id); // Persistence
        return true;
    }

    if (userToLogin.status === UserStatus.Pending) {
        alert("Sua conta está pendente de aprovação pelo administrador.");
        return false;
    }
    if (userToLogin.status === UserStatus.Rejected) {
        alert(`Sua conta foi rejeitada. Motivo: ${userToLogin.rejectionReason || 'Divergência de informações.'}. Por favor, entre em contato com o suporte.`);
        return false;
    }

    setLoggedUser(userToLogin);
    setView(View.UserDashboard);
    localStorage.setItem('greennseven_session_user_id', userToLogin.id); // Persistence
    return true;
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setView(View.Home);
    localStorage.removeItem('greennseven_session_user_id'); // Clear Session
    // Also clear URL path to avoid confusion
    window.history.pushState({}, '', '/');
  };

  const handleRegister = (userData: ExtendedRegisterData) => {
    let referredById: string | undefined = undefined;
    if (userData.referralCode && users) {
        const referrer = users.find(u => u.referralCode === userData.referralCode);
        if (referrer) {
            referredById = referrer.id;
        }
    }

    const newUser: User = {
        id: faker.string.uuid(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        cpf: userData.cpf,
        phone: userData.phone,
        address: userData.address,
        documents: userData.documents,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=00FF9C&color=000`,
        rank: InvestorRank.Bronze,
        balanceUSD: 0,
        capitalInvestedUSD: 0,
        monthlyProfitUSD: 0,
        dailyWithdrawableUSD: 0,
        isAdmin: false,
        joinedDate: new Date().toISOString().split('T')[0],
        referralCode: `${userData.name.split(' ')[0].toUpperCase()}${faker.string.numeric(4)}`,
        referredById: referredById,
        status: UserStatus.Pending,
        plan: 'Conservador', 
    };
    
    // Create notification for Admin
    const adminNotification: Notification = {
        id: faker.string.uuid(),
        userId: adminUser.id,
        message: `Novo usuário registrado: ${newUser.name}. Pendente de aprovação.`,
        date: new Date().toISOString(),
        isRead: false
    };

    setDbState(prev => ({
        ...prev, 
        users: [...prev.users, newUser],
        notifications: [...prev.notifications, adminNotification]
    }));

    syncUserToSupabase(newUser, userData.password);
    syncNotificationToSupabase(adminNotification);
  };

  const handleAddAdminLog = (adminUser: User, actionType: AdminActionType, description: string, targetId?: string) => {
    const newLog: AdminActionLog = {
      id: faker.string.uuid(),
      timestamp: new Date().toISOString(),
      adminId: adminUser.id,
      adminName: adminUser.name,
      actionType,
      description,
      targetId,
    };
    setDbState(prev => ({ ...prev, adminActionLogs: [newLog, ...prev.adminActionLogs] }));
    syncAdminLogToSupabase(newLog);
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => {
    const tx: Transaction = {
        ...newTransaction,
        id: faker.string.uuid(),
        date: new Date().toISOString().split('T')[0],
        bonusPayoutHandled: false,
    };
    
    if (tx.type === TransactionType.Withdrawal) {
      const withdrawalAmount = Math.abs(tx.amountUSD);
      const now = new Date();
      const currentHour = now.getHours();
      // Logic for withdrawal hours
      if (currentHour < 9 || currentHour >= 18) {
          // Warning but generally allowed to queue
      }

      const today = tx.date;
      const hasWithdrawalToday = dbState.transactions.some(t => 
          t.userId === loggedUser?.id && 
          t.type === TransactionType.Withdrawal && 
          t.date === today &&
          t.status !== TransactionStatus.Failed
      );

      if (hasWithdrawalToday) {
          alert("Você já solicitou um saque hoje. O limite é de 1 solicitação diária.");
          return;
      }

      if (tx.userId === loggedUser?.id && loggedUser) {
          const dailyLimit = loggedUser.dailyWithdrawableUSD || 0;
          if (withdrawalAmount > dailyLimit + 0.01) { // Adding small buffer for floating point
            alert(`Erro: Valor superior ao saldo disponível para saque (${formatCurrency(dailyLimit, 'USD')}).`);
            return;
          }
      }
    }
    
    // Admin Notification
    const adminNotif: Notification = {
        id: faker.string.uuid(),
        userId: adminUser.id,
        message: `Nova transação de ${tx.type} solicitada por ${users.find(u => u.id === tx.userId)?.name}.`,
        date: new Date().toISOString(),
        isRead: false
    };

    syncTransactionToSupabase(tx);
    syncNotificationToSupabase(adminNotif);
    setDbState(prev => ({ 
        ...prev, 
        transactions: [...prev.transactions, tx],
        notifications: [...prev.notifications, adminNotif]
    }));
  };

  const handleUpdateTransactionStatus = (transactionId: string, newStatus: TransactionStatus) => {
    const tx = dbState.transactions.find(t => t.id === transactionId);
    if (!tx) return;
    
    // SAFETY CHECK: Prevent double processing
    if (tx.status === newStatus) return;
    if (tx.status === TransactionStatus.Completed) {
        alert("Esta transação já foi finalizada e o saldo processado.");
        return;
    }

    const user = dbState.users.find(u => u.id === tx.userId);
    if (!user || !loggedUser?.isAdmin) return;

    const actionType = newStatus === TransactionStatus.Completed ? AdminActionType.TransactionApprove : AdminActionType.TransactionReject;
    const description = `${newStatus === TransactionStatus.Completed ? 'Aprovou' : 'Rejeitou'} transação de ${tx.type} no valor de ${formatCurrency(Math.abs(tx.amountUSD), 'USD')} para ${user.name}.`;
    handleAddAdminLog(loggedUser, actionType, description, transactionId);

    // ---------------- Notification Logic ----------------
    const notification: Notification = {
        id: faker.string.uuid(),
        userId: user.id,
        message: `Sua transação de ${tx.type} no valor de ${formatCurrency(Math.abs(tx.amountUSD), 'USD')} foi atualizada para: ${newStatus === TransactionStatus.Completed ? 'APROVADA' : 'REJEITADA'}.`,
        date: new Date().toISOString(),
        isRead: false
    };
    // ----------------------------------------------------

    let bonusTransactions: Transaction[] = [];
    let referrersToUpdate: User[] = [];
    let shouldPayBonus = false;

    if (tx.type === TransactionType.Deposit && newStatus === TransactionStatus.Completed && !tx.bonusPayoutHandled) {
        shouldPayBonus = true;
        let currentUser = user;
        
        for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
            const referrer = dbState.users.find(u => u.id === currentUser.referredById);
            if (!referrer) break;

            const bonusRate = referralRates[level] || 0;
            if (bonusRate === 0) continue;
            
            const bonusAmount = tx.amountUSD * bonusRate;

            const bonusTx: Transaction = {
                id: faker.string.uuid(),
                userId: referrer.id,
                date: new Date().toISOString().split('T')[0],
                type: TransactionType.Bonus,
                status: TransactionStatus.Completed,
                amountUSD: bonusAmount,
                referralLevel: level as 1 | 2 | 3,
                sourceUserId: user.id,
                bonusPayoutHandled: true,
            };
            
            bonusTransactions.push(bonusTx);
            syncTransactionToSupabase(bonusTx);
            
            const newBalance = referrer.balanceUSD + bonusAmount;
            const updatedReferrer = { 
                ...referrer, 
                balanceUSD: newBalance,
                monthlyProfitUSD: calculateProfit(newBalance, referrer.plan),
                rank: calculateRank(newBalance)
            };
            syncUserToSupabase(updatedReferrer);
            referrersToUpdate.push(updatedReferrer);

            currentUser = referrer;
        }
    }
    
    const updatedTx = { ...tx, status: newStatus, bonusPayoutHandled: shouldPayBonus ? true : tx.bonusPayoutHandled };
    syncTransactionToSupabase(updatedTx);

    const updatedTransactions = dbState.transactions.map(t => t.id === transactionId ? updatedTx : t);

    let updatedUsers = [...dbState.users];
    
    updatedUsers = updatedUsers.map(u => {
        if (u.id === user.id) {
            if (newStatus === TransactionStatus.Completed) {
                let newBalance = u.balanceUSD;
                let newInvested = u.capitalInvestedUSD;
                let newDailyWithdrawable = u.dailyWithdrawableUSD || 0;

                if (tx.type === TransactionType.Deposit) {
                    newBalance += tx.amountUSD;
                    newInvested += tx.amountUSD;
                } else if (tx.type === TransactionType.Withdrawal) {
                     // Deduction logic
                     newBalance += tx.amountUSD; // amountUSD is negative for withdrawals
                     
                     // Also deduct from daily withdrawable bucket
                     newDailyWithdrawable += tx.amountUSD; 
                     if (newDailyWithdrawable < 0) newDailyWithdrawable = 0;
                }
                
                const updated = { 
                    ...u, 
                    balanceUSD: newBalance, 
                    capitalInvestedUSD: newInvested,
                    dailyWithdrawableUSD: newDailyWithdrawable,
                    rank: calculateRank(newBalance),
                    monthlyProfitUSD: calculateProfit(newBalance, u.plan)
                };
                syncUserToSupabase(updated);
                return updated;
            }
        }
        return u;
    });

    referrersToUpdate.forEach(ref => {
        updatedUsers = updatedUsers.map(u => u.id === ref.id ? ref : u);
    });
    
    // Aggregate all new notifications (Transaction Status + Bonus)
    const newNotifications = [notification];
    if (bonusTransactions.length > 0) {
         bonusTransactions.forEach(btx => {
             const refName = dbState.users.find(u => u.id === btx.sourceUserId)?.name || 'Indicado';
             newNotifications.push({
                id: faker.string.uuid(),
                userId: btx.userId,
                message: `Bônus de indicação recebido: ${formatCurrency(btx.amountUSD, 'USD')} (Origem: ${refName})`,
                date: new Date().toISOString(),
                isRead: false
             });
         });
    }

    setDbState(prev => ({
        ...prev,
        transactions: [...updatedTransactions, ...bonusTransactions],
        users: updatedUsers,
        notifications: [...prev.notifications, ...newNotifications]
    }));
    
    syncNotificationsToSupabase(newNotifications);
  };

  const handlePayoutBonus = (depositTx: Transaction) => {
      if (depositTx.bonusPayoutHandled) {
          alert("Bônus já processado.");
          return;
      }

      let bonusTransactions: Transaction[] = [];
      let newNotifications: Notification[] = [];
      let referrersToUpdate: User[] = [];
      let currentUser = dbState.users.find(u => u.id === depositTx.userId);
      if (!currentUser) return;

      for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
          const referrer = dbState.users.find(u => u.id === currentUser.referredById);
          if (!referrer) break;

          const bonusRate = referralRates[level] || 0;
          if (bonusRate === 0) continue;

          const bonusAmount = depositTx.amountUSD * bonusRate;

          const bonusTx: Transaction = {
              id: faker.string.uuid(),
              userId: referrer.id,
              date: new Date().toISOString().split('T')[0],
              type: TransactionType.Bonus,
              status: TransactionStatus.Completed,
              amountUSD: bonusAmount,
              referralLevel: level as 1 | 2 | 3,
              sourceUserId: depositTx.userId,
              bonusPayoutHandled: true,
          };
          
          bonusTransactions.push(bonusTx);
          syncTransactionToSupabase(bonusTx);
          
          // Create notification
          newNotifications.push({
              id: faker.string.uuid(),
              userId: referrer.id,
              message: `Você recebeu um bônus manual de ${formatCurrency(bonusAmount, 'USD')}!`,
              date: new Date().toISOString(),
              isRead: false
          });

          const newBalance = referrer.balanceUSD + bonusAmount;
          const updatedReferrer = { 
              ...referrer, 
              balanceUSD: newBalance,
              monthlyProfitUSD: calculateProfit(newBalance, referrer.plan),
              rank: calculateRank(newBalance)
            };
          syncUserToSupabase(updatedReferrer);
          referrersToUpdate.push(updatedReferrer);
          currentUser = referrer;
      }
      
      const updatedDepositTx = { ...depositTx, bonusPayoutHandled: true };
      syncTransactionToSupabase(updatedDepositTx);
      
      setDbState(prev => ({
          ...prev,
          users: prev.users.map(u => {
              const ref = referrersToUpdate.find(r => r.id === u.id);
              return ref || u;
          }),
          transactions: prev.transactions.map(t => t.id === depositTx.id ? updatedDepositTx : t).concat(bonusTransactions),
          notifications: [...prev.notifications, ...newNotifications]
      }));
      
      if (loggedUser) {
        handleAddAdminLog(loggedUser, AdminActionType.BonusPayout, `Pagamento manual de bônus para o depósito de ${currentUser?.name}.`, depositTx.id);
      }
      syncNotificationsToSupabase(newNotifications);
      alert("Bônus repassados com sucesso!");
  };

  const handleUpdateUserStatus = (userId: string, newStatus: UserStatus, reason?: string) => {
      const updatedUsers = dbState.users.map(u => {
          if (u.id === userId) {
              const updated = { ...u, status: newStatus, rejectionReason: reason };
              syncUserToSupabase(updated);
              return updated;
          }
          return u;
      });
      
      let notification: Notification | null = null;
      
      if (newStatus !== UserStatus.Pending && loggedUser) {
           const actionType = newStatus === UserStatus.Approved ? AdminActionType.UserApprove : AdminActionType.UserReject;
           const description = `${newStatus === UserStatus.Approved ? 'Aprovou' : 'Rejeitou'} o cadastro do usuário ${dbState.users.find(u => u.id === userId)?.name}.`;
           handleAddAdminLog(loggedUser, actionType, description, userId);
           
           // Create Notification
           notification = {
               id: faker.string.uuid(),
               userId: userId,
               message: newStatus === UserStatus.Approved 
                    ? "Parabéns! Sua conta foi APROVADA. Você já pode realizar depósitos."
                    : `Sua conta foi REJEITADA. Motivo: ${reason}`,
               date: new Date().toISOString(),
               isRead: false
           };
      }
      
      setDbState(prev => ({ 
          ...prev, 
          users: updatedUsers,
          notifications: notification ? [...prev.notifications, notification] : prev.notifications
      }));
      if (notification) syncNotificationToSupabase(notification);
  };

  const handleAdminUpdateUserBalance = (userId: string, newBalance: number) => {
      const updatedUsers = dbState.users.map(u => {
          if (u.id === userId) {
               const updated = { 
                   ...u, 
                   balanceUSD: newBalance, 
                   rank: calculateRank(newBalance),
                   monthlyProfitUSD: calculateProfit(newBalance, u.plan)
               };
               syncUserToSupabase(updated);
               return updated;
          }
          return u;
      });
      
      const user = dbState.users.find(u => u.id === userId);
      if (loggedUser) {
        handleAddAdminLog(loggedUser, AdminActionType.UserBalanceEdit, `Alterou o saldo de ${user?.name} para ${formatCurrency(newBalance, 'USD')}.`, userId);
      }
      
      // Notify User
      const notif: Notification = {
          id: faker.string.uuid(),
          userId: userId,
          message: `Seu saldo foi atualizado manualmente pelo administrador para ${formatCurrency(newBalance, 'USD')}.`,
          date: new Date().toISOString(),
          isRead: false
      };

      setDbState(prev => ({ ...prev, users: updatedUsers, notifications: [...prev.notifications, notif] }));
      syncNotificationToSupabase(notif);
  };

  const handleBroadcastNotification = (message: string) => {
      // Create a notification for EVERY non-admin user
      const newNotifications: Notification[] = users
          .filter(u => !u.isAdmin)
          .map(u => ({
              id: faker.string.uuid(),
              userId: u.id,
              message: message,
              date: new Date().toISOString(),
              isRead: false
          }));
      
      setDbState(prev => ({
          ...prev,
          notifications: [...prev.notifications, ...newNotifications]
      }));
      
      if (loggedUser) {
         handleAddAdminLog(loggedUser, AdminActionType.SettingsUpdate, `Enviou notificação global: "${message}"`);
      }
      syncNotificationsToSupabase(newNotifications);
      alert("Notificação enviada para todos os usuários.");
  };

  const handleSendMessage = async (senderId: string, receiverId: string, text: string, attachment?: File) => {
      let attachmentData = undefined;

      if (attachment) {
          const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = error => reject(error);
          });

          try {
              const base64Url = await toBase64(attachment);
              attachmentData = {
                  fileName: attachment.name,
                  fileUrl: base64Url,
                  fileType: attachment.type
              };
          } catch (e) {
              console.error("Error converting file to base64", e);
              alert("Erro ao processar o arquivo. Tente novamente.");
              return; 
          }
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
      
      syncMessageToSupabase(newMessage);
      setDbState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage] }));

      // --- NOTIFICATION LOGIC START ---
      const sender = dbState.users.find(u => u.id === senderId);
      if (sender) {
          let notification: Notification | null = null;

          if (sender.isAdmin) {
              // Admin sent message -> Notify User
              notification = {
                  id: faker.string.uuid(),
                  userId: receiverId,
                  message: `💬 Suporte: Nova mensagem recebida.`,
                  date: new Date().toISOString(),
                  isRead: false
              };
          } else {
              // User sent message -> Notify Admin (receiverId here is admin's ID)
              notification = {
                  id: faker.string.uuid(),
                  userId: receiverId, 
                  message: `💬 Suporte: ${sender.name} enviou uma mensagem.`,
                  date: new Date().toISOString(),
                  isRead: false
              };
          }

          if (notification) {
              syncNotificationToSupabase(notification);
              setDbState(prev => ({
                  ...prev,
                  notifications: [...prev.notifications, notification]
              }));
          }
      }
      // --- NOTIFICATION LOGIC END ---
  };
  
  const handleMarkAllNotificationsAsRead = () => {
      if (!loggedUser) return;
      const updatedNotifications = dbState.notifications.map(n => 
          n.userId === loggedUser.id ? { ...n, isRead: true } : n
      );
      setDbState(prev => ({ ...prev, notifications: updatedNotifications }));
      
      // Sync changes
      const userNotifs = updatedNotifications.filter(n => n.userId === loggedUser.id);
      syncNotificationsToSupabase(userNotifs);
  };

  const handleUpdateSettings = (newSettings: PlatformSettings) => {
      if (!loggedUser?.isAdmin) return;
      setDbState(prev => ({ ...prev, platformSettings: newSettings }));
      handleAddAdminLog(loggedUser, AdminActionType.SettingsUpdate, "Atualizou as configurações da plataforma.");
      syncSettingsToSupabase(newSettings);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      setDbState(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      }));
      if (loggedUser?.id === updatedUser.id) {
          setLoggedUser(updatedUser);
      }
      syncUserToSupabase(updatedUser);
  };

  const handleUpdatePassword = (userId: string, newPassword: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          const updatedUser = { ...user, password: newPassword };
          handleUpdateUser(updatedUser);
          syncUserToSupabase(updatedUser, newPassword).then(res => {
              if (res.error) alert("Erro ao atualizar senha.");
              else alert("Senha de login atualizada com sucesso!");
          });
      }
  };

  let content;
  if (view === View.Home) {
      content = <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} />;
  } else if (view === View.Login) {
      content = <LoginPage setView={setView} onLogin={handleLogin} language={language} setLanguage={handleSetLanguage} />;
  } else if (view === View.Register) {
      content = <RegisterPage setView={setView} onRegister={handleRegister} language={language} setLanguage={handleSetLanguage} />;
  } else if (view === View.ForgotPassword) {
      content = <ForgotPasswordPage setView={setView} language={language} setLanguage={handleSetLanguage} />;
  } else if (view === View.UserDashboard && loggedUser) {
      content = <UserDashboard 
                    user={loggedUser} 
                    adminUser={adminUser}
                    transactions={transactions.filter(t => t.userId === loggedUser.id)}
                    allUsers={users}
                    allTransactions={transactions}
                    notifications={notifications.filter(n => n.userId === loggedUser.id)}
                    chatMessages={chatMessages}
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
                    onRefreshData={refreshData}
                />;
  } else if (view === View.AdminDashboard && loggedUser?.isAdmin) {
      content = <AdminDashboard 
                    user={loggedUser}
                    allUsers={users}
                    allTransactions={transactions}
                    chatMessages={chatMessages}
                    platformSettings={platformSettings}
                    adminActionLogs={adminActionLogs}
                    notifications={notifications.filter(n => n.userId === loggedUser.id)}
                    onLogout={handleLogout}
                    onUpdateTransaction={handleUpdateTransactionStatus}
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
                    onRefreshData={refreshData}
                    onBroadcastNotification={handleBroadcastNotification}
                    referralRates={referralRates}
                />;
  } else {
      content = <HomePage setView={setView} language={language} setLanguage={handleSetLanguage} />;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white`}>
        {content}
    </div>
  );
};

export default App;