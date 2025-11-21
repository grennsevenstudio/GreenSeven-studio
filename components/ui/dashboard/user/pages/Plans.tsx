
import React from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { INVESTMENT_PLANS } from '../../../../../constants';
import type { InvestmentPlan, User } from '../../../../../types';


const PlanCard: React.FC<{ plan: InvestmentPlan, isCurrent?: boolean, userBalance: number }> = ({ plan, isCurrent = false, userBalance }) => {
    const handleChangePlan = () => {
        if (userBalance < plan.minDepositUSD) {
            alert(`Saldo insuficiente! Para migrar para o plano ${plan.name}, você precisa de um saldo mínimo de US$ ${plan.minDepositUSD}. Seu saldo atual é US$ ${userBalance.toFixed(2)}.`);
            return;
        }

        if (confirm(`Você tem certeza que deseja mudar para o plano ${plan.name}?`)) {
            alert('Sua solicitação para mudar de plano foi enviada com sucesso!');
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
            </div>
        </Card>
    );
}

interface PlansProps {
    user: User;
}

const Plans: React.FC<PlansProps> = ({ user }) => {
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
                        userBalance={user.balanceUSD} 
                    />
                ))}
            </div>

            <Card className="border-brand-blue/30">
                <h2 className="text-xl font-bold text-brand-blue mb-2">Como funcionam as projeções?</h2>
                <p className="text-gray-400">
                    As projeções de rendimento são estimativas baseadas em dados históricos e performance de mercado, e não representam garantia de resultados futuros. Os rendimentos são calculados diariamente sobre o seu saldo em dólar e creditados em sua conta. Você pode acompanhar a performance diária de seu investimento diretamente no seu dashboard.
                </p>
            </Card>
        </div>
    )
}

export default Plans;