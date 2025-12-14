
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Modal from '../../../../layout/Modal';
import type { Transaction, User } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import { REFERRAL_BONUS_RATES, ICONS } from '../../../../../constants';
import Input from '../../../../ui/Input';

interface BonusPayoutDetails {
    level: number;
    referrer: User;
    bonusAmount: number;
}

const Toast: React.FC<{ message: string }> = ({ message }) => (
    <div className="fixed bottom-6 right-6 bg-brand-green text-brand-black px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up">
        <div className="bg-black/10 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
        </div>
        <span className="font-bold">{message}</span>
        <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
            }
        `}</style>
    </div>
);

const WithdrawalReviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    tx: Transaction;
    user: User | undefined;
}> = ({ isOpen, onClose, onConfirm, tx, user }) => {
    if (!tx || !user) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Analisar Solicitação de Saque">
            <div className="space-y-4">
                <div className="bg-brand-black p-4 rounded-lg border border-gray-700 space-y-3">
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Solicitante:</span>
                        <span className="text-white font-bold">{user.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Valor Solicitado (USD):</span>
                        <span className="text-white font-bold">$ {Math.abs(tx.amountUSD).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-800 pb-2">
                        <span className="text-gray-400">Valor a Transferir (BRL):</span>
                        <span className="text-brand-green font-black text-lg">R$ {tx.amountBRL ? tx.amountBRL.toFixed(2) : '0.00'}</span>
                    </div>
                </div>

                <div className="bg-brand-gray p-4 rounded-lg border border-gray-700">
                    <h4 className="text-gray-400 text-xs font-bold uppercase mb-3">Dados para Transferência (PIX)</h4>
                    {tx.withdrawalDetails ? (
                        <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">Nome:</span> <span className="text-white">{tx.withdrawalDetails.fullName}</span></p>
                            <p><span className="text-gray-500">CPF:</span> <span className="text-white">{tx.withdrawalDetails.cpf}</span></p>
                            <p><span className="text-gray-500">Banco:</span> <span className="text-white">{tx.withdrawalDetails.bank}</span></p>
                            <div className="mt-2">
                                <span className="text-gray-500 block mb-1">Chave PIX:</span>
                                <div className="flex items-center gap-2 bg-black p-2 rounded border border-gray-800">
                                    <code className="text-brand-green flex-1 break-all">{tx.withdrawalDetails.pixKey}</code>
                                    <button 
                                        className="text-gray-400 hover:text-white p-1"
                                        title="Copiar Chave"
                                        onClick={() => {
                                            navigator.clipboard.writeText(tx.withdrawalDetails?.pixKey || '');
                                            alert("Chave PIX copiada!");
                                        }}
                                    >
                                        {ICONS.copy}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-500">Dados bancários não encontrados.</p>
                    )}
                </div>

                <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
                    <p className="text-yellow-200 text-xs flex gap-2 items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Confirme que realizou a transferência bancária <strong>ANTES</strong> de aprovar. A aprovação notificará o usuário de que o pagamento foi enviado.</span>
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={onConfirm}>Confirmar Transferência</Button>
                </div>
            </div>
        </Modal>
    );
};

const PayoutConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    depositTx: Transaction;
    payoutDetails: BonusPayoutDetails[];
    sourceUser: User | undefined;
}> = ({ isOpen, onClose, onConfirm, depositTx, payoutDetails, sourceUser }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Repasse de Bônus">
            <div className="space-y-4">
                <p>Você está prestes a repassar os bônus de indicação referentes ao primeiro depósito de <span className="font-bold text-white">{sourceUser?.name}</span> no valor de <span className="font-bold text-brand-green">US$ {depositTx.amountUSD.toFixed(2)}</span>.</p>
                
                <div className="p-3 bg-brand-black rounded-lg space-y-2">
                    <h4 className="font-semibold text-gray-300">Bônus a serem pagos:</h4>
                    {payoutDetails.map(detail => (
                        <div key={detail.level} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Nível {detail.level} ({detail.referrer.name}):</span>
                            <span className="font-bold text-brand-green">+ US$ {detail.bonusAmount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-500">Esta ação é irreversível. As transações de bônus serão criadas como "Concluídas" e o saldo dos indicadores será atualizado.</p>

                <div className="flex justify-end gap-4 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={onConfirm}>Confirmar Repasse</Button>
                </div>
            </div>
        </Modal>
    );
};


const TransactionRow: React.FC<{ 
    tx: Transaction,
    allUsers: User[],
    onUpdateTransaction: (transactionId: string, newStatus: TransactionStatus) => void
    onOpenPayoutModal: (tx: Transaction) => void;
    onOpenWithdrawalModal: (tx: Transaction) => void;
    isBonusEligible: boolean;
}> = ({ tx, allUsers, onUpdateTransaction, onOpenPayoutModal, onOpenWithdrawalModal, isBonusEligible }) => {
    const user = allUsers.find(u => u.id === tx.userId);
    const sourceUser = tx.sourceUserId ? allUsers.find(u => u.id === tx.sourceUserId) : null;
    const amountColor = tx.amountUSD > 0 ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
        [TransactionStatus.Scheduled]: 'bg-blue-500/20 text-blue-400',
    };

    const handleApprove = () => {
        if (tx.type === TransactionType.Withdrawal) {
            onOpenWithdrawalModal(tx);
        } else {
            onUpdateTransaction(tx.id, TransactionStatus.Completed);
        }
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-brand-gray/50">
            <td className="p-4">
                <p className="font-semibold text-white">{user?.name || 'Usuário Desconhecido'}</p>
                <p className="text-xs text-gray-500 font-mono">{tx.id.slice(0, 8)}...</p>
            </td>
            <td className="p-4 text-sm text-gray-400">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
            <td className="p-4 font-medium text-sm text-gray-300">
                {tx.type === TransactionType.Deposit ? 'Depósito' : 
                 tx.type === TransactionType.Withdrawal ? 'Saque' : 
                 tx.type === TransactionType.Bonus ? 'Bônus' : tx.type}
                
                {tx.type === TransactionType.Bonus && tx.referralLevel && (
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                        Nível {tx.referralLevel} (de {sourceUser?.name || 'N/A'})
                    </span>
                )}
            </td>
            <td className={`p-4 font-bold`}>
                <p className={amountColor}>
                    {tx.type === TransactionType.Deposit && tx.amountBRL ? `R$ ${tx.amountBRL.toFixed(2)}` : `US$ ${tx.amountUSD.toFixed(2)}`}
                </p>
                {tx.type === TransactionType.Withdrawal && tx.status === TransactionStatus.Pending && tx.amountBRL && (
                    <p className="text-xs font-normal text-yellow-500 mt-1">Pagar: R$ {tx.amountBRL.toFixed(2)}</p>
                )}
            </td>
            <td className="p-4 text-xs text-gray-400">
                {tx.withdrawalDetails ? (
                    <div className="space-y-0.5">
                        <p><span className="text-gray-600">PIX:</span> <span className="text-gray-300 select-all">{tx.withdrawalDetails.pixKey}</span></p>
                        <p><span className="text-gray-600">Banco:</span> {tx.withdrawalDetails.bank}</p>
                    </div>
                ) : 'N/A'}
            </td>
            <td className="p-4">
                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${statusColors[tx.status]}`}>{tx.status}</span>
            </td>
            <td className="p-4">
                <div className="flex gap-2 items-center">
                    {tx.status === TransactionStatus.Pending && tx.type !== TransactionType.Bonus && (
                        <>
                            <Button onClick={handleApprove} variant="ghost" className="px-2 py-1 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30">
                                {tx.type === TransactionType.Withdrawal ? 'Analisar' : 'Aprovar'}
                            </Button>
                            <Button onClick={() => onUpdateTransaction(tx.id, TransactionStatus.Failed)} variant="ghost" className="px-2 py-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30">
                                Recusar
                            </Button>
                        </>
                    )}
                     {isBonusEligible && (
                        <Button onClick={() => onOpenPayoutModal(tx)} variant="secondary" className="px-2 py-1 text-xs">Repassar Bônus</Button>
                    )}
                </div>
            </td>
        </tr>
    );
};


