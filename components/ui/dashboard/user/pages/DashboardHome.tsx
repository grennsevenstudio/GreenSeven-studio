
import React, { useState, useEffect } from 'react';
import type { User, Transaction, WithdrawalDetails, Stock } from '../../../../../types';
import { TransactionType, TransactionStatus } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS, DOLLAR_RATE, MOCK_STOCKS } from '../../../../../constants';
import { faker } from '@faker-js/faker';

const WITHDRAWAL_FEE_PERCENT = 5;

interface DashboardHomeProps {
    user: User;
    transactions: Transaction[];
    // FIX: Aligned Omit type with parent component to include 'bonusPayoutHandled'
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => void;
    setActiveView: (view: string) => void;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; icon: React.ReactNode; subValue?: React.ReactNode; highlight?: boolean }> = ({ title, value, icon, subValue, highlight = false }) => {
    const borderGradient = highlight 
        ? 'from-brand-green via-brand-green/50 to-brand-gray' 
        : 'from-brand-blue/30 via-brand-gray to-brand-black/0';

    return (
        <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${borderGradient} transition-all duration-300 hover:shadow-lg hover:shadow-brand-green/10 transform hover:-translate-y-1`}>
            <div className="bg-brand-gray rounded-[14px] p-4 sm:p-6 h-full flex flex-col justify-between overflow-hidden group">
                {/* Decorative Glow on highlight cards */}
                {highlight && <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-green/10 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>}

                <div className="flex justify-between items-start">
                    <p className="text-gray-300 font-medium">{title}</p>
                    <div className={`transition-colors ${highlight ? 'text-brand-green' : 'text-gray-500 group-hover:text-brand-green'}`}>
                        {React.cloneElement(icon as React.ReactElement<any>, { className: "h-7 w-7" })}
                    </div>
                </div>
                
                <div className="z-10">
                    <div className="text-3xl sm:text-4xl font-black text-white leading-tight mt-2">{value}</div>
                    {subValue && <div className="text-sm text-gray-400 mt-1">{subValue}</div>}
                </div>
            </div>
        </div>
    );
};

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const isPositive = tx.type === TransactionType.Deposit || tx.type === TransactionType.Bonus || tx.type === TransactionType.Yield;
    const amountColor = isPositive ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
    };

    return (
        <div className="flex items-center justify-between p-3 hover:bg-brand-black rounded-lg">
            <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isPositive ? ICONS.arrowUp : ICONS.arrowDown}
                </div>
                <div>
                    <p className="font-semibold text-white">{tx.type}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold ${amountColor}`}>{isPositive ? '+' : ''} US$ {tx.amountUSD.toFixed(2)}</p>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[tx.status]}`}>{tx.status}</span>
            </div>
        </div>
    )
}

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
}> = ({ user, onClose, onAddTransaction }) => {
    const [step, setStep] = useState(1);
    const [amountBRL, setAmountBRL] = useState('');
    const [pixKey, setPixKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Updated Beneficiary Data based on User Request
    const beneficiaryName = "D. S. LEAL";
    const staticPixKey = "8d0c0ba9-df70-4910-a993-9ac514fc853d";

    const handleGeneratePix = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseFloat(amountBRL) > 0) {
            setIsLoading(true);
            setTimeout(() => {
                setPixKey(staticPixKey);
                setStep(2);
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleConfirmPayment = () => {
        setIsLoading(true);
        setTimeout(() => {
            const brl = parseFloat(amountBRL);
            const usd = brl / DOLLAR_RATE;
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
                    Recebemos a confirmação do seu pagamento de R$ {amountBRL}. A transação está agora pendente de aprovação final pelo nosso time.
                    Assim que aprovado, o saldo em dólar será creditado na sua conta.
                </p>
            </SuccessDisplay>
        );
    }
    
    if (step === 2) {
        return (
             <div>
                <p className="text-center text-gray-400 mb-4">Use o QR Code ou a chave PIX abaixo para pagar.</p>
                <div className="flex justify-center mb-4">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${staticPixKey}`} 
                        alt="QR Code PIX" 
                        className="bg-white p-2 rounded-lg" 
                    />
                </div>
                <p className="text-center text-lg font-bold mt-4">R$ {parseFloat(amountBRL).toFixed(2)}</p>
                
                <div className="bg-brand-black p-4 rounded-lg mt-4 border border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Dados do Recebedor</p>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white font-medium">{beneficiaryName}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">Instituição:</span>
                        <span className="text-white font-medium">Itaú Empresas</span>
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
                Valor estimado em dólar (cotação R$ {DOLLAR_RATE}): 
                <span className="font-bold text-white"> US$ {amountBRL ? (parseFloat(amountBRL) / DOLLAR_RATE).toFixed(2) : '0.00'}</span>
            </p>
            <div className="pt-2">
                <Button type="submit" fullWidth isLoading={isLoading}>Gerar QR Code PIX</Button>
            </div>
        </form>
    );
};

