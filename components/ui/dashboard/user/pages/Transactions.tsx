
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
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800/50 grid grid-cols-1 gap-3 text-xs sm:text-sm animate-fade-in bg-gray-50 dark:bg-black/20 p-3 rounded-lg -mx-2 -mb-2">
        <div className="space-y-2">
            <h4 className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Detalhes da Operação</h4>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-800/50 pb-1">
                <span className="text-gray-500 dark:text-gray-400">ID da Transação:</span>
                <span className="text-gray-900 dark:text-white font-mono">{tx.id.split('-')[0].toUpperCase()}...</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 dark:border-gray-800/50 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Data Completa:</span>
                <span className="text-gray-900 dark:text-white">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
            </div>
             <div className="flex justify-between pb-1">
                <span className="text-gray-500 dark:text-gray-400">Status Atual:</span>
                <span className={`font-bold ${statusColors[tx.status].split(' ')[1]}`}>
                    {tx.status === TransactionStatus.Completed ? 'Autorizado/Concluído' :
                     tx.status === TransactionStatus.Pending ? 'Pendente de Análise' :
                     tx.status === TransactionStatus.Failed ? 'Recusado' : tx.status}
                </span>
            </div>
        </div>

        {(tx.withdrawalDetails || tx.amountBRL || tx.sourceUserId) && (
            <div className="space-y-2 pt-1">
                {tx.type === TransactionType.Withdrawal && tx.withdrawalDetails ? (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Banco:</span>
                            <span className="text-gray-900 dark:text-white text-right">{tx.withdrawalDetails.bank}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Chave PIX:</span>
                            <span className="text-gray-900 dark:text-white text-right break-all max-w-[150px] truncate" title={tx.withdrawalDetails.pixKey}>{tx.withdrawalDetails.pixKey}</span>
                        </div>
                        {tx.amountBRL && (
                            <div className="flex justify-between bg-brand-green/10 p-2 rounded">
                                <span className="text-gray-600 dark:text-gray-300">Recebido (BRL):</span>
                                <span className="text-brand-green-dark dark:text-brand-green font-bold">{formatCurrency(tx.amountBRL, 'BRL')}</span>
                            </div>
                        )}
                    </>
                ) : tx.type === TransactionType.Deposit && tx.amountBRL ? (
                     <div className="flex justify-between bg-gray-100 dark:bg-brand-gray p-2 rounded">
                        <span className="text-gray-500 dark:text-gray-400">Valor Original:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(tx.amountBRL, 'BRL')}</span>
                    </div>
                ) : tx.type === TransactionType.Bonus ? (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Origem:</span>
                            <span className="text-gray-900 dark:text-white font-mono">{tx.sourceUserId ? `Ref: ...${tx.sourceUserId.slice(-4)}` : 'Sistema'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Nível:</span>
                            <span className="text-brand-blue font-bold">{tx.referralLevel ? `${tx.referralLevel}º Nível` : 'Direto'}</span>
                        </div>
                    </>
                ) : null}
            </div>
        )}
    </div>
);

