
import { createClient } from '@supabase/supabase-js';
import type { User, Transaction } from '../types';

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================

// Credenciais do Projeto: Gemini studio
const SUPABASE_URL = 'https://vocdmybprkqwpddibffb.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY2RteWJwcmtxd3BkZGliZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzY4MjMwNSwiZXhwIjoyMDc5MjU4MzA1fQ.pwEasdlwG0GmnB5yRu4CwoarZSV_tunnjLuOG89cTTI';

// Inicializa o cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Verifica a conexão com o Supabase tentando fazer um select simples.
 */
export const checkSupabaseConnection = async () => {
    try {
        const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) return { success: false, message: error.message };
        return { success: true, count: count || 0 };
    } catch (e: any) {
        return { success: false, message: e.message || 'Unknown error' };
    }
}

/**
 * Busca todos os usuários do Supabase e mapeia para o tipo User.
 */
export const fetchUsersFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        
        if (error) {
            console.error('Erro ao buscar usuários:', JSON.stringify(error, null, 2));
            return { error };
        }

        const users: User[] = data.map((row: any) => ({
            id: row.id,
            name: row.full_name || 'Sem Nome',
            email: row.email,
            avatarUrl: row.avatar_url || 'https://via.placeholder.com/150',
            plan: row.plan,
            rank: row.rank,
            status: row.status,
            rejectionReason: row.rejection_reason,
            isAdmin: row.is_admin,
            balanceUSD: Number(row.balance_usd || 0),
            capitalInvestedUSD: Number(row.capital_invested_usd || 0),
            monthlyProfitUSD: Number(row.monthly_profit_usd || 0),
            dailyWithdrawableUSD: Number(row.daily_withdrawable_usd || 0),
            joinedDate: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            lastPlanChangeDate: row.last_plan_change_date || undefined,

            // Mapeia campos JSONB de additional_data
            cpf: row.additional_data?.cpf || '',
            phone: row.additional_data?.phone || '',
            address: row.additional_data?.address || {
                cep: '', street: '', number: '', neighborhood: '', city: '', state: ''
            },
            documents: row.additional_data?.documents || {
                idFrontUrl: '', idBackUrl: '', selfieUrl: ''
            },
            referralCode: row.additional_data?.referralCode || '',
            referredById: row.additional_data?.referredById,
            transactionPin: row.additional_data?.transactionPin
        }));

        return { data: users };
    } catch (err: any) {
        console.error('Erro inesperado ao buscar usuários:', err);
        return { error: { message: err.message || 'Erro desconhecido ao buscar usuários' } };
    }
};

/**
 * Busca todas as transações do Supabase e mapeia para o tipo Transaction.
 */
export const fetchTransactionsFromSupabase = async () => {
    try {
        const { data, error } = await supabase.from('transactions').select('*');

        if (error) {
            console.error('Erro ao buscar transações:', JSON.stringify(error, null, 2));
            return { error };
        }

        const transactions: Transaction[] = data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            amountUSD: Number(row.amount_usd || 0),
            amountBRL: row.amount_brl ? Number(row.amount_brl) : undefined,
            status: row.status,
            date: row.date ? row.date.split('T')[0] : new Date().toISOString().split('T')[0],
            withdrawalDetails: row.withdrawal_details,
            referralLevel: row.referral_level,
            sourceUserId: row.source_user_id,
            bonusPayoutHandled: row.bonus_payout_handled
        }));

        return { data: transactions };
    } catch (err: any) {
        console.error('Erro inesperado ao buscar transações:', err);
        return { error: { message: err.message || 'Erro desconhecido ao buscar transações' } };
    }
};

/**
 * Sincroniza um usuário para a tabela 'users' no Supabase.
 */
export const syncUserToSupabase = async (user: User, password?: string) => {
  try {
    // 1. Tenta encontrar o usuário pelo email para pegar o ID correto (evita erro de chave duplicada)
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

    // Se o usuário já existe, usamos o ID dele para fazer o update.
    // Se não existe, usamos o ID gerado localmente (ou novo).
    const targetId = existingUser ? existingUser.id : user.id;

    const payload: any = {
        id: targetId,
        email: user.email,
        full_name: user.name, 
        avatar_url: user.avatarUrl,
        plan: user.plan || 'Conservador',
        rank: user.rank,
        
        status: user.status,
        rejection_reason: user.rejectionReason || null,
        
        balance_usd: user.balanceUSD,
        capital_invested_usd: user.capitalInvestedUSD,
        monthly_profit_usd: user.monthlyProfitUSD,
        daily_withdrawable_usd: user.dailyWithdrawableUSD,
        last_plan_change_date: user.lastPlanChangeDate ? new Date(user.lastPlanChangeDate).toISOString() : null,

        is_admin: user.isAdmin,
        created_at: user.joinedDate ? new Date(user.joinedDate).toISOString() : new Date().toISOString(),
        
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

    // Adiciona a senha ao payload se fornecida
    if (password) {
        payload.password = password;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      // FALLBACK: Se a coluna 'last_plan_change_date' não existir (Erro PGRST204), tentamos salvar sem ela.
      // Isso evita que a aplicação quebre se a migration não tiver sido rodada ainda.
      if (error.code === 'PGRST204' && (error.message?.includes('last_plan_change_date') || JSON.stringify(error).includes('last_plan_change_date'))) {
          console.warn("A coluna 'last_plan_change_date' não existe no Supabase. Tentando sincronizar sem este campo.");
          delete payload.last_plan_change_date;
          
          const { data: retryData, error: retryError } = await supabase
              .from('users')
              .upsert(payload, { onConflict: 'id' })
              .select();
          
          if (retryError) return { error: retryError };
          return { data: retryData };
      }

      return { error };
    }
    return { data };
  } catch (err: any) {
    // Wrap the exception in a plain object so JSON.stringify doesn't produce {}
    return { error: { message: err.message || 'Unexpected sync error', details: err } };
  }
};

/**
 * Sincroniza uma transação para a tabela 'transactions' no Supabase.
 */
export const syncTransactionToSupabase = async (tx: Transaction) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .upsert({
        id: tx.id,
        user_id: tx.userId,
        type: tx.type,
        amount_usd: tx.amountUSD,
        status: tx.status,
        date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
        amount_brl: tx.amountBRL || null,
        
        withdrawal_details: tx.withdrawalDetails || null,
        referral_level: tx.referralLevel || null,
        source_user_id: tx.sourceUserId || null,
        bonus_payout_handled: tx.bonusPayoutHandled || false
      }, { onConflict: 'id' })
      .select();

    if (error) {
      return { error };
    }
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Unexpected transaction sync error', details: err } };
  }
};
