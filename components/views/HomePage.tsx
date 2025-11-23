

import React, { useState, useEffect, useRef } from 'react';
import { View, type Stock, type InvestmentPlan, type Language } from '../../types';
import Button from '../ui/Button';
import Modal from '../layout/Modal';
import { ICONS, INVESTMENT_PLANS } from '../../constants';
import { 
    TERMS_OF_USE_CONTENT, 
    PRIVACY_POLICY_CONTENT,
    SECURITY_CONTENT,
    ABOUT_CONTENT,
    CONTACT_CONTENT,
    CAREERS_CONTENT
} from '../legal/TermsAndPrivacy';
import { TRANSLATIONS } from '../../lib/translations';

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

const MOCK_TICKER_STOCKS: Stock[] = [
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 145.64, change: 0.06, changePercent: 0.04 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 245.24, change: -0.26, changePercent: -0.11 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 492.00, change: 0.64, changePercent: 0.13 },
    { symbol: 'META', name: 'Meta Platforms, Inc.', price: 326.05, change: 0.50, changePercent: 0.15 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 172.03, change: -0.53, changePercent: -0.31 },
    { symbol: 'GOOG', name: 'Alphabet Inc.', price: 135.21, change: 0.12, changePercent: 0.09 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.57, change: 2.11, changePercent: 0.48 },
];

