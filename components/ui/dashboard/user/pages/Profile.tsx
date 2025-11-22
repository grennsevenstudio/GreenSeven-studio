
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { User, Transaction } from '../../../../../types';
import { InvestorRank, TransactionStatus, TransactionType } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS, RANK_COLORS } from '../../../../../constants';
import { formatCPF } from '../../../../../lib/utils';

interface ProfileProps {
    user: User;
    allTransactions: Transaction[];
    setActiveView: (view: string) => void;
    onUpdateUser: (updatedUser: User) => void;
    onUpdatePassword: (userId: string, newPassword: string) => void;
}

const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up ${type === 'success' ? 'bg-brand-green text-brand-black' : 'bg-red-500 text-white'}`}>
        <div className={`p-1 rounded-full ${type === 'success' ? 'bg-black/10' : 'bg-white/20'}`}>
            {type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            )}
        </div>
        <span className="font-bold">{message}</span>
        <style>{`
            @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-up {
                animation: fade-in-up 0.3s ease-out forwards;
            }
        `}</style>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ user, allTransactions, setActiveView, onUpdateUser, onUpdatePassword }) => {
    // Personal Info State
    const [name, setName] = useState(user.name);
    const [cpf, setCpf] = useState(user.cpf || '');
    const [phone, setPhone] = useState(user.phone || '');
    
    // Address State
    const [address, setAddress] = useState(user.address || {
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: ''
    });

    // Security State
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);
    
    const [newLoginPassword, setNewLoginPassword] = useState('');
    const [confirmLoginPassword, setConfirmLoginPassword] = useState('');

    const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Toast State
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Sync state if user prop changes
    useEffect(() => {
        setName(user.name);
        setCpf(user.cpf || '');
        setPhone(user.phone || '');
        setAddress(user.address || { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' });
    }, [user]);

    const fetchAddress = async (cleanCep: string) => {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setAddress(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
        setPhone(value);
    };

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        
        if (id === 'cep') {
            const formattedCep = value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
            setAddress(prev => ({ ...prev, cep: formattedCep }));
            
            const cleanCep = formattedCep.replace(/\D/g, '');
            if (cleanCep.length === 8) {
                fetchAddress(cleanCep);
            }
            return;
        }

        setAddress(prev => ({ ...prev, [id]: value }));
    };

    const handlePinUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setPinError(null);

        // Validations
        if (user.transactionPin && currentPin !== user.transactionPin) {
            setPinError("PIN atual incorreto.");
            showToast("PIN atual incorreto.", 'error');
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
        showToast("PIN de saque atualizado com sucesso!");
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
    };

    const handleLoginPasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLoginPassword.length < 6) {
            showToast("A senha deve ter no mínimo 6 caracteres.", 'error');
            return;
        }
        if (newLoginPassword !== confirmLoginPassword) {
            showToast("As senhas não coincidem.", 'error');
            return;
        }
        onUpdatePassword(user.id, newLoginPassword);
        setNewLoginPassword('');
        setConfirmLoginPassword('');
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
        let updatedUser = { 
            ...user,
            name: name,
            cpf: cpf,
            phone: phone,
            address: address
        };
        
        if (newAvatarUrl) {
            updatedUser.avatarUrl = newAvatarUrl;
        }

        onUpdateUser(updatedUser);
        setNewAvatarUrl(null);
        showToast('Informações atualizadas com sucesso!');
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
            {toast && <Toast message={toast.message} type={toast.type} />}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
            <div>
                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                <p className="text-gray-400">Gerencie seus dados cadastrais e de segurança.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Details */}
                    <Card>
                        <h2 className="text-xl font-bold mb-6">Dados Cadastrais</h2>
                        <form className="space-y-8" onSubmit={handleProfileSave}>
                            <div className="flex items-center gap-6 border-b border-gray-800 pb-6">
                                <img src={newAvatarUrl || user.avatarUrl} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-brand-green object-cover" />
                                <div>
                                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Mudar Foto</Button>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF ou PNG. Tamanho máx. 5MB.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-brand-green uppercase text-xs tracking-wider">Informações Pessoais</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input 
                                        label="Nome Completo" 
                                        id="name" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <Input 
                                        label="Email" 
                                        id="email" 
                                        type="email" 
                                        value={user.email} 
                                        disabled 
                                        className="opacity-50 cursor-not-allowed"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input 
                                        label="CPF" 
                                        id="cpf" 
                                        placeholder="000.000.000-00" 
                                        value={cpf}
                                        onChange={(e) => setCpf(formatCPF(e.target.value))}
                                        maxLength={14}
                                    />
                                    <Input 
                                        label="Telefone" 
                                        id="phone" 
                                        placeholder="(00) 00000-0000" 
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        maxLength={15}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-gray-800 pt-6">
                                <h3 className="font-semibold text-brand-green uppercase text-xs tracking-wider">Endereço</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <Input label="CEP" id="cep" value={address.cep} onChange={handleAddressChange} placeholder="00000-000" maxLength={9} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Input label="Cidade" id="city" value={address.city} onChange={handleAddressChange} />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3">
                                        <Input label="Rua" id="street" value={address.street} onChange={handleAddressChange} />
                                    </div>
                                    <div className="md:col-span-1">
                                         <Input label="Número" id="number" value={address.number} onChange={handleAddressChange} />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input label="Bairro" id="neighborhood" value={address.neighborhood} onChange={handleAddressChange} />
                                    <Input label="Estado (UF)" id="state" value={address.state} onChange={handleAddressChange} maxLength={2} />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button type="submit">Salvar Alterações</Button>
                            </div>
                        </form>
                    </Card>

                    {/* Documents Section (Read Only View) */}
                     <Card>
                        <h2 className="text-xl font-bold mb-4">Documentos Enviados</h2>
                        <p className="text-gray-400 text-sm mb-6">Documentos submetidos durante o processo de verificação KYC.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Frente do RG/CNH</p>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 group relative">
                                    {user.documents?.idFrontUrl ? (
                                        <a href={user.documents.idFrontUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={user.documents.idFrontUrl} alt="ID Front" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <span className="text-white text-xs font-bold">Ver Imagem</span>
                                            </div>
                                        </a>
                                    ) : <div className="flex items-center justify-center h-full text-gray-600 text-xs">Pendente</div>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Verso do RG/CNH</p>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 group relative">
                                    {user.documents?.idBackUrl ? (
                                         <a href={user.documents.idBackUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={user.documents.idBackUrl} alt="ID Back" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <span className="text-white text-xs font-bold">Ver Imagem</span>
                                            </div>
                                        </a>
                                    ) : <div className="flex items-center justify-center h-full text-gray-600 text-xs">Pendente</div>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Selfie</p>
                                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-800 group relative">
                                    {user.documents?.selfieUrl ? (
                                         <a href={user.documents.selfieUrl} target="_blank" rel="noopener noreferrer">
                                            <img src={user.documents.selfieUrl} alt="Selfie" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                <span className="text-white text-xs font-bold">Ver Imagem</span>
                                            </div>
                                        </a>
                                    ) : <div className="flex items-center justify-center h-full text-gray-600 text-xs">Pendente</div>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Security Card */}
                    <Card>
                         <h2 className="text-xl font-bold mb-6">Segurança</h2>
                         
                         {/* Login Password Section */}
                         <div className="mb-8 border-b border-gray-800 pb-8">
                            <h3 className="font-semibold text-white mb-4">Alterar Senha de Login</h3>
                            <form onSubmit={handleLoginPasswordUpdate} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <Input 
                                        label="Nova Senha" 
                                        id="newLoginPass" 
                                        type="password"
                                        value={newLoginPassword}
                                        onChange={e => setNewLoginPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <Input 
                                        label="Confirmar Nova Senha" 
                                        id="confirmLoginPass" 
                                        type="password" 
                                        value={confirmLoginPassword}
                                        onChange={e => setConfirmLoginPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" variant="secondary">Atualizar Senha</Button>
                                </div>
                            </form>
                         </div>

                         {/* Transaction PIN Section */}
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
