import { createClient } from '@supabase/supabase-js';
import type { User, Transaction, ChatMessage, PlatformSettings, AdminActionLog, Notification, InvestmentPlan } from '../types';
import { InvestorRank } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

// Credenciais do Projeto
const SUPABASE_URL = 'https://kcwbtbjngrthtxtojqus.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtjd2J0YmpuZ3J0aHR4dG9qcXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDc5MjUsImV4cCI6MjA3OTQyMzkyNX0.44rjV4beXn-MZwK9CXx1j8AgXqoSeHOfOh1X2pjaTrk';

// Inicializa o cliente com headers explícitos para resolver erros de 'Failed to fetch'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false 
    },
    global: {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
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

// Helper to normalize rank to Title Case to match Enum
const normalizeRank = (rank: string): InvestorRank => {
    if (!rank) return InvestorRank.Bronze;
    // Convert "bronze" -> "Bronze", "GOLD" -> "Gold"
    const titleCase = rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
    
    if (Object.values(InvestorRank).includes(titleCase as InvestorRank)) {
        return titleCase as InvestorRank;
    }
    return InvestorRank.Bronze;
};

export const checkSupabaseConnection = async () => {
    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) {
             if (isNetworkError(error)) {
                 return { success: false, message: "Offline / Erro de Conexão" };
             }
             if (error.code === '42P01' || error.code === 'PGRST205') {
                 return { success: false, message: "Tabelas não criadas. Use o script SQL." };
             }
             return { success: false, message: `Erro: ${error.message}` };
        }
        return { success: true, count: count || 0 };
    } catch (e: any) {
        return { success: false, message: "Offline / Erro de Conexão" };
    }
}

