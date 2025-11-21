
import React, { useState, useEffect } from 'react';
import type { User, Transaction, Notification, ChatMessage, PlatformSettings, AdminActionLog } from './types';
import { View, TransactionStatus, TransactionType, AdminActionType, UserStatus, InvestorRank } from './types';
import { REFERRAL_BONUS_RATES, INVESTMENT_PLANS } from './constants';
import { initializeDB, getAllData, saveAllData, type AppDB } from './lib/db';
import { syncUserToSupabase, syncTransactionToSupabase } from './lib/supabase';
import { faker } from '@faker-js/faker';

import HomePage from './components/views/HomePage';
import LoginPage from './components/views/LoginPage';
import RegisterPage from './components/views/RegisterPage';
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
  
  // Centralized state for the entire application, loaded from our DB service
  const [dbState, setDbState] = useState<AppDB>(getAllData());

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    saveAllData(dbState);
  }, [dbState]);

  // Handle Theme
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Automatically sync Admin user to Supabase on load to ensure connection
  useEffect(() => {
    const admin = dbState.users.find(u => u.isAdmin);
    if (admin) {
        console.log("Tentando conectar Admin ao Supabase...");
        // Sync admin with default password to ensure they exist in cloud DB
        syncUserToSupabase(admin, 'admin123').then(res => {
            if(!res.error) console.log("Admin conectado ao Supabase com sucesso.");
        });
    }
  }, []); // Empty dependency array = run once on mount

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  
  const { users, transactions, notifications, chatMessages, platformSettings, adminActionLogs } = dbState;
  // Ensure there is an admin user for props, though logic handles it
  const adminUser = users.find(u => u.isAdmin) || users[0]; 

  const handleLogin = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const userToLogin = users.find(u => u.email.toLowerCase() === cleanEmail);
    
    if (!userToLogin) {
        alert("Email ou senha incorretos.");
        return false;
    }

    if (userToLogin.isAdmin) {
        setLoggedUser(userToLogin);
        setView(View.AdminDashboard);
        return true;
    }

    // Regular user checks
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

  const handleRegister = (simpleUserData: { name: string; email: string; password?: string; referralCode?: string }) => {
    // Find referrer if code is provided
    let referredById: string | undefined = undefined;
    if (simpleUserData.referralCode) {
        const referrer = users.find(u => u.referralCode === simpleUserData.referralCode);
        if (referrer) {
            referredById = referrer.id;
        }
    }

    const newUser: User = {
        id: faker.string.uuid(),
        name: simpleUserData.name,
        email: simpleUserData.email,
        // Filling required fields with placeholders since we simplified the form
        cpf: 'Não informado',
        phone: 'Não informado',
        address: {
            cep: '00000-000',
            street: 'Endereço não informado',
            number: 'S/N',
            neighborhood: 'Bairro não informado',
            city: 'Cidade não informada',
            state: 'UF'
        },
        documents: {
            idFrontUrl: 'https://via.placeholder.com/150', // Placeholder
            idBackUrl: 'https://via.placeholder.com/150',
            selfieUrl: 'https://via.placeholder.com/150'
        },
        avatarUrl: `https://i.pravatar.cc/150?u=${faker.string.uuid()}`,
        rank: InvestorRank.Bronze,
        balanceUSD: 0,
        capitalInvestedUSD: 0,
        monthlyProfitUSD: 0,
        dailyWithdrawableUSD: 0,
        isAdmin: false,
        joinedDate: new Date().toISOString().split('T')[0],
        referralCode: `${simpleUserData.name.split(' ')[0].toUpperCase()}${faker.string.numeric(4)}`,
        referredById: referredById,
        status: UserStatus.Pending, // Still pending approval
        plan: 'Conservador', // Default plan
    };
    
    // 1. Atualiza o estado local
    setDbState(prev => ({...prev, users: [...prev.users, newUser]}));

    // 2. Envia para o Supabase imediatamente, passando a senha
    syncUserToSupabase(newUser, simpleUserData.password).then((result) => {
        if (result.error) {
            // Improved logging to see the full object
            console.error("Erro ao registrar usuário no Supabase:", result.error);
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
      if (tx.userId === loggedUser?.id) {
          if (withdrawalAmount > (loggedUser?.dailyWithdrawableUSD || 0)) {
            alert("Erro: Saldo insuficiente para saque.");
            return;
          }
      }
    }
    // Envia transação para Supabase
    syncTransactionToSupabase(tx).then((result) => {
         if (result.error) {
            console.error("Erro ao salvar transação no Supabase:", result.error);
        }
    });
    setDbState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
  };

  const handleUpdateTransactionStatus = (transactionId: string, newStatus: TransactionStatus) => {
    const tx = dbState.transactions.find(t => t.id === transactionId);
    const user = dbState.users.find(u => u.id === tx?.userId);

    if (!tx || !user || !loggedUser?.isAdmin) return;

    // 1. Registro de Log do Admin
    const actionType = newStatus === TransactionStatus.Completed ? AdminActionType.TransactionApprove : AdminActionType.TransactionReject;
    const description = `${newStatus === TransactionStatus.Completed ? 'Aprovou' : 'Rejeitou'} transação de ${tx.type} no valor de US$ ${Math.abs(tx.amountUSD).toFixed(2)} para ${user.name}.`;
    handleAddAdminLog(loggedUser, actionType, description, transactionId);

    // 2. Lógica de Bônus Automático (Se for depósito aprovado e bônus não pago)
    let bonusTransactions: Transaction[] = [];
    let referrersToUpdate: User[] = [];
    let shouldPayBonus = false;

    if (tx.type === TransactionType.Deposit && newStatus === TransactionStatus.Completed && !tx.bonusPayoutHandled) {
        shouldPayBonus = true;
        let currentUser = user;
        
        // Percorre até 3 níveis de indicação
        for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
            const referrer = dbState.users.find(u => u.id === currentUser.referredById);
            if (!referrer) break;

            // Calculate bonus
            const bonusRateKey = level as keyof typeof REFERRAL_BONUS_RATES;
            const bonusRate = REFERRAL_BONUS_RATES[bonusRateKey];
            const bonusAmount = tx.amountUSD * bonusRate;

            // Create Bonus Transaction
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
            
            // Sync Bonus
            syncTransactionToSupabase(bonusTx);

            // Update referrer balance and rank
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
    
    // Update Tx State and Sync
    const updatedTx = { ...tx, status: newStatus, bonusPayoutHandled: shouldPayBonus ? true : tx.bonusPayoutHandled };
    syncTransactionToSupabase(updatedTx);

    const updatedTransactions = dbState.transactions.map(t => t.id === transactionId ? updatedTx : t);

    // Update User Balance if Deposit Approved
    let updatedUsers = [...dbState.users];
    
    // Update the user who made the transaction
    if (newStatus === TransactionStatus.Completed) {
        updatedUsers = updatedUsers.map(u => {
            if (u.id === user.id) {
                let newBalance = u.balanceUSD;
                let newInvested = u.capitalInvestedUSD;

                if (tx.type === TransactionType.Deposit) {
                    newBalance += tx.amountUSD;
                    newInvested += tx.amountUSD;
                } else if (tx.type === TransactionType.Withdrawal) {
                     // Withdrawal amountUSD is negative
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
            }
            return u;
        });
    }

    // Apply updates from referrals
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
      
      handleAddAdminLog(loggedUser!, AdminActionType.BonusPayout, `Pagamento manual de bônus para o depósito de ${currentUser?.name}.`, depositTx.id);
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
      
      if (newStatus !== UserStatus.Pending) {
           const actionType = newStatus === UserStatus.Approved ? AdminActionType.UserApprove : AdminActionType.UserReject;
           const description = `${newStatus === UserStatus.Approved ? 'Aprovou' : 'Rejeitou'} o cadastro do usuário ${dbState.users.find(u => u.id === userId)?.name}.`;
           handleAddAdminLog(loggedUser!, actionType, description, userId);
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
      handleAddAdminLog(loggedUser!, AdminActionType.UserBalanceEdit, `Alterou o saldo de ${user?.name} para US$ ${newBalance.toFixed(2)}.`, userId);

      setDbState(prev => ({ ...prev, users: updatedUsers }));
  };

  const handleSendMessage = (senderId: string, receiverId: string, text: string, attachment?: File) => {
      const attachmentData = attachment ? {
          fileName: attachment.name,
          fileUrl: URL.createObjectURL(attachment),
          fileType: attachment.type
      } : undefined;

      const newMessage: ChatMessage = {
          id: faker.string.uuid(),
          senderId,
          receiverId,
          text,
          timestamp: new Date().toISOString(),
          isRead: false,
          attachment: attachmentData
      };
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
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
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
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                />;
  } else {
      content = <HomePage setView={setView} />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-gray-100 dark:bg-brand-black text-gray-900 dark:text-white`}>
        {content}
    </div>
  );
};

export default App;
