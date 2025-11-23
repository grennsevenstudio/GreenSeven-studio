
import React, { useMemo, useState } from 'react';
import type { User, Transaction } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { ICONS } from '../../../../../constants';
import { formatCurrency } from '../../../../../lib/utils';

interface CareerPlanProps {
    user: User;
    allUsers?: User[];
    allTransactions?: Transaction[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = "text-brand-green" }) => (
    <Card className="flex-1">
        <div className="flex items-center gap-4">
            <div className={`p-3 bg-brand-black rounded-lg ${color}`}>{icon}</div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </Card>
);

const LevelCard: React.FC<{ level: number, percentage: number, color: string, description: string }> = ({ level, percentage, color, description }) => (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl border border-gray-800 bg-brand-black/30 text-center hover:bg-brand-black/50 transition-colors`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4 ${color}`}>
            {level}º
        </div>
        <h3 className="text-white font-bold text-lg mb-1">{percentage}% de Comissão</h3>
        <p className="text-sm text-gray-400">{description}</p>
    </div>
);

const InfiniteWidthExplanation: React.FC = () => (
    <Card className="bg-gradient-to-r from-brand-black to-brand-gray border border-gray-800">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {React.cloneElement(ICONS.career as React.ReactElement<any>, { className: "h-6 w-6 text-brand-green" })}
                    Lateralidade Infinita
                </h3>
                <p className="text-gray-300 leading-relaxed">
                    Na <span className="text-brand-green font-bold">GreennSeven</span>, o céu é o limite. Você pode indicar <strong>quantas pessoas quiser</strong> diretamente através do seu código (Nível 1). 
                    Não há travas, não há limites. Quanto mais você expande sua lateralidade, maiores são seus ganhos residuais sobre a rede.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                        Indique 10, 100 ou 1.000 amigos diretos.
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                        Ganhe 5% sobre o primeiro depósito de TODOS os seus diretos.
                    </li>
                </ul>
            </div>
            
            {/* Visual Representation of Lateral Structure */}
            <div className="flex-1 flex justify-center py-4">
                <div className="relative flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-brand-green flex items-center justify-center text-brand-black font-bold z-10 shadow-lg shadow-brand-green/20">
                        VOCÊ
                    </div>
                    <div className="w-px h-8 bg-gray-600"></div>
                    <div className="h-px w-48 bg-gray-600 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    </div>
                    
                    <div className="flex gap-2 justify-center mt-0 pt-2 overflow-x-auto pb-2 max-w-[300px] md:max-w-full no-scrollbar">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[40px]">
                                <div className="w-px h-6 bg-gray-600 -mt-2 mb-1"></div>
                                <div className="w-10 h-10 rounded-full bg-gray-800 border border-brand-green/30 flex items-center justify-center text-xs text-gray-400">
                                    {i + 1}
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-col items-center min-w-[40px]">
                             <div className="w-px h-6 bg-gray-600 -mt-2 mb-1"></div>
                             <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-xl text-brand-green font-bold">
                                ∞
                             </div>
                        </div>
                    </div>
                    <p className="text-xs text-brand-green mt-4 font-bold uppercase tracking-wider">Infinitos Diretos</p>
                </div>
            </div>
        </div>
    </Card>
);