const WithdrawModalContent: React.FC<{
    user: User;
    onClose: () => void;
    onAddTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'bonusPayoutHandled'>) => void;
    setActiveView: (view: string) => void;
}> = ({ user, onClose, onAddTransaction, setActiveView }) => {
    const [step, setStep] = useState(1);
    const [amountUSD, setAmountUSD] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [pixDetails, setPixDetails] = useState<WithdrawalDetails>({ pixKey: '', fullName: '', cpf: '', bank: '' });
    const [pixKeyError, setPixKeyError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fee = (parseFloat(amountUSD) || 0) * (WITHDRAWAL_FEE_PERCENT / 100);
    const amountToReceiveUSD = (parseFloat(amountUSD) || 0) - fee;
    const amountToReceiveBRL = amountToReceiveUSD * DOLLAR_RATE;
    
    // Calculates the daily limit based on the plan (Monthly Profit / 30 days)
    const dailyLimit = user.monthlyProfitUSD / 30;

    const handleAmountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(amountUSD);
        if (isNaN(amount) || amount <= 0) {
            alert("Por favor, insira um valor de saque válido.");
            return;
        }
        if (amount > dailyLimit) {
            alert(`Saldo insuficiente para realizar este saque. Você pode sacar até US$ ${dailyLimit.toFixed(2)} por dia, referente aos seus lucros.`);
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
            onAddTransaction({
                userId: user.id,
                type: TransactionType.Withdrawal,
                status: TransactionStatus.Pending,
                amountUSD: -Math.abs(parseFloat(amountUSD)),
                amountBRL: amountToReceiveBRL,
                withdrawalDetails: pixDetails,
            });
            setStep(4);
        }, 2000);
    };

    if (step === 4) {
        return (
            <SuccessDisplay title="Solicitação Enviada!" onClose={onClose}>
                <p>
                    Sua solicitação de saque de <span className="font-bold text-white">US$ {amountUSD}</span> foi enviada para análise.
                    Assim que aprovada, o valor de <span className="font-bold text-white">R$ {amountToReceiveBRL.toFixed(2)}</span> será enviado para a chave PIX informada.
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
        <form onSubmit={handleAmountSubmit} className="space-y-4">
             <div className="bg-brand-black border border-gray-700 rounded-lg p-4 flex justify-between items-center shadow-inner">
                <div>
                    <p className="text-sm text-gray-400">Saldo Disponível Hoje</p>
                    <p className="text-xs text-gray-500">Baseado no seu plano</p>
                </div>
                <p className="text-2xl font-bold text-brand-green">
                    US$ {dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            
            <p className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg">Seu limite diário de saque é renovado a cada 24h baseado na rentabilidade do seu plano.</p>
            
            <Input 
                label="Valor do Saque (USD)"
                id="withdraw-usd"
                type="number"
                placeholder="Ex: 100.00"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                required
                step="0.01"
                max={dailyLimit}
            />
            <div className="p-4 bg-brand-black rounded-lg space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-400">
                    <span>Valor bruto do saque:</span>
                    <span>US$ {(parseFloat(amountUSD) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                    <span>Taxa ({WITHDRAWAL_FEE_PERCENT}%):</span>
                    <span className="text-red-500">- US$ {fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between items-center font-semibold">
                    <span>Líquido a sacar (USD):</span>
                    <span>US$ {amountToReceiveUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-brand-green text-base mt-1">
                    <span>Total a receber (BRL):</span>
                    <span>R$ {amountToReceiveBRL.toFixed(2)}</span>
                </div>
            </div>
            <div className="pt-2">
                <Button type="submit" fullWidth>Continuar</Button>
            </div>
        </form>
    );
};

const StockTickerCard: React.FC<{ stock: Stock }> = ({ stock }) => {
    const isPositive = stock.change > 0;
    const colorClass = isPositive ? 'text-brand-green' : 'text-red-500';
    const icon = isPositive ? ICONS.stockUp : ICONS.stockDown;
    const priceRef = React.useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (priceRef.current) {
            priceRef.current.classList.add('flash');
            const timer = setTimeout(() => priceRef.current?.classList.remove('flash'), 500);
            return () => clearTimeout(timer);
        }
    }, [stock.price]);


    return (
        <Card className="p-3 bg-brand-black/50">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-base font-bold">{stock.symbol}</p>
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
        </Card>
    );
};

const AnimatedBalance: React.FC<{ value: string; isShown: boolean }> = ({ value, isShown }) => {
    return (
        <span key={String(isShown)} className="inline-block balance-value-anim">
            {value}
        </span>
    );
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, transactions, onAddTransaction, setActiveView }) => {
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
    const [dailyEarnings, setDailyEarnings] = useState(0);

    const balanceBRL = user.balanceUSD * DOLLAR_RATE;
    const maskedValue = '••••••••';
    
    // Calculate daily available balance (Monthly Profit / 30)
    const dailyAvailable = user.monthlyProfitUSD / 30;

    useEffect(() => {
        const totalDailyProfit = user.monthlyProfitUSD / 30;
        const msInDay = 24 * 60 * 60 * 1000;
        const profitPerMs = totalDailyProfit / msInDay;

        const updateEarnings = () => {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const msElapsed = now.getTime() - startOfDay.getTime();
            
            // Calculate exact profit for this moment in time based on elapsed milliseconds
            // This makes the decimal places roll smoothly like a financial ticker
            const currentEarnings = Math.min(msElapsed * profitPerMs, totalDailyProfit);
            setDailyEarnings(currentEarnings);
        };

        // Initial update
        updateEarnings();

        // Update frequently (every 80ms) to create a smooth counting effect for the decimals
        const earningsInterval = setInterval(updateEarnings, 80);

        return () => clearInterval(earningsInterval);
    }, [user.monthlyProfitUSD]);
    
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
        }, 2500);

        return () => clearInterval(stockInterval);
    }, []);

    return (
        <>
        <style>{`
          .flash-green { color: #00FF99 !important; }
          .flash-red { color: #EF4444 !important; }
          
          @keyframes scale-in {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
            animation: scale-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
          }

          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
          .success-circle {
            stroke-dasharray: 264;
            stroke-dashoffset: 264;
            animation: draw 0.8s ease-out forwards;
          }
          .success-check {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: draw 0.6s 0.3s ease-out forwards;
          }
          @keyframes balance-fade {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .balance-value-anim {
            animation: balance-fade 0.4s ease-out;
          }
          
          .live-ticker {
            font-variant-numeric: tabular-nums;
          }
          
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(0, 255, 156, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(0, 255, 156, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 255, 156, 0); }
          }
          .live-indicator {
            animation: pulse-green 2s infinite;
          }
        `}</style>
        <Modal 
            isOpen={isDepositModalOpen} 
            onClose={() => setDepositModalOpen(false)} 
            title="Depositar via PIX"
        >
            <DepositModalContent user={user} onClose={() => setDepositModalOpen(false)} onAddTransaction={onAddTransaction} />
        </Modal>

        <Modal 
            isOpen={isWithdrawModalOpen} 
            onClose={() => setWithdrawModalOpen(false)} 
            title="Solicitar Saque via PIX"
        >
            <WithdrawModalContent 
                user={user} 
                onClose={() => setWithdrawModalOpen(false)} 
                onAddTransaction={onAddTransaction} 
                setActiveView={setActiveView}
            />
        </Modal>

        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
                    <p className="text-gray-400">Aqui está um resumo de sua conta.</p>
                </div>
                <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}
                >
                    {showBalance ? ICONS.eye : ICONS.eyeSlash}
                </button>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard 
                    title="Saldo Total (USD)" 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? `$ ${user.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    subValue={
                         <AnimatedBalance 
                            value={showBalance ? `~ R$ ${balanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `~ R$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    icon={ICONS.dollar} 
                />
                 <StatCard 
                    title="Saldo Disponível para Saque" 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? `$ ${dailyAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    subValue={`Rendimentos diários acumulados`}
                    icon={ICONS.withdraw}
                    highlight={true}
                />
                 <StatCard 
                    title="Lucro Mensal Projetado" 
                    value={`$ ${user.monthlyProfitUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    subValue={`Projeção para 30 dias`}
                    icon={ICONS.plans}
                />
                 <StatCard 
                    title="Rendimentos Hoje" 
                    value={
                        <div className="flex items-center gap-3">
                            <span className="live-ticker">
                                {`$ ${dailyEarnings.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`}
                            </span>
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        </div>
                    }
                    subValue={
                        <div className="flex items-center gap-1 text-brand-green font-semibold">
                             <span className="text-xs">AO VIVO</span>
                             <span className="text-gray-400 font-normal ml-1">| Acumulando em tempo real...</span>
                        </div>
                    }
                    icon={ICONS.arrowUp}
                />
            </div>

            {/* Actions */}
             <Card>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="font-semibold text-center md:text-left">Movimente sua conta de forma rápida e segura.</p>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button onClick={() => setDepositModalOpen(true)} variant="primary" fullWidth>{ICONS.deposit} Depositar</Button>
                        <Button onClick={() => setWithdrawModalOpen(true)} variant="secondary" fullWidth>{ICONS.withdraw} Sacar</Button>
                    </div>
                </div>
            </Card>

            {/* Market Overview */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Mercado Americano (Tempo Real)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stocks.map(stock => (
                        <StockTickerCard key={stock.symbol} stock={stock} />
                    ))}
                </div>
                <div className="mt-6 text-center">
                    <a href="https://www.investing.com" target="_blank" rel="noopener noreferrer">
                            <Button variant="secondary">
                            Acessar Mercado
                            <span className="ml-2 flex items-center">{ICONS.externalLink}</span>
                            </Button>
                    </a>
                </div>
            </Card>


            {/* Recent Transactions */}
            <Card>
                <h2 className="text-xl font-bold mb-4">Movimentações Recentes</h2>
                <div className="space-y-2">
                    {transactions.slice(0, 5).map(tx => (
                        <TransactionRow key={tx.id} tx={tx} />
                    ))}
                </div>
            </Card>
        </div>
        </>
    )
}

export default DashboardHome;
