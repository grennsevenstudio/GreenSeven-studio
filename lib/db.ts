
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
} from '../types';
import { DOLLAR_RATE } from '../constants';

// The structure of our "database" in localStorage
export interface AppDB {
  users: User[];
  transactions: Transaction[];
  chatMessages: ChatMessage[];
  notifications: Notification[];
  platformSettings: PlatformSettings;
  adminActionLogs: AdminActionLog[];
}

const DB_KEY = 'greennseven_db';

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
    isAdmin: true,
    joinedDate: '2023-01-01',
    referralCode: 'ADMINPRO',
    transactionPin: '1234'
  };

  const MOCK_PLATFORM_SETTINGS: PlatformSettings = {
    dollarRate: DOLLAR_RATE,
    withdrawalFeePercent: 5,
    signupBonusUSD: 10,
    pixKey: 'seu-cnpj-ou-chave-aleatoria',
    isMaintenanceMode: false,
    allowNewRegistrations: true,
    logoUrl: '',
  };

  const initialDB: AppDB = {
    users: [MOCK_ADMIN],
    transactions: [],
    chatMessages: [],
    notifications: [],
    platformSettings: MOCK_PLATFORM_SETTINGS,
    adminActionLogs: []
  };

  saveAllData(initialDB);
  console.log('Database initialized with correct Admin email.');
};

// Function to read all data from the database
export const getAllData = (): AppDB => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      initializeDB();
      return JSON.parse(localStorage.getItem(DB_KEY)!) as AppDB;
    }
    return JSON.parse(data) as AppDB;
  } catch (error) {
    console.warn("Failed to parse DB from localStorage, re-initializing.", error);
    localStorage.removeItem(DB_KEY);
    initializeDB();
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) as AppDB : { users: [], transactions: [], chatMessages: [], notifications: [], adminActionLogs: [], platformSettings: {} as any };
  }
};

// Function to save all data to the database
export const saveAllData = (db: AppDB) => {
  try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e: any) {
      // Handle Quota Exceeded
      if (
        e.name === 'QuotaExceededError' || 
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
        e.code === 22 || 
        e.code === 1014
      ) {
          console.warn("LocalStorage quota exceeded. Attempting to save without heavy assets.");
          
          // Create a lightweight version of DB by removing large Base64 strings
          // We rely on Supabase for data persistence, LocalStorage is just a cache/fallback
          const lightweightDB = {
              ...db,
              users: db.users.map(u => ({
                  ...u,
                  documents: { 
                    idFrontUrl: '', 
                    idBackUrl: '', 
                    selfieUrl: '' 
                  } 
              })),
              chatMessages: db.chatMessages.map(m => ({
                  ...m,
                  attachment: m.attachment ? { ...m.attachment, fileUrl: '' } : undefined
              }))
          };
          
          try {
              localStorage.setItem(DB_KEY, JSON.stringify(lightweightDB));
              console.log("Database saved in lightweight mode.");
          } catch (retryError) {
              console.error("Failed to save even lightweight DB. LocalStorage is completely full.", retryError);
          }
      } else {
          console.error("Failed to save DB", e);
      }
  }
};