const CareerPlan: React.FC<CareerPlanProps> = ({ user, allUsers = [], allTransactions = [] }) => {
    const [referralCode] = useState(user.referralCode);
    
    // Calculate total referrals count
    const referralsCount = useMemo(() => {
        return (allUsers || []).filter(u => u.referredById === user.id).length;
    }, [allUsers, user.id]);

    // Calculate total bonus earned
    const totalBonus = useMemo(() => {
        return (allTransactions || [])
            .filter(tx => tx.userId === user.id && tx.type === TransactionType.Bonus && tx.status === TransactionStatus.Completed)
            .reduce((acc, curr) => acc + curr.amountUSD, 0);
    }, [allTransactions, user.id]);

    // Bonus History List
    const bonusHistory = useMemo(() => {
        return (allTransactions || [])
            .filter(tx => tx.userId === user.id && tx.type === TransactionType.Bonus && tx.status === TransactionStatus.Completed)
            .map(tx => {
                const sourceUser = tx.sourceUserId ? (allUsers || []).find(u => u.id === tx.sourceUserId) : null;
                return {
                    id: tx.id,
                    date: tx.date,
                    amount: tx.amountUSD,
                    level: tx.referralLevel || 1,
                    sourceName: sourceUser ? sourceUser.name : 'Usuário Desconhecido'
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allTransactions, user.id, allUsers]);

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        alert('Código copiado para a área de transferência!');
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div>
                <h1 className="text-3xl font-bold">Plano de Carreira</h1>
                <p className="text-gray-400">Expanda sua rede e ganhe comissões em 3 níveis de profundidade.</p>
            </div>

            {/* Stats Overview */}
            <div className="flex flex-col md:flex-row gap-6">
                 <StatCard 
                    title="Total de Indicações Diretas" 
                    value={referralsCount.toString()} 
                    icon={ICONS.adminUsers} 
                />
                 <StatCard 
                    title="Bônus Totais Recebidos" 
                    value={formatCurrency(totalBonus, 'USD')} 
                    icon={ICONS.dollar}
                />
            </div>

            {/* Referral Code Section */}
            <Card className="border-brand-green/30 bg-gradient-to-br from-brand-gray to-brand-black">
                <div className="text-center max-w-2xl mx-auto py-4">
                    <h2 className="text-2xl font-bold text-white mb-2">Compartilhe seu Código</h2>
                    <p className="text-gray-400 mb-6">
                        Envie este código para seus amigos. Quando eles se cadastrarem, devem inseri-lo no campo "Código de Indicação" para que você receba seus bônus.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/40 p-2 rounded-xl border border-gray-700">
                        <div className="flex-1 w-full text-center sm:text-left pl-4">
                             <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">SEU CÓDIGO</span>
                             <p className="text-3xl font-mono font-bold text-brand-green tracking-widest">{referralCode}</p>
                        </div>
                        <Button onClick={copyCode} className="w-full sm:w-auto h-12 px-8">
                            {ICONS.copy} Copiar Código
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Levels Visualization */}
            <div>
                <h2 className="text-xl font-bold mb-4">Estrutura de Ganhos</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <LevelCard 
                        level={1} 
                        percentage={5} 
                        color="bg-brand-green text-brand-black" 
                        description="Bônus sobre o primeiro depósito dos seus indicados diretos."
                    />
                    <LevelCard 
                        level={2} 
                        percentage={3} 
                        color="bg-brand-blue text-brand-black" 
                        description="Bônus sobre os indicados dos seus amigos (Amigos dos amigos)."
                    />
                    <LevelCard 
                        level={3} 
                        percentage={1} 
                        color="bg-purple-500 text-white" 
                        description="Bônus sobre o terceiro nível da sua rede."
                    />
                </div>
            </div>

            {/* Infinite Width Explanation */}
            <InfiniteWidthExplanation />

            {/* Bonus History Table */}
            <Card>
                <h2 className="text-xl font-bold mb-6">Extrato de Bônus</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Data</th>
                                <th className="p-4">Gerado Por</th>
                                <th className="p-4">Nível</th>
                                <th className="p-4 rounded-tr-lg">Valor (USD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bonusHistory.length > 0 ? (
                                bonusHistory.map(item => (
                                    <tr key={item.id} className="border-b border-gray-800 hover:bg-brand-gray/30 transition-colors">
                                        <td className="p-4 text-gray-300">{item.date}</td>
                                        <td className="p-4 font-medium text-white">{item.sourceName}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                item.level === 1 ? 'bg-brand-green/20 text-brand-green' : 
                                                item.level === 2 ? 'bg-brand-blue/20 text-brand-blue' : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {item.level}º Nível
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-brand-green">
                                            + {formatCurrency(item.amount, 'USD')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                                        Você ainda não recebeu bônus de indicação. Compartilhe seu código para começar a ganhar!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CareerPlan;
