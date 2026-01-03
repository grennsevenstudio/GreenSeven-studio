
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Transaction, Stock, Language, PlatformSettings } from '../../../../../types';
import { TransactionType, TransactionStatus } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { ICONS, MOCK_STOCKS, INVESTMENT_PLANS } from '../../../../../constants';
import { TRANSLATIONS } from '../../../../../lib/translations';
import { formatCurrency } from '../../../../../lib/utils';

interface DashboardHomeProps {
    user: User;
    transactions: Transaction[];
    onAddTransaction: (newTransaction: Pick<Transaction, Exclude<keyof Transaction, 'id' | 'date' | 'bonusPayoutHandled'>>, userUpdate?: Partial<User>) => void;
    setActiveView: (view: string) => void;
    language: Language;
    onRefreshData?: () => Promise<void>;
    platformSettings: PlatformSettings;
    onDepositClick: () => void;
    onWithdrawClick: () => void;
    liveDailyProfit: number;
    liveBonus: number;
    liveTodayEarnings: number;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; subValue?: React.ReactNode; highlight?: boolean; locked?: boolean }> = ({ title, value, icon, subValue, highlight = false, locked = false }) => {
    const borderGradient = highlight 
        ? 'from-brand-green via-brand-green/50 to-brand-gray' 
        : locked 
            ? 'from-gray-700 via-gray-800 to-gray-900'
            : 'from-brand-blue/30 via-brand-gray to-brand-gray/30';

    return (
        <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${borderGradient} transition-all duration-300 hover:shadow-lg hover:shadow-brand-green/10 transform hover:-translate-y-1 h-full`}>
            <div className="bg-brand-gray rounded-[14px] p-4 sm:p-5 h-full flex flex-col relative overflow-hidden group">
                {highlight && (
                    <>
                        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-green/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-black/20 rounded-full"></div>
                    </>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <p className="font-medium text-gray-300 text-sm sm:text-base">{title}</p>
                    <div className={`transition-colors ${highlight ? 'text-brand-green' : 'text-gray-500 group-hover:text-brand-green'}`}>
                        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                    </div>
                </div>
                
                <div className="z-10 mt-auto">
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-2 break-words">{value}</div>
                    {subValue && typeof subValue === 'string' ? (
                        <div className="text-xs sm:text-sm text-gray-500 font-medium">{subValue}</div>
                    ) : (
                        subValue
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    let icon, colorClass, bgClass, label;
    switch (tx.type) {
        case TransactionType.Deposit:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
            colorClass = 'text-brand-green';
            bgClass = 'bg-brand-green/10';
            label = 'Depósito';
            break;
        case TransactionType.Withdrawal:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
            colorClass = 'text-red-400';
            bgClass = 'bg-red-400/10';
            label = 'Saque';
            break;
        case TransactionType.Bonus:
            icon = ICONS.dollar;
            colorClass = 'text-brand-blue';
            bgClass = 'bg-brand-blue/10';
            label = 'Bônus';
            break;
        default:
            icon = ICONS.history;
            colorClass = 'text-gray-400';
            bgClass = 'bg-gray-800';
            label = tx.type;
    }
    const statusMap: {[key in TransactionStatus]: { text: string, color: string }} = {
        [TransactionStatus.Completed]: { text: 'Autorizado', color: 'bg-brand-green/20 text-brand-green border border-brand-green/30' },
        [TransactionStatus.Pending]: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
        [TransactionStatus.Failed]: { text: 'Recusado', color: 'bg-red-500/20 text-red-400' },
        [TransactionStatus.Scheduled]: { text: 'Agendado', color: 'bg-blue-500/20 text-brand-blue' },
    };
    const statusInfo = statusMap[tx.status] || { text: tx.status, color: 'bg-gray-800 text-gray-400' };
    
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full ${bgClass} ${colorClass}`}>{icon}</div>
                <div>
                    <p className="font-bold text-white text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-sm ${tx.type === TransactionType.Withdrawal ? 'text-red-400' : 'text-brand-green'}`}>
                    {tx.type === TransactionType.Withdrawal ? '-' : '+'} {formatCurrency(Math.abs(tx.amountUSD), 'USD')}
                </p>
                <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusInfo.color}`}>
                    {statusInfo.text}
                </span>
            </div>
        </div>
    );
};

const StockTickerItem: React.FC<{ stock: Stock }> = ({ stock }) => {
    const isPositive = stock.change > 0;
    const colorClass = isPositive ? 'text-brand-green' : 'text-red-500';
    const icon = isPositive ? ICONS.stockUp : ICONS.stockDown;
    const priceRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (priceRef.current) {
            priceRef.current.classList.add('flash');
            const timer = setTimeout(() => priceRef.current?.classList.remove('flash'), 500);
            return () => clearTimeout(timer);
        }
    }, [stock.price]);

    return (
        <div className="p-2 sm:p-3 bg-brand-black/50 rounded-xl border border-gray-800"> 
            <div className="flex justify-between items-center gap-2">
                <div className="min-w-0">
                    <p className="font-bold text-gray-300 text-xs sm:text-sm truncate">{stock.symbol}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{stock.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p ref={priceRef} className="font-mono text-white text-xs sm:text-sm transition-colors duration-300">${stock.price.toFixed(2)}</p>
                    <p className={`text-[10px] sm:text-xs font-semibold flex items-center justify-end gap-0.5 ${colorClass}`}>
                        {icon} {Math.abs(stock.change).toFixed(2)}%
                    </p>
                </div>
            </div>
        </div>
    );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, transactions, onAddTransaction, setActiveView, language, onRefreshData, platformSettings, onDepositClick, onWithdrawClick, liveDailyProfit, liveBonus, liveTodayEarnings }) => {
    const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    
    const dollarRate = platformSettings.dollarRate || 5.50;

    const t = TRANSLATIONS[language] || TRANSLATIONS['pt'];

    // Mask helper
    const maskValue = (val: string) => isBalanceVisible ? val : '••••••';

    const recentTransactions = transactions
        .filter(t => 
            t.type === TransactionType.Deposit || 
            t.type === TransactionType.Withdrawal || 
            t.type === TransactionType.Bonus
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); 

    // Pending Deposits Calculation for visual indicator
    const pendingDepositAmount = useMemo(() => {
        return transactions
            .filter(tx => tx.type === TransactionType.Deposit && tx.status === TransactionStatus.Pending)
            .reduce((acc, tx) => acc + tx.amountUSD, 0);
    }, [transactions]);

    // Simulate stock updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStocks(prevStocks => prevStocks.map(stock => {
                const change = (Math.random() - 0.5) * 2;
                const newPrice = Math.max(0.01, stock.price + change);
                const changePercent = ((newPrice - stock.price) / stock.price) * 100;
                return { ...stock, price: newPrice, change: change, changePercent: changePercent };
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const currentPlanObj = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
    const estimatedProfit30DaysBRL = (user.capitalInvestedUSD * currentPlanObj.returnRate) * dollarRate;

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in p-4 sm:p-0 pb-20">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .flash { color: #fff; text-shadow: 0 0 5px #fff; }
            `}</style>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-blue">
                            {t.financial_dashboard}
                        </h1>
                        <button 
                            onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
                            title={isBalanceVisible ? "Ocultar valores" : "Mostrar valores"}
                        >
                            {isBalanceVisible ? ICONS.eye : ICONS.eyeSlash}
                        </button>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base">{t.dashboard_subtitle}</p>
                </div>
            </div>

            {/* Visual Indicator of Pending Deposits - REQUESTED FEATURE */}
            {pendingDepositAmount > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-center gap-4 animate-pulse-slow">
                    <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-500">
                        {ICONS.refresh}
                    </div>
                    <div>
                        <p className="text-yellow-500 font-bold text-sm uppercase">Depósitos Aguardando Autorização</p>
                        <p className="text-white text-xs">O administrador está analisando <span className="font-black text-brand-green">{formatCurrency(pendingDepositAmount, 'USD')}</span> enviados por você.</p>
                    </div>
                </div>
            )}

            {/* Wallet Cards Grid - Adjusted for Mobile Stacking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <StatCard 
                    title={t.total_balance} 
                    value={maskValue(formatCurrency(user.capitalInvestedUSD, 'USD'))} 
                    icon={ICONS.dollar} 
                    subValue={t.invested_total}
                />
                <StatCard 
                    title={t.available_withdraw} 
                    value={maskValue(formatCurrency(liveDailyProfit, 'USD'))} 
                    icon={ICONS.withdraw} 
                    subValue={t.daily_yields}
                    highlight
                />
                <StatCard 
                    title={t.bonus_available} 
                    value={maskValue(formatCurrency(liveBonus, 'USD'))} 
                    icon={ICONS.userPlus} 
                    subValue={t.bonus_desc}
                    highlight
                />
                <Card className="h-full flex flex-col justify-center">
                    <div className="space-y-2">
                        <p className="text-gray-400 text-sm font-medium">{t.projected_profit} ({user.plan}):</p>
                        <p className="text-xl sm:text-2xl font-bold text-brand-green">
                            {isBalanceVisible ? `+${formatCurrency(user.monthlyProfitUSD, 'USD')}` : '+ ••••••'}
                        </p>
                        <div className="h-px bg-gray-800 my-2"></div>
                        <p className="text-xs text-gray-500">{t.projection_30_days} (BRL):</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-300">
                            ≈ {maskValue(formatCurrency(estimatedProfit30DaysBRL, 'BRL'))}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Live Earnings Ticker */}
            <div className="bg-brand-black border border-gray-800 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-green animate-pulse"></div>
                <div>
                    <p className="text-gray-400 text-sm mb-1">{t.earnings_today} (Live)</p>
                    <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter transition-all duration-300">
                        {maskValue(formatCurrency(liveTodayEarnings, 'USD'))}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-brand-green/10 px-3 py-1.5 rounded-full border border-brand-green/20">
                    <div className="w-2 h-2 bg-brand-green rounded-full animate-ping"></div>
                    <span className="text-brand-green font-bold text-xs uppercase tracking-wider">{t.live}</span>
                    <span className="text-brand-green text-xs hidden sm:inline">| {t.accumulating}</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-brand-gray to-brand-black border border-gray-800 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t.quick_actions_title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button onClick={onDepositClick} className="h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg shadow-brand-green/20">
                        {ICONS.deposit} {t.deposit}
                    </Button>
                    <Button onClick={onWithdrawClick} variant="secondary" className="h-12 sm:h-14 text-base sm:text-lg font-bold border-gray-700 hover:border-gray-500">
                        {ICONS.withdraw} {t.withdraw}
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Market Overview */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {ICONS.trendingUp} {t.market_title}
                        </h3>
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold uppercase">{t.live}</span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                        {stocks.map(stock => (
                            <StockTickerItem key={stock.symbol} stock={stock} />
                        ))}
                    </div>
                    <Button 
                        fullWidth 
                        variant="ghost" 
                        className="text-sm mt-2" 
                        onClick={() => window.location.href = 'https://br.investing.com'}
                    >
                        {t.access_market} &rarr;
                    </Button>
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-gray-800 bg-brand-black/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{t.recent_transactions}</h3>
                            <button onClick={() => setActiveView('transactions')} className="text-brand-green text-sm hover:underline">Ver todas</button>
                        </div>
                        <div className="space-y-0 divide-y divide-gray-800">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map(tx => (
                                    <TransactionRow key={tx.id} tx={tx} />
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>Nenhuma movimentação recente.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
