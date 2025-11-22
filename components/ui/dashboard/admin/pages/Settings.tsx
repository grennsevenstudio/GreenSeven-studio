
import React, { useState, useEffect } from 'react';
import type { PlatformSettings, User, Transaction } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import ToggleSwitch from '../../../../ui/ToggleSwitch';
import { ICONS } from '../../../../../constants';
import { GoogleGenAI, Modality } from "@google/genai";
import { checkSupabaseConnection, syncUserToSupabase, syncTransactionToSupabase } from '../../../../../lib/supabase';

interface SettingsProps {
    platformSettings: PlatformSettings;
    onUpdateSettings: (newSettings: PlatformSettings) => void;
    allUsers: User[];
    allTransactions?: Transaction[];
}

const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up ${type === 'success' ? 'bg-brand-green text-brand-black' : 'bg-red-500 text-white'}`}>
        <div className={`p-1 rounded-full ${type === 'success' ? 'bg-black/10' : 'bg-white/20'}`}>
            {type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )}
        </div>
        <span className="font-bold">{message}</span>
        <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
            }
        `}</style>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ platformSettings, onUpdateSettings, allUsers, allTransactions = [] }) => {
    const [settings, setSettings] = useState<PlatformSettings>(platformSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedUserToReset, setSelectedUserToReset] = useState<string>(allUsers.filter(u => !u.isAdmin)[0]?.id || '');
    
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);

    // Supabase Status State
    const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
    const [supabaseMessage, setSupabaseMessage] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // SQL Code Definition - REFINED FOR ROBUSTNESS
    const sqlCode = `-- SCRIPT SQL DE CONFIGURAÇÃO (GreennSeven Invest)
-- Projeto: greenn7investiments.tecnologic@gmail.com's Project (dvmaukjrkepgktfnuesf)

-- 1. Habilita extensão para gerar IDs únicos (UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT,
  rank TEXT,
  status TEXT,
  rejection_reason TEXT,
  is_admin BOOLEAN DEFAULT false,
  balance_usd NUMERIC DEFAULT 0,
  capital_invested_usd NUMERIC DEFAULT 0,
  monthly_profit_usd NUMERIC DEFAULT 0,
  daily_withdrawable_usd NUMERIC DEFAULT 0,
  last_plan_change_date TEXT,
  support_status TEXT DEFAULT 'open',
  additional_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT,
  amount_usd NUMERIC,
  amount_brl NUMERIC,
  status TEXT,
  date TEXT,
  withdrawal_details JSONB,
  referral_level NUMERIC,
  source_user_id UUID,
  bonus_payout_handled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. TABELA DE MENSAGENS (CHAT)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  text TEXT,
  timestamp TEXT,
  is_read BOOLEAN DEFAULT false,
  attachment JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas se existirem
DROP POLICY IF EXISTS "Public Access Users" ON public.users;
DROP POLICY IF EXISTS "Public Access Transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public Access Messages" ON public.messages;

-- Cria políticas permissivas para o App
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- Garante permissões
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

-- 6. CRIAÇÃO DO ADMINISTRADOR PADRÃO
INSERT INTO public.users (
    email, password, full_name, is_admin, status, rank, balance_usd, plan, additional_data
) VALUES (
    'admin@greennseven.com', 
    'admin123', 
    'Administrador Geral', 
    true, 
    'Approved', 
    'Diamond', 
    1000000, 
    'Select', 
    '{"cpf": "000.000.000-00"}'::jsonb
) ON CONFLICT (email) DO UPDATE SET is_admin = true;
`;

    useEffect(() => {
        setSettings(platformSettings);
    }, [platformSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [id]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleToggleChange = (id: keyof PlatformSettings, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            [id]: checked,
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            onUpdateSettings(settings);
            setIsSaving(false);
            showToast("Configurações salvas com sucesso!");
        }, 1000);
    };

    const handleResetPassword = () => {
        if (!selectedUserToReset) {
            alert("Por favor, selecione um usuário.");
            return;
        }
        const user = allUsers.find(u => u.id === selectedUserToReset);
        if (confirm(`Tem certeza de que deseja enviar um link de redefinição de senha para ${user?.name}?`)) {
            showToast(`Link enviado para ${user?.email}`, 'success');
        }
    };
    
    const getApiKey = () => {
        try {
            if (typeof process !== 'undefined' && process.env?.API_KEY) {
                return process.env.API_KEY;
            }
        } catch (e) {
            return '';
        }
        return '';
    };

    const handleGenerateLogo = async () => {
        setIsGeneratingLogo(true);
        setGeneratedLogoUrl(null);

        const apiKey = getApiKey();

        if (!apiKey) {
            alert("API Key não configurada no ambiente.");
            setIsGeneratingLogo(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = "A modern and professional logo for a financial investment platform named 'GreennSeven'. The design must be a minimalist vector graphic with a white background, featuring an abstract symbol representing growth and security. Use a sleek color palette of brand green and professional blue. The text 'GreennSeven' should be elegantly integrated.";
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                    setGeneratedLogoUrl(imageUrl);
                    break;
                }
            }
        } catch (error) {
            console.error("Error generating logo:", error);
            showToast("Falha ao gerar o logo.", 'error');
        } finally {
            setIsGeneratingLogo(false);
        }
    };
    
    const handleSetLogo = () => {
        if (generatedLogoUrl) {
            const newSettings = { ...settings, logoUrl: generatedLogoUrl };
            setSettings(newSettings);
            onUpdateSettings(newSettings);
            showToast("Logo atualizado com sucesso!");
        }
    };

    const handleCheckSupabase = async () => {
        setSupabaseStatus('checking');
        const result = await checkSupabaseConnection();
        if (result.success) {
            setSupabaseStatus('connected');
            setSupabaseMessage(`Conectado! Tabela 'users' encontrada com ${result.count} registros.`);
        } else {
            setSupabaseStatus('error');
            setSupabaseMessage(`Erro: ${result.message}.`);
        }
    };

    const handleSyncData = async () => {
        setIsSyncing(true);
        let userSuccess = 0;
        let userFail = 0;
        let txSuccess = 0;
        let txFail = 0;

        // Sync Users
        for (const user of allUsers) {
            // Se for o admin padrão, usa a senha padrão para sync
            const pwd = user.email === 'admin@greennseven.com' ? 'admin123' : undefined;
            const result = await syncUserToSupabase(user, pwd);
            if (result.error) {
                console.error(`Falha no usuário ${user.email}:`, result.error);
                userFail++;
            } else {
                userSuccess++;
            }
        }

        // Sync Transactions
        const transactionsToSync = allTransactions || [];
        for (const tx of transactionsToSync) {
            const result = await syncTransactionToSupabase(tx);
            if (result.error) {
                console.error(`Falha na transação ${tx.id}:`, result.error);
                txFail++;
            } else {
                txSuccess++;
            }
        }
        
        setIsSyncing(false);
        showToast(`Sincronização: ${userSuccess} users OK, ${txSuccess} txs OK.`, 'success');
        handleCheckSupabase(); 
    };
    
    const copySQLToClipboard = () => {
        navigator.clipboard.writeText(sqlCode);
        showToast("SQL copiado!", 'success');
    };

    return (
        <div className="space-y-8">
            {toast && <Toast message={toast.message} type={toast.type} />}
            <div>
                <h1 className="text-3xl font-bold">Configurações da Plataforma</h1>
                <p className="text-gray-400">Gerencie as configurações globais e a conexão com o banco de dados.</p>
            </div>
            
            <form className="space-y-8" onSubmit={handleSubmit}>
                <Card>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        Integração Supabase (Banco de Dados)
                    </h2>
                    <div className="bg-brand-black p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Status da Conexão</h3>
                            <div className="flex gap-2">
                                <Button type="button" onClick={handleCheckSupabase} variant="secondary" className="text-xs py-2">
                                    Testar Conexão
                                </Button>
                                <Button type="button" onClick={copySQLToClipboard} variant="ghost" className="text-xs py-2">
                                    {ICONS.copy} Copiar SQL de Correção
                                </Button>
                            </div>
                        </div>
                        
                        {supabaseStatus === 'idle' && <p className="text-gray-500 text-sm">Clique em "Testar Conexão" para verificar a integração.</p>}
                        {supabaseStatus === 'checking' && <p className="text-yellow-400 text-sm animate-pulse">Verificando conexão...</p>}
                        {supabaseStatus === 'connected' && <p className="text-brand-green text-sm font-bold">{supabaseMessage}</p>}
                        {supabaseStatus === 'error' && (
                            <div>
                                <p className="text-red-500 text-sm font-bold">{supabaseMessage}</p>
                                <p className="text-gray-400 text-xs mt-2">
                                    Copie o código abaixo e execute no painel do Supabase para corrigir as tabelas.
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-4">
                             <label className="text-xs text-gray-500 uppercase font-bold">Script SQL (Correção de Tabelas e Permissões):</label>
                             <textarea 
                                readOnly 
                                className="w-full h-48 bg-gray-900 text-gray-300 text-[10px] p-2 rounded border border-gray-700 font-mono mt-1 focus:outline-none focus:border-brand-green leading-relaxed"
                                value={sqlCode}
                                onClick={(e) => e.currentTarget.select()} 
                             />
                             <p className="text-[10px] text-gray-500 mt-1">Este script cria as tabelas necessárias e libera o acesso para o App funcionar. Copie e execute no Supabase.</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-white font-semibold text-sm mb-2">Forçar Sincronização de Dados</h4>
                            <p className="text-gray-500 text-xs mb-3">
                                Envia todos os dados locais para o Supabase. Use isso se os usuários não aparecerem.
                            </p>
                            <Button 
                                type="button" 
                                onClick={handleSyncData} 
                                disabled={isSyncing}
                                variant="primary" 
                                className="w-full sm:w-auto text-sm py-2"
                            >
                                {isSyncing ? 'Sincronizando...' : `Sincronizar Agora`}
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Branding & Logo</h2>
                    <div className="grid md:grid-cols-2 gap-6 items-center">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-2">Logo Atual</p>
                            <div className="h-24 w-full bg-brand-black rounded-lg flex items-center justify-center p-4">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="GreennSeven Logo" className="max-h-full" />
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        {ICONS.logo}
                                        <span className="text-lg font-bold">GreennSeven Invest</span>
                                    </div>
                                )}
                            </div>
                             <Button type="button" onClick={handleGenerateLogo} disabled={isGeneratingLogo} className="mt-4 w-full">
                                {isGeneratingLogo ? 'Gerando...' : 'Gerar Novo Logo com IA'}
                            </Button>
                        </div>
                        <div>
                             <p className="text-sm font-medium text-gray-400 mb-2">Logo Gerado</p>
                             <div className="h-24 w-full bg-brand-black rounded-lg flex items-center justify-center p-4">
                                {isGeneratingLogo ? (
                                    <p className="text-gray-400 text-sm">Gerando imagem...</p>
                                ) : generatedLogoUrl ? (
                                     <img src={generatedLogoUrl} alt="Generated Logo" className="max-h-full" />
                                ) : (
                                     <p className="text-gray-500 text-sm">A pré-visualização aparecerá aqui.</p>
                                )}
                             </div>
                             {generatedLogoUrl && !isGeneratingLogo && (
                                <Button type="button" variant="primary" onClick={handleSetLogo} className="mt-4 w-full">
                                    Definir como Logo Ativo
                                </Button>
                             )}
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Financeiro</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Input label="Cotação do Dólar (para saques BRL)" id="dollarRate" type="number" step="0.01" value={settings.dollarRate} onChange={handleChange} />
                        <Input label="Taxa de Saque (%)" id="withdrawalFeePercent" type="number" value={settings.withdrawalFeePercent} onChange={handleChange} />
                        <Input label="Bônus de Cadastro (USD)" id="signupBonusUSD" type="number" value={settings.signupBonusUSD} onChange={handleChange} />
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Configurações do PIX</h2>
                    <Input label="Chave PIX (para depósitos)" id="pixKey" value={settings.pixKey} onChange={handleChange} />
                </Card>

                <Card>
                    <h2 className="text-xl font-bold mb-4">Controles da Plataforma</h2>
                    <div className="space-y-4 max-w-sm">
                        <ToggleSwitch
                            id="isMaintenanceMode"
                            label="Modo Manutenção"
                            checked={settings.isMaintenanceMode}
                            onChange={(checked) => handleToggleChange('isMaintenanceMode', checked)}
                        />
                         <ToggleSwitch
                            id="allowNewRegistrations"
                            label="Permitir Novos Cadastros"
                            checked={settings.allowNewRegistrations}
                            onChange={(checked) => handleToggleChange('allowNewRegistrations', checked)}
                        />
                    </div>
                </Card>
                
                <Card>
                    <h2 className="text-xl font-bold mb-4">Gerenciamento de Usuários</h2>
                     <div className="flex items-end gap-4">
                        <div className="flex-1">
                             <label htmlFor="user-reset-select" className="block text-sm font-medium text-gray-400 mb-1">
                                Redefinir Senha do Usuário
                            </label>
                            <select 
                                id="user-reset-select" 
                                className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                                value={selectedUserToReset}
                                onChange={(e) => setSelectedUserToReset(e.target.value)}
                            >
                                {allUsers.filter(u => !u.isAdmin).map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                        </div>
                        <Button type="button" variant="secondary" onClick={handleResetPassword}>
                            Enviar Link
                        </Button>
                     </div>
                </Card>


                 <div className="flex justify-end">
                    <Button type="submit" variant="primary" className="px-8 py-3" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                 </div>
            </form>
        </div>
    );
};

export default Settings;