export const fetchCareerPlanConfig = async () => {
    try {
        const { data, error } = await supabase.from('career_plan_config').select('*');
        if (error) {
             // Silently fail if table doesn't exist yet (fallback to defaults in App)
             return { data: null, error };
        }
        
        // Convert array [{level: 1, percentage: 0.03}] to object {1: 0.03}
        const config: {[key: number]: number} = {};
        if (data) {
            data.forEach((item: any) => {
                config[item.level] = Number(item.percentage);
            });
        }
        return { data: config, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
}

export const fetchInvestmentPlansFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('investment_plans').select('*').order('min_deposit_usd', { ascending: true });
        
        if (error) {
            return { data: null, error };
        }
        
        if (!data) return { data: [], error: null };

        const mapped: InvestmentPlan[] = data.map((p: any) => ({
            id: p.plan_id || p.id,
            name: p.name,
            monthlyReturn: p.monthly_return,
            returnRate: Number(p.return_rate),
            minDepositUSD: Number(p.min_deposit_usd),
            color: p.color
        }));

        return { data: mapped, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

export const fetchUsersFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        
        if (error) {
            if (isNetworkError(error) || error.code === '42P01' || error.code === 'PGRST205') {
                console.warn("Supabase unreachable or tables missing.");
                return { data: null, error: error }; 
            }
            console.error("Erro ao buscar usuários:", JSON.stringify(error, null, 2));
            return { data: null, error };
        }
        
        if (!data) return { data: [], error: null };

        const mappedUsers: User[] = data.map((u: any) => {
            // ROBUST MAPPING: Handles potential null/undefined values safely
            const extra = u.additional_data || {};
            
            // Ensure address has all required fields by merging with default
            const defaultAddress = { 
                cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' 
            };
            const address = { ...defaultAddress, ...(extra.address || {}) };

            // Ensure documents has all required fields
            const defaultDocs = { 
                idFrontUrl: '', idBackUrl: '', selfieUrl: '' 
            };
            const documents = { ...defaultDocs, ...(extra.documents || {}) };

            return {
                id: u.id,
                name: u.full_name || u.email?.split('@')[0] || 'Sem Nome',
                email: u.email || '',
                password: u.password, 
                cpf: extra.cpf || '',
                phone: extra.phone || '',
                address: address,
                documents: documents,
                kycAnalysis: u.kyc_analysis || extra.kycAnalysis,
                status: u.status || 'Pending',
                rejectionReason: u.rejection_reason,
                avatarUrl: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=00FF9C&color=000`,
                rank: normalizeRank(u.rank),
                plan: u.plan || 'Conservador',
                lastPlanChangeDate: u.last_plan_change_date,
                balanceUSD: Number(u.balance_usd || 0),
                capitalInvestedUSD: Number(u.capital_invested_usd || 0),
                monthlyProfitUSD: Number(u.monthly_profit_usd || 0),
                dailyWithdrawableUSD: Number(u.daily_withdrawable_usd || 0),
                bonusBalanceUSD: Number(u.bonus_balance_usd || 0),
                lastProfitUpdate: extra.lastProfitUpdate || u.created_at || new Date().toISOString(),
                isAdmin: u.is_admin === true,
                joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                referralCode: u.referral_code || extra.referralCode || '',
                referredById: u.referred_by_id || extra.referredById,
                transactionPin: u.transaction_pin || extra.transactionPin,
                supportStatus: u.support_status || 'open'
            };
        });

        return { data: mappedUsers, error: null };
    } catch (e) {
        console.warn("Exceção ao buscar usuários:", e);
        return { data: null, error: e };
    }
};

export const fetchTransactionsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('transactions').select('*');
        if (error) {
            if (isNetworkError(error) || error.code === '42P01') {
                 return { data: null, error };
            }
            return { data: null, error };
        }
        if (!data) return { data: [], error: null };

        const mappedTxs: Transaction[] = data.map((t: any) => ({
            id: t.id,
            user_id: t.user_id, 
            userId: t.user_id, 
            type: t.type,
            amountUSD: Number(t.amount_usd),
            amountBRL: Number(t.amount_brl),
            status: t.status,
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            scheduledDate: t.scheduled_date,
            withdrawalDetails: t.withdrawal_details,
            referralLevel: t.referral_level,
            sourceUserId: t.source_user_id,
            bonusPayoutHandled: t.bonus_payout_handled,
            walletSource: t.wallet_source 
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
            return { data: null, error };
        }
        if (!data) return { data: [], error: null };
        
        const mapped: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            text: m.text,
            timestamp: m.timestamp,
            isRead: m.is_read,
            attachment: m.attachment
        }));
        return { data: mapped, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

export const fetchSettingsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('platform_settings').select('*').single();
        if (error) {
            return { data: null, error };
        }
        
        const settings: PlatformSettings = {
            dollarRate: Number(data.dollar_rate),
            withdrawalFeePercent: Number(data.withdrawal_fee_percent),
            signupBonusUSD: Number(data.signup_bonus_usd),
            pixKey: data.pix_key,
            isMaintenanceMode: data.is_maintenance_mode,
            allowNewRegistrations: data.allow_new_registrations,
            logoUrl: data.logo_url
        };
        return { data: settings, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

export const fetchAdminLogsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('admin_logs').select('*').order('timestamp', { ascending: false });
        if (error) return { data: null, error };
        
        const logs: AdminActionLog[] = data.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            adminId: l.admin_id,
            adminName: l.admin_name,
            actionType: l.action_type,
            description: l.description,
            targetId: l.target_id
        }));
        return { data: logs, error: null };
    } catch (e) {
        return { data: null, error: e };
    }
};

export const fetchNotificationsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('notifications').select('*');
        if (error) return { data: null, error };
        if (!data) return { data: [], error: null };
        
        const mapped: Notification[] = data.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            message: n.message,
            date: n.date,
            isRead: n.is_read 
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
            bonus_balance_usd: user.bonusBalanceUSD,
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
                lastProfitUpdate: user.lastProfitUpdate,
                kycAnalysis: user.kycAnalysis
            }
        };

        const { error } = await supabase.from('users').upsert(dbUser, { onConflict: 'id' });
        
        if (error) {
            if (error.code === '23505') { // Unique violation
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', user.email)
                    .maybeSingle();

                if (existingUser && !fetchError) {
                    return { error: null, resolvedId: existingUser.id }; 
                }
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
            // Use scheduled_date column if we add it, or store in JSON if simplified
            // For now, let's assume we might need to add scheduled_date column in SQL
            scheduled_date: (tx as any).scheduledDate, 
            withdrawal_details: tx.withdrawalDetails,
            referral_level: tx.referralLevel,
            source_user_id: tx.sourceUserId,
            bonus_payout_handled: tx.bonusPayoutHandled,
            wallet_source: tx.walletSource
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

export const syncSettingsToSupabase = async (settings: PlatformSettings) => {
    try {
        const dbSettings = {
            id: 1, // Singleton row
            dollar_rate: settings.dollarRate,
            withdrawal_fee_percent: settings.withdrawalFeePercent,
            signup_bonus_usd: settings.signupBonusUSD,
            pix_key: settings.pixKey,
            is_maintenance_mode: settings.isMaintenanceMode,
            allow_new_registrations: settings.allowNewRegistrations,
            logo_url: settings.logoUrl
        };
        const { error } = await supabase.from('platform_settings').upsert(dbSettings, { onConflict: 'id' });
        return { error };
    } catch (e) {
        return { error: e };
    }
};

export const syncAdminLogToSupabase = async (log: AdminActionLog) => {
    try {
        const dbLog = {
            id: log.id,
            timestamp: log.timestamp,
            admin_id: log.adminId,
            admin_name: log.adminName,
            action_type: log.actionType,
            description: log.description,
            target_id: log.targetId
        };
        const { error } = await supabase.from('admin_logs').upsert(dbLog, { onConflict: 'id' });
        return { error };
    } catch (e) {
        return { error: e };
    }
};

export const syncNotificationToSupabase = async (notif: Notification) => {
    try {
        const dbNotif = {
            id: notif.id,
            user_id: notif.userId,
            message: notif.message,
            date: notif.date,
            is_read: notif.isRead
        };
        const { error } = await supabase.from('notifications').upsert(dbNotif, { onConflict: 'id' });
        return { error };
    } catch (e) {
        return { error: e };
    }
};

export const syncNotificationsToSupabase = async (notifs: Notification[]) => {
    try {
        if (notifs.length === 0) return { error: null };
        
        const dbNotifs = notifs.map(n => ({
            id: n.id,
            user_id: n.userId,
            message: n.message,
            date: n.date,
            is_read: n.isRead 
        }));
        
        const { error } = await supabase.from('notifications').upsert(dbNotifs, { onConflict: 'id' });
        return { error };
    } catch (e) {
        return { error: e };
    }
};

export const syncInvestmentPlanToSupabase = async (plan: InvestmentPlan) => {
    try {
        const dbPlan = {
            plan_id: plan.id, 
            name: plan.name,
            monthly_return: plan.monthlyReturn,
            return_rate: plan.returnRate,
            min_deposit_usd: plan.minDepositUSD,
            color: plan.color
        };
        const { error } = await supabase.from('investment_plans').upsert(dbPlan, { onConflict: 'plan_id' });
        return { error };
    } catch (e) {
        return { error: e };
    }
};
