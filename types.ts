

export enum View {
  Home,
  Login,
  Register,
  ForgotPassword,
  UserDashboard,
  AdminDashboard,
}

export type Language = 'pt' | 'en' | 'es' | 'fr' | 'de';

export type SyncStatus = 'idle' | 'syncing' | 'online' | 'error';

export enum InvestorRank {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Diamond = 'Diamond',
}

export enum UserStatus {
  Pending = 'Pendente',
  Approved = 'Aprovado',
  Rejected = 'Rejeitado',
}

export type SupportStatus = 'open' | 'pending' | 'resolved';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Added password field for local authentication check
  cpf: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  documents: {
    idFrontUrl: string;
    idBackUrl: string;
    selfieUrl: string;
  };
  status: UserStatus;
  rejectionReason?: string; // Motivo da recusa
  avatarUrl: string;
  rank: InvestorRank;
  plan?: string; // Current investment plan name
  lastPlanChangeDate?: string; // Date of the last plan change
  balanceUSD: number; // Total balance: capital + monthly profit + bonus
  capitalInvestedUSD: number;
  monthlyProfitUSD: number;
  dailyWithdrawableUSD: number; // Accumulated daily yields
  bonusBalanceUSD: number; // Accumulated referral bonuses (Separated)
  lastProfitUpdate?: string; // Date string tracking last daily yield accumulation
  isAdmin: boolean;
  joinedDate: string;
  referralCode: string;
  referredById?: string;
  transactionPin?: string; // 4-digit PIN for withdrawals
  supportStatus?: SupportStatus; // Status of the support ticket
  kycAnalysis?: string;
  hasSeenWelcomePopup?: boolean;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  monthlyReturn: string;
  returnRate: number; // Taxa numérica para cálculo (ex: 0.25 para 25%)
  minDepositUSD: number;
  color: string;
}

export interface ReferralLevel {
    level: number;
    percentage: number;
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdrawal = 'Withdrawal',
  Bonus = 'Bonus',
  Yield = 'Yield',
}

export enum TransactionStatus {
  Completed = 'Completed',
  Pending = 'Pending',
  Failed = 'Failed',
  Scheduled = 'Scheduled',
}

export interface WithdrawalDetails {
  pixKey: string;
  fullName: string;
  cpf: string;
  bank: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountUSD: number;
  amountBRL?: number;
  status: TransactionStatus;
  date: string;
  withdrawalDetails?: WithdrawalDetails;
  referralLevel?: 1 | 2 | 3;
  sourceUserId?: string;
  bonusPayoutHandled?: boolean;
  walletSource?: 'yield' | 'bonus'; // Indicates which wallet to deduct from (for withdrawals)
  scheduledDate?: string;
}

export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    date: string;
    isRead: boolean;
    isAdmin?: boolean; // Optional flag to mark if it's an admin notification (system alert)
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: string;
    isRead: boolean;
    attachment?: {
        fileName: string;
        fileUrl: string;
        fileType: string;
    };
}

export interface PlatformSettings {
    dollarRate: number;
    withdrawalFeePercent: number;
    signupBonusUSD: number;
    pixKey: string;
    isMaintenanceMode: boolean;
    maintenanceEndTime?: string; // ISO Date string for when maintenance ends
    allowNewRegistrations: boolean;
    logoUrl: string;
}

export enum AdminActionType {
    TransactionApprove = 'TransactionApprove',
    TransactionReject = 'TransactionReject',
    UserApprove = 'UserApprove',
    UserReject = 'UserReject',
    BonusPayout = 'BonusPayout',
    UserBalanceEdit = 'UserBalanceEdit',
    UserBonusEdit = 'UserBonusEdit',
    UserCapitalEdit = 'UserCapitalEdit',
    UserProfitEdit = 'UserProfitEdit',
    SettingsUpdate = 'SettingsUpdate',
    PaymentScheduled = 'PaymentScheduled',
    HistoryClear = 'HistoryClear',
    TransactionDelete = 'TransactionDelete',
    UserDelete = 'UserDelete',
}

export interface AdminActionLog {
    id: string;
    timestamp: string;
    adminId: string;
    adminName: string;
    actionType: AdminActionType;
    description: string;
    targetId?: string;
}