import React, { useState, useEffect } from 'react';
import { View, type Stock, type InvestmentPlan } from '../../types';
import Button from '../ui/Button';
import Modal from '../layout/Modal';
import { ICONS, INVESTMENT_PLANS } from '../../constants';

const MOCK_TICKER_STOCKS: Stock[] = [
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 145.64, change: 0.06, changePercent: 0.04 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 245.24, change: -0.26, changePercent: -0.11 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 492.00, change: 0.64, changePercent: 0.13 },
    { symbol: 'META', name: 'Meta Platforms, Inc.', price: 326.05, change: 0.50, changePercent: 0.15 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 172.03, change: -0.53, changePercent: -0.31 },
    { symbol: 'GOOG', name: 'Alphabet Inc.', price: 135.21, change: 0.12, changePercent: 0.09 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.57, change: 2.11, changePercent: 0.48 },
];

const StockTickerItem: React.FC<{ stock: Stock }> = ({ stock }) => {
    const isPositive = stock.change >= 0;
    return (
        <div className="flex items-center gap-4 px-6 flex-shrink-0">
            <span className="font-bold text-gray-400">{stock.symbol}</span>
            <span className="font-semibold text-white">${stock.price.toFixed(2)}</span>
            <div className={`flex items-center gap-1 font-semibold text-sm ${isPositive ? 'text-brand-green' : 'text-red-500'}`}>
                {isPositive ? ICONS.stockUp : ICONS.stockDown}
                <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
            </div>
        </div>
    );
};

