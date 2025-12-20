
import React, { useMemo, useState } from 'react';
import type { User, InvestmentPlan } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Modal from '../../../../layout/Modal';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';
import { formatCurrency } from '../../../../../lib/utils';

interface ProfitProjectionProps {
    allUsers: User[];
    investmentPlans: InvestmentPlan[];
    onAdminUpdateUserProfit: (userId: string, newProfit: number) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="flex-1">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-black rounded-lg text-brand-green">{icon}</div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </Card>
);

const ProfitProjection: React.FC<ProfitProjectionProps> = ({ allUsers, investmentPlans, onAdminUpdateUserProfit }) => {
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newProfitValue, setNewProfitValue] = useState('');

    const projectionData = useMemo(() => {
        const activeInvestors = allUsers.filter(u => !u.isAdmin && u.capitalInvestedUSD > 0);
        
        const totalProjectedProfit = activeInvestors.reduce((sum, user) => sum + user.monthlyProfitUSD, 0);
        
        const totalInvestedCapital = activeInvestors.reduce((sum, user) => sum + user.capitalInvestedUSD, 0);

        const breakdownByPlan = investmentPlans.map(plan => {
            const usersInPlan = activeInvestors.filter(u => u.plan === plan.name);
            const totalCapitalInPlan = usersInPlan.reduce((sum, u) => sum + u.capitalInvestedUSD, 0);
            const totalProfitInPlan = usersInPlan.reduce((sum, u) => sum + u.monthlyProfitUSD, 0);
            return {
                ...plan,
                userCount: usersInPlan.length,
                totalCapital: totalCapitalInPlan,
                totalProfit: totalProfitInPlan,
            };
        });

        return {
            activeInvestors,
            totalProjectedProfit,
            totalInvestedCapital,
            breakdownByPlan,
        };
    }, [allUsers, investmentPlans]);
    
    const handleSaveProfit = () => {
        if (editingUser) {
            const newProfit = parseFloat(newProfitValue);
            if (!isNaN(newProfit) && newProfit >= 0) {
                onAdminUpdateUserProfit(editingUser.id, newProfit);
                setEditingUser(null);
                setNewProfitValue('');
            } else {
                alert('Por favor, insira um valor numérico válido.');
            }
        }
    };

    return (
        <div className="space-y-8">
            <Modal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                title={`Editar Projeção de ${editingUser?.name}`}
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                        Ajuste manualmente o valor da projeção de lucro mensal para este usuário. O valor original baseado no plano e capital é de {editingUser ? formatCurrency(editingUser.capitalInvestedUSD * ((investmentPlans.find(p => p.name === editingUser.plan) || investmentPlans[0]).returnRate), 'USD') : ''}.
                    </p>
                    <Input
                        label="Novo Lucro Mensal Projetado (USD)"
                        id="new-profit"
                        type="number"
                        value={newProfitValue}
                        onChange={(e) => setNewProfitValue(e.target.value)}
                        placeholder="Ex: 150.75"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button>
                        <Button onClick={handleSaveProfit}>Salvar Alterações</Button>
                    </div>
                </div>
            </Modal>
            <div>
                <h1 className="text-3xl font-bold">Projeção de Lucro Mensal</h1>
                <p className="text-gray-400">Estimativa de lucro a ser pago aos investidores com base no capital e planos atuais.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Lucro Mensal Projetado" 
                    value={formatCurrency(projectionData.totalProjectedProfit, 'USD')}
                    icon={ICONS.trendingUp} 
                />
                 <StatCard 
                    title="Capital Investido Ativo" 
                    value={formatCurrency(projectionData.totalInvestedCapital, 'USD')}
                    icon={ICONS.dollar}
                />
                 <StatCard 
                    title="Investidores Ativos" 
                    value={projectionData.activeInvestors.length.toString()}
                    icon={ICONS.adminUsers}
                />
            </div>
            
            {/* Breakdown by Plan */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Detalhes por Plano</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {projectionData.breakdownByPlan.map(planData => (
                        <div key={planData.id} className="bg-brand-black p-4 rounded-lg border border-gray-800">
                            <h3 className={`font-bold ${planData.color}`}>{planData.name}</h3>
                            <div className="mt-2 space-y-2 text-sm">
                                <p className="flex justify-between">
                                    <span className="text-gray-400">Usuários:</span> 
                                    <span className="font-semibold text-white">{planData.userCount}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-400">Capital:</span> 
                                    <span className="font-semibold text-white">{formatCurrency(planData.totalCapital, 'USD')}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-400">Lucro Projetado:</span> 
                                    <span className="font-semibold text-brand-green">{formatCurrency(planData.totalProfit, 'USD')}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* User List */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Projeção por Usuário</h2>
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs sticky top-0">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Plano</th>
                                <th className="p-4 text-right">Capital Investido (USD)</th>
                                <th className="p-4 text-right">Lucro Mensal (USD)</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectionData.activeInvestors.sort((a,b) => b.monthlyProfitUSD - a.monthlyProfitUSD).map(user => (
                                <tr key={user.id} className="border-b border-gray-800 hover:bg-brand-gray/50">
                                    <td className="p-4 font-medium text-white">{user.name}</td>
                                    <td className="p-4 text-gray-300">{user.plan}</td>
                                    <td className="p-4 text-right text-gray-300 font-mono">{formatCurrency(user.capitalInvestedUSD, 'USD')}</td>
                                    <td className="p-4 text-right text-brand-green font-bold font-mono">{formatCurrency(user.monthlyProfitUSD, 'USD')}</td>
                                    <td className="p-4 text-right">
                                        <Button 
                                            variant="ghost" 
                                            className="px-3 py-1 text-xs"
                                            onClick={() => {
                                                setEditingUser(user);
                                                setNewProfitValue(user.monthlyProfitUSD.toFixed(2));
                                            }}
                                        >
                                            Editar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProfitProjection;