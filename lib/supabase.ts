
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
 * Sincroniza um usuário para a tabela 'users' no Supabase.
 */
export const syncUserToSupabase = async (user: User, password?: string) => {
  try {
    const payload: any = {
        id: user.id,
        email: user.email,
        full_name: user.name, 
        avatar_url: user.avatarUrl,
        plan: 'Conservador',
        rank: user.rank,
        
        status: user.status,
        rejection_reason: user.rejectionReason || null,
        
        balance_usd: user.balanceUSD,
        capital_invested_usd: user.capitalInvestedUSD,
        monthly_profit_usd: user.monthlyProfitUSD,
        daily_withdrawable_usd: user.dailyWithdrawableUSD,
        
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
      console.error(`Erro ao sincronizar usuário ${user.email} com Supabase:`, JSON.stringify(error, null, 2));
      return { error };
    }
    return { data };
  } catch (err) {
    console.error('Erro inesperado na sincronização de usuário:', err);
    return { error: err };
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
      }, { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`Erro ao sincronizar transação ${tx.id} com Supabase:`, JSON.stringify(error, null, 2));
      return { error };
    }
    return { data };
  } catch (err) {
    console.error('Erro inesperado na sincronização de transação:', err);
    return { error: err };
  }
};
