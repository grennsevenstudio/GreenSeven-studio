import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Transaction, WithdrawalDetails, Stock, Language, InvestmentPlan } from '../../../../../types';
import { TransactionType, TransactionStatus } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS, DOLLAR_RATE, MOCK_STOCKS, INVESTMENT_PLANS } from '../../../../../constants';
import { TRANSLATIONS } from '../../../../../lib/translations';
import { formatCurrency } from '../../../../../lib/utils';

const WITHDRAWAL_FEE_PERCENT = 0;

interface DashboardHomeProps {
    user: User;
    transactions: Transaction[];
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => void;
    setActiveView: (view: string) => void;
    language: Language;
    onRefreshData?: () => Promise<void>;
}

// --- COMPONENTS ---

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; subValue?: React.ReactNode; highlight?: boolean; locked?: boolean }> = ({ title, value, icon, subValue, highlight = false, locked = false }) => {
    const borderGradient = highlight 
        ? 'from-brand-green via-brand-green/50 to-brand-gray' 
        : locked 
            ? 'from-gray-700 via-gray-800 to-gray-900'
            : 'from-brand-blue/30 via-brand-gray to-brand-gray/30';

    const lockedIcon = locked ? (
        <div className="absolute top-4 right-10 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
        </div>
    ) : null;

    return (
        <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${borderGradient} transition-all duration-300 hover:shadow-lg hover:shadow-brand-green/10 transform hover:-translate-y-1 h-full`}>
            <div className="bg-brand-gray rounded-[14px] p-5 h-full flex flex-col relative overflow-hidden group">
                {lockedIcon}
                {highlight && (
                    <>
                        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-green/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-black/20 rounded-full"></div>
                    </>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <p className="font-medium text-gray-300 text-sm">{title}</p>
                    <div className={`transition-colors ${highlight ? 'text-brand-green' : 'text-gray-500 group-hover:text-brand-green'}`}>
                        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                    </div>
                </div>
                
                <div className="z-10 mt-auto">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-1">{value}</div>
                    {subValue && typeof subValue === 'string' ? (
                        <div className="text-xs text-gray-500 font-medium">{subValue}</div>
                    ) : (
                        subValue
                    )}
                </div>
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
        <div className="p-3 bg-brand-black/50 rounded-xl border border-gray-800"> 
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-base font-bold text-white">{stock.symbol}</p>
                    <p className="text-xs text-gray-400 truncate w-20">{stock.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p ref={priceRef} className={`font-bold text-base transition-colors duration-500 ${isPositive ? 'flash-green' : 'flash-red'}`}>${stock.price.toFixed(2)}</p>
                    <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${colorClass}`}>
                        {icon}
                        <span>{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnimatedBalance: React.FC<{ value: string; isShown: boolean }> = ({ value, isShown }) => {
    return (
        <span key={String(isShown)} className="inline-block balance-value-anim">
            {value}
        </span>
    );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, transactions = [], onAddTransaction, setActiveView, language, onRefreshData }) => {
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
    
    const earningsRef = useRef<HTMLSpanElement>(null);
    const requestRef = useRef<number>();

    const t = TRANSLATIONS[language];
    const maskedValue = '$ ••••••••';
    
    const dailyAvailable = user.dailyWithdrawableUSD || 0;
    const bonusAvailable = user.bonusBalanceUSD || 0;

    const userPlan = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
    const monthlyProfitUSD = user.capitalInvestedUSD * userPlan.returnRate;
    const accumulatedBRL = (user.capitalInvestedUSD + monthlyProfitUSD) * DOLLAR_RATE;

    const capitalSubValue = (
        <div className="w-full mt-1">
            <span className="text-xs text-gray-500 font-medium">{t.locked_capital}</span>
            <div className="mt-3 pt-3 border-t border-gray-800 w-full space-y-1.5">
                <div className="flex justify-between items-center w-full text-xs">
                    <span className="text-gray-400">Lucro Mensal (Projeção) ({userPlan.name}):</span>
                    <span className="text-brand-green font-bold">+{formatCurrency(monthlyProfitUSD, 'USD')}</span>
                </div>
                <div className="flex justify-between items-center w-full text-xs">
                    <span className="text-gray-400">Estimativa de ganho em 30 dias (BRL):</span>
                    <span className="text-gray-300 font-medium">≈ {formatCurrency(accumulatedBRL, 'BRL')}</span>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        const userPlan = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
        const monthlyProfit = (user.capitalInvestedUSD || 0) * (userPlan?.returnRate || 0);
        const totalDailyProfit = monthlyProfit / 30;
        const profitPerMs = totalDailyProfit / (24 * 60 * 60 * 1000);
        
        const animate = () => {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const msElapsed = now.getTime() - startOfDay.getTime();
            const currentEarnings = Math.min(msElapsed * profitPerMs, totalDailyProfit);
            
            if (earningsRef.current) {
                 earningsRef.current.textContent = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 6,
                    maximumFractionDigits: 6
                 }).format(currentEarnings);
            }
            
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [user.capitalInvestedUSD, user.plan]);
    
    useEffect(() => {
        const initialPrices = MOCK_STOCKS.map(s => s.price);
        const stockInterval = setInterval(() => {
            setStocks(currentStocks => 
                currentStocks.map((stock, index) => {
                    const fluctuation = (Math.random() - 0.49) * (stock.price * 0.005);
                    const newPrice = stock.price + fluctuation;
                    const initialPrice = initialPrices[index];
                    const newChange = newPrice - initialPrice;
                    const newChangePercent = (newChange / initialPrice) * 100;
                    return {
                        ...stock,
                        price: newPrice,
                        change: newChange,
                        changePercent: newChangePercent,
                    };
                })
            );
        }, 3000);

        return () => clearInterval(stockInterval);
    }, []);

    return (
        <>
        <style>{`
          .flash-green { color: #00FF99 !important; }
          .flash-red { color: #EF4444 !important; }
          @keyframes balance-fade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .balance-value-anim { animation: balance-fade 0.4s ease-out; }
          .live-ticker { font-variant-numeric: tabular-nums; }
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 156, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(0, 255, 156, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 156, 0); }
          }
        `}</style>

        <div className="space-y-4 md:space-y-8">
             <div className="flex justify-between items-center">
                <p className="text-gray-300">{t.dashboard_subtitle}</p>
                <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                >
                    {showBalance ? ICONS.eye : ICONS.eyeSlash}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <StatCard 
                    title={t.total_balance}
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(user.capitalInvestedUSD || 0, 'USD') : maskedValue}
                            isShown={showBalance}
                        />
                    }
                    subValue={capitalSubValue}
                    icon={ICONS.shield} 
                />
                 <StatCard 
                    title={t.available_withdraw} 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(dailyAvailable, 'USD') : maskedValue}
                            isShown={showBalance}
                        />
                    }
                    subValue={t.daily_yields}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    highlight={true}
                />
                 <StatCard 
                    title={t.bonus_available} 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(bonusAvailable, 'USD') : maskedValue}
                            isShown={showBalance}
                        />
                    }
                    subValue={t.bonus_desc}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m0-10a9 9 0 110 18 9 9 0 010-18z" /></svg>}
                    highlight={true}
                />
                 <StatCard 
                    title={t.earnings_today} 
                    value={
                        <div className="flex items-center gap-3">
                            <span className="live-ticker" ref={earningsRef}>
                                $ 0,000000
                            </span>
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        </div>
                    }
                    subValue={
                        <div className="flex items-center gap-1 text-brand-green font-semibold">
                             <span className="text-xs">{t.live}</span>
                             <span className="text-gray-400 font-normal ml-1">| {t.accumulating}</span>
                        </div>
                    }
                    icon={ICONS.arrowUp}
                />
            </div>

             <Card className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <p className="font-semibold text-left text-sm md:text-base w-full">{t.quick_actions_title}</p>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button onClick={() => setDepositModalOpen(true)} variant="primary" fullWidth className="py-2 md:py-3 text-sm md:text-base">{ICONS.deposit} {t.deposit}</Button>
                        <Button onClick={() => setWithdrawModalOpen(true)} variant="secondary" fullWidth className="py-2 md:py-3 text-sm md:text-base">{ICONS.withdraw} {t.withdraw}</Button>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg md:text-xl font-bold mb-4">{t.market_title}</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {stocks.map(stock => (
                        <StockTickerItem key={stock.symbol} stock={stock} />
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <a href="https://www.investing.com" target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary">
                            {t.access_market}
                            <span className="ml-2 flex items-center">{ICONS.externalLink}</span>
                            </Button>
                    </a>
                </div>
            </Card>
        </div>
        </>
    )
}

export default DashboardHome;
