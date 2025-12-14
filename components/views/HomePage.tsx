
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
  const [scrolled, setScrolled] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const t = TRANSLATIONS[language].landing;
  const faqList = TRANSLATIONS[language].faq;

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleNewsletterSubmit = () => {
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
        // Visual feedback for invalid email
        const input = document.getElementById('newsletter-input');
        if(input) {
            input.classList.add('border-red-500');
            setTimeout(() => input.classList.remove('border-red-500'), 2000);
        }
        return;
    }

    setIsSubmittingNewsletter(true);
    
    // Simulate API call
    setTimeout(() => {
        setIsSubmittingNewsletter(false);
        setNewsletterSuccess(true);
        setNewsletterEmail('');
        setTimeout(() => setNewsletterSuccess(false), 5000);
    }, 1500);
  };

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
    <div className="min-h-screen bg-brand-black text-white font-sans scroll-smooth selection:bg-brand-green selection:text-black">
        <Modal 
            isOpen={!!modalContent} 
            onClose={() => setModalContent(null)} 
            title={modalContent?.title || ''}
        >
            <div className="prose prose-invert max-h-[70vh] overflow-y-auto pr-2">
                {modalContent?.content}
            </div>
        </Modal>

        {/* TOP MARKET STRIP */}
        <div className="bg-black/50 border-b border-white/5 py-1 overflow-hidden backdrop-blur-sm relative z-50">
            <div className="animate-marquee whitespace-nowrap flex gap-8 items-center text-[10px] font-mono text-gray-400">
                <span>BTC/USD <span className="text-green-400">+2.4%</span></span>
                <span>ETH/USD <span className="text-green-400">+1.8%</span></span>
                <span>S&P 500 <span className="text-green-400">+0.5%</span></span>
                <span>NSDQ 100 <span className="text-green-400">+0.8%</span></span>
                <span>USD/BRL <span className="text-red-400">-0.2%</span></span>
                <span>EUR/USD <span className="text-green-400">+0.1%</span></span>
                <span>GOLD <span className="text-green-400">+0.4%</span></span>
                {/* Duplicate for seamless loop */}
                <span>BTC/USD <span className="text-green-400">+2.4%</span></span>
                <span>ETH/USD <span className="text-green-400">+1.8%</span></span>
                <span>S&P 500 <span className="text-green-400">+0.5%</span></span>
            </div>
        </div>

        {/* HEADER */}
        <header className={`fixed top-6 left-0 w-full z-40 transition-all duration-300 ${scrolled ? 'top-0 py-3 bg-black/80 backdrop-blur-lg border-b border-white/10 shadow-lg shadow-brand-green/5' : 'py-5 bg-transparent'}`}>
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 cursor-pointer shrink-0 group" onClick={() => window.location.reload()}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-green blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-8 w-8 text-brand-green relative z-10"})}
                        </div>
                        <span className="text-xl md:text-2xl font-black tracking-wider text-white">GREENN<span className="text-brand-green">SEVEN</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4 md:gap-8">
                        <nav className="hidden lg:flex items-center gap-8">
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
                                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors tracking-wide relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-brand-green after:transition-all after:duration-300 hover:after:w-full"
                                >
                                    {item.name}
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            {/* Language */}
                            <div className="relative" ref={langMenuRef}>
                                <button 
                                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                    className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity p-2 rounded-md hover:bg-white/5"
                                >
                                    <span className="text-2xl leading-none transition-all drop-shadow-md">{LANGUAGE_OPTIONS.find(l => l.code === language)?.flag}</span>
                                </button>
                                
                                {isLangMenuOpen && (
                                    <div className="absolute right-0 mt-4 w-40 bg-[#111] border border-white/10 rounded-lg shadow-2xl py-2 animate-fade-in-up z-50">
                                        {LANGUAGE_OPTIONS.map((option) => (
                                            <button
                                                key={option.code}
                                                onClick={() => {
                                                    setLanguage(option.code);
                                                    setIsLangMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-5 py-3 text-sm hover:bg-white/5 flex items-center gap-3 transition-colors ${language === option.code ? 'text-brand-green bg-brand-green/5' : 'text-gray-400'}`}
                                            >
                                                <span className="text-lg">{option.flag}</span>
                                                <span className="font-medium">{option.code.toUpperCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="hidden sm:flex gap-3">
                                <Button onClick={() => setView(View.Login)} variant="ghost" className="text-sm font-bold text-gray-300 hover:text-white px-4">
                                {t.login}
                                </Button>
                                <Button onClick={() => setView(View.Register)} className="px-6 py-2.5 text-sm rounded-full bg-brand-green text-black font-bold shadow-[0_0_20px_rgba(0,255,156,0.3)] hover:shadow-[0_0_30px_rgba(0,255,156,0.5)] border-none">
                                {t.signup}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {/* HERO SECTION */}
        <section id="home" className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-brand-green/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[100px] animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Hero Text */}
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-green/30 bg-brand-green/5 mb-6 animate-fade-in-up">
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                            <span className="text-xs font-bold text-brand-green tracking-wider uppercase">Plataforma Dolarizada</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none text-white">
                            {t.hero_title_1} <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-brand-blue to-brand-green bg-[length:200%_auto] animate-text-gradient">{t.hero_title_2}</span> <br/>
                            {t.hero_title_3}
                        </h1>
                        
                        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed font-light">
                            {t.hero_subtitle}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Button onClick={() => setView(View.Register)} className="px-10 py-4 text-lg rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-colors shadow-xl">
                                {t.hero_cta}
                            </Button>
                            <Button onClick={() => openModal('learn')} variant="secondary" className="px-10 py-4 text-lg rounded-lg border-white/20 hover:bg-white/10 hover:border-brand-green/50 text-white">
                                {t.hero_learn}
                            </Button>
                        </div>

                        {/* Social Proof Strip */}
                        <div className="mt-12 pt-8 border-t border-white/5 flex gap-8 justify-center lg:justify-start">
                            <div>
                                <p className="text-2xl font-bold text-white">+50k</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Usuários</p>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <p className="text-2xl font-bold text-brand-green">24/7</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Suporte</p>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div>
                                <p className="text-2xl font-bold text-brand-blue">US$ 2M+</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Volume</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Visual (Mock Dashboard) */}
                    <div className="flex-1 w-full max-w-[600px] relative animate-float hidden lg:block">
                        <div className="absolute inset-0 bg-brand-green/20 blur-[100px] rounded-full"></div>
                        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden backdrop-blur-sm">
                            {/* Fake UI Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="h-2 w-20 bg-gray-800 rounded-full"></div>
                            </div>
                            {/* Balance Card */}
                            <div className="bg-gradient-to-r from-brand-green/20 to-brand-blue/20 rounded-xl p-6 border border-white/5 mb-4">
                                <p className="text-sm text-gray-400 mb-1">Saldo Total (USD)</p>
                                <p className="text-3xl font-bold text-white">$ 12,450.00</p>
                                <div className="mt-4 flex gap-2">
                                    <div className="h-8 w-24 bg-brand-green rounded text-black font-bold text-xs flex items-center justify-center">DEPOSITAR</div>
                                    <div className="h-8 w-24 bg-white/10 rounded text-white font-bold text-xs flex items-center justify-center border border-white/10">SACAR</div>
                                </div>
                            </div>
                            {/* Chart Placeholder */}
                            <div className="flex items-end justify-between h-24 gap-2 px-2">
                                {[30, 45, 35, 60, 50, 75, 60, 90, 80].map((h, i) => (
                                    <div key={i} className="w-full bg-gray-800 rounded-t-sm relative overflow-hidden group">
                                        <div style={{height: `${h}%`}} className="absolute bottom-0 w-full bg-brand-green/50 group-hover:bg-brand-green transition-all duration-500"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Floating Element */}
                        <div className="absolute -bottom-10 -left-10 bg-[#111] p-4 rounded-xl border border-white/10 shadow-xl flex items-center gap-3 animate-pulse-slow">
                            <div className="bg-brand-green/20 p-2 rounded-lg text-brand-green">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Rendimento Hoje</p>
                                <p className="font-bold text-brand-green">+ $ 145.20</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FEATURES (Reduced Padding) */}
        <section id="features" className="py-16 bg-[#0A0A0A] relative border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.features_title}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">{t.features_subtitle}</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: ICONS.featureProfit, title: t.feature_profit_title, desc: t.feature_profit_desc },
                        { icon: ICONS.featureSecurity, title: t.feature_security_title, desc: t.feature_security_desc },
                        { icon: ICONS.featureLayout, title: t.feature_interface_title, desc: t.feature_interface_desc },
                        { icon: ICONS.featureSupport, title: t.feature_support_title, desc: t.feature_support_desc },
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-[#121212] p-8 rounded-2xl border border-white/5 hover:border-brand-green/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="p-4 bg-black rounded-xl w-fit mb-6 text-brand-green group-hover:scale-110 transition-transform shadow-lg shadow-brand-green/5 border border-white/5">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-brand-black relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">{t.how_title}</h2>
                        <p className="text-lg text-gray-400 mb-10">{t.how_subtitle}</p>
                        
                        <div className="space-y-8 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-brand-green/50 to-transparent"></div>

                            {[
                                { step: '01', title: t.step_1_title, desc: t.step_1_desc },
                                { step: '02', title: t.step_2_title, desc: t.step_2_desc },
                                { step: '03', title: t.step_3_title, desc: t.step_3_desc },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-8 relative">
                                    <div className="w-12 h-12 rounded-full bg-brand-black border border-brand-green/30 flex items-center justify-center font-bold text-brand-green text-xl shadow-[0_0_15px_rgba(0,255,156,0.1)] z-10 shrink-0">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-12">
                            <Button onClick={() => setView(View.Register)} className="px-8 py-3 bg-brand-green text-black font-bold rounded-lg shadow-lg hover:shadow-brand-green/30">{t.hero_cta}</Button>
                        </div>
                    </div>
                    
                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-brand-blue/10 blur-[100px] rounded-full"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
                            alt="Dashboard Mobile" 
                            className="relative rounded-3xl border border-white/10 shadow-2xl opacity-80 hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="absolute -bottom-6 -right-6 bg-brand-black p-6 rounded-2xl border border-white/10 shadow-2xl max-w-xs">
                            <p className="text-gray-400 text-xs uppercase font-bold mb-2">Status da Conta</p>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-white font-bold">Verificada & Ativa</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* PLANS */}
        <section id="plans" className="py-24 bg-[#080808] relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,178,255,0.05),transparent_50%)]"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.plans_title}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">{t.plans_subtitle}</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {INVESTMENT_PLANS.map((plan, idx) => (
                        <div key={idx} className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col hover:border-brand-green transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,156,0.1)] group relative overflow-hidden">
                            {idx === 1 && (
                                <div className="absolute top-0 right-0 bg-brand-green text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">
                                    Recomendado
                                </div>
                            )}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <h3 className={`text-xl font-bold mb-2 ${plan.color}`}>{plan.name}</h3>
                            <div className="my-6">
                                <span className="text-3xl font-black text-white">{plan.monthlyReturn}</span>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">{t.plan_return_label}</p>
                            </div>
                            
                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs">✓</div>
                                    <span className="text-gray-300">{t.plan_deposit_label}: <strong className="text-white">US$ {plan.minDepositUSD}</strong></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs">✓</div>
                                    <span className="text-gray-300">Saques diários</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green text-xs">✓</div>
                                    <span className="text-gray-300">Suporte 24/7</span>
                                </div>
                            </div>
                            
                            <Button onClick={() => setView(View.Register)} variant="secondary" fullWidth className="bg-white/5 border-white/10 hover:bg-brand-green hover:text-black hover:border-brand-green transition-all">Começar</Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-green/10"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">{t.cta_title}</h2>
                    <p className="text-xl text-gray-300 mb-10 font-light">
                        {t.cta_subtitle}
                    </p>
                    <Button onClick={() => setView(View.Register)} className="bg-white text-black hover:bg-gray-200 px-12 py-4 text-lg font-bold rounded-full shadow-2xl hover:scale-105 transition-transform">
                        {t.cta_button}
                    </Button>
                </div>
            </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-brand-black border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.nav_faq}</h2>
                </div>
                
                <div className="space-y-4">
                    {faqList.map((item, idx) => (
                        <div key={idx} className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden transition-colors hover:border-white/10">
                            <button 
                                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                            >
                                <span className="font-bold text-gray-200">{item.q}</span>
                                <span className={`transform transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''} text-brand-green`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </span>
                            </button>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${openFaqIndex === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5">
                                    {item.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-black border-t border-white/10 pt-16 pb-8 text-sm">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            {React.cloneElement(ICONS.career as React.ReactElement<any>, {className: "h-6 w-6 text-brand-green"})}
                            <span className="text-xl font-bold text-white">GREENN<span className="text-brand-green">SEVEN</span></span>
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-6">
                            {t.footer_desc}
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.twitter}</a>
                            <a href="https://www.instagram.com/greennseven?igsh=amhsM2N6MWw1MzIx" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.instagram}</a>
                            <a href="#" className="text-gray-500 hover:text-brand-green transition-colors">{ICONS.facebook}</a>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">{t.footer_company}</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><button onClick={() => openModal('about')} className="hover:text-brand-green transition-colors">{t.footer_about}</button></li>
                            <li><button onClick={() => openModal('careers')} className="hover:text-brand-green transition-colors">{t.footer_careers}</button></li>
                            <li><button onClick={() => openModal('contact')} className="hover:text-brand-green transition-colors">{t.footer_contact}</button></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">{t.footer_legal}</h4>
                        <ul className="space-y-3 text-gray-500">
                            <li><button onClick={() => openModal('terms')} className="hover:text-brand-green transition-colors">{t.footer_terms}</button></li>
                            <li><button onClick={() => openModal('privacy')} className="hover:text-brand-green transition-colors">{t.footer_privacy}</button></li>
                            <li><button onClick={() => openModal('security')} className="hover:text-brand-green transition-colors">{t.footer_security}</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Newsletter</h4>
                        <div className="flex gap-2">
                            <input 
                                id="newsletter-input"
                                type="email" 
                                placeholder="Email" 
                                className="bg-[#111] border border-white/10 rounded px-3 py-2 w-full focus:outline-none focus:border-brand-green text-white placeholder-gray-600 transition-colors" 
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                disabled={isSubmittingNewsletter}
                            />
                            <Button 
                                className="px-4 py-2 bg-brand-green text-black font-bold"
                                onClick={handleNewsletterSubmit}
                                isLoading={isSubmittingNewsletter}
                            >
                                OK
                            </Button>
                        </div>
                        {newsletterSuccess && (
                            <p className="text-brand-green text-xs mt-2 animate-fade-in font-medium">
                                ✓ Obrigado! Enviamos um guia exclusivo sobre a GreennSeven para seu e-mail.
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-600">
                    <p>&copy; {new Date().getFullYear()} GreennSeven Invest. {t.footer_rights}</p>
                </div>
            </div>
        </footer>
    </div>
  );
};

export default HomePage;
