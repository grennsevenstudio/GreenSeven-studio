
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Transaction, WithdrawalDetails, Stock, Language, PlatformSettings } from '../../../../../types';
import { TransactionType, TransactionStatus } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS, MOCK_STOCKS, INVESTMENT_PLANS } from '../../../../../constants';
import { TRANSLATIONS } from '../../../../../lib/translations';
import { formatCurrency } from '../../../../../lib/utils';

interface DashboardHomeProps {
    user: User;
    transactions: Transaction[];
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>, userUpdate?: Partial<User>) => void;
    setActiveView: (view: string) => void;
    language: Language;
    onRefreshData?: () => Promise<void>;
    onUpdateUser?: (user: User) => void;
    platformSettings: PlatformSettings;
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

const SuccessDisplay: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; }> = ({ title, children, onClose }) => {
    return (
        <div className="text-center animate-scale-in">
            <svg className="h-24 w-24 mx-auto mb-4" viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" fillRule="evenodd">
                <circle className="success-circle" cx="44" cy="44" r="42" stroke="url(#success-gradient)" strokeWidth="4" />
                <path className="success-check" d="M25 45l14 14 24-24" stroke="#00FF9C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <linearGradient id="success-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FF9C" />
                  <stop offset="100%" stopColor="#00B2FF" />
                </linearGradient>
              </defs>
            </svg>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <div className="text-gray-400 mt-2">{children}</div>
            <Button onClick={onClose} className="mt-8" fullWidth>Fechar</Button>
        </div>
    );
};

