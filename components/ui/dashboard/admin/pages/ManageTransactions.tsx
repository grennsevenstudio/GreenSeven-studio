import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Modal from '../../../../layout/Modal';
import type { Transaction, User } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import { REFERRAL_BONUS_RATES } from '../../../../../constants';

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
    isBonusEligible: boolean;
}> = ({ tx, allUsers, onUpdateTransaction, onOpenPayoutModal, isBonusEligible }) => {
    const user = allUsers.find(u => u.id === tx.userId);
    const sourceUser = tx.sourceUserId ? allUsers.find(u => u.id === tx.sourceUserId) : null;
    const amountColor = tx.amountUSD > 0 ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
        [TransactionStatus.Scheduled]: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-brand-gray/50">
            <td className="p-4">
                <p className="font-semibold">{user?.name || 'Usuário Desconhecido'}</p>
                <p className="text-sm text-gray-500">{tx.id.slice(0, 8)}...</p>
            </td>
            <td className="p-4">{tx.date}</td>
            <td className="p-4 font-medium">
                {tx.type}
                {tx.type === TransactionType.Bonus && tx.referralLevel && (
                    <span className="text-xs text-gray-400 block">
                        Nível {tx.referralLevel} (de {sourceUser?.name || 'N/A'})
                    </span>
                )}
            </td>
            <td className={`p-4 font-bold`}>
                <p className={amountColor}>
                    {tx.type === TransactionType.Deposit && tx.amountBRL ? `R$ ${tx.amountBRL.toFixed(2)}` : `US$ ${tx.amountUSD.toFixed(2)}`}
                </p>
                {tx.type === TransactionType.Withdrawal && tx.status === TransactionStatus.Pending && tx.amountBRL && (
                    <p className="text-sm font-normal text-gray-300">Pagar: R$ {tx.amountBRL.toFixed(2)}</p>
                )}
            </td>
            <td className="p-4 text-xs text-gray-400">
                {tx.withdrawalDetails ? (
                    <div className="space-y-0.5">
                        <p><strong>Nome:</strong> {tx.withdrawalDetails.fullName}</p>
                        <p><strong>CPF:</strong> {tx.withdrawalDetails.cpf}</p>
                        <p><strong>PIX:</strong> {tx.withdrawalDetails.pixKey}</p>
                        <p><strong>Banco:</strong> {tx.withdrawalDetails.bank}</p>
                    </div>
                ) : 'N/A'}
            </td>
            <td className="p-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[tx.status]}`}>{tx.status}</span>
            </td>
            <td className="p-4">
                <div className="flex gap-2 items-center">
                    {tx.status === TransactionStatus.Pending && tx.type !== TransactionType.Bonus && (
                        <>
                            <Button onClick={() => onUpdateTransaction(tx.id, TransactionStatus.Completed)} variant="ghost" className="px-2 py-1 text-sm text-brand-green hover:text-brand-green-light">Aprovar</Button>
                            <Button onClick={() => onUpdateTransaction(tx.id, TransactionStatus.Failed)} variant="ghost" className="px-2 py-1 text-sm text-red-500 hover:text-red-400">Recusar</Button>
                        </>
                    )}
                     {isBonusEligible && (
                        <Button onClick={() => onOpenPayoutModal(tx)} variant="secondary" className="px-2 py-1 text-sm">Repassar Bônus</Button>
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    
    const sourceUserForModal = selectedTxForBonus ? allUsers.find(u => u.id === selectedTxForBonus.userId) : undefined;

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
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gestão de Transações</h1>
                <p className="text-gray-400">Aprove transações, visualize detalhes e gerencie repasses de bônus.</p>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário / ID</th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Detalhes de Pagamento</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                                <TransactionRow 
                                    key={tx.id} 
                                    tx={tx}
                                    allUsers={allUsers}
                                    onUpdateTransaction={handleUpdateWithToast} 
                                    onOpenPayoutModal={setSelectedTxForBonus}
                                    isBonusEligible={isTxBonusEligible(tx, transactions)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
        </>
    );
};

export default ManageTransactions;