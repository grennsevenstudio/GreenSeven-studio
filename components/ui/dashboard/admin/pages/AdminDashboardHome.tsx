
import React from 'react';
import Card from '../../../../ui/Card';
import { ICONS } from '../../../../../constants';
import { TransactionStatus, type Transaction, type User } from '../../../../../types';

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

const ProfitChart = () => (
    <div className="h-48 flex items-end justify-between gap-2 px-4 pt-8 pb-2 bg-brand-black rounded-lg border border-gray-800 overflow-hidden">
        {[25, 40, 35, 50, 45, 60, 55, 75, 65, 85, 70, 95].map((h, i) => (
            <div key={i} className="w-full flex flex-col justify-end h-full group cursor-pointer">
                <div className="w-full bg-gradient-to-t from-brand-green/10 to-brand-green/40 rounded-t hover:to-brand-green/80 transition-all duration-300 relative" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-brand-black text-xs font-bold px-2 py-1 rounded transition-opacity shadow-lg z-10 whitespace-nowrap">
                        +${h}k
                    </div>
                </div>
            </div>
        ))}
    </div>
);

interface AdminDashboardHomeProps {
    allUsers: User[];
    allTransactions: Transaction[];
}

const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ allUsers, allTransactions }) => {
    const totalVolume = allUsers.reduce((sum, user) => sum + user.balanceUSD, 0);
    const totalUsers = allUsers.length;
    const pendingTransactions = allTransactions.filter(tx => tx.status === TransactionStatus.Pending).length;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Dashboard do Administrador</h1>
                <p className="text-gray-400">Visão geral da plataforma GreennSeven Invest.</p>
            </div>
            {/* Stats */}
            <div className="flex flex-col md:flex-row gap-6">
                <StatCard 
                    title="Volume Total Investido (USD)" 
                    value={`$ ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={ICONS.dollar} 
                />
                 <StatCard 
                    title="Total de Usuários Ativos" 
                    value={totalUsers.toLocaleString('en-US')}
                    icon={ICONS.adminUsers}
                />
                 <StatCard 
                    title="Transações Pendentes" 
                    value={pendingTransactions.toLocaleString('en-US')}
                    icon={ICONS.transactions}
                />
            </div>
            
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Projeção de Lucro Líquido (Anual)</h2>
                    <div className="flex gap-2">
                         <span className="flex items-center gap-1 text-xs text-gray-400"><div className="w-3 h-3 bg-brand-green/40 rounded"></div> Lucro Realizado</span>
                    </div>
                </div>
                <ProfitChart />
            </Card>
        </div>
    );
}

export default AdminDashboardHome;
