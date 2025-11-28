import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User, Transaction, WithdrawalDetails, Stock, Language } from '../../../../../types';
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
                <path fillRule="evenodd" d="M5 9V7a5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
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

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    // Determine icon and color based on type
    let icon;
    let colorClass;
    let bgClass;
    let label;

    switch (tx.type) {
        case TransactionType.Deposit:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
            colorClass = 'text-brand-green';
            bgClass = 'bg-brand-green/10';
            label = 'Depósito';
            break;
        case TransactionType.Withdrawal:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
            colorClass = 'text-white';
            bgClass = 'bg-gray-700';
            label = 'Saque';
            break;
        case TransactionType.Bonus:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m0-10a9 9 0 110 18 9 9 0 010-18z" /></svg>;
            colorClass = 'text-brand-blue';
            bgClass = 'bg-brand-blue/10';
            label = 'Bônus de Rede';
            break;
        case TransactionType.Yield:
            icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
            colorClass = 'text-brand-green';
            bgClass = 'bg-brand-green/10';
            label = 'Rendimento';
            break;
        default:
            icon = ICONS.history;
            colorClass = 'text-gray-400';
            bgClass = 'bg-gray-800';
            label = tx.type;
    }

    const statusMap: {[key in TransactionStatus]: { text: string, color: string }} = {
        [TransactionStatus.Completed]: { text: 'Concluído', color: 'text-brand-green' },
        [TransactionStatus.Pending]: { text: 'Pendente', color: 'text-yellow-500' },
        [TransactionStatus.Failed]: { text: 'Falhou', color: 'text-red-500' },
        [TransactionStatus.Scheduled]: { text: 'Agendado', color: 'text-brand-blue' },
    };

    const statusInfo = statusMap[tx.status] || { text: tx.status, color: 'text-gray-400' };
    const dateObj = new Date(tx.date);
    // Safe date parsing
    const formattedDate = !isNaN(dateObj.getTime()) 
        ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) 
        : tx.date;

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-all group">
            <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{label}</span>
                    <span className="text-xs text-gray-500">{formattedDate}</span>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-sm ${tx.type === TransactionType.Withdrawal ? 'text-white' : 'text-brand-green'}`}>
                    {tx.type === TransactionType.Withdrawal ? '-' : '+'} {formatCurrency(Math.abs(tx.amountUSD), 'USD')}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.color.replace('text-', 'bg-')}`}></div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${statusInfo.color} opacity-80`}>
                        {statusInfo.text}
                    </span>
                </div>
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
    
    // Updated beneficiary info
    const beneficiaryName = "Greennseven";
    const institutionName = "Recarga Pay";
    const staticPixKey = "40b383be-3df8-4bc2-88a5-be6c7b0a55a0";

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
                    Recebemos a confirmação do seu pagamento de {formatCurrency(parseFloat(amountBRL), 'BRL')}. A transação está agora pendente de aprovação final pelo nosso time.
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
                    {/* Custom Border Container matching the screenshot: Blue top / Yellow bottom */}
                    <div className="p-1 rounded-2xl bg-[linear-gradient(to_bottom,#3B82F6_50%,#F59E0B_50%)] inline-block shadow-xl">
                        <div className="bg-white p-2 rounded-xl">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${staticPixKey}`} 
                                alt="QR Code PIX" 
                                className="w-48 h-48 block" 
                            />
                        </div>
                    </div>
                </div>
                <p className="text-center text-lg font-bold mt-4">{formatCurrency(parseFloat(amountBRL), 'BRL')}</p>
                
                {/* Receiver Info Block */}
                <div className="bg-brand-black p-4 rounded-lg mt-4 border border-gray-800">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Dados do Recebedor</p>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Nome:</span>
                        <span className="text-white font-medium">{beneficiaryName}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">Instituição:</span>
                        <span className="text-white font-medium">{institutionName}</span>
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
                Valor estimado em dólar (cotação {formatCurrency(DOLLAR_RATE, 'BRL')}): 
                <span className="font-bold text-white"> {amountBRL ? formatCurrency(parseFloat(amountBRL) / DOLLAR_RATE, 'USD') : formatCurrency(0, 'USD')}</span>
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
    const [withdrawalSource, setWithdrawalSource] = useState<'yield' | 'bonus'>('yield');

    const fee = (parseFloat(amountUSD) || 0) * (WITHDRAWAL_FEE_PERCENT / 100);
    const amountToReceiveUSD = (parseFloat(amountUSD) || 0) - fee;
    const amountToReceiveBRL = amountToReceiveUSD * DOLLAR_RATE;
    
    const availableBalance = withdrawalSource === 'yield' 
        ? (user.dailyWithdrawableUSD || 0) 
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
            onAddTransaction({
                userId: user.id,
                type: TransactionType.Withdrawal,
                status: TransactionStatus.Pending,
                amountUSD: -Math.abs(parseFloat(amountUSD)),
                amountBRL: amountToReceiveBRL,
                withdrawalDetails: pixDetails,
                walletSource: withdrawalSource
            });
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
        <form onSubmit={handleAmountSubmit} className="space-y-4">
             <div className="bg-brand-black border border-gray-700 rounded-lg p-4 flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400 font-medium">Origem do Saque:</label>
                    <select 
                        value={withdrawalSource} 
                        onChange={(e) => setWithdrawalSource(e.target.value as 'yield' | 'bonus')}
                        className="bg-gray-900 border border-gray-600 text-white text-sm rounded-lg p-2 focus:outline-none focus:border-brand-green"
                    >
                        <option value="yield">Rendimentos Diários</option>
                        <option value="bonus">Bônus de Indicação</option>
                    </select>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-800 mt-2">
                    <div>
                        <p className="text-sm text-gray-400">Saldo Disponível</p>
                        <p className="text-xs text-gray-500">{withdrawalSource === 'yield' ? 'Lucro acumulado' : 'Bônus de rede'}</p>
                    </div>
                    <p className="text-2xl font-bold text-brand-green">
                        {formatCurrency(availableBalance, 'USD')}
                    </p>
                </div>
            </div>
            
            <div className="bg-yellow-500/10 border-l-2 border-yellow-500 p-3 rounded-r-lg">
                <p className="text-xs text-yellow-400 font-bold uppercase mb-1">Regra de Saque</p>
                <p className="text-sm text-gray-300">
                    Seu capital principal ({formatCurrency(user.capitalInvestedUSD, 'USD')}) permanece <strong>bloqueado</strong>. 
                    Você pode sacar seus rendimentos diários e bônus de indicação separadamente.
                </p>
            </div>

            <div className="bg-blue-500/10 border-l-2 border-blue-500 p-3 rounded-r-lg mt-2">
                 <p className="text-xs text-blue-400 font-bold uppercase mb-1">Horário de Atendimento</p>
                 <p className="text-sm text-gray-300">
                     Saques disponíveis das <strong>08:00 às 18:00</strong>.
                 </p>
            </div>
            
            <Input 
                label="Valor do Saque (USD)"
                id="withdraw-usd"
                type="number"
                placeholder="Ex: 50.00"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                required
                step="0.01"
                max={availableBalance}
            />
            <div className="p-4 bg-brand-black rounded-lg space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-400">
                    <span>Valor bruto do saque:</span>
                    <span>{formatCurrency((parseFloat(amountUSD) || 0), 'USD')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                    <span>Taxa ({WITHDRAWAL_FEE_PERCENT}%):</span>
                    <span className="text-red-500">- {formatCurrency(fee, 'USD')}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between items-center font-semibold">
                    <span>Líquido a sacar (USD):</span>
                    <span>{formatCurrency(amountToReceiveUSD, 'USD')}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-brand-green text-base mt-1">
                    <span>Total a receber (BRL):</span>
                    <span>{formatCurrency(amountToReceiveBRL, 'BRL')}</span>
                </div>
            </div>
            <div className="pt-2">
                <Button type="submit" fullWidth>Continuar</Button>
            </div>
        </form>
    );
};

