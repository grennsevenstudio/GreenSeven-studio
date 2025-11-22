
import { createClient } from '@supabase/supabase-js';
import type { User, Transaction, ChatMessage } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

// Credenciais do Projeto: greenn7investiments.tecnologic@gmail.com's Project
// Project ID: dvmaukjrkepgktfnuesf
const SUPABASE_URL = 'https://dvmaukjrkepgktfnuesf.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2bWF1a2pya2VwZ2t0Zm51ZXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjE2NTAsImV4cCI6MjA3OTMzNzY1MH0.t84GRCDCTZcqjzQZgRFUAn_25xjsIKjJ-wvXjjmMaiY';

// Inicializa o cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false 
    }
});

/**
 * Helper function to detect network/fetch errors.
 * Returns true if the error is related to connectivity or the fetch API.
 */
const isNetworkError = (err: any) => {
    if (!err) return false;
    
    const msg = (err.message || '').toString();
    const details = (err.details || '').toString();
    
    if (
        msg.includes('Failed to fetch') || 
        msg.includes('Network request failed') || 
        msg.includes('Load failed') ||
        msg.includes('TypeError') ||
        details.includes('Failed to fetch') ||
        err.name === 'TypeError' ||
        (err.code === '' && (msg.includes('error') || msg.includes('fetch')))
    ) {
        return true;
    }
    
    return false;
};

/**
 * Verifica a conexão com o Supabase tentando fazer um select simples.
 */
export const checkSupabaseConnection = async () => {
    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) {
             if (isNetworkError(error)) {
                 return { success: false, message: "Offline / Erro de Conexão" };
             }
             if (error.code === '42P01' || error.code === 'PGRST205') {
                 return { success: false, message: "Tabelas não criadas" };
             }
             return { success: false, message: error.message };
        }
        return { success: true, count: count || 0 };
    } catch (e: any) {
        return { success: false, message: "Offline / Erro de Conexão" };
    }
}

/**
 * Busca todos os usuários do Supabase e mapeia para o tipo User.
 */
export const fetchUsersFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                return { data: [], error: null };
            }
            return { data: null, error };
        }
        
        if (!data) return { data: [], error: null };

        const mappedUsers: User[] = data.map((u: any) => ({
            id: u.id,
            name: u.full_name || u.email.split('@')[0],
            email: u.email,
            password: u.password, // Mapped password for local auth check
            cpf: u.additional_data?.cpf || '',
            phone: u.additional_data?.phone || '',
            address: u.additional_data?.address || {},
            documents: u.additional_data?.documents || {},
            status: u.status,
            rejectionReason: u.rejection_reason,
            avatarUrl: u.avatar_url || 'https://via.placeholder.com/150',
            rank: u.rank,
            plan: u.plan,
            lastPlanChangeDate: u.last_plan_change_date,
            balanceUSD: Number(u.balance_usd || 0),
            capitalInvestedUSD: Number(u.capital_invested_usd || 0),
            monthlyProfitUSD: Number(u.monthly_profit_usd || 0),
            dailyWithdrawableUSD: Number(u.daily_withdrawable_usd || 0),
            isAdmin: u.is_admin,
            joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            referralCode: u.additional_data?.referralCode || '',
            referredById: u.additional_data?.referredById,
            transactionPin: u.additional_data?.transactionPin,
            supportStatus: u.support_status || 'open'
        }));

        return { data: mappedUsers, error: null };
    } catch (e) {
        return { data: [], error: null };
    }
};

/**
 * Busca todas as transações.
 */
export const fetchTransactionsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('transactions').select('*');
        
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                return { data: [], error: null };
            }
            return { data: null, error };
        }

        if (!data) return { data: [], error: null };

        const mappedTxs: Transaction[] = data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            type: t.type,
            amountUSD: Number(t.amount_usd),
            amountBRL: Number(t.amount_brl),
            status: t.status,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            withdrawalDetails: t.withdrawal_details,
            referralLevel: t.referral_level,
            sourceUserId: t.source_user_id,
            bonusPayoutHandled: t.bonus_payout_handled
        }));

        return { data: mappedTxs, error: null };
    } catch (e) {
        return { data: [], error: null };
    }
};

