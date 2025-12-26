
import React, { useState, useEffect } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import type { InvestmentPlan, PlatformSettings } from '../../../../../types';


const PlanEditCard: React.FC<{ plan: InvestmentPlan; onUpdatePlan: (plan: InvestmentPlan) => void; dollarRate: number }> = ({ plan, onUpdatePlan, dollarRate }) => {
    const [monthlyReturn, setMonthlyReturn] = useState(plan.monthlyReturn);
    const [minDepositBRL, setMinDepositBRL] = useState(String((plan.minDepositUSD * dollarRate).toFixed(2)));

    useEffect(() => {
        setMonthlyReturn(plan.monthlyReturn);
        setMinDepositBRL(String((plan.minDepositUSD * dollarRate).toFixed(2)));
    }, [plan, dollarRate]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numbers = monthlyReturn.match(/\d+/g);
        const rate = numbers ? Math.max(...numbers.map(Number)) / 100 : plan.returnRate;

        const newMinDepositUSD = Number(minDepositBRL) / dollarRate;

        const updatedPlan: InvestmentPlan = {
            ...plan,
            monthlyReturn,
            minDepositUSD: newMinDepositUSD,
            returnRate: rate,
        };
        onUpdatePlan(updatedPlan);
        alert(`Plano "${plan.name}" atualizado com sucesso!`);
    };
    
    const handlePause = () => {
        if (confirm(`Você tem certeza que deseja pausar o plano "${plan.name}"?`)) {
            alert(`Plano "${plan.name}" pausado com sucesso.`);
        }
    };

    return (
        <Card className="flex flex-col border-2 border-gray-800">
            <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
            <form className="mt-4 space-y-4" onSubmit={handleSave}>
                <Input label="Rentabilidade Mensal" id={`return-${plan.id}`} value={monthlyReturn} onChange={e => setMonthlyReturn(e.target.value)} />
                <div>
                    <Input label="Depósito Mínimo (BRL)" id={`min-deposit-${plan.id}`} type="number" value={minDepositBRL} onChange={e => setMinDepositBRL(e.target.value)} />
                    <p className="text-xs text-gray-500 mt-1">Valor em USD: {(Number(minDepositBRL) / dollarRate).toFixed(2)}</p>
                </div>
                <div className="flex gap-2 pt-2">
                     <Button type="submit" variant="primary" fullWidth>Salvar</Button>
                     <Button type="button" onClick={handlePause} variant="ghost" className="text-red-500 hover:text-red-400" fullWidth>Pausar</Button>
                </div>
            </form>
        </Card>
    );
};

interface ManagePlansProps {
    investmentPlans: InvestmentPlan[];
    onUpdatePlan: (plan: InvestmentPlan) => void;
    platformSettings: PlatformSettings;
}

const ManagePlans: React.FC<ManagePlansProps> = ({ investmentPlans, onUpdatePlan, platformSettings }) => {
    const dollarRate = platformSettings.dollarRate || 5.0;
    const handleAddPlan = () => {
        alert('Abrindo formulário para adicionar novo plano (simulação)...');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Gestão dos Planos</h1>
                    <p className="text-gray-400">Altere taxas, adicione ou pause os planos de investimento.</p>
                </div>
                <Button variant="primary" onClick={handleAddPlan}>Adicionar Novo Plano</Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {investmentPlans.map(plan => (
                    <PlanEditCard key={plan.id} plan={plan} onUpdatePlan={onUpdatePlan} dollarRate={dollarRate} />
                ))}
            </div>
        </div>
    )
}

export default ManagePlans;
