
import { faker } from '@faker-js/faker';
import {
  type User,
  type Transaction,
  type ChatMessage,
  type Notification,
  type PlatformSettings,
  InvestorRank,
  UserStatus,
  type AdminActionLog,
  type InvestmentPlan,
} from '../types';
import { DOLLAR_RATE, INVESTMENT_PLANS } from '../constants';

// The structure of our "database" in localStorage
export interface AppDB {
  users: User[];
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  notifications: Notification[];
  platformSettings: PlatformSettings;
  adminActionLogs: AdminActionLog[];
  investmentPlans: InvestmentPlan[];
}

const DB_KEY = 'greennseven_db';
const SESSION_KEY = 'greennseven_session';

// Function to seed the database if it doesn't exist
export const initializeDB = () => {
  const existingData = localStorage.getItem(DB_KEY);
  let shouldSeed = !existingData;

  // Migration/Sanity Check:
  if (existingData) {
      try {
          const parsed = JSON.parse(existingData);
          
          // Check if database is corrupted or using old format
          if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
              console.warn("Database corrupted. Resetting.");
              shouldSeed = true;
          } else {
              // Check if Admin email matches the required one
              const admin = parsed.users.find((u: User) => u.email === 'admin@greennseven.com');
              if (!admin || !admin.isAdmin) {
                   console.warn("Admin configuration invalid. Resetting to ensure correct email.");
                   shouldSeed = true;
                   localStorage.removeItem(DB_KEY);
              }
          }
      } catch (e) {
          shouldSeed = true;
          localStorage.removeItem(DB_KEY);
      }
  }

  if (!shouldSeed) {
    // Check if plans exist in local data, if not, verify migration
    const data = JSON.parse(localStorage.getItem(DB_KEY)!);
    if (!data.investmentPlans) {
        data.investmentPlans = INVESTMENT_PLANS;
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }
    return;
  }

  // --- IDS GENERATION (Valid UUIDs) ---
  const ADMIN_ID = faker.string.uuid();

  // --- INITIAL MOCK DATA (SEED) ---
  const MOCK_ADMIN: User = {
    id: ADMIN_ID,
    name: 'Admin GreennSeven',
    email: 'admin@greennseven.com', // STRICT EMAIL
    password: 'admin123', // Password for local auth
    cpf: '000.000.000-00',
    phone: '(00) 00000-0000',
    address: {
        cep: '00000-000',
        street: 'Sede Administrativa',
        number: '1',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP'
    },
    documents: {
        idFrontUrl: 'https://via.placeholder.com/150',
        idBackUrl: 'https://via.placeholder.com/150',
        selfieUrl: 'https://via.placeholder.com/150'
    },
    status: UserStatus.Approved,
    avatarUrl: `https://ui-avatars.com/api/?name=Admin+GreennSeven&background=00FF9C&color=000`,
    rank: InvestorRank.Diamond,
    balanceUSD: 25420.50,
    capitalInvestedUSD: 20000,
    monthlyProfitUSD: 1200,
    dailyWithdrawableUSD: 1240.50,
    bonusBalanceUSD: 4180.00, // Bonus balance
    lastProfitUpdate: new Date().toISOString(), // Initial profit update time
    isAdmin: true,
    joinedDate: '2023-01-01',
    referralCode: 'ADMINPRO',
    transactionPin: '1234'
  };

  const MOCK_PLATFORM_SETTINGS: PlatformSettings = {
    dollarRate: DOLLAR_RATE,
    withdrawalFeePercent: 0, // Zero fee by default
    signupBonusUSD: 10,
    pixKey: '40b383be-3df8-4bc2-88a5-be6c7b0a55a0',
    isMaintenanceMode: false,
    maintenanceEndTime: undefined,
    allowNewRegistrations: true,
    logoUrl: '',
  };

  const initialDB: AppDB = {
    users: [MOCK_ADMIN],
    transactions: [],
    chatMessages: [],
    notifications: [],
    platformSettings: MOCK_PLATFORM_SETTINGS,
    adminActionLogs: [],
    investmentPlans: INVESTMENT_PLANS
  };

  saveAllData(initialDB);
  console.log('Database initialized with correct Admin email.');
};

// Function to read all data from the database
export const getAllData = (): AppDB => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
        // Should ideally be handled by initializeDB, but as a fallback:
        return { 
            users: [], 
            transactions: [], 
            chatMessages: [], 
            notifications: [], 
            platformSettings: {} as any, 
            adminActionLogs: [],
            investmentPlans: INVESTMENT_PLANS 
        };
    }
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading from DB", e);
    return { 
        users: [], 
        transactions: [], 
        chatMessages: [], 
        notifications: [], 
        platformSettings: {} as any, 
        adminActionLogs: [],
        investmentPlans: INVESTMENT_PLANS
    };
  }
};

/**
 * Robust save function to handle QuotaExceededError by pruning old logs and notifications
 */
export const saveAllData = (data: AppDB) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn("Storage quota exceeded. Pruning logs and notifications...");
      
      // Pruning strategy: keep only the 20 most recent logs and 50 most recent notifications/messages
      const prunedData: AppDB = {
          ...data,
          adminActionLogs: data.adminActionLogs.slice(0, 20), // Newest are at the start
          notifications: data.notifications.slice(-50), // Newest are at the end
          chatMessages: data.chatMessages.slice(-50) // Newest are at the end
      };
      
      try {
          localStorage.setItem(DB_KEY, JSON.stringify(prunedData));
          console.log("Data saved successfully after pruning.");
      } catch (retryError) {
          console.error("Failed to save even after pruning non-essential data.", retryError);
          // Last resort: clear logs entirely
          const minimalData = { ...prunedData, adminActionLogs: [], notifications: [], chatMessages: [] };
          try {
              localStorage.setItem(DB_KEY, JSON.stringify(minimalData));
          } catch(lastError) {
              console.error("Critical failure: unable to save minimal data to localStorage.");
          }
      }
    } else {
      console.error("Error saving to DB:", e);
    }
  }
};

export const getSessionUser = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

export const setSessionUser = (userId: string) => {
  localStorage.setItem(SESSION_KEY, userId);
};

export const clearSessionUser = () => {
  localStorage.removeItem(SESSION_KEY);
};