const DepositModalContent: React.FC<{
    user: User;
    onClose: () => void;
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => void;
    platformSettings: PlatformSettings;
}> = ({ user, onClose, onAddTransaction, platformSettings }) => {
    const [step, setStep] = useState(1);
    const [amountBRL, setAmountBRL] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const dollarRate = platformSettings.dollarRate || 5.50;
    const adminPixKey = platformSettings.pixKey || "chave-nao-configurada";
    const beneficiaryName = "GREENNSEVEN TECNOLOGIA LTDA";
    const cnpj = "40.840.653/0001-01";

    const handleGeneratePix = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseFloat(amountBRL) > 0) {
            setIsLoading(true);
            setTimeout(() => {
                setPixKey(adminPixKey); // Use dynamic key from settings
                setStep(2);
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleConfirmPayment = () => {
        setIsLoading(true);
        setTimeout(() => {
            const brl = parseFloat(amountBRL);
            const usd = brl / dollarRate;
            onAddTransaction({
                userId: user.id,
                type: TransactionType.Deposit,
                status: TransactionStatus.Pending,
                amountUSD: usd,
                amountBRL: brl,
            });
            setStep(3);
        }, 2000);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixKey);
        alert('Chave PIX copiada!');
    };
    
    if (step === 3) {
        return (
            <SuccessDisplay title="Pagamento Recebido!" onClose={onClose}>
                <p>
                    Recebemos a confirmação do seu pagamento de {formatCurrency(parseFloat(amountBRL), 'BRL')}. A transação está agora pendente de aprovação final pelo nosso time.
                    Assim que aprovado, o saldo em dólar será creditado na sua conta.
                </p>
            </SuccessDisplay>
        );
    }
    
    if (step === 2) {
        return (
             <div>
                <p className="text-center text-gray-400 mb-4">Utilize os dados abaixo para realizar o pagamento via PIX.</p>
                
                <p className="text-center text-lg font-bold mt-4">{formatCurrency(parseFloat(amountBRL), 'BRL')}</p>
                
                <div className="bg-brand-black p-4 rounded-lg mt-4 border border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Dados do Recebedor</p>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white font-medium">{beneficiaryName}</span>
                    </div>
                     <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">CNPJ:</span>
                        <span className="text-white font-medium">{cnpj}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="text-sm font-medium text-gray-400">Chave PIX (Copia e Cola)</label>
                    <div className="relative">
                        <input type="text" readOnly value={pixKey} className="w-full bg-brand-black border border-gray-700 rounded-lg py-2 px-3 text-sm text-gray-300 pr-10"/>
                        <button onClick={copyToClipboard} className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white">
                            {ICONS.copy}
                        </button>
                    </div>
                </div>
                <Button onClick={handleConfirmPayment} fullWidth className="mt-6" isLoading={isLoading}>Já Efetuei o Pagamento</Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleGeneratePix} className="space-y-4">
            <Input 
                label="Valor do Depósito (BRL)"
                id="deposit-brl"
                type="number"
                placeholder="Ex: 500,00"
                value={amountBRL}
                onChange={(e) => setAmountBRL(e.target.value)}
                required
                step="0.01"
            />
            <p className="text-sm text-gray-400">
                Valor estimado em dólar (cotação {formatCurrency(dollarRate, 'BRL')}): 
                <span className="font-bold text-white"> {amountBRL ? formatCurrency(parseFloat(amountBRL) / dollarRate, 'USD') : formatCurrency(0, 'USD')}</span>
            </p>
            <div className="pt-2">
                <Button type="submit" fullWidth isLoading={isLoading}>Gerar Chave PIX</Button>
            </div>
        </form>
    );
};

const WithdrawModalContent: React.FC<{
    user: User;
    onClose: () => void;
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>, userUpdate?: Partial<User>) => void;
    setActiveView: (view: string) => void;
    currentLiveProfit: number;
    platformSettings: PlatformSettings;
}> = ({ user, onClose, onAddTransaction, setActiveView, currentLiveProfit, platformSettings }) => {
    const [step, setStep] = useState(1);
    const [amountUSD, setAmountUSD] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [pixDetails, setPixDetails] = useState<WithdrawalDetails>({ pixKey: '', fullName: '', cpf: '', bank: '' });
    const [pixKeyError, setPixKeyError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [withdrawalSource, setWithdrawalSource] = useState<'yield' | 'bonus'>('yield');

    const withdrawalFeePercent = platformSettings.withdrawalFeePercent || 0;
    const dollarRate = platformSettings.dollarRate || 5.50;

    const fee = (parseFloat(amountUSD) || 0) * (withdrawalFeePercent / 100);
    const amountToReceiveUSD = (parseFloat(amountUSD) || 0) - fee;
    const amountToReceiveBRL = amountToReceiveUSD * dollarRate;
    
    // For Yield, we use the LIVE calculated total (db + generated since last update)
    const availableBalance = withdrawalSource === 'yield' 
        ? currentLiveProfit
        : (user.bonusBalanceUSD || 0);

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(amountUSD);
        if (isNaN(amount) || amount <= 0) {
            alert("Por favor, insira um valor de saque válido.");
            return;
        }
        if (amount > availableBalance) {
            const walletName = withdrawalSource === 'yield' ? 'Lucro Diário' : 'Bônus de Indicação';
            alert(`Saldo insuficiente na carteira de ${walletName}. Disponível: ${formatCurrency(availableBalance, 'USD')}.`);
            return;
        }
        setStep(2);
    }
    
    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPinError(false);
        setIsLoading(true);
        setTimeout(() => {
            if (pin === user.transactionPin) {
                setStep(3);
            } else {
                setPinError(true);
            }
            setIsLoading(false);
        }, 1000);
    };

    const validatePixKey = (key: string): boolean => {
        const pixRegex = /^((\d{11})|(\d{14})|([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})|(\+[0-9]{1,15})|([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}))$/;
        return pixRegex.test(key);
    };
    
    const handleConfirmWithdrawal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePixKey(pixDetails.pixKey)) {
            setPixKeyError('Formato de chave PIX inválido. Verifique CPF, CNPJ, email, telefone ou chave aleatória.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            // Prepare User Update to "crystallize" the live profit before deducting
            let userUpdate: Partial<User> | undefined = undefined;
            if (withdrawalSource === 'yield') {
                userUpdate = {
                    dailyWithdrawableUSD: currentLiveProfit, // Lock in the live amount to DB
                    lastProfitUpdate: new Date().toISOString() // Reset the timer
                };
            }

            onAddTransaction({
                userId: user.id,
                type: TransactionType.Withdrawal,
                status: TransactionStatus.Pending,
                amountUSD: -Math.abs(parseFloat(amountUSD)),
                amountBRL: amountToReceiveBRL,
                withdrawalDetails: pixDetails,
                walletSource: withdrawalSource
            }, userUpdate);
            
            setStep(4);
        }, 2000);
    };

    if (step === 4) {
        return (
            <SuccessDisplay title="Solicitação Enviada!" onClose={onClose}>
                <p>
                    Sua solicitação de saque de <span className="font-bold text-white">{formatCurrency(parseFloat(amountUSD), 'USD')}</span> foi enviada para análise.
                    Assim que aprovada, o valor de <span className="font-bold text-white">{formatCurrency(amountToReceiveBRL, 'BRL')}</span> será enviado para a chave PIX informada.
                </p>
            </SuccessDisplay>
        );
    }
    
    if (step === 3) {
        return (
            <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
                <p className="text-sm text-gray-300">Por favor, preencha seus dados para recebimento via PIX. Verifique as informações com atenção.</p>
                <Input label="Nome Completo" id="fullName" required value={pixDetails.fullName} onChange={e => setPixDetails({...pixDetails, fullName: e.target.value})} />
                <Input label="CPF" id="cpf" required value={pixDetails.cpf} onChange={e => setPixDetails({...pixDetails, cpf: e.target.value})} />
                <div className="relative">
                  <Input 
                    label="Chave PIX" 
                    id="pixKey" 
                    required 
                    value={pixDetails.pixKey} 
                    onChange={e => {
                        setPixDetails({...pixDetails, pixKey: e.target.value});
                        if (pixKeyError) setPixKeyError(null);
                    }}
                    error={!!pixKeyError}
                   />
                   {pixKeyError && <p className="text-red-500 text-xs mt-1">{pixKeyError}</p>}
                </div>
                <Input label="Nome do Banco" id="bank" required value={pixDetails.bank} onChange={e => setPixDetails({...pixDetails, bank: e.target.value})} />
                 <div className="pt-2">
                    <Button type="submit" fullWidth isLoading={isLoading}>Confirmar Solicitação de Saque</Button>
                </div>
            </form>
        )
    }

    if (step === 2) {
        if (!user.transactionPin) {
            return (
                <div className="text-center space-y-4">
                    <h3 className="text-lg font-bold text-yellow-400">PIN de Saque Necessário</h3>
                    <p className="text-gray-400">Para sua segurança, é necessário criar um PIN de 4 dígitos no seu perfil antes de solicitar o primeiro saque.</p>
                    <Button 
                        onClick={() => { onClose(); setActiveView('profile'); }}
                        fullWidth
                    >
                        Criar PIN no Meu Perfil
                    </Button>
                </div>
            );
        }
        return (
            <form onSubmit={handlePinSubmit} className="space-y-4">
                <p className="text-center text-gray-400">Insira seu PIN de segurança de 4 dígitos para continuar.</p>
                <Input
                    label="PIN de Saque"
                    id="pin"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ''));
                        if (pinError) setPinError(false);
                    }}
                    error={pinError}
                    required
                />
                {pinError && <p className="text-red-500 text-sm text-center">PIN incorreto. Tente novamente.</p>}
                <div className="pt-2">
                    <Button type="submit" fullWidth isLoading={isLoading}>Confirmar Saque</Button>
                </div>
            </form>
        );
    }
    
    return (
        <form onSubmit={handleAmountSubmit} className="space-y-5">
             <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setWithdrawalSource('yield')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        withdrawalSource === 'yield' 
                        ? 'bg-brand-green/10 border-brand-green text-brand-green' 
                        : 'bg-brand-black border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                    <span className="text-xs font-bold uppercase">Rendimentos</span>
                    <span className="text-sm font-bold">{formatCurrency(currentLiveProfit || 0, 'USD')}</span>
                </button>
                
                <button
                    type="button"
                    onClick={() => setWithdrawalSource('bonus')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                        withdrawalSource === 'bonus' 
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                        : 'bg-brand-black border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                >
                    <span className="text-xs font-bold uppercase">Bônus</span>
                    <span className="text-sm font-bold">{formatCurrency(user.bonusBalanceUSD || 0, 'USD')}</span>
                </button>
            </div>
            
            <div>
                <Input 
                    label="Quanto deseja sacar? (USD)"
                    id="withdraw-usd"
                    type="number"
                    placeholder="Ex: 50.00"
                    value={amountUSD}
                    onChange={(e) => setAmountUSD(e.target.value)}
                    required
                    step="0.01"
                    max={availableBalance}
                />
            </div>

            <div className="bg-brand-gray/50 rounded-xl p-4 border border-gray-800 space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                    <span>Taxa ({withdrawalFeePercent}%):</span>
                    <span className="text-red-400">- {formatCurrency(fee, 'USD')}</span>
                </div>
                <div className="h-px bg-gray-700"></div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white">Você recebe (PIX):</span>
                    <span className="text-xl font-bold text-brand-green">{formatCurrency(amountToReceiveBRL, 'BRL')}</span>
                </div>
                <p className="text-[10px] text-gray-500 text-right">Cotação: {formatCurrency(dollarRate, 'BRL')}</p>
            </div>

            <div className="flex gap-2 text-[10px] text-gray-400 bg-black/20 p-2 rounded-lg">
                <div className="min-w-[4px] bg-brand-blue rounded-full"></div>
                <div>
                    <p>• Atendimento: Seg à Sex, 08:00 às 18:00.</p>
                    <p>• Capital principal permanece investido (bloqueado).</p>
                </div>
            </div>
            
            <div className="pt-2">
                <Button type="submit" fullWidth>Continuar</Button>
            </div>
        </form>
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
        [TransactionStatus.Completed]: { text: 'Concluído', color: 'bg-brand-green/20 text-brand-green' },
        [TransactionStatus.Pending]: { text: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
        [TransactionStatus.Failed]: { text: 'Falhou', color: 'bg-red-500/20 text-red-400' },
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
                <span className={`mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusInfo.color}`}>
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

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, transactions, onAddTransaction, setActiveView, language, onRefreshData, platformSettings }) => {
    const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isBalanceVisible, setIsBalanceVisible] = useState(true);
    
    const dollarRate = platformSettings.dollarRate || 5.50;

    // Live Oscillation State
    const [liveData, setLiveData] = useState({
        daily: user.dailyWithdrawableUSD,
        bonus: user.bonusBalanceUSD,
        today: 0,
        combinedDaily: user.dailyWithdrawableUSD
    });

    const t = TRANSLATIONS[language] || TRANSLATIONS['pt'];

    // Mask helper
    const maskValue = (val: string) => isBalanceVisible ? val : '••••••';

    // Real-time calculation effect
    useEffect(() => {
        const calculateLiveProfit = () => {
            const plan = INVESTMENT_PLANS.find(p => p.name.toLowerCase() === (user.plan || 'conservador').toLowerCase()) || INVESTMENT_PLANS[0];
            const monthlyRate = plan.returnRate; // e.g., 0.05
            const invested = user.capitalInvestedUSD;
            
            // Calculate daily earnings based on total invested
            const dailyProfitTotal = (invested * monthlyRate) / 30;
            // Calculate earnings per second (86400 seconds in a day)
            const profitPerSecond = dailyProfitTotal / 86400;

            const now = new Date();
            // IMPORTANT: Calculate time passed since the LAST UPDATE (withdrawal or reset), not just midnight
            // If user.lastProfitUpdate is missing (legacy), fallback to start of day or joinedDate
            const lastUpdate = new Date(user.lastProfitUpdate || user.joinedDate);
            
            // Difference in seconds
            let secondsPassed = (now.getTime() - lastUpdate.getTime()) / 1000;
            if (secondsPassed < 0) secondsPassed = 0;
            
            // Profit generated since the last snapshot/withdrawal
            const generatedSinceLastUpdate = Math.max(0, profitPerSecond * secondsPassed);

            setLiveData({
                daily: user.dailyWithdrawableUSD, // Base amount from DB
                bonus: user.bonusBalanceUSD,
                today: generatedSinceLastUpdate, // Just visual indicator of "recent" growth
                combinedDaily: user.dailyWithdrawableUSD + generatedSinceLastUpdate // What is actually available
            });
        };

        // Initial Calculation
        calculateLiveProfit();

        // 2 second delay interval
        const interval = setInterval(calculateLiveProfit, 2000);

        return () => clearInterval(interval);
    }, [user.capitalInvestedUSD, user.plan, user.dailyWithdrawableUSD, user.bonusBalanceUSD, user.lastProfitUpdate, user.joinedDate]);

    // Updated Filter Logic
    const recentTransactions = transactions
        .filter(t => 
            t.type === TransactionType.Deposit || 
            t.type === TransactionType.Withdrawal || 
            t.type === TransactionType.Bonus
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10); 

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

    // Estimate next 30 days profit
    const currentPlanObj = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
    const estimatedProfit30DaysBRL = (user.capitalInvestedUSD * currentPlanObj.returnRate) * dollarRate;

    const bonusBalance = liveData.bonus; 
    const dailyWithdrawableLive = liveData.combinedDaily; // This is the total available for withdrawal
    const earningsTicker = liveData.today; // Show just the "new" money growing

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

            <Modal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} title="Realizar Depósito">
                <DepositModalContent 
                    user={user} 
                    onClose={() => setIsDepositModalOpen(false)} 
                    onAddTransaction={onAddTransaction} 
                    platformSettings={platformSettings}
                />
            </Modal>

            <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Solicitar Saque">
                <WithdrawModalContent 
                    user={user} 
                    onClose={() => setIsWithdrawModalOpen(false)} 
                    onAddTransaction={onAddTransaction} 
                    setActiveView={setActiveView} 
                    currentLiveProfit={dailyWithdrawableLive}
                    platformSettings={platformSettings}
                />
            </Modal>

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

            {/* Wallet Cards Grid - Adjusted for Mobile Stacking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <StatCard 
                    title={t.total_balance} 
                    value={maskValue(formatCurrency(user.capitalInvestedUSD, 'USD'))} 
                    icon={ICONS.dollar} 
                    subValue={t.locked_capital}
                    locked
                />
                <StatCard 
                    title={t.available_withdraw} 
                    value={maskValue(formatCurrency(dailyWithdrawableLive, 'USD'))} 
                    icon={ICONS.withdraw} 
                    subValue={t.daily_yields}
                    highlight
                />
                <StatCard 
                    title={t.bonus_available} 
                    value={maskValue(formatCurrency(bonusBalance, 'USD'))} 
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
                        {maskValue(formatCurrency(earningsTicker, 'USD'))}
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
                    <Button onClick={() => setIsDepositModalOpen(true)} className="h-12 sm:h-14 text-base sm:text-lg font-bold shadow-lg shadow-brand-green/20">
                        {ICONS.deposit} {t.deposit}
                    </Button>
                    <Button onClick={() => setIsWithdrawModalOpen(true)} variant="secondary" className="h-12 sm:h-14 text-base sm:text-lg font-bold border-gray-700 hover:border-gray-500">
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
