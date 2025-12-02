
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../../../ui/Card';
import type { Transaction } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';
import { formatCurrency } from '../../../../../lib/utils';

interface TransactionItemProps {
    tx: Transaction;
    isExpanded: boolean;
    onToggle: () => void;
}

const TransactionDetails: React.FC<{ tx: Transaction, statusColors: any }> = ({ tx, statusColors }) => (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm relative overflow-hidden bg-brand-black/20 rounded-lg">
        <div className="space-y-2">
            <h4 className="text-brand-green font-bold uppercase text-[10px] tracking-wider mb-1 border-b border-gray-700 pb-1">Detalhes</h4>
            <div className="flex justify-between">
                <span className="text-gray-400">ID:</span>
                <span className="text-white font-mono text-xs">{tx.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-400">Data:</span>
                <span className="text-white">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-bold ${statusColors[tx.status].split(' ')[1]}`}>{tx.status}</span>
            </div>
        </div>

        <div className="space-y-2">
            <h4 className="text-brand-blue font-bold uppercase text-[10px] tracking-wider mb-1 border-b border-gray-700 pb-1">Informações Adicionais</h4>
            
            {tx.type === TransactionType.Withdrawal && tx.withdrawalDetails ? (
                <>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Banco:</span>
                        <span className="text-white text-right">{tx.withdrawalDetails.bank}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">PIX:</span>
                        <span className="text-white text-right break-all">{tx.withdrawalDetails.pixKey}</span>
                    </div>
                    {tx.amountBRL && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-700/50">
                            <span className="text-gray-400">Valor (BRL):</span>
                            <span className="text-brand-green font-bold">{formatCurrency(tx.amountBRL, 'BRL')}</span>
                        </div>
                    )}
                </>
            ) : tx.type === TransactionType.Deposit && tx.amountBRL ? (
                 <>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Valor Original:</span>
                        <span className="text-white">{formatCurrency(tx.amountBRL, 'BRL')}</span>
                    </div>
                 </>
            ) : tx.type === TransactionType.Bonus ? (
                <>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Origem:</span>
                        <span className="text-white font-mono text-xs">{tx.sourceUserId ? `Ref: ${tx.sourceUserId.slice(0,8)}...` : 'Sistema'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Nível:</span>
                        <span className="text-white">{tx.referralLevel ? `${tx.referralLevel}º Nível` : 'Direto'}</span>
                    </div>
                </>
            ) : (
                <p className="text-gray-500 text-xs italic">Sem detalhes adicionais.</p>
            )}
        </div>
    </div>
);

const TransactionRow: React.FC<TransactionItemProps> = ({ tx, isExpanded, onToggle }) => {
    const isPositive = tx.amountUSD > 0;
    const amountColor = isPositive ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
        [TransactionStatus.Scheduled]: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <>
            <tr 
                onClick={onToggle}
                className={`border-b border-gray-800 transition-colors cursor-pointer group ${isExpanded ? 'bg-brand-gray/80 border-l-2 border-l-brand-green' : 'hover:bg-brand-gray/30 border-l-2 border-l-transparent'}`}
            >
                <td className="p-4 text-gray-300 flex items-center gap-3">
                    <div className={`text-brand-green transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4 font-medium text-white">
                    {tx.type === TransactionType.Deposit ? 'Depósito' : 
                     tx.type === TransactionType.Withdrawal ? 'Saque' : 
                     tx.type === TransactionType.Bonus ? 'Bônus' : tx.type}
                </td>
                <td className={`p-4 font-bold ${amountColor}`}>
                    {tx.status === TransactionStatus.Pending && tx.type === TransactionType.Deposit ? `(~ ${formatCurrency(tx.amountUSD, 'USD')})` : formatCurrency(tx.amountUSD, 'USD')}
                </td>
                <td className="p-4 text-gray-300">{tx.amountBRL ? formatCurrency(tx.amountBRL, 'BRL') : '-'}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[tx.status]}`}>
                        {tx.status === TransactionStatus.Completed ? 'Concluído' :
                         tx.status === TransactionStatus.Pending ? 'Pendente' :
                         tx.status === TransactionStatus.Failed ? 'Falhou' : tx.status}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-brand-black/40 border-b border-gray-800 animate-fade-in">
                    <td colSpan={5} className="p-0">
                        <TransactionDetails tx={tx} statusColors={statusColors} />
                    </td>
                </tr>
            )}
        </>
    )
}

const TransactionMobileCard: React.FC<TransactionItemProps> = ({ tx, isExpanded, onToggle }) => {
    const isPositive = tx.amountUSD > 0;
    const amountColor = isPositive ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
        [TransactionStatus.Scheduled]: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <div className="bg-brand-gray border border-gray-800 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-3" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-brand-green/10 text-brand-green' : 'bg-red-500/10 text-red-500'}`}>
                        {tx.type === TransactionType.Deposit || tx.type === TransactionType.Bonus ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white">
                            {tx.type === TransactionType.Deposit ? 'Depósito' : 
                             tx.type === TransactionType.Withdrawal ? 'Saque' : 
                             tx.type === TransactionType.Bonus ? 'Bônus' : tx.type}
                        </h4>
                        <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold ${amountColor}`}>
                        {formatCurrency(tx.amountUSD, 'USD')}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusColors[tx.status]}`}>
                        {tx.status === TransactionStatus.Completed ? 'Concluído' :
                         tx.status === TransactionStatus.Pending ? 'Pendente' :
                         tx.status === TransactionStatus.Failed ? 'Falhou' : tx.status}
                    </span>
                </div>
            </div>
            
            {/* Toggle Button */}
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-center pt-2 border-t border-gray-700/50 text-gray-500 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-700 animate-fade-in">
                    <TransactionDetails tx={tx} statusColors={statusColors} />
                </div>
            )}
        </div>
    );
};

