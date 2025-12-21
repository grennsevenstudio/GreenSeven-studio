
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../layout/Modal';
import { ICONS } from '../../../../../constants';
import type { User } from '../../../../../types';

interface DeleteUserProps {
    allUsers: User[];
    onDeleteUser: (userId: string) => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({ allUsers, onDeleteUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const filteredUsers = useMemo(() => {
        return allUsers
            .filter(u => !u.isAdmin)
            .filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [allUsers, searchTerm]);

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-8">
            <Modal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                title="Confirmar Exclusão de Usuário"
            >
                <div className="space-y-4">
                    <p className="text-lg text-red-400 font-bold">Atenção: Ação Irreversível!</p>
                    <p className="text-sm text-gray-400">Você tem certeza que deseja excluir permanentemente o usuário <strong className="text-white">{userToDelete?.name}</strong>?</p>
                    <div className="bg-brand-black p-3 rounded border border-gray-800 text-sm">
                        <p><span className="text-gray-500">Email:</span> <span className="text-gray-300">{userToDelete?.email}</span></p>
                    </div>
                    <p className="text-xs text-gray-500">Todos os dados associados a este usuário, incluindo transações, mensagens e histórico, serão removidos do sistema.</p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                        <Button variant="secondary" onClick={() => setUserToDelete(null)}>Cancelar</Button>
                        <Button 
                            variant="primary" 
                            className="bg-red-600 hover:bg-red-700 text-white border-red-500"
                            onClick={confirmDelete}
                        >
                            Confirmar Exclusão
                        </Button>
                    </div>
                </div>
            </Modal>

            <div>
                <h1 className="text-3xl font-bold">Excluir Usuário</h1>
                <p className="text-gray-400">Remova permanentemente contas de usuários da plataforma.</p>
            </div>

            <Card>
                <div className="mb-6 max-w-md">
                    <Input 
                        label="Buscar Usuário para Excluir" 
                        id="search-delete-user" 
                        placeholder="Nome ou Email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={ICONS.adminUsers}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Data de Cadastro</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-red-500/10 transition-colors">
                                        <td className="p-4 font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full bg-gray-800" />
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                                        <td className="p-4 text-gray-400 text-sm">{new Date(user.joinedDate).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-right">
                                            <Button 
                                                onClick={() => handleDeleteClick(user)} 
                                                variant="secondary"
                                                className="px-4 py-2 text-xs bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300"
                                            >
                                                {ICONS.trash} Excluir
                                            </Button>
                                        </td>
                                    </tr>
                                ))
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

export default DeleteUser;