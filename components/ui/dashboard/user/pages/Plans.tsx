
import React from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { INVESTMENT_PLANS, ICONS } from '../../../../../constants';
import type { InvestmentPlan, User } from '../../../../../types';

const LOCK_PERIOD_DAYS = 30;

const PlanCard: React.FC<{ 
    plan: InvestmentPlan, 
    isCurrent?: boolean, 
    user: User,
    onUpdateUser: (user: User) => void 
}> = ({ plan, isCurrent = false, user, onUpdateUser }) => {
    
    const handleChangePlan = () => {
        // 1. Check Balance
        if (user.balanceUSD < plan.minDepositUSD) {
            alert(`Saldo insuficiente! Para migrar para o plano ${plan.name}, você precisa de um saldo mínimo de US$ ${plan.minDepositUSD}. Seu saldo atual é US$ ${user.balanceUSD.toFixed(2)}.`);
            return;
        }

        // 2. Check Lockout Period (30 days)
        if (user.lastPlanChangeDate) {
            const lastChange = new Date(user.lastPlanChangeDate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastChange.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < LOCK_PERIOD_DAYS) {
                const remainingDays = LOCK_PERIOD_DAYS - diffDays;
                alert(`Para garantir a performance dos resultados e a estabilidade da carteira, alterações de plano só são permitidas a cada 30 dias.\n\nVocê poderá alterar seu plano novamente em ${remainingDays} dias.`);
                return;
            }
        }

        // 3. Confirm Change
        if (confirm(`Você tem certeza que deseja mudar para o plano ${plan.name}? A rentabilidade de ${plan.monthlyReturn} será aplicada ao seu saldo atual.`)) {
            
            // Recalcula o lucro mensal baseado no novo plano
            const newProfit = user.balanceUSD * plan.returnRate;
            
            onUpdateUser({
                ...user,
                plan: plan.name,
                monthlyProfitUSD: newProfit,
                lastPlanChangeDate: new Date().toISOString() // Set lock date
            });

            alert(`Plano atualizado para ${plan.name} com sucesso!`);
        }
    };

    return (
        <Card className={`relative flex flex-col border-2 ${isCurrent ? 'border-brand-green' : 'border-gray-800'} transition-all duration-300`}>
            {isCurrent && <div className="bg-brand-green text-brand-black text-xs font-bold px-3 py-1 rounded-full absolute -top-3 -right-3">SEU PLANO</div>}
            <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
            <p className="text-gray-400 mt-2">Rentabilidade mensal</p>
            <p className="text-4xl font-black text-white my-4">{plan.monthlyReturn}</p>
            <p className="text-gray-400">Depósito mínimo</p>
            <p className="text-xl font-bold text-white mb-6">US$ {plan.minDepositUSD}</p>
            <div className="mt-auto">
                <Button 
                    fullWidth 
                    variant={isCurrent ? 'primary' : 'secondary'} 
                    disabled={isCurrent}
                    onClick={!isCurrent ? handleChangePlan : undefined}
                >
                    {isCurrent ? 'Plano Ativo' : 'Mudar de Plano'}
                </Button>
                {!isCurrent && user.lastPlanChangeDate && (
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                        Troca permitida a cada 30 dias.
                    </p>
                )}
            </div>
        </Card>
    );
}

interface PlansProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

const Plans: React.FC<PlansProps> = ({ user, onUpdateUser }) => {
    // Determine current plan based on user data, defaulting to the first plan ID if not found or not set
    const userPlanName = user.plan || 'Conservador';
    const currentPlanObj = INVESTMENT_PLANS.find(p => p.name.toLowerCase() === userPlanName.toLowerCase());
    const currentPlanId = currentPlanObj ? currentPlanObj.id : '1';

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Planos de Investimento</h1>
                <p className="text-gray-400">Escolha o plano que melhor se alinha com seus objetivos financeiros.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {INVESTMENT_PLANS.map(plan => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        isCurrent={plan.id === currentPlanId}
                        user={user}
                        onUpdateUser={onUpdateUser}
                    />
                ))}
            </div>

            <Card className="border-brand-blue/30 bg-gradient-to-r from-brand-gray to-brand-black/50">
                <div className="flex gap-4 items-start">
                    <div className="p-3 bg-brand-blue/10 rounded-lg text-brand-blue mt-1 hidden sm:block">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-brand-blue mb-3">Como funcionam as projeções?</h2>
                        <div className="space-y-3 text-gray-300 leading-relaxed">
                            <p>
                                As projeções de rendimento são estimativas calculadas com base na performance do mercado. Os rendimentos são creditados <strong>diariamente</strong> sobre o seu saldo em dólar, fazendo seu dinheiro trabalhar para você 24 horas por dia.
                            </p>
                            <p className="text-white font-medium bg-brand-blue/5 p-3 rounded-lg border-l-2 border-brand-blue">
                                ✨ <strong>O sucesso financeiro é construído com constância!</strong><br/>
                                A cada dia que passa, seu capital cresce e você fica um passo mais próximo da sua liberdade financeira. Acompanhe essa evolução incrível diretamente no seu dashboard e veja seu futuro sendo construído.
                            </p>
                            <p className="text-xs text-gray-500 pt-2">
                                * Para garantir a performance e estabilidade dos resultados para todos os investidores, alterações de plano são limitadas a uma vez a cada 30 dias.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default Plans;