/**
 * Busca todas as mensagens de chat.
 */
export const fetchMessagesFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('messages').select('*');
        
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                return { data: [], error: null };
            }
            return { data: null, error };
        }
        
        if (!data) return { data: [], error: null };

        const mappedMessages: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            timestamp: m.timestamp,
            isRead: m.is_read,
            attachment: m.attachment
        }));

        return { data: mappedMessages, error: null };
    } catch (e) {
        return { data: [], error: null };
    }
};

/**
 * Sincroniza (Upsert) um usuário no Supabase.
 */
export const syncUserToSupabase = async (user: User, password?: string) => {
    try {
        const dbUser: any = {
            id: user.id,
            email: user.email,
            full_name: user.name,
            avatar_url: user.avatarUrl,
            plan: user.plan,
            rank: user.rank,
            status: user.status,
            rejection_reason: user.rejectionReason,
            is_admin: user.isAdmin,
            balance_usd: user.balanceUSD,
            capital_invested_usd: user.capitalInvestedUSD,
            monthly_profit_usd: user.monthlyProfitUSD,
            daily_withdrawable_usd: user.dailyWithdrawableUSD,
            last_plan_change_date: user.lastPlanChangeDate,
            support_status: user.supportStatus,
            additional_data: {
                cpf: user.cpf,
                phone: user.phone,
                address: user.address,
                documents: user.documents,
                referralCode: user.referralCode,
                referredById: user.referredById,
                transactionPin: user.transactionPin
            }
        };

        // Use the passed password argument OR the password inside the user object
        if (password) {
            dbUser.password = password;
        } else if (user.password) {
            dbUser.password = user.password;
        }
        
        Object.keys(dbUser).forEach(key => dbUser[key] === undefined && delete dbUser[key]);

        const { error } = await supabase.from('users').upsert(dbUser, { onConflict: 'id' });
        
        if (error) {
             if (isNetworkError(error) || error.code === '42P01') return { error: null };
             return { error };
        }
        return { error: null };
    } catch (e) {
        return { error: null };
    }
};

/**
 * Sincroniza (Upsert) uma transação no Supabase.
 */
export const syncTransactionToSupabase = async (tx: Transaction) => {
    try {
        const dbTx = {
            id: tx.id,
            user_id: tx.userId,
            type: tx.type,
            amount_usd: tx.amountUSD,
            amount_brl: tx.amountBRL,
            status: tx.status,
            date: new Date().toISOString(),
            withdrawal_details: tx.withdrawalDetails,
            referral_level: tx.referralLevel,
            source_user_id: tx.sourceUserId,
            bonus_payout_handled: tx.bonusPayoutHandled
        };
        
        const { error } = await supabase.from('transactions').upsert(dbTx);
        if (error) {
             if (isNetworkError(error) || error.code === '42P01') return { error: null };
             return { error };
        }
        return { error: null };
    } catch (e) {
        return { error: null };
    }
}

/**
 * Sincroniza (Upsert) uma mensagem no Supabase.
 */
export const syncMessageToSupabase = async (msg: ChatMessage) => {
    try {
        const dbMsg = {
            id: msg.id,
            sender_id: msg.senderId,
            receiver_id: msg.receiverId,
            text: msg.text,
            timestamp: msg.timestamp,
            is_read: msg.isRead,
            attachment: msg.attachment
        };
        const { error } = await supabase.from('messages').upsert(dbMsg);
        if (error) {
            if (isNetworkError(error) || error.code === '42P01') return { error: null };
            return { error };
        }
        return { error: null };
    } catch (e) {
        return { error: null };
    }
}