
import { createClient } from '@supabase/supabase-js';
import type { User, Transaction, ChatMessage } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

// Credenciais do Projeto
const SUPABASE_URL = 'https://kcwbtbjngrthtxtojqus.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjd2J0YmpuZ3J0aHR4dG9qcXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDc5MjUsImV4cCI6MjA3OTQyMzkyNX0.44rjV4beXn-MZwK9CXx1j8AgXqoSeHOfOh1X2pjaTrk';

// Inicializa o cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false 
    }
});

/**
 * Helper function to detect network/fetch errors.
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

export const fetchUsersFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                console.warn("Supabase unreachable... Using local data.");
                return { data: null, error: error }; 
            }
            console.error("Erro ao buscar usuários:", JSON.stringify(error, null, 2));
            return { data: null, error };
        }
        
        if (!data) return { data: [], error: null };

        const mappedUsers: User[] = data.map((u: any) => {
            const extra = u.additional_data || {};
            return {
                id: u.id,
                name: u.full_name || u.email?.split('@')[0] || 'Sem Nome',
                email: u.email,
                password: u.password, 
                cpf: extra.cpf || '',
                phone: extra.phone || '',
                address: extra.address || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
                documents: extra.documents || { idFrontUrl: '', idBackUrl: '', selfieUrl: '' },
                status: u.status || 'Pending',
                rejectionReason: u.rejection_reason,
                avatarUrl: u.avatar_url || 'https://via.placeholder.com/150',
                rank: u.rank || 'Bronze',
                plan: u.plan || 'Conservador',
                lastPlanChangeDate: u.last_plan_change_date,
                balanceUSD: Number(u.balance_usd || 0),
                capitalInvestedUSD: Number(u.capital_invested_usd || 0),
                monthlyProfitUSD: Number(u.monthly_profit_usd || 0),
                dailyWithdrawableUSD: Number(u.daily_withdrawable_usd || 0),
                isAdmin: u.is_admin || false,
                joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                // Map explicit columns back to object properties
                referralCode: u.referral_code || extra.referralCode || '',
                referredById: u.referred_by_id || extra.referredById,
                transactionPin: u.transaction_pin || extra.transactionPin,
                supportStatus: u.support_status || 'open'
            };
        });

        return { data: mappedUsers, error: null };
    } catch (e) {
        console.warn("Exceção ao buscar usuários (Offline):", e);
        return { data: null, error: e };
    }
};

export const fetchTransactionsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('transactions').select('*');
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                 console.warn("Supabase unreachable... Using local transactions.");
                 return { data: null, error };
            }
            console.error("Erro ao buscar transações:", JSON.stringify(error, null, 2));
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
        return { data: null, error: e };
    }
};

export const fetchMessagesFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('messages').select('*');
        if (error) {
            // Silently fail for messages on network error to avoid spam
            return { data: null, error };
        }
        if (!data) return { data: [], error: null };
        
        const mapped: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            timestamp: m.timestamp,
            is_read: m.is_read,
            attachment: m.attachment
        }));
        return { data: mapped, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

// ============================================================================
// SYNC FUNCTIONS (Upsert)
// ============================================================================

export const syncUserToSupabase = async (user: User, password?: string): Promise<{ error: any, resolvedId?: string }> => {
    try {
        const dbUser = {
            id: user.id,
            email: user.email,
            password: password || user.password,
            full_name: user.name,
            avatar_url: user.avatarUrl,
            plan: user.plan,
            rank: user.rank,
            status: user.status,
            rejection_reason: user.rejectionReason || null,
            is_admin: user.isAdmin,
            balance_usd: user.balanceUSD,
            capital_invested_usd: user.capitalInvestedUSD,
            monthly_profit_usd: user.monthlyProfitUSD,
            daily_withdrawable_usd: user.dailyWithdrawableUSD,
            last_plan_change_date: user.lastPlanChangeDate,
            referral_code: user.referralCode,
            referred_by_id: user.referredById || null,
            transaction_pin: user.transactionPin || null,
            support_status: user.supportStatus,
            additional_data: {
                cpf: user.cpf,
                phone: user.phone,
                address: user.address,
                documents: user.documents,
            }
        };

        const { error } = await supabase.from('users').upsert(dbUser, { onConflict: 'id' });
        
        if (error) {
            // Handle unique constraint on email
            if (error.code === '23505') {
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', user.email)
                    .maybeSingle();

                if (existingUser && !fetchError) {
                    return { error: null, resolvedId: existingUser.id }; 
                }
            }

            if (!isNetworkError(error) && error.code !== '42P01') {
                 // console.error("Erro ao sincronizar usuário:", JSON.stringify(error, null, 2));
            }
            return { error };
        }
        return { error: null };
    } catch (e) {
        return { error: e };
    }
};

export const syncTransactionToSupabase = async (tx: Transaction) => {
    try {
        const dbTx = {
            id: tx.id,
            user_id: tx.userId,
            type: tx.type,
            amount_usd: tx.amountUSD,
            amount_brl: tx.amountBRL,
            status: tx.status,
            date: tx.date,
            withdrawal_details: tx.withdrawalDetails,
            referral_level: tx.referralLevel,
            source_user_id: tx.sourceUserId,
            bonus_payout_handled: tx.bonusPayoutHandled
        };
        const { error } = await supabase.from('transactions').upsert(dbTx, { onConflict: 'id' });
        if (error) return { error };
        return { error: null };
    } catch (e) {
        return { error: e };
    }
};

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
        const { error } = await supabase.from('messages').upsert(dbMsg, { onConflict: 'id' });
        if (error) return { error };
        return { error: null };
    } catch (e) {
        return { error: e };
    }
};