const FAQList = ({ content }: { content: { q: string, a: string }[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-2">
            {content.map((item, index) => (
                <div key={index} className="border border-gray-700 rounded-lg bg-brand-black/50 overflow-hidden">
                    <button
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800 transition-colors"
                    >
                        <span className="font-bold text-white">{item.q}</span>
                        <span className={`transform transition-transform duration-200 text-brand-green ${openIndex === index ? 'rotate-180' : ''}`}>
                            {ICONS.arrowDown}
                        </span>
                    </button>
                    {openIndex === index && (
                        <div className="p-4 pt-0 text-gray-400 text-sm leading-relaxed border-t border-gray-700/50 mt-2">
                            {item.a}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

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

const PlanPreviewCard: React.FC<{ plan: InvestmentPlan, returnLabel: string, depositLabel: string }> = ({ plan, returnLabel, depositLabel }) => (
     <div className="bg-brand-gray p-8 rounded-2xl border-2 border-gray-800 flex flex-col text-center items-center transition-all duration-300 hover:border-brand-green hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-green/10">
        <h3 className={`text-2xl font-bold ${plan.color}`}>{plan.name}</h3>
        <p className="text-gray-400 mt-2">{returnLabel}</p>
        <p className="text-4xl font-black text-white my-4">{plan.monthlyReturn}</p>
        <p className="text-gray-400">{depositLabel}</p>
        <p className="text-xl font-bold text-white">US$ {plan.minDepositUSD}</p>
    </div>
);

interface HomePageProps {
    setView: (view: View) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setView, language, setLanguage }) => {
    const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);
    const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    
    const t = TRANSLATIONS[language];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const openInfoModal = (type: string) => {
        let title = '';
        let content: React.ReactNode = null;

        switch (type) {
            case 'security':
                title = t.landing.footer_security;
                content = SECURITY_CONTENT;
                break;
            case 'about':
                title = t.landing.footer_about;
                content = ABOUT_CONTENT;
                break;
            case 'contact':
                title = t.landing.footer_contact;
                content = CONTACT_CONTENT;
                break;
            case 'careers':
                title = t.landing.footer_careers;
                content = CAREERS_CONTENT;
                break;
            case 'terms':
                title = t.landing.footer_terms;
                content = TERMS_OF_USE_CONTENT;
                break;
            case 'privacy':
                title = t.landing.footer_privacy;
                content = PRIVACY_POLICY_CONTENT;
                break;
            case 'faq':
                title = 'FAQ';
                content = <FAQList content={t.faq} />;
                break;
            default:
                return;
        }
        setInfoModalContent({ title, content });
    };

    const navItems = [
        { name: t.landing.nav_home, href: '#home' },
        { name: t.landing.nav_features, href: '#features' },
        { name: t.landing.nav_how, href: '#how-it-works' },
        { name: t.landing.nav_plans, href: '#plans' },
        { name: t.landing.nav_faq, href: '#faq', action: () => openInfoModal('faq') },
    ];

    useEffect(() => {
        const handleScroll = (e: MouseEvent) => {
            const target = e.target as HTMLAnchorElement;
            const href = target.getAttribute('href');
            if (target.tagName === 'A' && href && href.startsWith('#') && !href.includes('faq')) {
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
                    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
            }}></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,156,0.08)_0%,rgba(0,0,0,0)_60%)]"></div>
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
                        <h4 className="font-bold text-lg text-white">{t.landing.diagram_create}</h4>
                        <p className="text-sm text-gray-400">{t.landing.diagram_create_sub}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gray border-2 border-brand-green text-brand-green flex-shrink-0">
                        {React.cloneElement(ICONS.deposit as React.ReactElement<any>, { className: "w-8 h-8" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">{t.landing.diagram_dep}</h4>
                        <p className="text-sm text-gray-400">{t.landing.diagram_dep_sub}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-gray border-2 border-gray-600 text-gray-400 flex-shrink-0">
                        {React.cloneElement(ICONS.plans as React.ReactElement<any>, { className: "w-8 h-8" })}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-white">{t.landing.diagram_profit}</h4>
                        <p className="text-sm text-gray-400">{t.landing.diagram_profit_sub}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-brand-black text-white min-h-screen relative w-full overflow-x-hidden">
            <GridBackground />
            
             <Modal 
                isOpen={isLearnMoreOpen} 
                onClose={() => setIsLearnMoreOpen(false)} 
                title={t.landing.modal_learn_title}
            >
                <div className="space-y-6">
                    <div className="bg-brand-gray p-4 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            {React.cloneElement(ICONS.shield as React.ReactElement<any>, { className: "h-5 w-5 text-brand-green" })} {t.landing.modal_why_title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {t.landing.modal_why_desc}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white mb-4">{t.landing.modal_advantages_title}</h3>
                        <div className="grid gap-4">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-brand-green/20 p-2 rounded-lg h-fit text-brand-green">
                                    {React.cloneElement(ICONS.arrowUp as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{t.landing.modal_adv_1_title}</h4>
                                    <p className="text-sm text-gray-400">{t.landing.modal_adv_1_desc}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-brand-blue/20 p-2 rounded-lg h-fit text-brand-blue">
                                    {React.cloneElement(ICONS.dollar as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{t.landing.modal_adv_2_title}</h4>
                                    <p className="text-sm text-gray-400">{t.landing.modal_adv_2_desc}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 bg-purple-500/20 p-2 rounded-lg h-fit text-purple-400">
                                    {React.cloneElement(ICONS.transactions as React.ReactElement<any>, { className: "h-5 w-5" })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{t.landing.modal_adv_3_title}</h4>
                                    <p className="text-sm text-gray-400">{t.landing.modal_adv_3_desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <p className="text-center text-gray-400 text-sm mb-4">{t.landing.modal_start_text}</p>
                        <Button fullWidth onClick={() => { setIsLearnMoreOpen(false); setView(View.Register); }}>
                            {t.landing.modal_cta}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={!!infoModalContent}
                onClose={() => setInfoModalContent(null)}
                title={infoModalContent?.title || ''}
            >
                <div className="prose prose-invert prose-sm max-h-[60vh] overflow-y-auto pr-4 text-gray-300">
                    {infoModalContent?.content}
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
                            <a 
                                key={item.name} 
                                href={item.href} 
                                onClick={(e) => {
                                    if (item.action) {
                                        e.preventDefault();
                                        item.action();
                                    }
                                }}
                                className="font-semibold text-gray-300 hover:text-brand-green transition-colors uppercase text-sm tracking-wide"
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* Language Selector in Navbar */}
                        <div className="relative mr-2" ref={langMenuRef}>
                            <button 
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity p-2 rounded-md hover:bg-gray-800"
                            >
                                <span className="text-2xl leading-none">{LANGUAGE_OPTIONS.find(l => l.code === language)?.flag}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {isLangMenuOpen && (
                                <div className="absolute right-0 mt-2 w-36 bg-brand-gray border border-gray-700 rounded-lg shadow-xl py-1 animate-fade-in-up z-50">
                                    {LANGUAGE_OPTIONS.map((option) => (
                                        <button
                                            key={option.code}
                                            onClick={() => {
                                                setLanguage(option.code);
                                                setIsLangMenuOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 flex items-center gap-3 transition-colors ${language === option.code ? 'bg-gray-800/50 text-brand-green' : 'text-gray-300'}`}
                                        >
                                            <span className="text-lg">{option.flag}</span>
                                            <span className="font-medium">{option.code.toUpperCase()}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                         <Button onClick={() => setView(View.Login)} variant="secondary" className="px-5 py-2 !rounded-md">
                           {t.landing.login}
                         </Button>
                         <Button onClick={() => setView(View.Register)} variant="primary" className="px-5 py-2 !rounded-md hidden sm:block">
                           {t.landing.signup}
                         </Button>
                    </div>
                </div>
            </header>

            <main id="home" className="h-[calc(100vh-76px)] min-h-[600px] flex items-center justify-center text-center relative px-4 z-10">
                <div className="relative z-10 flex flex-col items-center">
                    <h1 className="text-6xl md:text-8xl font-black leading-tight max-w-4xl">
                        {t.landing.hero_title_1}
                        <span className="block bg-gradient-to-r from-brand-blue to-brand-green text-transparent bg-clip-text mt-2 animate-gradient-x">
                            {t.landing.hero_title_2}
                        </span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
                        {t.landing.hero_subtitle}
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Button onClick={() => setView(View.Register)} variant="primary" className="px-8 py-4 text-lg">
                            <div className="flex items-center gap-2">
                                {t.landing.hero_cta}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </div>
                        </Button>
                        <Button variant="secondary" className="px-8 py-4 text-lg" onClick={() => setIsLearnMoreOpen(true)}>
                            {t.landing.hero_learn}
                        </Button>
                    </div>
                </div>
            </main>
            
            <section id="features" className="py-24 px-4 sm:px-6 lg:px-12 bg-brand-gray/50 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">{t.landing.features_title}</h2>
                    <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">{t.landing.features_subtitle}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 text-left">
                        <FeatureCard icon={ICONS.featureProfit} title={t.landing.feature_profit_title}>
                            {t.landing.feature_profit_desc}
                        </FeatureCard>
                        <FeatureCard icon={ICONS.featureSecurity} title={t.landing.feature_security_title}>
                            {t.landing.feature_security_desc}
                        </FeatureCard>
                         <FeatureCard icon={ICONS.featureLayout} title={t.landing.feature_interface_title}>
                            {t.landing.feature_interface_desc}
                        </FeatureCard>
                        <FeatureCard icon={ICONS.featureSupport} title={t.landing.feature_support_title}>
                            {t.landing.feature_support_desc}
                        </FeatureCard>
                    </div>
                </div>
            </section>
            
            <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">{t.landing.how_title}</h2>
                    <p className="mt-4 text-lg text-gray-400">{t.landing.how_subtitle}</p>
                    <div className="mt-16 flex flex-col-reverse md:flex-row justify-between items-center text-left gap-12">
                        <div className="w-full md:w-1/2 space-y-12">
                            <HowItWorksStep number="1" title={t.landing.step_1_title}>
                                {t.landing.step_1_desc}
                            </HowItWorksStep>
                            <HowItWorksStep number="2" title={t.landing.step_2_title}>
                                {t.landing.step_2_desc}
                            </HowItWorksStep>
                            <HowItWorksStep number="3" title={t.landing.step_3_title}>
                                {t.landing.step_3_desc}
                            </HowItWorksStep>
                        </div>
                         <HowItWorksDiagram />
                    </div>
                </div>
            </section>

            <section id="plans" className="py-24 px-4 sm:px-6 lg:px-12 bg-brand-gray/50 relative z-10">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-4xl font-black text-white">{t.landing.plans_title}</h2>
                    <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">{t.landing.plans_subtitle}</p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                        {INVESTMENT_PLANS.map(plan => (
                            <PlanPreviewCard 
                                key={plan.id} 
                                plan={plan} 
                                returnLabel={t.landing.plan_return_label}
                                depositLabel={t.landing.plan_deposit_label}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section id="cta" className="py-20 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-brand-blue/80 to-brand-green/80 p-12 rounded-2xl">
                    <h2 className="text-4xl font-black text-brand-black">{t.landing.cta_title}</h2>
                    <p className="mt-4 text-lg text-brand-black/80 max-w-2xl mx-auto">{t.landing.cta_subtitle}</p>
                    <Button onClick={() => setView(View.Register)} variant="primary" className="px-8 py-4 text-lg mt-8">
                        {t.landing.cta_button}
                    </Button>
                </div>
            </section>
            
            <div className="relative z-10">
                <StockTicker />
            </div>

            <footer className="bg-brand-gray border-t border-gray-800 py-16 px-4 sm:px-6 lg:px-12 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2">
                            {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-7 w-7 text-brand-green"})}
                            <span className="text-2xl font-bold tracking-wider">GREENNSEVEN</span>
                        </div>
                        <p className="mt-4 text-gray-400">{t.landing.footer_desc}</p>
                    </div>
                     <div>
                        <h4 className="font-bold text-white tracking-wider">{t.landing.footer_company}</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('about')}} className="text-gray-400 hover:text-white">{t.landing.footer_about}</a></li>
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('contact')}} className="text-gray-400 hover:text-white">{t.landing.footer_contact}</a></li>
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('careers')}} className="text-gray-400 hover:text-white">{t.landing.footer_careers}</a></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-white tracking-wider">{t.landing.footer_legal}</h4>
                        <ul className="mt-4 space-y-2">
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('terms')}} className="text-gray-400 hover:text-white">{t.landing.footer_terms}</a></li>
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('privacy')}} className="text-gray-400 hover:text-white">{t.landing.footer_privacy}</a></li>
                            <li><a href="#" onClick={(e) => {e.preventDefault(); openInfoModal('security')}} className="text-gray-400 hover:text-white">{t.landing.footer_security}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
                    <p className="text-gray-500">&copy; 2025 GreennSeven. {t.landing.footer_rights}</p>
                    <div className="flex gap-4 mt-4 sm:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white">{ICONS.twitter}</a>
                        <a href="https://www.instagram.com/greennseven?igsh=amhsM2N6MWw1MzIx" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">{ICONS.instagram}</a>
                        <a href="#" className="text-gray-400 hover:text-white">{ICONS.facebook}</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
