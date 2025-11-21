
import React, { useMemo } from 'react';
import type { User, Transaction } from '../../../../../types';
import { TransactionStatus, TransactionType } from '../../../../../types';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { ICONS, REFERRAL_BONUS_RATES } from '../../../../../constants';

interface CareerPlanProps {
    user: User;
    allUsers: User[];
    allTransactions: Transaction[];
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

const CareerPlan: React.FC<CareerPlanProps> = ({ user, allUsers, allTransactions }) => {
    const referralLink = `https://greennseven.com/register?ref=${user.referralCode}`;

    const directReferrals = useMemo(() => {
        return allUsers.filter(u => u.referredById === user.id);
    }, [user.id, allUsers]);

    const totalBonusEarned = useMemo(() => {
        return allTransactions
            .filter(tx => tx.userId === user.id && tx.type === TransactionType.Bonus && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amountUSD, 0);
    }, [user.id, allTransactions]);

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        alert('Link de indicação copiado para a área de transferência!');
    };

    const getReferralStatus = (referralId: string) => {
        const hasCompletedDeposit = allTransactions.some(
            tx => tx.userId === referralId && tx.type === TransactionType.Deposit && tx.status === TransactionStatus.Completed
        );
        return hasCompletedDeposit ? 
            <span className="text-brand-green font-semibold">Ativo</span> : 
            <span className="text-yellow-400">Aguardando Depósito</span>;
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Plano de Carreira</h1>
                <p className="text-gray-400">Convide novos investidores e ganhe bônus sobre seus depósitos.</p>
            </div>

            <Card className="border-brand-green/30">
                <h2 className="text-xl font-bold mb-4">Seu Link de Indicação</h2>
                <p className="text-gray-400 mb-4">Compartilhe este link com seus amigos. Quando eles se cadastrarem e fizerem o primeiro depósito, você ganhará um bônus.</p>
                <div className="relative">
                    <input 
                        type="text" 
                        readOnly 
                        value={referralLink} 
                        className="w-full bg-brand-black border border-gray-700 rounded-lg py-3 px-4 text-gray-300 pr-28"
                    />
                    <Button 
                        onClick={copyLink} 
                        className="absolute inset-y-0 right-0 my-1.5 mr-1.5 px-4 py-2 text-sm"
                    >
                        {ICONS.copy} Copiar
                    </Button>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                 <StatCard 
                    title="Total de Indicados (Nível 1)" 
                    value={directReferrals.length.toString()}
                    icon={ICONS.adminUsers} 
                />
                 <StatCard 
                    title="Total de Bônus Ganhos (USD)" 
                    value={`$ ${totalBonusEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={ICONS.dollar}
                />
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-center">
                <Card>
                    <p className="text-4xl font-black text-brand-green">{(REFERRAL_BONUS_RATES[1] * 100)}%</p>
                    <p className="font-bold mt-2">Nível 1</p>
                    <p className="text-sm text-gray-400">Bônus sobre o primeiro depósito dos seus indicados diretos.</p>
                </Card>
                <Card>
                    <p className="text-4xl font-black text-brand-blue">{(REFERRAL_BONUS_RATES[2] * 100)}%</p>
                    <p className="font-bold mt-2">Nível 2</p>
                    <p className="text-sm text-gray-400">Bônus sobre os indicados dos seus indicados.</p>
                </Card>
                 <Card>
                    <p className="text-4xl font-black text-gray-400">{(REFERRAL_BONUS_RATES[3] * 100)}%</p>
                    <p className="font-bold mt-2">Nível 3</p>
                    <p className="text-sm text-gray-400">Bônus sobre o terceiro nível de indicações.</p>
                </Card>
            </div>

            <Card>
                 <h2 className="text-xl font-bold mb-4">Minhas Indicações (Nível 1)</h2>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-brand-black text-gray-400 uppercase text-xs">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Data de Cadastro</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {directReferrals.length > 0 ? directReferrals.map(ref => (
                                <tr key={ref.id} className="border-b border-gray-800 hover:bg-brand-gray/50">
                                    <td className="p-4 font-semibold">{ref.name}</td>
                                    <td className="p-4 text-gray-300">{ref.email}</td>
                                    <td className="p-4 text-gray-300">{ref.joinedDate}</td>
                                    <td className="p-4">{getReferralStatus(ref.id)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-500">
                                        Você ainda não tem nenhuma indicação direta.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}

export default CareerPlan;
