
import React from 'react';
import Card from '../../../../ui/Card';
import type { AdminActionLog } from '../../../../../types';

const LogRow: React.FC<{ log: AdminActionLog }> = ({ log }) => {
    const formattedDate = new Date(log.timestamp).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });

    return (
        <tr className="border-b border-gray-800 hover:bg-brand-gray/50">
            <td className="p-4 text-sm text-gray-400">{formattedDate}</td>
            <td className="p-4 font-semibold">{log.adminName}</td>
            <td className="p-4 font-medium">{log.actionType}</td>
            <td className="p-4 text-gray-300">{log.description}</td>
        </tr>
    );
};

interface AdminActionLogsProps {
    adminActionLogs: AdminActionLog[];
}

const AdminActionLogs: React.FC<AdminActionLogsProps> = ({ adminActionLogs }) => {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Logs de Ações Administrativas</h1>
                <p className="text-gray-400">Registro de todas as ações importantes realizadas pelos administradores.</p>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Data e Hora</th>
                                <th className="p-4">Administrador</th>
                                <th className="p-4">Tipo de Ação</th>
                                <th className="p-4">Descrição</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminActionLogs.length > 0 ? (
                                adminActionLogs.map(log => (
                                    <LogRow key={log.id} log={log} />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-500">
                                        Nenhum registro de ação encontrado.
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

export default AdminActionLogs;
