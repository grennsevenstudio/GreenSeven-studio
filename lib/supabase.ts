
import { createClient } from '@supabase/supabase-js';
import type { User, Transaction, ChatMessage } from '../types';

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
        if (error) {
             // Ignora erros de tabela inexistente na verificação inicial
            if (error.code === '42P01' || error.code === 'PGRST205') {
                return { success: false, message: 'Tabelas não criadas (Execute o SQL em Settings)' };
            }
            return { success: false, message: error.message };
        }
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
            // Se a tabela não existir ou erro de cache de schema, retorna vazio para não quebrar o app
            if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                console.warn("Tabela 'users' não encontrada no Supabase. Retornando lista vazia.");
                return { data: [] };
            }
            
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
            supportStatus: row.support_status, // Mapeia o status do suporte

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
            // Se a tabela não existir ou erro de cache de schema, retorna vazio para não quebrar o app
            if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                console.warn("Tabela 'transactions' não encontrada no Supabase. Retornando lista vazia.");
                return { data: [] };
            }

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
 * Busca todas as mensagens de chat do Supabase.
 */
export const fetchMessagesFromSupabase = async () => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('timestamp', { ascending: true });

        if (error) {
            // Se a tabela não existir (ainda não foi criada pelo script) ou erro de cache de schema, retorna vazio sem erro crítico
            // PGRST205: Could not find the table in the schema cache
            // 42P01: Undefined table
            if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
                 console.warn("Tabela 'messages' não encontrada no Supabase. Retornando lista vazia.");
                 return { data: [] };
            }
            
            console.error('Erro ao buscar mensagens:', JSON.stringify(error, null, 2));
            return { error };
        }

        const messages: ChatMessage[] = data.map((row: any) => ({
            id: row.id,
            senderId: row.sender_id,
            receiverId: row.receiver_id,
            text: row.text,
            timestamp: row.timestamp,
            isRead: row.is_read,
            attachment: row.attachment || undefined
        }));

        return { data: messages };
    } catch (err: any) {
        console.error('Erro inesperado ao buscar mensagens:', err);
        return { error: { message: err.message || 'Erro desconhecido ao buscar mensagens' } };
    }
};

/**
 * Sincroniza um usuário para a tabela 'users' no Supabase.
 */
export const syncUserToSupabase = async (user: User, password?: string) => {
  try {
    // 1. Tenta encontrar o usuário pelo email para pegar o ID correto
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

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
        support_status: user.supportStatus || 'open',

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

    if (password) {
        payload.password = password;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      // Fallback para last_plan_change_date se a coluna não existir
      if (error.code === 'PGRST204' && (error.message?.includes('last_plan_change_date') || JSON.stringify(error).includes('last_plan_change_date'))) {
          delete payload.last_plan_change_date;
          const { data: retryData, error: retryError } = await supabase.from('users').upsert(payload, { onConflict: 'id' }).select();
          if (retryError) return { error: retryError };
          return { data: retryData };
      }

      // Fallback para support_status se a coluna não existir
      if (error.code === 'PGRST204' && (error.message?.includes('support_status') || JSON.stringify(error).includes('support_status'))) {
          delete payload.support_status;
           const { data: retryData2, error: retryError2 } = await supabase.from('users').upsert(payload, { onConflict: 'id' }).select();
           if (retryError2) return { error: retryError2 };
           return { data: retryData2 };
      }

      // Ignorar erro se tabela não existir
      if (error.code === '42P01' || error.code === 'PGRST205') return { data: null };

      return { error };
    }
    return { data };
  } catch (err: any) {
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
      // Ignorar erro se tabela não existir
      if (error.code === '42P01' || error.code === 'PGRST205') return { data: null };
      return { error };
    }
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Unexpected transaction sync error', details: err } };
  }
};

/**
 * Sincroniza uma mensagem de chat para a tabela 'messages' no Supabase.
 */
export const syncMessageToSupabase = async (msg: ChatMessage) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: msg.id,
        sender_id: msg.senderId,
        receiver_id: msg.receiverId,
        text: msg.text,
        timestamp: msg.timestamp,
        is_read: msg.isRead,
        attachment: msg.attachment || null
      })
      .select();

    if (error) {
      // Ignorar erro se tabela não existir
      if (error.code === '42P01' || error.code === 'PGRST205') return { data: null };
      console.error("Erro ao salvar mensagem no Supabase:", error);
      return { error };
    }
    return { data };
  } catch (err: any) {
    return { error: { message: err.message || 'Unexpected message sync error', details: err } };
  }
};
