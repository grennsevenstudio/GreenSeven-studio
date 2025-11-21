
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

    // SQL Code Definition - Updated to include email, name, and password
    const sqlCode = `-- SCRIPT SQL PARA GEMINI STUDIO (Supabase)
-- Execute este script no SQL Editor do Supabase para configurar o banco de dados.

-- 1. Habilita extensão UUID (Necessário para gerar IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação/Atualização Tabela Users
-- Armazena Nome, Email, Senha e dados financeiros.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT,       -- Coluna para armazenar a senha
  full_name TEXT,      -- Coluna para o Nome Completo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adiciona colunas auxiliares garantindo que existam
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rank TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS balance_usd NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS capital_invested_usd NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS monthly_profit_usd NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_withdrawable_usd NUMERIC DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS additional_data JSONB; -- Dados extras (CPF, Endereço, etc)

-- 3. Criação/Atualização Tabela Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount_usd NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS amount_brl NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS withdrawal_details JSONB;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS referral_level NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_user_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS bonus_payout_handled BOOLEAN DEFAULT false;

-- 4. ATUALIZAÇÃO DE CACHE E PERMISSÕES
-- Força o PostgREST a reconhecer as novas colunas imediatamente
NOTIFY pgrst, 'reload schema';

-- Configuração de segurança (RLS) permissiva para funcionamento imediato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for users" ON public.users;
CREATE POLICY "Allow all access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access for transactions" ON public.transactions;
CREATE POLICY "Allow all access for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
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
            alert("Configurações salvas com sucesso!");
        }, 1000);
    };

    const handleResetPassword = () => {
        if (!selectedUserToReset) {
            alert("Por favor, selecione um usuário.");
            return;
        }
        const user = allUsers.find(u => u.id === selectedUserToReset);
        if (confirm(`Tem certeza de que deseja enviar um link de redefinição de senha para ${user?.name}?`)) {
            alert(`Link de redefinição de senha enviado para ${user?.email} (simulação).`);
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
            alert("Falha ao gerar o logo. Verifique o console para mais detalhes.");
        } finally {
            setIsGeneratingLogo(false);
        }
    };
    
    const handleSetLogo = () => {
        if (generatedLogoUrl) {
            const newSettings = { ...settings, logoUrl: generatedLogoUrl };
            setSettings(newSettings);
            onUpdateSettings(newSettings);
            alert("Logo atualizado com sucesso!");
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
            setSupabaseMessage(`Erro: ${result.message}. Verifique se a tabela 'users' foi criada no Supabase.`);
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
            const result = await syncUserToSupabase(user);
            if (result.error) {
                console.error(`Falha no usuário ${user.email}:`, JSON.stringify(result.error, null, 2));
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
                console.error(`Falha na transação ${tx.id}:`, JSON.stringify(result.error, null, 2));
                txFail++;
            } else {
                txSuccess++;
            }
        }
        
        setIsSyncing(false);
        alert(`Sincronização Completa!\n\nUsuários: ${userSuccess} OK / ${userFail} Falhas\nTransações: ${txSuccess} OK / ${txFail} Falhas\n\nVerifique o console (F12) para ver os erros detalhados.`);
        handleCheckSupabase(); 
    };
    
    const copySQLToClipboard = () => {
        navigator.clipboard.writeText(sqlCode);
        alert("Código SQL copiado para a área de transferência!");
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Configurações da Plataforma</h1>
                <p className="text-gray-400">Gerencie as configurações globais da GreennSeven Invest.</p>
            </div>
            
            <form className="space-y-8" onSubmit={handleSubmit}>
                <Card>
                    <h2 className="text-xl font-bold mb-4">Integração Banco de Dados (Supabase)</h2>
                    <div className="bg-brand-black p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Status da Conexão</h3>
                            <div className="flex gap-2">
                                <Button type="button" onClick={handleCheckSupabase} variant="secondary" className="text-xs py-2">
                                    Testar Conexão
                                </Button>
                                <Button type="button" onClick={copySQLToClipboard} variant="ghost" className="text-xs py-2">
                                    {ICONS.copy} Copiar SQL
                                </Button>
                            </div>
                        </div>
                        
                        {supabaseStatus === 'idle' && <p className="text-gray-500 text-sm">Clique em "Testar Conexão" para verificar a integração.</p>}
                        {supabaseStatus === 'checking' && <p className="text-yellow-400 text-sm animate-pulse">Verificando conexão...</p>}
                        {supabaseStatus === 'connected' && <p className="text-brand-green text-sm">{supabaseMessage}</p>}
                        {supabaseStatus === 'error' && (
                            <div>
                                <p className="text-red-500 text-sm font-bold">{supabaseMessage}</p>
                                <p className="text-gray-400 text-xs mt-2">
                                    Copie e execute o script SQL abaixo no Supabase para corrigir a estrutura.
                                </p>
                            </div>
                        )}
                        
                        <div className="mt-4">
                             <label className="text-xs text-gray-500 uppercase font-bold">Script SQL (Criação de Tabelas):</label>
                             <textarea 
                                readOnly 
                                className="w-full h-48 bg-gray-900 text-gray-300 text-[10px] p-2 rounded border border-gray-700 font-mono mt-1 focus:outline-none focus:border-brand-green leading-relaxed"
                                value={sqlCode}
                                onClick={(e) => e.currentTarget.select()} 
                             />
                             <p className="text-[10px] text-gray-500 mt-1">Copie e execute este script no Supabase para criar as colunas <strong>email</strong>, <strong>password</strong> e <strong>full_name</strong>.</p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-700">
                            <h4 className="text-white font-semibold text-sm mb-2">Sincronização de Dados</h4>
                            <p className="text-gray-500 text-xs mb-3">
                                Tenta reenviar todos os dados locais para o Supabase.
                            </p>
                            <Button 
                                type="button" 
                                onClick={handleSyncData} 
                                disabled={isSyncing}
                                variant="primary" 
                                className="w-full sm:w-auto text-sm py-2"
                            >
                                {isSyncing ? 'Sincronizando...' : `Sincronizar Dados com Supabase`}
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
