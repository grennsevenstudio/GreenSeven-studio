
import React, { useState, useMemo } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';
import type { User, Notification } from '../../../../../types';

interface ManageNotificationsProps {
    allUsers: User[];
    allNotifications: Notification[];
    onAddNotification: (targetUserIds: string[], message: string) => void;
    onDeleteNotification: (notificationId: string) => void;
}

const ManageNotifications: React.FC<ManageNotificationsProps> = ({ allUsers, allNotifications, onAddNotification, onDeleteNotification }) => {
    const [selectedUserId, setSelectedUserId] = useState<'all' | string>('all');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const usersWithoutAdmin = useMemo(() => allUsers.filter(u => !u.isAdmin), [allUsers]);

    const filteredNotifications = useMemo(() => {
        return allNotifications
            .filter(n => {
                if (!searchTerm) return true;
                const user = allUsers.find(u => u.id === n.userId);
                return (
                    n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user?.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allNotifications, searchTerm, allUsers]);

    const handleSendNotification = () => {
        if (!message.trim()) {
            alert("A mensagem não pode estar vazia.");
            return;
        }

        let targetIds: string[] = [];
        if (selectedUserId === 'all') {
            targetIds = usersWithoutAdmin.map(u => u.id);
        } else {
            targetIds = [selectedUserId];
        }

        if (targetIds.length > 0) {
            onAddNotification(targetIds, message);
            setMessage('');
            alert(`Notificação enviada para ${targetIds.length} usuário(s).`);
        }
    };
    
    const handleDelete = (notifId: string) => {
        if(confirm("Tem certeza que deseja excluir esta notificação?")) {
            onDeleteNotification(notifId);
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gerenciar Notificações</h1>
                <p className="text-gray-400">Envie ou remova notificações para os usuários da plataforma.</p>
            </div>

            <Card>
                <h2 className="text-xl font-bold mb-4">Criar Nova Notificação</h2>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <label htmlFor="user-select" className="block text-sm font-medium text-gray-400 mb-1">
                            Destinatário
                        </label>
                        <select
                            id="user-select"
                            className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-brand-green"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="all">Todos os Usuários</option>
                            {usersWithoutAdmin.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="notification-message" className="block text-sm font-medium text-gray-400 mb-1">
                            Mensagem
                        </label>
                        <textarea
                            id="notification-message"
                            rows={3}
                            className="w-full bg-brand-black border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green"
                            placeholder="Ex: Manutenção programada para amanhã às 22h."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSendNotification} disabled={!message.trim()}>
                        Enviar Notificação
                    </Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold mb-4">Histórico de Notificações</h2>
                <div className="mb-4 max-w-sm">
                    <Input
                        label=""
                        id="search-notifications"
                        placeholder="Buscar por mensagem ou usuário..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs sticky top-0">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Mensagem</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNotifications.map(notif => {
                                const user = allUsers.find(u => u.id === notif.userId);
                                return (
                                    <tr key={notif.id} className="border-b border-gray-800 hover:bg-brand-gray/50">
                                        <td className="p-4 text-xs text-gray-400 whitespace-nowrap">{new Date(notif.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 text-sm font-medium text-white">{user?.name || 'Usuário Removido'}</td>
                                        <td className="p-4 text-sm text-gray-300 max-w-sm truncate">{notif.message}</td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${notif.isRead ? 'text-gray-500' : 'text-brand-green'}`}>
                                                {notif.isRead ? 'Lida' : 'Não Lida'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                onClick={() => handleDelete(notif.id)}
                                                variant="ghost"
                                                className="text-red-500 hover:bg-red-500/10 p-2 h-auto"
                                                title="Excluir Notificação"
                                            >
                                                {ICONS.trash}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {filteredNotifications.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma notificação encontrada.</p>}
                </div>
            </Card>
        </div>
    );
};

export default ManageNotifications;