const TransactionRow: React.FC<TransactionItemProps> = ({ tx, isExpanded, onToggle }) => {
    const isWithdrawal = tx.type === TransactionType.Withdrawal;
    const amountColor = isWithdrawal ? 'text-red-500' : 'text-brand-green';
    
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-brand-green border-green-500/40 ring-2 ring-brand-green/20 font-black',
        [TransactionStatus.Pending]: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
        [TransactionStatus.Failed]: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
        [TransactionStatus.Scheduled]: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    };

    return (
        <>
            <tr 
                onClick={onToggle}
                className={`border-b border-gray-200 dark:border-gray-800 transition-all cursor-pointer group ${isExpanded ? 'bg-gray-50 dark:bg-brand-gray/50' : 'hover:bg-gray-50 dark:hover:bg-brand-gray/30'}`}
            >
                <td className="p-4 text-gray-600 dark:text-gray-300 flex items-center gap-3">
                    <div className={`text-brand-green transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-4 font-medium text-gray-900 dark:text-white">
                    {tx.type === TransactionType.Deposit ? 'Depósito' : 
                     tx.type === TransactionType.Withdrawal ? 'Saque' : 
                     tx.type === TransactionType.Bonus ? 'Bônus' : tx.type}
                </td>
                <td className={`p-4 font-bold ${amountColor}`}>
                    {(isWithdrawal ? '-' : '+') + ' ' + formatCurrency(Math.abs(tx.amountUSD), 'USD')}
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">{tx.amountBRL ? formatCurrency(tx.amountBRL, 'BRL') : '-'}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-tighter ${statusColors[tx.status]}`}>
                        {tx.status === TransactionStatus.Completed ? 'Autorizado' :
                         tx.status === TransactionStatus.Pending ? 'Pendente' :
                         tx.status === TransactionStatus.Failed ? 'Recusado' : tx.status}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50 dark:bg-brand-black/20 border-b border-gray-200 dark:border-gray-800">
                    <td colSpan={5} className="p-4">
                        <div className="max-w-2xl">
                             <TransactionDetails tx={tx} statusColors={statusColors} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

const TransactionMobileCard: React.FC<TransactionItemProps> = ({ tx, isExpanded, onToggle }) => {
    const isWithdrawal = tx.type === TransactionType.Withdrawal;
    const isBonus = tx.type === TransactionType.Bonus;
    const isDeposit = tx.type === TransactionType.Deposit;

    const amountColor = isWithdrawal ? 'text-red-500' : 'text-brand-green';
    
    // Icon Configuration
    let icon, iconBg;
    if (isWithdrawal) {
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
        iconBg = 'bg-red-100 dark:bg-red-500/10 text-red-500';
    } else if (isBonus) {
        icon = ICONS.userPlus;
        iconBg = 'bg-blue-100 dark:bg-brand-blue/10 text-brand-blue';
    } else {
        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
        iconBg = 'bg-green-100 dark:bg-brand-green/10 text-brand-green-dark dark:text-brand-green';
    }

    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-brand-green border border-brand-green/30 ring-1 ring-brand-green/10',
        [TransactionStatus.Pending]: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20',
        [TransactionStatus.Failed]: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20',
        [TransactionStatus.Scheduled]: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
    };

    const statusLabel = {
        [TransactionStatus.Completed]: 'Autorizado',
        [TransactionStatus.Pending]: 'Pendente',
        [TransactionStatus.Failed]: 'Recusado',
        [TransactionStatus.Scheduled]: 'Agendado',
    }[tx.status] || tx.status;

    return (
        <div 
            className={`bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-3 shadow-sm active:scale-[0.98] transition-transform duration-200 ${isExpanded ? 'ring-1 ring-brand-green/30' : ''}`}
            onClick={onToggle}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>
                        {icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                            {isDeposit ? 'Depósito' : isWithdrawal ? 'Saque' : isBonus ? 'Bônus de Rede' : tx.type}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {new Date(tx.date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </p>
                    </div>
                </div>
                
                <div className="text-right">
                    <p className={`font-bold text-sm ${amountColor}`}>
                        {isWithdrawal ? '-' : '+'} {formatCurrency(Math.abs(tx.amountUSD), 'USD')}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`px-2 py-[2px] text-[9px] font-black uppercase tracking-wider rounded-md ${statusColors[tx.status]}`}>
                            {statusLabel}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-2">
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

        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filter, transactions, searchTerm]);

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
        <div className="space-y-6 sm:space-y-8 animate-fade-in sm:p-0 pb-24 sm:pb-0">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <div className="px-4 sm:px-0">
                <h1 className="text-2xl sm:text-3xl font-bold">Extrato Financeiro</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Histórico completo de solicitações e autorizações.</p>
            </div>
            
            <div className="sticky top-[64px] z-20 bg-gray-50 dark:bg-brand-black pt-2 pb-4 px-4 sm:px-0 -mx-4 sm:mx-0 border-b border-gray-200 dark:border-gray-800/50 sm:static sm:bg-transparent sm:border-0 sm:pt-0 sm:pb-0 transition-colors duration-300">
                <div className="flex flex-col gap-3">
                    <div className="w-full">
                        <Input 
                            label="" 
                            id="search-transactions" 
                            placeholder="Buscar transação..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white dark:bg-brand-gray border-gray-200 dark:border-gray-700"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            }
                        />
                    </div>
                    <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar snap-x">
                        {filterButtons.map(btn => (
                            <button 
                                key={btn.value} 
                                onClick={() => setFilter(btn.value)}
                                className={`whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-full transition-all flex-shrink-0 snap-start border ${
                                    filter === btn.value 
                                    ? 'bg-gradient-to-r from-brand-green to-brand-green-dark text-brand-black border-transparent shadow-lg shadow-brand-green/20 scale-105' 
                                    : 'bg-white dark:bg-brand-gray text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            
            <Card className="border-0 sm:border bg-transparent sm:bg-white sm:dark:bg-brand-gray p-0 sm:p-6 shadow-none sm:shadow-lg">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 dark:bg-brand-black/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
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
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        Nenhuma transação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden px-4 sm:px-0">
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
                        <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
                            <div className="bg-gray-200 dark:bg-gray-800 p-4 rounded-full mb-3">
                                {ICONS.transactions}
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma movimentação encontrada.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredTransactions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 sm:border-t border-gray-200 dark:border-gray-800 pt-4 gap-4 px-4 sm:px-0 pb-4 sm:pb-0">
                        <div className="flex items-center gap-3 hidden sm:flex">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Por página:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white dark:bg-brand-black border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded p-1 focus:outline-none focus:border-brand-green"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                             <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> de <span className="font-medium text-gray-900 dark:text-white">{filteredTransactions.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="secondary" 
                                    onClick={handlePreviousPage} 
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Anterior
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1.5 text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
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
