import React from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import { INVESTMENT_PLANS } from '../../../../../constants';
import type { InvestmentPlan } from '../../../../../types';


const PlanEditCard: React.FC<{ plan: InvestmentPlan }> = ({ plan }) => {
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
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
                <Input label="Rentabilidade Mensal" id={`return-${plan.id}`} defaultValue={plan.monthlyReturn} />
                <Input label="Depósito Mínimo (USD)" id={`min-deposit-${plan.id}`} type="number" defaultValue={plan.minDepositUSD} />
                <div className="flex gap-2 pt-2">
                     <Button type="submit" variant="primary" fullWidth>Salvar</Button>
                     <Button type="button" onClick={handlePause} variant="ghost" className="text-red-500 hover:text-red-400" fullWidth>Pausar</Button>
                </div>
            </form>
        </Card>
    );
};

const ManagePlans: React.FC = () => {
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
                {INVESTMENT_PLANS.map(plan => (
                    <PlanEditCard key={plan.id} plan={plan} />
                ))}
            </div>
        </div>
    )
}

export default ManagePlans;