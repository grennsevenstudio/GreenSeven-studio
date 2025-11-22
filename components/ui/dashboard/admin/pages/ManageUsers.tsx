
import React, { useState } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Modal from '../../../../layout/Modal';
import type { User } from '../../../../../types';
import { UserStatus } from '../../../../../types';
import { RANK_COLORS, ICONS } from '../../../../../constants';

const DataItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
        <p className="text-gray-200">{value}</p>
    </div>
);

const RejectionReasonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('Divergência de informações nos documentos.');
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Motivo da Rejeição">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">Por favor, forneça um motivo para a rejeição do cadastro. Esta informação será registrada e enviada ao usuário.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="w-full bg-brand-black border border-gray-700 rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="Ex: A foto do documento está ilegível."
                />
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={() => onSubmit(reason)}>Confirmar Rejeição</Button>
                </div>
            </div>
        </Modal>
    );
};


const VerificationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUserStatus: (userId: string, newStatus: UserStatus, reason?: string) => void;
}> = ({ isOpen, onClose, user, onUpdateUserStatus }) => {
    const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);

    const handleApprove = () => {
        onUpdateUserStatus(user.id, UserStatus.Approved);
        onClose();
    };

    const handleReject = (reason: string) => {
        onUpdateUserStatus(user.id, UserStatus.Rejected, reason);
        setRejectionModalOpen(false);
        onClose();
    };

    const fullAddress = `${user.address.street}, ${user.address.number}${user.address.complement ? ` - ${user.address.complement}` : ''} - ${user.address.neighborhood}, ${user.address.city} - ${user.address.state}, ${user.address.cep}`;

    return (
        <>
        <RejectionReasonModal
            isOpen={isRejectionModalOpen}
            onClose={() => setRejectionModalOpen(false)}
            onSubmit={handleReject}
        />
        <Modal isOpen={isOpen} onClose={onClose} title={`Analisar Cadastro: ${user.name}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
                {/* User Data */}
                <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-lg text-brand-green border-b border-brand-green/20 pb-1">Dados do Usuário</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <DataItem label="Nome Completo" value={user.name} />
                         <DataItem label="Email" value={user.email} />
                         <DataItem label="CPF" value={user.cpf} />
                         <DataItem label="Telefone" value={user.phone} />
                    </div>
                    <DataItem label="Endereço Completo" value={fullAddress} />
                </div>
                {/* Documents */}
                <div className="space-y-4">
                     <h3 className="font-semibold text-lg text-brand-green border-b border-brand-green/20 pb-1">Documentos de Verificação (KYC)</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">RG/CNH (Frente)</p>
                            <div className="aspect-[3/2] rounded-lg overflow-hidden border border-gray-700 bg-black">
                                <a href={user.documents.idFrontUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={user.documents.idFrontUrl} alt="Frente do Documento" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">RG/CNH (Verso)</p>
                            <div className="aspect-[3/2] rounded-lg overflow-hidden border border-gray-700 bg-black">
                                <a href={user.documents.idBackUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={user.documents.idBackUrl} alt="Verso do Documento" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Selfie com Documento</p>
                            <div className="aspect-[3/2] rounded-lg overflow-hidden border border-gray-700 bg-black">
                                <a href={user.documents.selfieUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={user.documents.selfieUrl} alt="Selfie com Documento" className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" />
                                </a>
                            </div>
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 mt-2">* Clique nas imagens para abrir em tamanho real.</p>
                </div>
            </div>
             <div className="flex justify-end gap-4 pt-6 border-t border-gray-800 mt-6">
                <Button variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={() => setRejectionModalOpen(true)}>Rejeitar</Button>
                <Button variant="primary" onClick={handleApprove}>Aprovar Cadastro</Button>
            </div>
        </Modal>
        </>
    );
};


const UserRow: React.FC<{
    user: User;
    onAdminUpdateUserBalance: (userId: string, newBalance: number) => void;
    onUpdateUserStatus: (userId: string, newStatus: UserStatus, reason?: string) => void;
}> = ({ user, onAdminUpdateUserBalance, onUpdateUserStatus }) => {
    const [isVerificationModalOpen, setVerificationModalOpen] = useState(false);

    const handleEditBalance = () => {
        const newBalanceStr = prompt(`Alterar saldo para ${user.name}:`, user.balanceUSD.toString());
        if (newBalanceStr) {
            const newBalance = parseFloat(newBalanceStr);
            if (!isNaN(newBalance)) {
                onAdminUpdateUserBalance(user.id, newBalance);
            } else {
                 alert("Valor inválido.");
            }
        }
    };
    
    const statusColors: { [key in UserStatus]: string } = {
        [UserStatus.Approved]: 'bg-green-500/20 text-green-400',
        [UserStatus.Pending]: 'bg-yellow-500/20 text-yellow-400',
        [UserStatus.Rejected]: 'bg-red-500/20 text-red-400',
    };

    return (
        <>
            {isVerificationModalOpen && (
                <VerificationModal 
                    isOpen={isVerificationModalOpen} 
                    onClose={() => setVerificationModalOpen(false)} 
                    user={user} 
                    onUpdateUserStatus={onUpdateUserStatus} 
                />
            )}
            <tr className="border-b border-gray-800 hover:bg-brand-gray/50">
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full"/>
                        <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                    </div>
                </td>
                <td className="p-4">US$ {user.balanceUSD.toFixed(2)}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === UserStatus.Approved ? RANK_COLORS[user.rank] : statusColors[user.status]}`}>
                        {user.status === UserStatus.Approved ? user.rank : user.status}
                    </span>
                    {user.status === UserStatus.Rejected && (
                        <p className="text-xs text-red-400 mt-1 truncate" title={user.rejectionReason}>
                            Motivo: {user.rejectionReason || 'Não especificado'}
                        </p>
                    )}
                </td>
                <td className="p-4">{user.joinedDate}</td>
                <td className="p-4">
                    <div className="flex gap-2 flex-wrap items-center">
                        {user.status === UserStatus.Pending ? (
                            <Button onClick={() => setVerificationModalOpen(true)} variant="secondary" className="px-3 py-1 text-sm">Analisar</Button>
                        ) : (
                            <Button onClick={handleEditBalance} variant="ghost" className="px-2 py-1 text-sm">Editar Saldo</Button>
                        )}
                    </div>
                </td>
            </tr>
        </>
    );
};

interface ManageUsersProps {
    allUsers: User[];
    onAdminUpdateUserBalance: (userId: string, newBalance: number) => void;
    onUpdateUserStatus: (userId: string, newStatus: UserStatus, reason?: string) => void;
}

const ManageUsers: React.FC<ManageUsersProps> = ({ allUsers, onAdminUpdateUserBalance, onUpdateUserStatus }) => {
    // Show non-admin users first, with pending users at the top
    const sortedUsers = [...allUsers]
      .filter(u => !u.isAdmin)
      .sort((a, b) => {
        if (a.status === UserStatus.Pending && b.status !== UserStatus.Pending) return -1;
        if (a.status !== UserStatus.Pending && b.status === UserStatus.Pending) return 1;
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
                <p className="text-gray-400">Gerencie contas, saldos e visualize investidores.</p>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Saldo (USD)</th>
                                <th className="p-4">Status / Patente</th>
                                <th className="p-4">Data de Cadastro</th>
                                <th className="p-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map(user => (
                                <UserRow 
                                    key={user.id} 
                                    user={user} 
                                    onAdminUpdateUserBalance={onAdminUpdateUserBalance} 
                                    onUpdateUserStatus={onUpdateUserStatus}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ManageUsers;
