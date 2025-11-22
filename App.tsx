
import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage, PlatformSettings, AdminActionLog, Language } from './types';
import { View, TransactionStatus, TransactionType, AdminActionType, UserStatus, InvestorRank } from './types';
import { REFERRAL_BONUS_RATES, INVESTMENT_PLANS } from './constants';
import { initializeDB, getAllData, saveAllData, type AppDB } from './lib/db';
import { syncUserToSupabase, syncTransactionToSupabase, syncMessageToSupabase, fetchUsersFromSupabase, fetchTransactionsFromSupabase, fetchMessagesFromSupabase } from './lib/supabase';
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

// Helper to calculate monthly profit based on current balance and plan
const calculateProfit = (balance: number, planName: string = 'Conservador'): number => {
    const plan = INVESTMENT_PLANS.find(p => p.name.toLowerCase() === planName.toLowerCase()) || INVESTMENT_PLANS[0];
    return balance * plan.returnRate;
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Home);
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  
  // Centralized state for the entire application, loaded from our DB service
  const [dbState, setDbState] = useState<AppDB>(() => {
      try {
          const data = getAllData();
          // Safe check to ensure arrays exist
          return {
              users: data?.users || [],
              transactions: data?.transactions || [],
              chatMessages: data?.chatMessages || [],
              notifications: data?.notifications || [],
              adminActionLogs: data?.adminActionLogs || [],
              platformSettings: data?.platformSettings || {} as any
          };
      } catch(e) {
          // Emergency fallback if DB init fails completely
          return { users: [], transactions: [], chatMessages: [], notifications: [], adminActionLogs: [], platformSettings: {} as any };
      }
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (dbState) {
        saveAllData(dbState);
    }
  }, [dbState]);

  // Handle Theme
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load language from localStorage
  useEffect(() => {
      const savedLang = localStorage.getItem('app_language') as Language;
      if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
          setLanguage(savedLang);
      }
  }, []);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
  }

  // Automatically sync Admin user to Supabase on load to ensure connection
  useEffect(() => {
    if (!dbState?.users || dbState.users.length === 0) return;
    const admin = dbState.users.find(u => u.isAdmin);
    if (admin) {
        // Sync admin with default password to ensure they exist in cloud DB
        syncUserToSupabase(admin, 'admin123').then(res => {
            if (res.error) {
                console.error("Erro ao conectar Admin ao Supabase:", JSON.stringify(res.error, null, 2));
            } else {
                console.log("Admin conectado ao Supabase com sucesso.");
            }
        });
    }
  }, []); 

  const loadRemoteData = async () => {
    console.log("Carregando dados do Supabase...");
    
    try {
        const { data: remoteUsers, error: userError } = await fetchUsersFromSupabase();
        const { data: remoteTxs, error: txError } = await fetchTransactionsFromSupabase();
        const { data: remoteMessages, error: msgError } = await fetchMessagesFromSupabase();

        setDbState(prev => {
            let newState = { ...prev };
            
            // Only update if data is not null. If it's null, it means connection failed.
            // If it's an empty array [], it means the DB is empty, which is a valid state.
            if (remoteUsers !== null) {
                console.log(`${remoteUsers.length} usuários carregados do Supabase.`);
                newState.users = remoteUsers;
            } else if (userError) {
                 console.error("Erro ao carregar usuários do Supabase:", JSON.stringify(userError, null, 2));
            }

            if (remoteTxs !== null) {
                newState.transactions = remoteTxs;
            } else if (txError) {
                 console.error("Erro ao carregar transações do Supabase:", JSON.stringify(txError, null, 2));
            }

            if (remoteMessages !== null) {
                 newState.chatMessages = remoteMessages;
            } else if (msgError) {
                 console.error("Erro ao carregar mensagens do Supabase:", JSON.stringify(msgError, null, 2));
            }
            
            return newState;
        });

        // Return true if at least users loaded successfully
        return remoteUsers !== null;
    } catch (e) {
        console.error("Fatal error loading remote data", e);
        return false;
    }
  };

  // Fetch Data from Supabase on Mount
  useEffect(() => {
    loadRemoteData();
  }, []);
  
  const refreshData = async () => {
      const success = await loadRemoteData();
      if (success) {
          alert("Dados atualizados com sucesso!");
      } else {
          alert("Falha ao atualizar dados. Verifique a conexão.");
      }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  // Safe destructuring with defaults to prevent crashes
  const { users = [], transactions = [], notifications = [], chatMessages = [], platformSettings, adminActionLogs } = dbState || {};
  
  // ROBUST FALLBACK ADMIN to prevent crashes when users list is empty or loading
  const fallbackAdmin: User = {
      id: 'admin-fallback',
      name: 'Admin System',
      email: 'admin@system.com',
      cpf: '', phone: '', address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
      documents: { idFrontUrl: '', idBackUrl: '', selfieUrl: '' },
      status: UserStatus.Approved,
      avatarUrl: 'https://via.placeholder.com/150',
      rank: InvestorRank.Diamond,
      balanceUSD: 0, capitalInvestedUSD: 0, monthlyProfitUSD: 0, dailyWithdrawableUSD: 0,
      isAdmin: true, joinedDate: new Date().toISOString(), referralCode: 'ADMIN', plan: 'Select'
  };
  
  // Ensure adminUser is never undefined, even if users array is empty
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

    // Password Check Logic
    if (password) {
         if (userToLogin.password && userToLogin.password !== password) {
             alert("Senha incorreta. Tente novamente.");
             return false;
         }
    } else {
        // If no password provided but user has one (shouldn't happen with form validation)
        if (userToLogin.password) {
            alert("Senha obrigatória.");
            return false;
        }
    }

    if (userToLogin.isAdmin) {
        setLoggedUser(userToLogin);
        setView(View.AdminDashboard);
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
    return true;
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setView(View.Home);
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
        password: userData.password, // Store the password from registration
        cpf: userData.cpf,
        phone: userData.phone,
        address: userData.address,
        documents: userData.documents,
        // Changed to use initials instead of random face
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
    
    setDbState(prev => ({...prev, users: [...prev.users, newUser]}));

    syncUserToSupabase(newUser, userData.password).then((result) => {
        if (result.error) {
            console.error("Erro ao registrar usuário no Supabase:", JSON.stringify(result.error, null, 2));
        } else {
            console.log("Novo usuário sincronizado com Supabase:", newUser.email);
        }
    });
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
      
      // 1. Time Check (09:00 - 18:00)
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour < 9 || currentHour >= 18) {
          alert("Solicitações de saque são permitidas apenas entre 09:00 e 18:00.");
          return;
      }

      // 2. Frequency Check (1 per day)
      const today = tx.date; // Already formatted as YYYY-MM-DD
      const hasWithdrawalToday = dbState.transactions.some(t => 
          t.userId === loggedUser?.id && 
          t.type === TransactionType.Withdrawal && 
          t.date === today &&
          t.status !== TransactionStatus.Failed // Allow retry if previous attempt failed
      );

      if (hasWithdrawalToday) {
          alert("Você já solicitou um saque hoje. O limite é de 1 solicitação diária.");
          return;
      }

      if (tx.userId === loggedUser?.id && loggedUser) {
          // Check daily limit based on Plan (Monthly Profit / 30)
          const dailyLimit = (loggedUser.monthlyProfitUSD / 30);
          
          if (withdrawalAmount > dailyLimit) {
            alert(`Erro: Valor superior ao limite diário de saque (US$ ${dailyLimit.toFixed(2)}).`);
            return;
          }
          
          setDbState(prev => ({
              ...prev,
              transactions: [...prev.transactions, tx]
          }));

          syncTransactionToSupabase(tx).then((result) => {
             if (result.error) {
                console.error("Erro ao salvar transação no Supabase:", JSON.stringify(result.error, null, 2));
            }
          });
          return;
      }
    }

    syncTransactionToSupabase(tx).then((result) => {
         if (result.error) {
            console.error("Erro ao salvar transação no Supabase:", JSON.stringify(result.error, null, 2));
        }
    });
    setDbState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
  };

  const handleUpdateTransactionStatus = (transactionId: string, newStatus: TransactionStatus) => {
    const tx = dbState.transactions.find(t => t.id === transactionId);
    if (!tx) return;
    const user = dbState.users.find(u => u.id === tx.userId);
    if (!user || !loggedUser?.isAdmin) return;

    const actionType = newStatus === TransactionStatus.Completed ? AdminActionType.TransactionApprove : AdminActionType.TransactionReject;
    const description = `${newStatus === TransactionStatus.Completed ? 'Aprovou' : 'Rejeitou'} transação de ${tx.type} no valor de US$ ${Math.abs(tx.amountUSD).toFixed(2)} para ${user.name}.`;
    handleAddAdminLog(loggedUser, actionType, description, transactionId);

    let bonusTransactions: Transaction[] = [];
    let referrersToUpdate: User[] = [];
    let shouldPayBonus = false;

    if (tx.type === TransactionType.Deposit && newStatus === TransactionStatus.Completed && !tx.bonusPayoutHandled) {
        shouldPayBonus = true;
        let currentUser = user;
        
        for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
            const referrer = dbState.users.find(u => u.id === currentUser.referredById);
            if (!referrer) break;

            const bonusRateKey = level as keyof typeof REFERRAL_BONUS_RATES;
            const bonusRate = REFERRAL_BONUS_RATES[bonusRateKey];
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

                if (tx.type === TransactionType.Deposit) {
                    newBalance += tx.amountUSD;
                    newInvested += tx.amountUSD;
                } else if (tx.type === TransactionType.Withdrawal) {
                     newBalance += tx.amountUSD; 
                }
                
                const updated = { 
                    ...u, 
                    balanceUSD: newBalance, 
                    capitalInvestedUSD: newInvested,
                    rank: calculateRank(newBalance),
                    monthlyProfitUSD: calculateProfit(newBalance, u.plan)
                };
                syncUserToSupabase(updated);
                return updated;
            } else if (newStatus === TransactionStatus.Failed && tx.type === TransactionType.Withdrawal) {
                const updated = { ...u };
                syncUserToSupabase(updated);
                return updated;
            }
        }
        return u;
    });

    referrersToUpdate.forEach(ref => {
        updatedUsers = updatedUsers.map(u => u.id === ref.id ? ref : u);
    });

    setDbState(prev => ({
        ...prev,
        transactions: [...updatedTransactions, ...bonusTransactions],
        users: updatedUsers
    }));
  };

  const handlePayoutBonus = (depositTx: Transaction) => {
      if (depositTx.bonusPayoutHandled) {
          alert("Bônus já processado.");
          return;
      }

      let bonusTransactions: Transaction[] = [];
      let referrersToUpdate: User[] = [];
      let currentUser = dbState.users.find(u => u.id === depositTx.userId);
      if (!currentUser) return;

      for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
          const referrer = dbState.users.find(u => u.id === currentUser.referredById);
          if (!referrer) break;

          const bonusRateKey = level as keyof typeof REFERRAL_BONUS_RATES;
          const bonusRate = REFERRAL_BONUS_RATES[bonusRateKey];
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
          transactions: prev.transactions.map(t => t.id === depositTx.id ? updatedDepositTx : t).concat(bonusTransactions)
      }));
      
      if (loggedUser) {
        handleAddAdminLog(loggedUser, AdminActionType.BonusPayout, `Pagamento manual de bônus para o depósito de ${currentUser?.name}.`, depositTx.id);
      }
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
      
      if (newStatus !== UserStatus.Pending && loggedUser) {
           const actionType = newStatus === UserStatus.Approved ? AdminActionType.UserApprove : AdminActionType.UserReject;
           const description = `${newStatus === UserStatus.Approved ? 'Aprovou' : 'Rejeitou'} o cadastro do usuário ${dbState.users.find(u => u.id === userId)?.name}.`;
           handleAddAdminLog(loggedUser, actionType, description, userId);
      }
      
      setDbState(prev => ({ ...prev, users: updatedUsers }));
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
        handleAddAdminLog(loggedUser, AdminActionType.UserBalanceEdit, `Alterou o saldo de ${user?.name} para US$ ${newBalance.toFixed(2)}.`, userId);
      }

      setDbState(prev => ({ ...prev, users: updatedUsers }));
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
      
      // Save to Supabase
      syncMessageToSupabase(newMessage).then(res => {
          if (res.error) {
              console.error("Failed to sync message to Supabase:", res.error);
          }
      });

      setDbState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage] }));
  };
  
  const handleMarkAllNotificationsAsRead = () => {
      if (!loggedUser) return;
      const updatedNotifications = dbState.notifications.map(n => 
          n.userId === loggedUser.id ? { ...n, isRead: true } : n
      );
      setDbState(prev => ({ ...prev, notifications: updatedNotifications }));
  };

  const handleUpdateSettings = (newSettings: PlatformSettings) => {
      if (!loggedUser?.isAdmin) return;
      setDbState(prev => ({ ...prev, platformSettings: newSettings }));
      handleAddAdminLog(loggedUser, AdminActionType.SettingsUpdate, "Atualizou as configurações da plataforma.");
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
          // Update local user state first
          const updatedUser = { ...user, password: newPassword };
          handleUpdateUser(updatedUser);

          syncUserToSupabase(updatedUser, newPassword).then(res => {
              if (res.error) {
                  console.error("Erro ao atualizar senha:", res.error);
                  alert("Erro ao atualizar senha. Tente novamente.");
              } else {
                  alert("Senha de login atualizada com sucesso!");
              }
          });
      }
  };

  let content;
  if (view === View.Home) {
      content = <HomePage setView={setView} />;
  } else if (view === View.Login) {
      content = <LoginPage setView={setView} onLogin={handleLogin} />;
  } else if (view === View.Register) {
      content = <RegisterPage setView={setView} onRegister={handleRegister} />;
  } else if (view === View.ForgotPassword) {
      content = <ForgotPasswordPage setView={setView} />;
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
                    onLogout={handleLogout}
                    onUpdateTransaction={handleUpdateTransactionStatus}
                    onUpdateUserStatus={handleUpdateUserStatus}
                    onPayoutBonus={handlePayoutBonus}
                    onSendMessage={handleSendMessage}
                    onUpdateSettings={handleUpdateSettings}
                    onAdminUpdateUserBalance={handleAdminUpdateUserBalance}
                    onUpdateUser={handleUpdateUser}
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    language={language}
                    setLanguage={handleSetLanguage}
                    onRefreshData={refreshData}
                />;
  } else {
      content = <HomePage setView={setView} />;
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white`}>
        {content}
    </div>
  );
};

export default App;
