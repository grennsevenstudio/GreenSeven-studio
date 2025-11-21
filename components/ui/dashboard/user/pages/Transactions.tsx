

import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import type { Transaction } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const isPositive = tx.amountUSD > 0;
    const amountColor = isPositive ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-brand-gray/50">
            <td className="p-4">{tx.date}</td>
            <td className="p-4 font-medium">{tx.type}</td>
            <td className={`p-4 font-bold ${amountColor}`}>
                {tx.status === TransactionStatus.Pending && tx.type === TransactionType.Deposit ? `(~ US$ ${tx.amountUSD.toFixed(2)})` : `US$ ${tx.amountUSD.toFixed(2)}`}
            </td>
            <td className="p-4">{tx.amountBRL ? `R$ ${tx.amountBRL.toFixed(2)}` : 'N/A'}</td>
            <td className="p-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[tx.status]}`}>{tx.status}</span>
            </td>
        </tr>
    )
}

interface TransactionsProps {
    transactions: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
    const [filter, setFilter] = useState<TransactionType | 'All'>('All');

    const filteredTransactions = useMemo(() => {
        if (filter === 'All') return transactions;
        return transactions.filter(tx => tx.type === filter);
    }, [filter, transactions]);

    const filterButtons: {label: string, value: TransactionType | 'All'}[] = [
        { label: 'Todas', value: 'All'},
        { label: 'Depósitos', value: TransactionType.Deposit},
        { label: 'Saques', value: TransactionType.Withdrawal},
        { label: 'Rendimentos', value: TransactionType.Yield},
        { label: 'Bônus', value: TransactionType.Bonus},
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
                <p className="text-gray-400">Acompanhe todos os seus depósitos, saques e rendimentos.</p>
            </div>
            
            <Card>
                <div className="flex flex-wrap gap-2 mb-4">
                    {filterButtons.map(btn => (
                        <button 
                            key={btn.value} 
                            onClick={() => setFilter(btn.value)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === btn.value ? 'bg-brand-green text-brand-black' : 'bg-brand-black hover:bg-gray-800'}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Valor (USD)</th>
                                <th className="p-4">Valor (BRL)</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <TransactionRow key={tx.id} tx={tx} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

export default Transactions;