const StockTickerItem: React.FC<{ stock: Stock }> = ({ stock }) => {
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

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, transactions = [], onAddTransaction, setActiveView, language }) => {
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [showBalance, setShowBalance] = useState(false);
    const [stocks, setStocks] = useState<Stock[]>(MOCK_STOCKS);
    
    const earningsRef = useRef<HTMLSpanElement>(null);
    const requestRef = useRef<number>();

    const t = TRANSLATIONS[language];
    const maskedValue = '••••••••';
    
    const dailyAvailable = user.dailyWithdrawableUSD || 0;
    const bonusAvailable = user.bonusBalanceUSD || 0;

    const userPlan = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
    const monthlyProfitUSD = user.capitalInvestedUSD * userPlan.returnRate;
    const accumulatedBRL = (user.capitalInvestedUSD + monthlyProfitUSD) * DOLLAR_RATE;

    const capitalSubValue = (
        <div className="w-full mt-1">
            <span className="text-xs text-gray-500 font-medium">Capital Bloqueado</span>
            <div className="mt-3 pt-3 border-t border-gray-800 w-full space-y-1.5">
                <div className="flex justify-between items-center w-full text-xs">
                    <span className="text-gray-400">Rendimento Mensal ({userPlan.name}):</span>
                    <span className="text-brand-green font-bold">+{formatCurrency(monthlyProfitUSD, 'USD')}</span>
                </div>
                <div className="flex justify-between items-center w-full text-xs">
                    <span className="text-gray-400">Acumulado 30d (BRL):</span>
                    <span className="text-gray-300 font-medium">≈ {formatCurrency(accumulatedBRL, 'BRL')}</span>
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        const userPlan = INVESTMENT_PLANS.find(p => p.name === user.plan) || INVESTMENT_PLANS[0];
        const monthlyProfit = (user.capitalInvestedUSD || 0) * (userPlan?.returnRate || 0);
        const totalDailyProfit = monthlyProfit / 30;
        const msInDay = 24 * 60 * 60 * 1000;
        const profitPerMs = totalDailyProfit / msInDay;
        
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
          .live-indicator { animation: pulse-green 2s infinite; }
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
            title="Solicitar Saque"
        >
            <WithdrawModalContent 
                user={user} 
                onClose={() => setWithdrawModalOpen(false)} 
                onAddTransaction={onAddTransaction} 
                setActiveView={setActiveView}
            />
        </Modal>

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
                {/* Locked Capital Card - Replicating screenshot */}
                <StatCard 
                    title="Capital Investido (USD)"
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(user.capitalInvestedUSD || 0, 'USD') : `$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    subValue={capitalSubValue}
                    icon={ICONS.shield} 
                />
                 {/* Daily Available Card - Replicating screenshot */}
                 <StatCard 
                    title="Lucro Disponível (Diário)" 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(dailyAvailable, 'USD') : `$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    // Explicitly use the text from the screenshot
                    subValue="Rendimentos liberados para saque"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    highlight={true}
                />
                 {/* Bonus Available Card - Replicating screenshot style */}
                 <StatCard 
                    title="Bônus Disponível" 
                    value={
                        <AnimatedBalance 
                            value={showBalance ? formatCurrency(bonusAvailable, 'USD') : `$ ${maskedValue}`}
                            isShown={showBalance}
                        />
                    }
                    subValue="Comissões por indicação"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m0-10a9 9 0 110 18 9 9 0 010-18z" /></svg>}
                    highlight={true}
                />
                 {/* Live Earnings Card - Replicating screenshot */}
                 <StatCard 
                    title="Rendimentos Hoje" 
                    value={
                        <div className="flex items-center gap-3">
                            <span className="live-ticker" ref={earningsRef}>
                                {/* Initial Value, updated via Ref later */}
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

            <Card>
                <h2 className="text-lg md:text-xl font-bold mb-4">{t.recent_transactions}</h2>
                <div>
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