interface TransactionsProps {
    transactions: Transaction[];
}

const Transactions: React.FC<TransactionsProps> = ({ transactions }) => {
    const [filter, setFilter] = useState<TransactionType | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

    const handleRowToggle = (id: string) => {
        setExpandedTxId(prev => prev === id ? null : id);
    };

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        let result = transactions;
        
        if (filter !== 'All') {
            result = result.filter(tx => tx.type === filter);
        }

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(tx => 
                tx.type.toLowerCase().includes(lowerTerm) ||
                tx.status.toLowerCase().includes(lowerTerm) ||
                tx.amountUSD.toString().includes(lowerTerm) ||
                (tx.amountBRL && tx.amountBRL.toString().includes(lowerTerm)) ||
                tx.date.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort by Date Descending
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filter, transactions, searchTerm]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
        setExpandedTxId(null);
    }, [filter, searchTerm, itemsPerPage]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const filterButtons: {label: string, value: TransactionType | 'All'}[] = [
        { label: 'Todas', value: 'All'},
        { label: 'Depósitos', value: TransactionType.Deposit},
        { label: 'Saques', value: TransactionType.Withdrawal},
        { label: 'Bônus', value: TransactionType.Bonus},
        // Yield excluded from buttons if not desired, or kept if needed. Based on user request, showing all types in history is fine.
        { label: 'Rendimentos', value: TransactionType.Yield},
    ];

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
        setExpandedTxId(null);
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
        setExpandedTxId(null);
    };

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-0 pb-20">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Histórico de Movimentações</h1>
                <p className="text-gray-400 text-sm sm:text-base">Acompanhe todos os seus depósitos, saques e bônus.</p>
            </div>
            
            <Card>
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                        {filterButtons.map(btn => (
                            <button 
                                key={btn.value} 
                                onClick={() => setFilter(btn.value)}
                                className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex-shrink-0 ${filter === btn.value ? 'bg-brand-green text-brand-black' : 'bg-brand-black text-gray-300 hover:bg-gray-800'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <div className="w-full">
                        <Input 
                            label="" 
                            id="search-transactions" 
                            placeholder="Buscar..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4 rounded-tl-lg">Data</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Valor (USD)</th>
                                <th className="p-4">Valor (BRL)</th>
                                <th className="p-4 rounded-tr-lg">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map(tx => (
                                    <TransactionRow 
                                        key={tx.id} 
                                        tx={tx} 
                                        isExpanded={expandedTxId === tx.id}
                                        onToggle={() => handleRowToggle(tx.id)}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Nenhuma transação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                    {paginatedTransactions.length > 0 ? (
                        paginatedTransactions.map(tx => (
                            <TransactionMobileCard
                                key={tx.id}
                                tx={tx}
                                isExpanded={expandedTxId === tx.id}
                                onToggle={() => handleRowToggle(tx.id)}
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 bg-brand-black/20 rounded-xl">
                            Nenhuma transação encontrada.
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredTransactions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-gray-800 pt-4 gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Por página:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-brand-black border border-gray-700 text-white text-sm rounded p-1 focus:outline-none focus:border-brand-green"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4">
                             <div className="text-xs sm:text-sm text-gray-400">
                                <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> de <span className="font-medium text-white">{filteredTransactions.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="secondary" 
                                    onClick={handlePreviousPage} 
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Anterior
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Próximo
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}

export default Transactions;
