
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../../../ui/Card';
import type { Transaction } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => {
    const isPositive = tx.amountUSD > 0;
    const amountColor = isPositive ? 'text-brand-green' : 'text-red-500';
    const statusColors: {[key in TransactionStatus]: string} = {
        [TransactionStatus.Completed]: 'bg-green-500/20 text-green-400',
        [TransactionStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [TransactionStatus.Failed]: 'bg-red-500/20 text-red-400',
    };

    return (
        <tr className="border-b border-gray-800 hover:bg-brand-gray/50 transition-colors">
            <td className="p-4 text-gray-300">{tx.date}</td>
            <td className="p-4 font-medium text-white">{tx.type}</td>
            <td className={`p-4 font-bold ${amountColor}`}>
                {tx.status === TransactionStatus.Pending && tx.type === TransactionType.Deposit ? `(~ US$ ${tx.amountUSD.toFixed(2)})` : `US$ ${tx.amountUSD.toFixed(2)}`}
            </td>
            <td className="p-4 text-gray-300">{tx.amountBRL ? `R$ ${tx.amountBRL.toFixed(2)}` : 'N/A'}</td>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filtra as transações baseadas no tipo selecionado e termo de busca
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

        return result;
    }, [filter, transactions, searchTerm]);

    // Reseta para a página 1 sempre que o filtro ou busca mudar
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm, itemsPerPage]);

    // Lógica de Paginação
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const filterButtons: {label: string, value: TransactionType | 'All'}[] = [
        { label: 'Todas', value: 'All'},
        { label: 'Depósitos', value: TransactionType.Deposit},
        { label: 'Saques', value: TransactionType.Withdrawal},
        { label: 'Rendimentos', value: TransactionType.Yield},
        { label: 'Bônus', value: TransactionType.Bonus},
    ];

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
                <p className="text-gray-400">Acompanhe todos os seus depósitos, saques e rendimentos.</p>
            </div>
            
            <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {filterButtons.map(btn => (
                            <button 
                                key={btn.value} 
                                onClick={() => setFilter(btn.value)}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === btn.value ? 'bg-brand-green text-brand-black' : 'bg-brand-black text-gray-300 hover:bg-gray-800'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <div className="w-full md:w-72">
                        <Input 
                            label="" 
                            id="search-transactions" 
                            placeholder="Buscar por tipo, valor ou status..." 
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
                
                <div className="overflow-x-auto min-h-[400px]">
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
                                    <TransactionRow key={tx.id} tx={tx} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        {searchTerm 
                                            ? "Nenhuma transação encontrada para sua busca." 
                                            : "Nenhuma transação encontrada para este filtro."
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Controles de Paginação */}
                {filteredTransactions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 border-t border-gray-800 pt-4 gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Linhas por página:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-brand-black border border-gray-700 text-white text-sm rounded p-1 focus:outline-none focus:border-brand-green"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-4">
                             <div className="text-sm text-gray-400">
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
