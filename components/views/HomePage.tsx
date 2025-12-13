import React, { useState, useRef, useEffect } from 'react';
import { View, Language } from '../../types';
import Button from '../ui/Button';
import Modal from '../layout/Modal';
import { ICONS, INVESTMENT_PLANS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';
import { SECURITY_CONTENT, ABOUT_CONTENT, CONTACT_CONTENT, CAREERS_CONTENT, TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';

interface HomePageProps {
  setView: (view: View) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

const HomePage: React.FC<HomePageProps> = ({ setView, language, setLanguage }) => {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const t = TRANSLATIONS[language].landing;
  const faqList = TRANSLATIONS[language].faq;

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

  const navItems = [
    { name: t.nav_home, href: '#home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { name: t.nav_features, href: '#features' },
    { name: t.nav_how, href: '#how-it-works' },
    { name: t.nav_plans, href: '#plans' },
    { name: t.nav_faq, href: '#faq' },
  ];

  const openModal = (type: 'security' | 'about' | 'contact' | 'careers' | 'terms' | 'privacy' | 'learn') => {
      let content = null;
      let title = '';
      switch (type) {
          case 'security': title = t.footer_security; content = SECURITY_CONTENT; break;
          case 'about': title = t.footer_about; content = ABOUT_CONTENT; break;
          case 'contact': title = t.footer_contact; content = CONTACT_CONTENT; break;
          case 'careers': title = t.footer_careers; content = CAREERS_CONTENT; break;
          case 'terms': title = t.footer_terms; content = TERMS_OF_USE_CONTENT; break;
          case 'privacy': title = t.footer_privacy; content = PRIVACY_POLICY_CONTENT; break;
          case 'learn': 
            title = t.modal_learn_title; 
            content = (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-brand-green">{t.modal_why_title}</h3>
                    <p className="text-gray-300">{t.modal_why_desc}</p>
                    
                    <h3 className="text-lg font-bold text-white mt-4">{t.modal_advantages_title}</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3">
                            <div className="text-brand-green mt-1">✓</div>
                            <div>
                                <strong className="text-white">{t.modal_adv_1_title}</strong>
                                <p className="text-sm text-gray-400">{t.modal_adv_1_desc}</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="text-brand-green mt-1">✓</div>
                            <div>
                                <strong className="text-white">{t.modal_adv_2_title}</strong>
                                <p className="text-sm text-gray-400">{t.modal_adv_2_desc}</p>
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <div className="text-brand-green mt-1">✓</div>
                            <div>
                                <strong className="text-white">{t.modal_adv_3_title}</strong>
                                <p className="text-sm text-gray-400">{t.modal_adv_3_desc}</p>
                            </div>
                        </li>
                    </ul>
                    
                    <div className="bg-brand-green/10 border border-brand-green/30 p-4 rounded-lg mt-6 text-center">
                        <p className="text-brand-green font-bold">{t.modal_start_text}</p>
                    </div>
                    
                    <div className="pt-4">
                        <Button fullWidth onClick={() => { setModalContent(null); setView(View.Register); }}>{t.modal_cta}</Button>
                    </div>
                </div>
            );
            break;
      }
      setModalContent({ title, content });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-brand-black text-gray-900 dark:text-white font-sans scroll-smooth">
        <Modal 
            isOpen={!!modalContent} 
            onClose={() => setModalContent(null)} 
            title={modalContent?.title || ''}
        >
            <div className="prose prose-invert max-h-[70vh] overflow-y-auto pr-2">
                {modalContent?.content}
            </div>
        </Modal>

        {/* HEADER */}
        <header className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-30 py-5 px-4 sm:px-6 lg:px-12 w-full border-b border-gray-200 dark:border-gray-900 transition-colors duration-300">
            <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => window.location.reload()}>
                    {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-8 w-8 text-brand-green"})}
                    <span className="text-2xl md:text-3xl font-bold tracking-wider text-gray-900 dark:text-white">GREENNSEVEN</span>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="relative" ref={langMenuRef}>
                        <button 
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <span className="text-2xl leading-none">{LANGUAGE_OPTIONS.find(l => l.code === language)?.flag}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {isLangMenuOpen && (
                            <div className="absolute right-0 md:right-auto md:left-0 mt-2 w-40 bg-white dark:bg-brand-gray border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 animate-fade-in-up z-50">
                                {LANGUAGE_OPTIONS.map((option) => (
                                    <button
                                        key={option.code}
                                        onClick={() => {
                                            setLanguage(option.code);
                                            setIsLangMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-base hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors ${language === option.code ? 'bg-gray-50 dark:bg-gray-800/50 text-brand-green' : 'text-gray-700 dark:text-gray-300'}`}
                                    >
                                        <span className="text-xl">{option.flag}</span>
                                        <span className="font-medium">{option.code.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
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
                                className="font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-green dark:hover:text-brand-green transition-colors uppercase text-sm lg:text-base tracking-wide whitespace-nowrap"
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                            <Button onClick={() => setView(View.Login)} variant="secondary" className="px-5 py-2.5 !rounded-md text-sm lg:text-base bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 whitespace-nowrap">
                            {t.login}
                            </Button>
                            <Button onClick={() => setView(View.Register)} variant="primary" className="px-5 py-2.5 !rounded-md hidden sm:block text-sm lg:text-base whitespace-nowrap">
                            {t.signup}
                            </Button>
                    </div>
                </div>
            </div>
        </header>

        {/* HERO */}
        <section id="home" className="relative pt-20 pb-32 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-green/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
                    {t.hero_title_1} <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-blue to-brand-green bg-[length:200%_auto] animate-text-gradient">{t.hero_title_2}</span> <br/>
                    {t.hero_title_3}
                </h1>
                <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                    {t.hero_subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => setView(View.Register)} className="px-10 py-4 text-lg !rounded-full shadow-brand-green/25 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                        {t.hero_cta}
                    </Button>
                    <Button onClick={() => openModal('learn')} variant="secondary" className="px-10 py-4 text-lg !rounded-full border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 backdrop-blur-sm">
                        {t.hero_learn}
                    </Button>
                </div>
            </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 bg-gray-50 dark:bg-brand-gray/30 border-y border-gray-200 dark:border-gray-800/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.features_title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t.features_subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: ICONS.featureProfit, title: t.feature_profit_title, desc: t.feature_profit_desc },
                        { icon: ICONS.featureSecurity, title: t.feature_security_title, desc: t.feature_security_desc },
                        { icon: ICONS.featureLayout, title: t.feature_interface_title, desc: t.feature_interface_desc },
                        { icon: ICONS.featureSupport, title: t.feature_support_title, desc: t.feature_support_desc },
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white dark:bg-brand-gray p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-brand-green/50 hover:shadow-lg transition-all duration-300 group">
                            <div className="p-4 bg-gray-100 dark:bg-brand-black rounded-xl w-fit mb-6 text-brand-green group-hover:bg-brand-green group-hover:text-brand-black transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.how_title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{t.how_subtitle}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    <div className="absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-green/30 to-transparent hidden md:block"></div>

                    {[
                        { step: "01", title: t.step_1_title, desc: t.step_1_desc },
                        { step: "02", title: t.step_2_title, desc: t.step_2_desc },
                        { step: "03", title: t.step_3_title, desc: t.step_3_desc },
                    ].map((item, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-brand-black border-4 border-brand-green flex items-center justify-center text-3xl font-black text-brand-green shadow-xl mb-8">
                                {item.step}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* PLANS */}
        <section id="plans" className="py-24 bg-brand-black text-white relative">
            <div className="absolute inset-0 bg-brand-green/5"></div>
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.plans_title}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">{t.plans_subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {INVESTMENT_PLANS.map((plan, idx) => (
                        <div key={plan.id} className={`bg-brand-gray border border-gray-800 rounded-2xl p-6 hover:border-brand-green transition-all duration-300 flex flex-col relative ${idx === 1 ? 'lg:-mt-4 lg:mb-4 shadow-2xl shadow-brand-green/10 border-brand-green/50' : ''}`}>
                            {idx === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-green text-brand-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recomendado</div>}
                            <h3 className={`text-2xl font-bold mb-2 ${plan.color}`}>{plan.name}</h3>
                            <div className="mb-6">
                                <p className="text-gray-400 text-xs uppercase">{t.plan_return_label}</p>
                                <p className="text-4xl font-black">{plan.monthlyReturn}</p>
                            </div>
                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex justify-between items-center text-sm border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">{t.plan_deposit_label}</span>
                                    <span className="font-bold">US$ {plan.minDepositUSD}</span>
                                </div>
                                {/* Mock features based on plan */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                        Saques Diários
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                        Suporte {idx > 1 ? 'Prioritário' : 'Padrão'}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-green"></div>
                                        Proteção Cambial
                                    </div>
                                </div>
                            </div>
                            <Button onClick={() => setView(View.Register)} fullWidth variant={idx === 1 ? 'primary' : 'secondary'}>
                                Selecionar
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gradient-to-r from-brand-green to-brand-blue text-brand-black text-center">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-black mb-6">{t.cta_title}</h2>
                <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-medium opacity-90">{t.cta_subtitle}</p>
                <Button onClick={() => setView(View.Register)} className="bg-brand-black text-white hover:bg-gray-900 border-none px-12 py-5 text-lg !rounded-full shadow-2xl">
                    {t.cta_button}
                </Button>
            </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-white dark:bg-brand-black">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">FAQ</h2>
                    <p className="text-gray-500 dark:text-gray-400">{t.nav_faq}</p>
                </div>

                <div className="space-y-4">
                    {faqList.map((item, idx) => (
                        <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                            <button 
                                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                className="w-full flex justify-between items-center p-6 text-left bg-gray-50 dark:bg-brand-gray/30 hover:bg-gray-100 dark:hover:bg-brand-gray/50 transition-colors"
                            >
                                <span className="font-bold text-gray-900 dark:text-white pr-8">{item.q}</span>
                                <span className={`transform transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`}>
                                    {ICONS.arrowDown}
                                </span>
                            </button>
                            {openFaqIndex === idx && (
                                <div className="p-6 bg-white dark:bg-brand-black border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-brand-black border-t border-gray-800 pt-16 pb-8 text-sm">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6 text-white">
                            {ICONS.career}
                            <span className="text-xl font-bold tracking-wider">GREENNSEVEN</span>
                        </div>
                        <p className="text-gray-500 mb-6">
                            {t.footer_desc}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.twitter}</a>
                            <a href="#" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.instagram}</a>
                            <a href="#" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.facebook}</a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">{t.footer_company}</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><button onClick={() => openModal('about')} className="hover:text-brand-green transition-colors">{t.footer_about}</button></li>
                            <li><button onClick={() => openModal('contact')} className="hover:text-brand-green transition-colors">{t.footer_contact}</button></li>
                            <li><button onClick={() => openModal('careers')} className="hover:text-brand-green transition-colors">{t.footer_careers}</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">{t.footer_legal}</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><button onClick={() => openModal('terms')} className="hover:text-brand-green transition-colors">{t.footer_terms}</button></li>
                            <li><button onClick={() => openModal('privacy')} className="hover:text-brand-green transition-colors">{t.footer_privacy}</button></li>
                            <li><button onClick={() => openModal('security')} className="hover:text-brand-green transition-colors">{t.footer_security}</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider">{t.hero_cta}</h4>
                        <p className="text-gray-500 mb-4">{t.modal_start_text}</p>
                        <Button onClick={() => setView(View.Register)} fullWidth>{t.signup}</Button>
                    </div>
                </div>
                
                <div className="border-t border-gray-800 pt-8 text-center text-gray-600">
                    <p>&copy; {new Date().getFullYear()} GreennSeven Invest. {t.footer_rights}</p>
                </div>
            </div>
        </footer>
    </div>
  );
};

export default HomePage;