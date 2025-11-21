

import React, { useMemo, useState, useRef } from 'react';
import type { User, Transaction } from '../../../../../types';
import { InvestorRank, TransactionStatus, TransactionType } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS, RANK_COLORS } from '../../../../../constants';

interface ProfileProps {
    user: User;
    allTransactions: Transaction[];
    setActiveView: (view: string) => void;
    onUpdateUser: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, allTransactions, setActiveView, onUpdateUser }) => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePinUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setPinError(null);

        // Validations
        if (user.transactionPin && currentPin !== user.transactionPin) {
            setPinError("PIN atual incorreto.");
            return;
        }
        if (!/^\d{4}$/.test(newPin)) {
            setPinError("O novo PIN deve conter exatamente 4 dígitos numéricos.");
            return;
        }
        if (newPin !== confirmNewPin) {
            setPinError("Os novos PINs não coincidem.");
            return;
        }

        onUpdateUser({ ...user, transactionPin: newPin });
        alert("PIN de saque atualizado com sucesso!");
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedUser = { ...user };
        
        if (newAvatarUrl) {
            updatedUser.avatarUrl = newAvatarUrl;
        }

        onUpdateUser(updatedUser);
        setNewAvatarUrl(null);
        alert('Perfil atualizado com sucesso!');
    };

    const rankDetails: {[key in InvestorRank]: { next: InvestorRank | null, threshold: number, progress: number }} = {
        [InvestorRank.Bronze]: { next: InvestorRank.Silver, threshold: 1000, progress: (user.balanceUSD / 1000) * 100 },
        [InvestorRank.Silver]: { next: InvestorRank.Gold, threshold: 5000, progress: (user.balanceUSD / 5000) * 100 },
        [InvestorRank.Gold]: { next: InvestorRank.Platinum, threshold: 20000, progress: (user.balanceUSD / 20000) * 100 },
        [InvestorRank.Platinum]: { next: InvestorRank.Diamond, threshold: 100000, progress: (user.balanceUSD / 100000) * 100 },
        [InvestorRank.Diamond]: { next: null, threshold: Infinity, progress: 100 },
    };
    
    const currentRankDetail = rankDetails[user.rank];

    const totalBonusEarned = useMemo(() => {
        return allTransactions
            .filter(tx => tx.userId === user.id && tx.type === TransactionType.Bonus && tx.status === TransactionStatus.Completed)
            .reduce((sum, tx) => sum + tx.amountUSD, 0);
    }, [user.id, allTransactions]);

    return (
        <div className="space-y-8">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
            <div>
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                <p className="text-gray-400">Gerencie suas informações pessoais e de segurança.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Details */}
                    <Card>
                        <h2 className="text-xl font-bold mb-6">Informações Pessoais</h2>
                        <form className="space-y-6" onSubmit={handleProfileSave}>
                            <div className="flex items-center gap-6">
                                <img src={newAvatarUrl || user.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-brand-green object-cover" />
                                <div>
                                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Mudar Foto</Button>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF ou PNG. Tamanho máx. 5MB.</p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <Input label="Nome Completo" id="name" defaultValue={user.name} />
                                <Input label="Email" id="email" type="email" defaultValue={user.email} disabled />
                            </div>
                            <div>
                                <Input label="CPF (Opcional)" id="cpf" placeholder="000.000.000-00" />
                            </div>
                            <div className="pt-2">
                                <Button type="submit">Salvar Alterações</Button>
                            </div>
                        </form>
                    </Card>

                    {/* Security Card */}
                    <Card>
                         <h2 className="text-xl font-bold mb-6">Segurança</h2>
                         <form className="space-y-4" onSubmit={handlePinUpdate}>
                            <h3 className="font-semibold text-white">{user.transactionPin ? 'Alterar PIN de Saque' : 'Criar PIN de Saque'}</h3>
                            <p className="text-sm text-gray-400">Este PIN de 4 dígitos será solicitado em todas as transações de saque para sua segurança.</p>
                            
                            {user.transactionPin && (
                                <Input 
                                    label="PIN Atual" 
                                    id="currentPin" 
                                    type="password" 
                                    maxLength={4}
                                    value={currentPin}
                                    onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            )}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Input 
                                    label="Novo PIN (4 dígitos)" 
                                    id="newPin" 
                                    type="password" 
                                    maxLength={4}
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                                <Input 
                                    label="Confirmar Novo PIN" 
                                    id="confirmNewPin" 
                                    type="password" 
                                    maxLength={4}
                                    value={confirmNewPin}
                                    onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                            {pinError && <p className="text-sm text-red-500">{pinError}</p>}
                            <div className="pt-2">
                                <Button type="submit">{user.transactionPin ? 'Atualizar PIN' : 'Criar PIN'}</Button>
                            </div>
                         </form>
                    </Card>
                </div>


                {/* Side Cards */}
                <div className="space-y-8">
                    {/* Investor Rank */}
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Patente de Investidor</h2>
                        <div className={`text-center py-4 rounded-lg ${RANK_COLORS[user.rank]}`}>
                            <p className="text-2xl font-bold">{user.rank}</p>
                        </div>
                        <div className="mt-6">
                            <p className="text-gray-400 text-sm">Volume investido: <span className="font-bold text-white">US$ {user.capitalInvestedUSD.toFixed(2)}</span></p>

                            {currentRankDetail.next && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm font-medium text-gray-400">
                                        <span>Progresso</span>
                                        <span>Próximo nível: {currentRankDetail.next}</span>
                                    </div>
                                    <div className="w-full bg-brand-black rounded-full h-2.5 mt-1">
                                        <div className="bg-brand-green h-2.5 rounded-full" style={{ width: `${Math.min(currentRankDetail.progress, 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 text-right mt-1">US$ {currentRankDetail.threshold.toLocaleString()}</p>
                                </div>
                            )}

                            {user.rank === InvestorRank.Diamond && (
                                <p className="mt-4 text-center font-semibold text-brand-green">Você atingiu o nível máximo!</p>
                            )}
                        </div>
                    </Card>

                    {/* Referral Earnings */}
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Ganhos por Indicação</h2>
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-black rounded-lg text-brand-green">{ICONS.dollar}</div>
                            <div>
                                <p className="text-gray-400 text-sm">Total de bônus recebidos</p>
                                <p className="text-2xl font-bold text-white">
                                    $ {totalBonusEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="secondary" 
                            fullWidth 
                            className="mt-6"
                            onClick={() => setActiveView('career')}
                        >
                            Ver Detalhes do Plano de Carreira
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default Profile;