const StockTicker = () => {
    const duplicatedStocks = [...MOCK_TICKER_STOCKS, ...MOCK_TICKER_STOCKS];
    return (
        <div className="h-16 bg-brand-gray border-y border-gray-800">
            <div className="relative h-full flex items-center overflow-hidden">
                <div className="absolute top-0 left-0 flex items-center h-full animate-marquee whitespace-nowrap">
                    {duplicatedStocks.map((stock, index) => <StockTickerItem key={`${stock.symbol}-${index}`} stock={stock} />)}
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-brand-black/50 p-6 rounded-xl border border-gray-800 transform hover:-translate-y-2 transition-all duration-300 hover:border-brand-green/50 hover:shadow-2xl hover:shadow-brand-green/10">
        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-brand-green/10 text-brand-green mb-4">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6" })}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const HowItWorksStep: React.FC<{ number: string; title: string; children: React.ReactNode; }> = ({ number, title, children }) => (
    <div className="relative pl-12">
        <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-blue text-brand-black font-bold text-lg">
            {number}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const PlanPreviewCard: React.FC<{ plan: InvestmentPlan }> = ({ plan }) => (
     <div className="bg-brand-gray p-8 rounded-2xl border-2 border-gray-800 flex flex-col text-center items-center transition-all duration-300 hover:border-brand-green hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-green/10">
        <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
        <p className="text-gray-400 mt-2">Rentabilidade mensal</p>
        <p className="text-4xl font-black text-white my-4">{plan.monthlyReturn}</p>
        <p className="text-gray-400">Depósito mínimo</p>
        <p className="text-xl font-bold text-white">US$ {plan.minDepositUSD}</p>
    </div>
);

const HomePage: React.FC<{ setView: (view: View) => void; }> = ({ setView }) => {
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

    const navItems = [
        { name: 'Início', href: '#home' },
        { name: 'Vantagens', href: '#features' },
        { name: 'Como Funciona', href: '#how-it-works' },
        { name: 'Planos', href: '#plans' },
    ];

    useEffect(() => {
        const handleScroll = (e: MouseEvent) => {
            const target = e.target as HTMLAnchorElement;
            const href = target.getAttribute('href');
            if (target.tagName === 'A' && href && href.startsWith('#')) {
                e.preventDefault();
                const elementId = href.substring(1);
                const element = document.getElementById(elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        const nav = document.querySelector('nav');
        nav?.addEventListener('click', handleScroll);

        return () => {
            nav?.removeEventListener('click', handleScroll);
        };
    }, []);

    const GridBackground = () => (
         <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0" style={{
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
            }}></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,156,0.1)_0%,rgba(10,10,10,0)_60%)]"></div>
        </div>
    );
    
    const HowItWorksDiagram = () => (
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 bg-brand-green/5 rounded-full blur-3xl"></div>
            </div>
            
            <div className="space-y-4 relative">
                <div className="absolute left-8 top-12 h-[76px] w-px border-l-2 border-dashed border-gray-700"></div>
                <div className="absolute left-8 top-[188px] h-[76px] w-px border-l-2 border-dashed border-gray-700"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gray border-2 border-brand-blue text-brand-blue flex-shrink-0">
                        {React.cloneElement(ICONS.userPlus as React.ReactElement<any>, { className: "w-8 h-8" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Crie sua Conta</h4>
                        <p className="text-sm text-gray-400">Rápido, fácil e seguro.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gray border-2 border-brand-green text-brand-green flex-shrink-0">
                        {React.cloneElement(ICONS.deposit as React.ReactElement<any>, { className: "w-8 h-8" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Deposite via PIX</h4>
                        <p className="text-sm text-gray-400">Seu saldo é dolarizado na hora.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gray border-2 border-gray-600 text-gray-400 flex-shrink-0">
                        {React.cloneElement(ICONS.plans as React.ReactElement<any>, { className: "w-8 h-8" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">Comece a Lucrar</h4>
                        <p className="text-sm text-gray-400">Escolha seu plano e veja render.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-brand-black text-white min-h-screen relative">
            <GridBackground />
            
             <Modal 
                isOpen={isLearnMoreOpen} 
                onClose={() => setIsLearnMoreOpen(false)} 
                title="Dolarização de Capital"
            >
                <div className="space-y-6">
                    <div className="bg-brand-gray p-4 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            {React.cloneElement(ICONS.shield as React.ReactElement<any>, { className: "h-5 w-5 text-brand-green" })} Por que Dolarizar?
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            A dolarização é a estratégia definitiva de proteção patrimonial. Enquanto moedas locais sofrem com inflação e volatilidade, o Dólar Americano se mantém como a principal reserva de valor do mundo, garantindo que seu esforço de trabalho não perca valor com o tempo.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">Vantagens de Investir em Dólar:</h3>
                        <div className="grid gap-4">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-brand-green/20 p-2 rounded-lg h-fit text-brand-green">
                                    {React.cloneElement(ICONS.arrowUp as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Proteção contra Inflação</h4>
                                    <p className="text-sm text-gray-400">Blinde seu patrimônio contra a desvalorização cambial e mantenha seu poder de compra internacional.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-brand-blue/20 p-2 rounded-lg h-fit text-brand-blue">
                                    {React.cloneElement(ICONS.dollar as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Moeda Forte</h4>
                                    <p className="text-sm text-gray-400">Tenha ativos na moeda mais utilizada e confiável do comércio global.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-purple-500/20 p-2 rounded-lg h-fit text-purple-400">
                                    {React.cloneElement(ICONS.transactions as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Diversificação Inteligente</h4>
                                    <p className="text-sm text-gray-400">Não dependa apenas da economia do seu país. A GreennSeven conecta você ao mercado global.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-center text-gray-400 text-sm mb-4">Comece com apenas US$ 10,00 e veja seu dinheiro render em moeda forte.</p>
                        <Button fullWidth onClick={() => { setIsLearnMoreOpen(false); setView(View.Register); }}>
                            Começar a Investir Agora
                        </Button>
                    </div>
                </div>
            </Modal>

            <header className="sticky top-0 bg-brand-black/80 backdrop-blur-md z-30 py-4 px-4 sm:px-6 lg:px-12 w-full border-b border-gray-900">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
                        {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-7 w-7 text-brand-green"})}
                        <span className="text-2xl font-bold tracking-wider">GREENNSEVEN</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map(item => (
                            <a key={item.name} href={item.href} className="font-semibold text-gray-300 hover:text-brand-green transition-colors">
                                {item.name}
                            </a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                         <Button onClick={() => setView(View.Login)} variant="secondary" className="px-5 py-2 !rounded-md">
                           Login
                         </Button>
                         <Button onClick={() => setView(View.Register)} variant="primary" className="px-5 py-2 !rounded-md">
                           Abrir Conta
                         </Button>
                    </div>
                </div>
            </header>

            <main id="home" className="h-[calc(100vh-76px)] min-h-[600px] flex items-center justify-center text-center relative px-4 z-10">
                <div className="relative z-10 flex flex-col items-center">
                    <h1 className="text-6xl md:text-8xl font-black leading-tight max-w-4xl">
                        Seu Futuro Financeiro
                        <span className="block bg-gradient-to-r from-brand-blue to-brand-green text-transparent bg-clip-text mt-2 animate-gradient-x">
                            Dolarizado.
                        </span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
                        Proteja seu patrimônio da inflação e potencialize seus ganhos com a força da moeda mais sólida do mundo.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Button onClick={() => setView(View.Register)} variant="primary" className="px-8 py-4 text-lg">
                            <div className="flex items-center gap-2">
                                Começar Agora
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </div>
                        </Button>
                        <Button variant="secondary" className="px-8 py-4 text-lg" onClick={() => setIsLearnMoreOpen(true)}>
                            Saiba Mais
                        </Button>
                    </div>
                </div>
            </main>
            
            <section id="features" className="py-24 px-4 sm:px-6 lg:px-12 bg-brand-gray/50 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">A Vantagem GreennSeven</h2>
                    <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">Potencialize seus investimentos com uma plataforma robusta, segura e projetada para o seu sucesso.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 text-left">
                        <FeatureCard icon={ICONS.dollar} title="Rentabilidade Dolarizada">
                            Proteja seu capital da inflação e invista em uma moeda forte, maximizando seu poder de compra e seus ganhos.
                        </FeatureCard>
                        <FeatureCard icon={ICONS.shield} title="Segurança de Ponta">
                            Operamos com criptografia de nível bancário e as melhores práticas de segurança para proteger seus dados e seus investimentos.
                        </FeatureCard>
                         <FeatureCard icon={ICONS.layout} title="Interface Intuitiva">
                            Gerencie seus investimentos de forma simples e eficiente através de uma plataforma moderna e fácil de usar.
                        </FeatureCard>
                        <FeatureCard icon={ICONS.support} title="Suporte Exclusivo">
                            Nossa equipe de especialistas está sempre disponível para tirar suas dúvidas e te auxiliar em cada passo da sua jornada.
                        </FeatureCard>
                    </div>
                </div>
            </section>
            
            <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">Comece a Investir em 3 Passos Simples</h2>
                    <p className="mt-4 text-lg text-gray-400">Junte-se à GreennSeven e comece a construir seu futuro financeiro hoje mesmo.</p>
                    <div className="mt-16 flex flex-col-reverse md:flex-row justify-between items-center text-left gap-12">
                        <div className="w-full md:w-1/2 space-y-12">
                            <HowItWorksStep number="1" title="Abra sua Conta Global">
                                O processo de cadastro é rápido e seguro. Em poucos minutos sua conta estará pronta para operar.
                            </HowItWorksStep>
                            <HowItWorksStep number="2" title="Deposite em Reais, Invista em Dólares">
                                Adicione fundos à sua conta de forma prática utilizando o PIX. Seu saldo é convertido para dólar automaticamente.
                            </HowItWorksStep>
                            <HowItWorksStep number="3" title="Acompanhe seus Lucros">
                                Selecione um dos nossos planos de investimento, criados para diferentes perfis, e comece a ver seu capital render.
                            </HowItWorksStep>
                        </div>
                         <HowItWorksDiagram />
                    </div>
                </div>
            </section>

            <section id="plans" className="py-24 px-4 sm:px-6 lg:px-12 bg-brand-gray/50 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">Planos Feitos Para Você</h2>
                    <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">Encontre a estratégia de investimento perfeita para o seu perfil, do conservador ao agressivo.</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                        {INVESTMENT_PLANS.map(plan => (
                            <PlanPreviewCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </div>
            </section>

            <section id="cta" className="py-20 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-brand-blue/80 to-brand-green/80 p-12 rounded-2xl">
                    <h2 className="text-4xl font-black text-brand-black">Pronto para Dolarizar seu Futuro Financeiro?</h2>
                    <p className="mt-4 text-lg text-brand-black/80 max-w-2xl mx-auto">Junte-se a milhares de investidores que já estão potencializando seus lucros com a GreennSeven.</p>
                    <Button onClick={() => setView(View.Register)} variant="primary" className="px-8 py-4 text-lg mt-8">
                        Começar a Investir em Dólar
                    </Button>
                </div>
            </section>
            
            <div className="relative z-10">
                <StockTicker />
            </div>

            <footer className="bg-brand-gray border-t border-gray-800 py-16 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-7 w-7 text-brand-green"})}
                            <span className="text-2xl font-bold tracking-wider">GREENNSEVEN</span>
                        </div>
                        <p className="mt-4 text-gray-400">Sua plataforma de investimentos dolarizada, projetada para performance e segurança.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-white tracking-wider">Plataforma</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#features" className="text-gray-400 hover:text-white">Vantagens</a></li>
                            <li><a href="#plans" className="text-gray-400 hover:text-white">Planos</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Segurança</a></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-white tracking-wider">Empresa</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white">Sobre Nós</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Contato</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Carreiras</a></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-white tracking-wider">Legal</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" className="text-gray-400 hover:text-white">Termos de Serviço</a></li>
                            <li><a href="#" className="text-gray-400 hover:text-white">Política de Privacidade</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-500">&copy; {new Date().getFullYear()} GreennSeven. Todos os direitos reservados.</p>
                    <div className="flex gap-4 mt-4 sm:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white">{ICONS.twitter}</a>
                        <a href="#" className="text-gray-400 hover:text-white">{ICONS.instagram}</a>
                        <a href="#" className="text-gray-400 hover:text-white">{ICONS.facebook}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;