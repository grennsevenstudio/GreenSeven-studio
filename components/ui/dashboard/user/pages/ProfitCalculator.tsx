
import React, { useState, useMemo } from 'react';
import type { InvestmentPlan, PlatformSettings } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import { ICONS } from '../../../../../constants';
import { formatCurrency } from '../../../../../lib/utils';

interface ProfitCalculatorProps {
    investmentPlans: InvestmentPlan[];
    platformSettings: PlatformSettings;
}

const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({ investmentPlans, platformSettings }) => {
    const [amountBRL, setAmountBRL] = useState('1000');
    const dollarRate = platformSettings.dollarRate || 5.50;

    const amountUSD = useMemo(() => {
        const value = parseFloat(amountBRL);
        return isNaN(value) || value <= 0 ? 0 : value / dollarRate;
    }, [amountBRL, dollarRate]);

    return (
        <div className="space-y-8 animate-fade-in p-4 sm:p-0">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            <div>
                <h1 className="text-3xl font-bold">Calculadora de Lucros</h1>
                <p className="text-gray-400">Simule seus ganhos com base no valor de investimento.</p>
            </div>

            <Card className="border-gray-800 bg-brand-black/30">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div>
                        <Input
                            label="Valor do Investimento (BRL)"
                            id="investment-amount"
                            type="number"
                            value={amountBRL}
                            onChange={(e) => setAmountBRL(e.target.value)}
                            placeholder="Ex: 1000.00"
                        />
                         <p className="text-sm text-gray-400 mt-2">
                            Equivalente em Dólar: <span className="font-bold text-white">{formatCurrency(amountUSD, 'USD')}</span>
                        </p>
                    </div>
                    <div className="bg-brand-black p-4 rounded-lg border border-gray-700 text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Cotação do Dólar (Venda)</p>
                        <p className="text-2xl font-bold text-brand-green mt-1">{formatCurrency(dollarRate, 'BRL')}</p>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {investmentPlans.map(plan => {
                    const monthlyProfitUSD = amountUSD * plan.returnRate;
                    const dailyProfitUSD = monthlyProfitUSD / 30;
                    const annualProfitUSD = monthlyProfitUSD * 12;

                    return (
                        <Card key={plan.id} className={`flex flex-col border-2 ${plan.color.replace('text-', 'border-')}/50`}>
                            <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
                            <p className="text-sm font-semibold text-gray-300 mt-1">{plan.monthlyReturn} ao mês</p>

                            <div className="space-y-4 mt-6 flex-1">
                                <div className="bg-brand-black/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Lucro Diário</p>
                                    <p className="text-lg font-bold text-white mt-1">{formatCurrency(dailyProfitUSD, 'USD')}</p>
                                    <p className="text-sm text-gray-400">≈ {formatCurrency(dailyProfitUSD * dollarRate, 'BRL')}</p>
                                </div>
                                <div className="bg-brand-black/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Lucro Mensal</p>
                                    <p className="text-lg font-bold text-white mt-1">{formatCurrency(monthlyProfitUSD, 'USD')}</p>
                                    <p className="text-sm text-gray-400">≈ {formatCurrency(monthlyProfitUSD * dollarRate, 'BRL')}</p>
                                </div>
                                <div className="bg-brand-black/50 p-3 rounded-lg border border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Lucro Anual</p>
                                    <p className="text-lg font-bold text-white mt-1">{formatCurrency(annualProfitUSD, 'USD')}</p>
                                    <p className="text-sm text-gray-400">≈ {formatCurrency(annualProfitUSD * dollarRate, 'BRL')}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
             <p className="text-xs text-gray-500 text-center italic pt-4">* Os valores são projeções baseadas na rentabilidade máxima do plano e podem variar. Não representam garantia de retorno.</p>
        </div>
    );
};

export default ProfitCalculator;
