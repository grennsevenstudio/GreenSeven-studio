
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS } from '../../../../../constants';
import type { User, Transaction } from '../../../../../types';

interface DeleteHistoryProps {
    allUsers: User[];
    allTransactions: Transaction[];
    onDeleteUserTransactions: (userId: string) => void;
}

const DeleteHistory: React.FC<DeleteHistoryProps> = ({ allUsers, allTransactions, onDeleteUserTransactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(u => !u.isAdmin)
            .filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allUsers, searchTerm]);

    const getUserTransactionCount = (userId: string) => {
        return allTransactions.filter(tx => tx.userId === userId).length;
    };

    const handleOpenConfirm = (user: User) => {
        setSelectedUser(user);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedUser) {
            onDeleteUserTransactions(selectedUser.id);
            setIsConfirmModalOpen(false);
            setSelectedUser(null);
        }
    };

    return (
        <div className="space-y-8">
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirmar Exclusão de Histórico"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
                        <div className="text-red-500">
                            {ICONS.alert}
                        </div>
                        <div>
                            <h4 className="text-red-500 font-bold text-sm">Ação Irreversível</h4>
                            <p className="text-gray-300 text-xs mt-1">
                                Você está prestes a excluir <strong>todas</strong> as movimentações financeiras do usuário <span className="text-white font-bold">{selectedUser?.name}</span>. 
                                Isso removerá registros de depósitos, saques e bônus permanentemente do banco de dados.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">Deseja realmente continuar?</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button 
                            variant="primary" 
                            className="bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-red-900/20"
                            onClick={handleConfirmDelete}
                        >
                            Confirmar Exclusão
                        </Button>
                    </div>
                </div>
            </Modal>

            <div>
                <h1 className="text-3xl font-bold">Gerenciar Histórico</h1>
                <p className="text-gray-400">Limpeza de registros de movimentações por usuário.</p>
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
                                    const txCount = getUserTransactionCount(user.id);
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
                                                    onClick={() => handleOpenConfirm(user)} 
                                                    disabled={txCount === 0}
                                                    className={`px-4 py-2 text-xs flex items-center gap-2 ml-auto ${txCount === 0 ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500 border-gray-700' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30'}`}
                                                    variant="ghost"
                                                >
                                                    {ICONS.trash} Limpar Histórico
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
