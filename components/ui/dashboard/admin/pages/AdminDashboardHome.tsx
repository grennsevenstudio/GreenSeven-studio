
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Modal from '../../../../layout/Modal';
import { ICONS } from '../../../../../constants';
import { TransactionStatus, type Transaction, type User } from '../../../../../types';
import { formatCurrency } from '../../../../../lib/utils';

// Helper function for relative time
function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 5) return "agora";
    if (seconds < 60) return `há ${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;

    const days = Math.floor(hours / 24);
    return `há ${days}d`;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="flex-1">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-black rounded-lg text-brand-green">{icon}</div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </div>
    </Card>
);

const ProfitChart = () => (
    <div className="h-48 flex items-end justify-between gap-2 px-4 pt-8 pb-2 bg-brand-black rounded-lg border border-gray-800 overflow-hidden">
        {[25, 40, 35, 50, 45, 60, 55, 75, 65, 85, 70, 95].map((h, i) => (
            <div key={i} className="w-full flex flex-col justify-end h-full group cursor-pointer">
                <div className="w-full bg-gradient-to-t from-brand-green/10 to-brand-green/40 rounded-t hover:to-brand-green/80 transition-all duration-300 relative" style={{ height: `${h}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white text-brand-black text-xs font-bold px-2 py-1 rounded transition-opacity shadow-lg z-10 whitespace-nowrap">
                        +${h}k
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const BroadcastModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSend: (msg: string) => void; 
}> = ({ isOpen, onClose, onSend }) => {
    const [message, setMessage] = useState('');
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enviar Notificação Global">
            <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                    Esta mensagem será enviada como notificação para <strong>todos</strong> os usuários da plataforma. Use com cautela para anúncios importantes.
                </p>
                <textarea 
                    className="w-full bg-brand-black border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-green min-h-[100px]"
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button 
                        variant="primary" 
                        onClick={() => { onSend(message); onClose(); setMessage(''); }}
                        disabled={!message.trim()}
                    >
                        Enviar Notificação
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

interface AdminDashboardHomeProps {
    allUsers: User[];
    allTransactions: Transaction[];
    onBroadcastNotification: (message: string) => void;
}

const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ allUsers, allTransactions, onBroadcastNotification }) => {
    const totalVolume = allUsers.reduce((sum, user) => sum + user.balanceUSD, 0);
    const totalUsers = allUsers.length;
    const pendingTransactions = allTransactions.filter(tx => tx.status === TransactionStatus.Pending).length;
    
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [loginEvents, setLoginEvents] = useState<{ user: User; time: Date }[]>([]);

    // Simulate user logins
    useEffect(() => {
        const nonAdminUsers = allUsers.filter(u => !u.isAdmin);
        if (nonAdminUsers.length === 0) return;

        const interval = setInterval(() => {
            const randomUser = nonAdminUsers[Math.floor(Math.random() * nonAdminUsers.length)];
            const newEvent = { user: randomUser, time: new Date() };
            
            setLoginEvents(prev => [newEvent, ...prev].slice(0, 5));
        }, Math.random() * 5000 + 4000); // every 4-9 seconds

        return () => clearInterval(interval);
    }, [allUsers]);

    // Whale mode calculation
    const whales = useMemo(() => {
        return allUsers
            .filter(u => u.capitalInvestedUSD >= 10000 && !u.isAdmin)
            .sort((a, b) => b.capitalInvestedUSD - a.capitalInvestedUSD)
            .slice(0, 5); // show top 5
    }, [allUsers]);

    return (
        <div className="space-y-8">
            <BroadcastModal 
                isOpen={isBroadcastOpen}
                onClose={() => setIsBroadcastOpen(false)}
                onSend={onBroadcastNotification}
            />
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard do Administrador</h1>
                    <p className="text-gray-400">Visão geral da plataforma GreennSeven Invest.</p>
                </div>
                <Button variant="secondary" onClick={() => setIsBroadcastOpen(true)}>
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        Notificação Global
                    </div>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stats */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <StatCard 
                            title="Volume Total Investido (USD)" 
                            value={`$ ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            icon={ICONS.dollar} 
                        />
                         <StatCard 
                            title="Total de Usuários Ativos" 
                            value={totalUsers.toLocaleString('en-US')}
                            icon={ICONS.adminUsers}
                        />
                         <StatCard 
                            title="Transações Pendentes" 
                            value={pendingTransactions.toLocaleString('en-US')}
                            icon={ICONS.transactions}
                        />
                    </div>
                    
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Projeção de Lucro Líquido (Anual)</h2>
                            <div className="flex gap-2">
                                 <span className="flex items-center gap-1 text-xs text-gray-400"><div className="w-3 h-3 bg-brand-green/40 rounded"></div> Lucro Realizado</span>
                            </div>
                        </div>
                        <ProfitChart />
                    </Card>
                </div>

                {/* Side Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Whale Mode */}
                    <Card>
                        <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">{ICONS.crown}</div>
                           <h2 className="text-xl font-bold">Modo Baleia</h2>
                        </div>
                        <div className="space-y-3">
                            {whales.length > 0 ? whales.map(whale => (
                                <div key={whale.id} className="flex items-center justify-between p-2 bg-brand-black/40 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <img src={whale.avatarUrl} alt={whale.name} className="w-8 h-8 rounded-full" />
                                        <p className="text-sm font-semibold">{whale.name}</p>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-brand-green">{formatCurrency(whale.capitalInvestedUSD, 'USD')}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">Nenhum grande investidor ativo.</p>
                            )}
                        </div>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                         <div className="flex items-center gap-3 mb-4">
                           <div className="p-2 bg-brand-green/10 rounded-lg text-brand-green">{ICONS.flash}</div>
                           <h2 className="text-xl font-bold">Atividade Recente</h2>
                        </div>
                        <div className="space-y-4">
                            {loginEvents.length > 0 ? loginEvents.map((event, index) => (
                                <div key={index} className="flex items-center gap-3 animate-fade-in">
                                    <div className="relative flex items-center justify-center">
                                        <span className="absolute w-3 h-3 bg-brand-green rounded-full animate-ping opacity-75"></span>
                                        <span className="relative w-2 h-2 bg-brand-green rounded-full"></span>
                                    </div>
                                    <p className="text-sm">
                                        <span className="font-bold text-white">{event.user.name}</span>
                                        <span className="text-gray-400"> acabou de fazer login.</span>
                                    </p>
                                    <span className="ml-auto text-xs text-gray-500">{timeAgo(event.time)}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">Aguardando atividade...</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboardHome;