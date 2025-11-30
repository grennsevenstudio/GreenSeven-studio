import React, { useMemo, useState, useEffect } from 'react';
import type { User, Transaction, Language } from '../../../../../types';
import { TransactionStatus, TransactionType, InvestorRank } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { ICONS, RANK_COLORS } from '../../../../../constants';
import { formatCurrency } from '../../../../../lib/utils';
import { TRANSLATIONS } from '../../../../../lib/translations';

interface CareerPlanProps {
    user: User;
    allUsers?: User[];
    allTransactions?: Transaction[];
    language: Language;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color?: string }> = ({ title, value, icon, color = "text-brand-green" }) => (
    <Card className="flex-1 border-gray-800 bg-brand-black/50 hover:bg-brand-gray/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`p-4 bg-brand-black rounded-xl border border-gray-800 ${color} shadow-lg shadow-black/50`}>{icon}</div>
            <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{title}</p>
                <p className="text-2xl font-bold text-white mt-1">{value}</p>
            </div>
        </div>
    </Card>
);

const LevelCard: React.FC<{ level: number, percentage: number, color: string, description: string }> = ({ level, percentage, color, description }) => (
    <div className="relative group overflow-hidden rounded-2xl bg-brand-gray border border-gray-800 p-6 transition-all duration-300 hover:border-brand-green/30 hover:shadow-xl hover:shadow-brand-green/5">
        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl bg-brand-black border-l border-b border-gray-800 ${color.replace('bg-', 'text-')}`}>
            <span className="font-black text-xl">{percentage}%</span>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mb-4 shadow-inner ${color}`}>
            {level}º
        </div>
        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-brand-green transition-colors">Nível {level}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
);

const RankProgress: React.FC<{ user: User }> = ({ user }) => {
    const rankDetails: {[key in InvestorRank]: { next: InvestorRank | null, threshold: number, icon: any }} = {
        [InvestorRank.Bronze]: { next: InvestorRank.Silver, threshold: 1000, icon: '🥉' },
        [InvestorRank.Silver]: { next: InvestorRank.Gold, threshold: 5000, icon: '🥈' },
        [InvestorRank.Gold]: { next: InvestorRank.Platinum, threshold: 20000, icon: '🥇' },
        [InvestorRank.Platinum]: { next: InvestorRank.Diamond, threshold: 100000, icon: '💎' },
        [InvestorRank.Diamond]: { next: null, threshold: Infinity, icon: '👑' },
    };

    const currentRank = rankDetails[user.rank] || rankDetails[InvestorRank.Bronze];
    const progress = Math.min((user.balanceUSD / currentRank.threshold) * 100, 100);
    const nextRankName = currentRank.next;

    return (
        <Card className="bg-gradient-to-br from-brand-gray to-brand-black border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Patente Atual</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${RANK_COLORS[user.rank]}`}>
                        <span className="text-lg">{currentRank.icon}</span>
                        <span className="font-bold text-sm uppercase tracking-wider">{user.rank}</span>
                    </div>
                </div>
                {nextRankName && (
                    <div className="text-right">
                        <p className="text-sm text-gray-400 font-medium mb-1">Próxima Patente</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-700 bg-gray-800 text-gray-300">
                            <span className="font-bold text-sm uppercase tracking-wider">{nextRankName}</span>
                        </div>
                    </div>
                )}
            </div>

            {nextRankName ? (
                <div className="relative z-10">
                    <div className="flex justify-between text-xs font-semibold text-gray-400 mb-2">
                        <span>Progresso para {nextRankName}</span>
                        <span className="text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-black rounded-full h-3 border border-gray-800 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-brand-green to-brand-blue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,255,156,0.5)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">
                        Faltam <span className="text-brand-green font-bold">{formatCurrency(Math.max(0, currentRank.threshold - user.balanceUSD), 'USD')}</span> de volume
                    </p>
                </div>
            ) : (
                <div className="text-center py-4 relative z-10">
                    <p className="text-brand-green font-bold text-lg">Parabéns! Você alcançou o topo.</p>
                    <p className="text-sm text-gray-400">Você é um líder Diamond na GreennSeven.</p>
                </div>
            )}
        </Card>
    );
};

