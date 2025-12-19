
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS } from '../../../../../constants';
import type { User, Transaction } from '../../../../../types';
import { formatCurrency } from '../../../../../lib/utils';

interface DeleteHistoryProps {
    allUsers: User[];
    allTransactions: Transaction[];
    onDeleteTransaction: (txId: string) => void;
}

const DeleteHistory: React.FC<DeleteHistoryProps> = ({ allUsers, allTransactions, onDeleteTransaction }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(u => !u.isAdmin)
            .filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allUsers, searchTerm]);

    const getUserTransactions = (userId: string) => {
        return allTransactions.filter(tx => tx.userId === userId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const handleDeleteClick = (tx: Transaction) => {
        setTransactionToDelete(tx);
    };

    const confirmDelete = () => {
        if (transactionToDelete) {
            onDeleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Confirmation Modal */}
            <Modal
                isOpen={!!transactionToDelete}
                onClose={() => setTransactionToDelete(null)}
                title="Confirmar Exclusão"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-400">Você tem certeza que deseja excluir esta transação permanentemente?</p>
                    {transactionToDelete && (
                        <div className="bg-brand-black p-3 rounded border border-gray-800 text-sm">
                            <p><span className="text-gray-500">ID:</span> <span className="text-gray-300">{transactionToDelete.id.split('-')[0]}...</span></p>
                            <p><span className="text-gray-500">Tipo:</span> <span className="text-white font-bold">{transactionToDelete.type}</span></p>
                            <p><span className="text-gray-500">Valor:</span> <span className="text-brand-green">{formatCurrency(transactionToDelete.amountUSD, 'USD')}</span></p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setTransactionToDelete(null)}>Cancelar</Button>
                        <Button 
                            variant="primary" 
                            className="bg-red-600 hover:bg-red-700 text-white border-red-500"
                            onClick={confirmDelete}
                        >
                            Excluir
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedUserForDetails}
                onClose={() => setSelectedUserForDetails(null)}
                title={`Extrato: ${selectedUserForDetails?.name}`}
            >
                <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                    {selectedUserForDetails && (
                        <div className="space-y-2">
                            {getUserTransactions(selectedUserForDetails.id).length > 0 ? (
                                getUserTransactions(selectedUserForDetails.id).map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 bg-brand-black/50 border border-gray-800 rounded-lg hover:bg-brand-black transition-colors">
                                        <div>
                                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                                            <p className="font-bold text-white text-sm">{tx.type}</p>
                                            <p className={`text-xs ${tx.amountUSD >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
                                                {formatCurrency(tx.amountUSD, 'USD')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                                {tx.status}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteClick(tx)}
                                                className="text-gray-500 hover:text-red-500 transition-colors p-2"
                                                title="Excluir Transação"
                                            >
                                                {ICONS.trash}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">Nenhuma movimentação encontrada.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="secondary" onClick={() => setSelectedUserForDetails(null)}>Fechar</Button>
                </div>
            </Modal>

            <div>
                <h1 className="text-3xl font-bold">Gerenciar Histórico</h1>
                <p className="text-gray-400">Selecione um usuário para visualizar e gerenciar transações específicas.</p>
            </div>

            <Card>
                <div className="mb-6 max-w-md">
                    <Input 
                        label="Buscar Usuário" 
                        id="search-history-user" 
                        placeholder="Nome ou Email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Email</th>
                                <th className="p-4 text-center">Total Movimentações</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => {
                                    const txCount = getUserTransactions(user.id).length;
                                    return (
                                        <tr key={user.id} className="border-b border-gray-800 hover:bg-brand-gray/50 transition-colors">
                                            <td className="p-4 font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full bg-gray-800" />
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${txCount > 0 ? 'bg-brand-blue/20 text-brand-blue' : 'bg-gray-800 text-gray-500'}`}>
                                                    {txCount} registros
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button 
                                                    onClick={() => setSelectedUserForDetails(user)} 
                                                    disabled={txCount === 0}
                                                    className={`px-4 py-2 text-xs ml-auto ${txCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    variant="secondary"
                                                >
                                                    Ver Extrato
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default DeleteHistory;
