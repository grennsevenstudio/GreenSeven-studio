
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';
import type { User } from '../../../../../types';
import { formatCurrency } from '../../../../../lib/utils';

interface ManageBonusProps {
    allUsers: User[];
    onAdminUpdateUserBonus: (userId: string, amount: number, operation: 'add' | 'remove') => void;
}

const ManageBonus: React.FC<ManageBonusProps> = ({ allUsers, onAdminUpdateUserBonus }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [bonusAmount, setBonusAmount] = useState<{ [userId: string]: string }>({});

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(u => !u.isAdmin)
            .filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allUsers, searchTerm]);

    const handleAmountChange = (userId: string, val: string) => {
        setBonusAmount(prev => ({ ...prev, [userId]: val }));
    };

    const handleAction = (userId: string, operation: 'add' | 'remove') => {
        const amountStr = bonusAmount[userId];
        const amount = parseFloat(amountStr);
        
        if (isNaN(amount) || amount <= 0) {
            alert("Insira um valor válido maior que zero.");
            return;
        }

        onAdminUpdateUserBonus(userId, amount, operation);
        
        // Feedback visual simples
        alert(`${operation === 'add' ? 'Adicionado' : 'Removido'} ${formatCurrency(amount, 'USD')} de bônus com sucesso.`);
        setBonusAmount(prev => ({ ...prev, [userId]: '' }));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>

            <div>
                <h1 className="text-3xl font-bold">Gestão de Bônus</h1>
                <p className="text-gray-400">Ajuste manualmente o saldo de bônus de indicação dos usuários.</p>
            </div>

            <Card>
                <div className="mb-6 max-w-md">
                    <Input 
                        label="Buscar Usuário" 
                        id="search-bonus-user" 
                        placeholder="Nome ou Email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4 text-center">Bônus Atual</th>
                                <th className="p-4 text-center">Valor do Ajuste (USD)</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-brand-gray/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-gray-700" />
                                                <div>
                                                    <p className="font-bold text-white text-sm">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono text-brand-green font-bold">
                                                {formatCurrency(user.bonusBalanceUSD || 0, 'USD')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="max-w-[120px] mx-auto">
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full bg-brand-black border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-green font-mono"
                                                    value={bonusAmount[user.id] || ''}
                                                    onChange={(e) => handleAmountChange(user.id, e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="primary" 
                                                    className="px-3 py-2 text-xs h-9"
                                                    onClick={() => handleAction(user.id, 'add')}
                                                    title="Adicionar Bônus"
                                                >
                                                    + Crédito
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    className="px-3 py-2 text-xs h-9 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                                                    onClick={() => handleAction(user.id, 'remove')}
                                                    title="Remover Bônus"
                                                >
                                                    - Débito
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="bg-brand-blue/10 border border-brand-blue/20 p-4 rounded-xl flex gap-4 items-start">
                <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
                    {ICONS.alert}
                </div>
                <div>
                    <h4 className="text-brand-blue font-bold text-sm uppercase">Nota Importante</h4>
                    <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                        Alterações manuais de bônus impactam diretamente o saldo disponível para saque do usuário e seu volume total de rede (Patente). Todas as movimentações são registradas nos registros de auditoria da plataforma.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ManageBonus;