const CareerPlan: React.FC<CareerPlanProps> = ({ user, allUsers = [], allTransactions = [], language }) => {
    const [referralCode] = useState(user.referralCode);
    const [prevBonusCount, setPrevBonusCount] = useState(0);
    const t = TRANSLATIONS[language] || TRANSLATIONS['pt'];
    
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

    // Effect to detect new bonuses and animate
    useEffect(() => {
        if (bonusHistory.length > prevBonusCount) {
            // In a real app, we might show a confetti or specific toast here
            setPrevBonusCount(bonusHistory.length);
        }
    }, [bonusHistory.length, prevBonusCount]);

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        alert('Código copiado para a área de transferência!');
    };

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-0">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes flash-green {
                    0% { color: inherit; transform: scale(1); }
                    50% { color: #00FF9C; transform: scale(1.1); text-shadow: 0 0 10px rgba(0,255,156,0.5); }
                    100% { color: inherit; transform: scale(1); }
                }
                .animate-flash {
                    animation: flash-green 1s ease-in-out;
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{t.career_title}</h1>
                    <p className="text-gray-400 mt-1">{t.career_subtitle}</p>
                </div>
                <div className="px-4 py-2 bg-brand-green/10 border border-brand-green/30 rounded-lg">
                    <span className="text-brand-green font-bold text-sm uppercase tracking-wider">{t.unilevel_system}</span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress to Next Rank */}
                    <RankProgress user={user} />

                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <StatCard 
                            title={t.direct_referrals} 
                            value={referralsCount.toString()} 
                            icon={ICONS.adminUsers} 
                            color="text-brand-blue"
                        />
                        <StatCard 
                            title={t.total_bonus} 
                            value={formatCurrency(totalBonus, 'USD')} 
                            icon={ICONS.dollar}
                            color="text-brand-green"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Share Code - Ticket Style */}
                    <div className="bg-brand-green p-1 rounded-2xl shadow-xl shadow-brand-green/10 transform transition-transform hover:scale-[1.02]">
                        <div className="bg-brand-black rounded-xl p-6 border-2 border-brand-green border-dashed relative overflow-hidden">
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-green rounded-full"></div>
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-green rounded-full"></div>
                            
                            <p className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">{t.share_code_title}</p>
                            <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 text-center mb-4">
                                <p className="text-3xl font-mono font-black text-brand-green tracking-widest">{referralCode}</p>
                            </div>
                            <Button onClick={copyCode} fullWidth variant="primary">
                                {ICONS.copy} {t.copy_code}
                            </Button>
                        </div>
                    </div>

                    {/* Levels */}
                    <div className="space-y-3">
                        <LevelCard 
                            level={1} 
                            percentage={5} 
                            color="bg-brand-green text-brand-black" 
                            description={t.level_1_desc}
                        />
                        <LevelCard 
                            level={2} 
                            percentage={3} 
                            color="bg-brand-blue text-brand-black" 
                            description={t.level_2_desc}
                        />
                        <LevelCard 
                            level={3} 
                            percentage={1} 
                            color="bg-purple-500 text-white" 
                            description={t.level_3_desc}
                        />
                    </div>
                </div>
            </div>

            {/* Bonus History Table */}
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-brand-green/10 rounded-lg text-brand-green">
                        {ICONS.history}
                    </div>
                    <h2 className="text-xl font-bold">{t.bonus_history_title}</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4 rounded-tl-lg">{t.bonus_date}</th>
                                <th className="p-4">{t.bonus_origin}</th>
                                <th className="p-4">{t.bonus_level}</th>
                                <th className="p-4 rounded-tr-lg text-right">{t.bonus_value}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bonusHistory.length > 0 ? (
                                bonusHistory.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-800 hover:bg-brand-gray/30 transition-colors">
                                        <td className="p-4 text-gray-300 text-sm">
                                            {new Date(item.date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 font-medium text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-300">
                                                {item.sourceName.charAt(0)}
                                            </div>
                                            {item.sourceName}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                item.level === 1 ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' : 
                                                item.level === 2 ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                            }`}>
                                                Nível {item.level}
                                            </span>
                                        </td>
                                        <td className={`p-4 font-bold text-right text-brand-green ${index === 0 && prevBonusCount < bonusHistory.length ? 'animate-flash' : ''}`}>
                                            + {formatCurrency(item.amount, 'USD')}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500 gap-3">
                                            <div className="p-4 bg-gray-800 rounded-full opacity-50">
                                                {React.cloneElement(ICONS.adminUsers as React.ReactElement<any>, { className: "w-8 h-8" })}
                                            </div>
                                            <p className="italic">{t.no_bonus}</p>
                                            <p className="text-sm text-gray-600">{t.share_to_earn}</p>
                                        </div>
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