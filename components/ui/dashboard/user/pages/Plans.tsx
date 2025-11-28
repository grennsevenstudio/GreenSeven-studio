import React, { useState, useEffect } from 'react';
import Card from '../../../../ui/Card';
import Button from '../../../../ui/Button';
import { INVESTMENT_PLANS, ICONS } from '../../../../../constants';
import type { InvestmentPlan, User, Language } from '../../../../../types';
import { TRANSLATIONS } from '../../../../../lib/translations';

const LOCK_PERIOD_DAYS = 30;

interface ExpandablePlanDetailsProps {
    details: {
        advantages: string[];
        risks: string[];
        riskLevel?: string;
    };
    color: string;
    riskLabel: string;
}

const ExpandablePlanDetails: React.FC<ExpandablePlanDetailsProps> = ({ details, color, riskLabel }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!details) return null;

    // Map risk levels to colors
    const getRiskColor = (level: string) => {
        const l = (level || '').toLowerCase();
        if (l.includes('baixo') || l.includes('low') || l.includes('niedrig') || l.includes('faible')) return 'bg-brand-green/20 text-brand-green';
        if (l.includes('médio') || l.includes('medium') || l.includes('moyen') || l.includes('mittel')) return 'bg-yellow-500/20 text-yellow-400';
        return 'bg-red-500/20 text-red-400';
    };

    return (
        <div className="mt-4 border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400 font-bold uppercase">{riskLabel}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${getRiskColor(details.riskLevel || '')}`}>
                    {details.riskLevel}
                </span>
            </div>
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-400 hover:text-white transition-colors focus:outline-none"
            >
                <span>Riscos e Vantagens</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {ICONS.arrowDown}
                </span>
            </button>
            
            {isOpen && (
                <div className="mt-4 space-y-4 animate-fade-in text-left">
                    <div>
                        <h4 className="text-xs uppercase font-bold text-brand-green mb-2 flex items-center gap-1">
                            {React.cloneElement(ICONS.check as React.ReactElement<any>, { className: "h-3 w-3" })} Vantagens
                        </h4>
                        <ul className="space-y-1">
                            {details.advantages?.map((adv, idx) => (
                                <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-brand-green flex-shrink-0"></span>
                                    {adv}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs uppercase font-bold text-red-400 mb-2 flex items-center gap-1">
                            {React.cloneElement(ICONS.alert as React.ReactElement<any>, { className: "h-3 w-3" })} Riscos
                        </h4>
                        <ul className="space-y-1">
                            {details.risks?.map((risk, idx) => (
                                <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0"></span>
                                    {risk}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlanCard: React.FC<{ 
    plan: InvestmentPlan, 
    isCurrent?: boolean, 
    user: User,
    onUpdateUser: (user: User) => void,
    planDetails?: { advantages: string[], risks: string[], riskLevel?: string },
    translations: any
}> = ({ plan, isCurrent = false, user, onUpdateUser, planDetails, translations }) => {
    
    // Check if locked
    let isLocked = false;
    let daysRemaining = 0;

    if (user.lastPlanChangeDate) {
        const lastChange = new Date(user.lastPlanChangeDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastChange.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < LOCK_PERIOD_DAYS) {
            isLocked = true;
            daysRemaining = LOCK_PERIOD_DAYS - diffDays;
        }
    }

    // Check minimum balance requirement
    const hasMinimumBalance = user.capitalInvestedUSD >= plan.minDepositUSD;

    const handleChangePlan = () => {
        if (!hasMinimumBalance) return;
        if (isLocked) return;

        if (confirm(`Confirmar mudança para o plano ${plan.name}?\n\nImportante:\n- A rentabilidade de ${plan.monthlyReturn} será aplicada.\n- Você não poderá mudar de plano novamente por 30 dias.`)) {
            
            const newProfit = user.capitalInvestedUSD * plan.returnRate;
            
            onUpdateUser({
                ...user,
                plan: plan.name,
                monthlyProfitUSD: newProfit,
                lastPlanChangeDate: new Date().toISOString()
            });
        }
    };

    return (
        <Card className={`relative flex flex-col border-2 ${isCurrent ? 'border-brand-green' : 'border-gray-800'} transition-all duration-300`}>
            {isCurrent && <div className="bg-brand-green text-brand-black text-xs font-bold px-3 py-1 rounded-full absolute -top-3 -right-3">SEU PLANO</div>}
            <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
            <p className="text-gray-400 mt-2">Rentabilidade mensal</p>
            <p className="text-4xl font-black text-white my-4">{plan.monthlyReturn}</p>
            
            <div className="flex items-center justify-between border-t border-gray-800 pt-4 mb-4">
                <span className="text-gray-400 text-sm">{translations?.min_deposit || "Mínimo"}</span>
                <span className={`text-lg font-bold ${hasMinimumBalance ? 'text-white' : 'text-red-400'}`}>
                    US$ {plan.minDepositUSD}
                </span>
            </div>

            <div className="mt-auto">
                <Button 
                    fullWidth 
                    variant={isCurrent ? 'primary' : 'secondary'} 
                    disabled={isCurrent || isLocked || !hasMinimumBalance}
                    onClick={!isCurrent ? handleChangePlan : undefined}
                    className={`${!hasMinimumBalance && !isCurrent ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isCurrent ? 'Plano Ativo' : isLocked ? `${translations?.locked_days || "Bloqueado"} ${daysRemaining} ${translations?.days || "dias"}` : !hasMinimumBalance ? `Saldo Insuficiente` : 'Selecionar Plano'}
                </Button>
                
                {!isCurrent && isLocked && (
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                        Troca permitida a cada 30 dias.
                    </p>
                )}
            </div>
            {planDetails && translations && (
                <ExpandablePlanDetails 
                    details={planDetails} 
                    color={plan.color} 
                    riskLabel={translations.risk_level_label || "Risco"}
                />
            )}
        </Card>
    );
}

