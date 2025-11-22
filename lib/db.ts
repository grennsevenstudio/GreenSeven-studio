
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

// Helper to check if string is a valid UUID
const isUUID = (str: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
};

// Function to seed the database if it doesn't exist
export const initializeDB = () => {
  const existingData = localStorage.getItem(DB_KEY);
  let shouldSeed = !existingData;

  // Migration/Sanity Check:
  if (existingData) {
      try {
          const parsed = JSON.parse(existingData);
          const firstUser = parsed.users?.[0];
          // Check if we have legacy data (non-UUID IDs or fake users when we want only admin)
          if (firstUser && (!isUUID(firstUser.id) || parsed.users.length > 1 && parsed.users.some((u: User) => u.name.includes('Carlos') || u.name.includes('Ana')))) {
              console.warn("Legacy or demo data detected. Resetting database to clean state.");
              shouldSeed = true;
              localStorage.removeItem(DB_KEY);
          }
      } catch (e) {
          shouldSeed = true;
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
    email: 'admin@greennseven.com',
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
    avatarUrl: `https://i.pravatar.cc/150?u=${ADMIN_ID}`,
    rank: InvestorRank.Platinum,
    balanceUSD: 25420.50,
    capitalInvestedUSD: 20000,
    monthlyProfitUSD: 1200,
    dailyWithdrawableUSD: 1240.50,
    isAdmin: true,
    joinedDate: '2023-01-01',
    referralCode: 'ADMINPRO',
    transactionPin: '1234' // Added for easy testing of withdrawals
  };

  const MOCK_ALL_USERS: User[] = [MOCK_ADMIN]; // Strictly only Admin
  const MOCK_ALL_TRANSACTIONS: Transaction[] = [];
  const MOCK_CHAT_MESSAGES: ChatMessage[] = [];
  const MOCK_NOTIFICATIONS: Notification[] = [];
  
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
    users: MOCK_ALL_USERS,
    transactions: MOCK_ALL_TRANSACTIONS,
    chatMessages: MOCK_CHAT_MESSAGES,
    notifications: MOCK_NOTIFICATIONS,
    platformSettings: MOCK_PLATFORM_SETTINGS,
    adminActionLogs: []
  };

  localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  console.log('Database initialized. Demo users removed. Only Admin exists.');
};

// Function to read all data from the database
export const getAllData = (): AppDB => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      throw new Error('No data found');
    }
    return JSON.parse(data) as AppDB;
  } catch (error) {
    console.warn("Failed to parse DB from localStorage, re-initializing.", error);
    initializeDB();
    const data = localStorage.getItem(DB_KEY);
    return JSON.parse(data!) as AppDB;
  }
};

// Function to save all data to the database
export const saveAllData = (db: AppDB) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};