interface ManageTransactionsProps {
    transactions: Transaction[];
    allUsers: User[];
    onUpdateTransaction: (transactionId: string, newStatus: TransactionStatus) => void;
    onPayoutBonus: (depositTransaction: Transaction) => void;
    referralRates?: {[key:number]: number};
}

const ManageTransactions: React.FC<ManageTransactionsProps> = ({ transactions, allUsers, onUpdateTransaction, onPayoutBonus, referralRates }) => {
    const [selectedTxForBonus, setSelectedTxForBonus] = useState<Transaction | null>(null);
    const [selectedTxForWithdrawal, setSelectedTxForWithdrawal] = useState<Transaction | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    
    // Filters State
    const [statusFilter, setStatusFilter] = useState<'All' | TransactionStatus>('Pending'); // Default to Pending for better admin focus
    const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const activeReferralRates = referralRates || REFERRAL_BONUS_RATES;

    const bonusPayoutDetails = useMemo((): BonusPayoutDetails[] => {
        if (!selectedTxForBonus) return [];
        
        const details: BonusPayoutDetails[] = [];
        let currentUser = allUsers.find(u => u.id === selectedTxForBonus.userId);

        for (let level = 1; level <= 3 && currentUser?.referredById; level++) {
            const referrer = allUsers.find(u => u.id === currentUser.referredById);
            if (!referrer) break;

            const bonusRate = activeReferralRates[level as any] || 0;
            if (bonusRate === 0) continue;

            const bonusAmount = selectedTxForBonus.amountUSD * bonusRate;

            details.push({ level, referrer, bonusAmount });
            currentUser = referrer;
        }
        return details;
    }, [selectedTxForBonus, allUsers, activeReferralRates]);

    const isTxBonusEligible = (tx: Transaction, allTransactions: Transaction[]): boolean => {
        if (tx.type !== TransactionType.Deposit || tx.status !== TransactionStatus.Completed || tx.bonusPayoutHandled) {
            return false;
        }
        const user = allUsers.find(u => u.id === tx.userId);
        if (!user || !user.referredById) {
            return false;
        }
        const userCompletedDeposits = allTransactions.filter(
            t => t.userId === tx.userId && t.type === TransactionType.Deposit && t.status === TransactionStatus.Completed
        );
        const firstCompletedDeposit = userCompletedDeposits.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        return firstCompletedDeposit?.id === tx.id;
    };
    
    const handleConfirmPayout = () => {
        if (selectedTxForBonus) {
            onPayoutBonus(selectedTxForBonus);
            setToastMessage('Bônus repassado com sucesso!');
            setTimeout(() => setToastMessage(null), 3000);
            setSelectedTxForBonus(null);
        }
    }

    const handleUpdateWithToast = (transactionId: string, newStatus: TransactionStatus) => {
        onUpdateTransaction(transactionId, newStatus);
        const action = newStatus === TransactionStatus.Completed ? "aprovada" : "recusada";
        setToastMessage(`Transação ${action} com sucesso!`);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleConfirmWithdrawal = () => {
        if (selectedTxForWithdrawal) {
            handleUpdateWithToast(selectedTxForWithdrawal.id, TransactionStatus.Completed);
            setSelectedTxForWithdrawal(null);
        }
    };
    
    const sourceUserForModal = selectedTxForBonus ? allUsers.find(u => u.id === selectedTxForBonus.userId) : undefined;
    const withdrawalUserForModal = selectedTxForWithdrawal ? allUsers.find(u => u.id === selectedTxForWithdrawal.userId) : undefined;

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
            const matchesType = typeFilter === 'All' || tx.type === typeFilter;
            
            let matchesSearch = true;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const user = allUsers.find(u => u.id === tx.userId);
                matchesSearch = 
                    (user?.name.toLowerCase().includes(term) || false) ||
                    (user?.email.toLowerCase().includes(term) || false) ||
                    tx.id.toLowerCase().includes(term);
            }

            return matchesStatus && matchesType && matchesSearch;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, statusFilter, typeFilter, searchTerm, allUsers]);

    return (
        <>
        {toastMessage && <Toast message={toastMessage} />}
        {selectedTxForBonus && (
            <PayoutConfirmationModal 
                isOpen={!!selectedTxForBonus}
                onClose={() => setSelectedTxForBonus(null)}
                onConfirm={handleConfirmPayout}
                depositTx={selectedTxForBonus}
                payoutDetails={bonusPayoutDetails}
                sourceUser={sourceUserForModal}
            />
        )}
        {selectedTxForWithdrawal && (
            <WithdrawalReviewModal
                isOpen={!!selectedTxForWithdrawal}
                onClose={() => setSelectedTxForWithdrawal(null)}
                onConfirm={handleConfirmWithdrawal}
                tx={selectedTxForWithdrawal}
                user={withdrawalUserForModal}
            />
        )}

        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gestão de Transações</h1>
                <p className="text-gray-400">Aprove transações, visualize detalhes e gerencie repasses de bônus.</p>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-brand-black/20 border-gray-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input 
                            label="Buscar" 
                            id="search-admin-tx" 
                            placeholder="Nome, Email ou ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                        <select 
                            className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                        >
                            <option value="All">Todos</option>
                            <option value={TransactionStatus.Pending}>Pendentes</option>
                            <option value={TransactionStatus.Completed}>Concluídos</option>
                            <option value={TransactionStatus.Failed}>Falharam</option>
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                        <select 
                            className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                        >
                            <option value="All">Todos</option>
                            <option value={TransactionType.Deposit}>Depósitos</option>
                            <option value={TransactionType.Withdrawal}>Saques</option>
                            <option value={TransactionType.Bonus}>Bônus</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário / ID</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Detalhes</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(tx => (
                                    <TransactionRow 
                                        key={tx.id} 
                                        tx={tx}
                                        allUsers={allUsers}
                                        onUpdateTransaction={handleUpdateWithToast} 
                                        onOpenPayoutModal={setSelectedTxForBonus}
                                        onOpenWithdrawalModal={setSelectedTxForWithdrawal}
                                        isBonusEligible={isTxBonusEligible(tx, transactions)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Nenhuma transação encontrada com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
        </>
    );
};

export default ManageTransactions;