interface PlansProps {
    user: User;
    onUpdateUser: (user: User) => void;
    language: Language;
}

const Plans: React.FC<PlansProps> = ({ user, onUpdateUser, language }) => {
    const userPlanName = user.plan || 'Conservador';
    const currentPlanObj = INVESTMENT_PLANS.find(p => p.name.toLowerCase() === userPlanName.toLowerCase());
    const currentPlanId = currentPlanObj ? currentPlanObj.id : '1';
    
    // Robust fallback: if language is undefined or invalid key, default to 'pt'
    const currentLanguage = language || 'pt';
    const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS['pt'];
    
    // Extra safety: if translations are completely missing
    if (!t) {
        return <div className="text-white p-4">Carregando traduções...</div>;
    }

    // Helper to safely access planDetails part of translations
    // @ts-ignore
    const tPlans = t.planDetails || {};

    const getPlanKey = (name: string) => {
        const normalized = (name || '').toLowerCase();
        if (normalized.includes('conservador')) return 'conservador';
        if (normalized.includes('moderado')) return 'moderado';
        if (normalized.includes('agressivo')) return 'agressivo';
        if (normalized.includes('select')) return 'select';
        return 'conservador';
    };

    return (
        <div className="space-y-8 animate-fade-in">
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            <div>
                <h1 className="text-3xl font-bold">Planos de Investimento</h1>
                <p className="text-gray-400">Escolha o plano que melhor se alinha com seus objetivos financeiros.</p>
            </div>

            {/* Risk Disclaimer Box */}
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <div className="flex gap-3">
                    <div className="text-yellow-500">
                        {React.cloneElement(ICONS.alert as React.ReactElement<any>, { className: "w-6 h-6" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-500 uppercase text-sm mb-1">Aviso de Risco</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {tPlans.risk_warning || "Invista com consciência. Mercados financeiros possuem riscos."}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {INVESTMENT_PLANS.map(plan => (
                    <PlanCard 
                        key={plan.id} 
                        plan={plan} 
                        isCurrent={plan.id === currentPlanId}
                        user={user}
                        onUpdateUser={onUpdateUser}
                        planDetails={tPlans[getPlanKey(plan.name)]}
                        translations={tPlans}
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