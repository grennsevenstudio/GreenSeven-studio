
import React, { useState, useEffect, useRef } from 'react';
import { View, Language } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../layout/Modal';
import { ICONS } from '../../constants';
import { TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';
import { TRANSLATIONS } from '../../lib/translations';

interface LoginPageProps {
  setView: (view: View) => void;
  onLogin: (email: string, password?: string) => Promise<boolean>;
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

const LoginPage: React.FC<LoginPageProps> = ({ setView, onLogin, language, setLanguage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: boolean | string; password: boolean }>({ email: false, password: false });
  const [rememberMe, setRememberMe] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Language Dropdown State
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language].auth;

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Close language dropdown when clicking outside
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let emailError: boolean | string = false;
    if (!email) {
      emailError = true;
    } else if (!validateEmail(email)) {
      emailError = 'Formato de email inválido';
    }

    const newErrors = { email: emailError, password: !password };
    
    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    const loginSuccess = await onLogin(email, password);
    if (!loginSuccess) {
      setIsLoading(false);
      setErrors({ email: 'Credenciais inválidas. Verifique seu email e senha.', password: true });
    }
    // On success, the component unmounts and isLoading state is gone.
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !validateEmail(forgotEmail)) {
        alert("Por favor, insira um email válido.");
        return;
    }
    
    setIsForgotLoading(true);
    // Simulating API call
    setTimeout(() => {
        setIsForgotLoading(false);
        setForgotSuccess(true);
    }, 2000);
  };

  const closeForgotModal = () => {
      setIsForgotModalOpen(false);
      setTimeout(() => {
          setForgotSuccess(false);
          setForgotEmail('');
      }, 300);
  };

  const openModal = (type: 'terms' | 'privacy') => {
    if (type === 'terms') {
      setModalContent({ title: t.terms_link, content: TERMS_OF_USE_CONTENT });
    } else {
      setModalContent({ title: t.privacy_link, content: PRIVACY_POLICY_CONTENT });
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-brand-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in">
            <svg className="animate-spin h-12 w-12 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl font-bold text-white mt-4 tracking-wider">Conectando...</p>
        </div>
      )}

      {/* Terms Modal */}
      <Modal 
        isOpen={!!modalContent}
        onClose={() => setModalContent(null)}
        title={modalContent?.title || ''}
      >
        <div className="prose prose-invert prose-sm max-h-[60vh] overflow-y-auto pr-4 text-gray-300">
           {modalContent?.content}
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={closeForgotModal}
        title={t.recovery_title}
      >
          {forgotSuccess ? (
              <div className="text-center py-4 animate-fade-in">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                  </div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Email Enviado!</h3>
                  <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enviamos um link de redefinição de senha para <strong>{forgotEmail}</strong>. Verifique sua caixa de entrada e spam.
                      </p>
                  </div>
                  <div className="mt-6">
                      <Button onClick={closeForgotModal} fullWidth>{t.back_btn}</Button>
                  </div>
              </div>
          ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                      {t.recovery_subtitle}
                  </p>
                  <Input 
                      label={t.email_label}
                      id="forgotEmail" 
                      type="email" 
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required 
                  />
                  <div className="pt-2">
                      <Button type="submit" fullWidth isLoading={isForgotLoading}>
                          {t.send_link_btn}
                      </Button>
                  </div>
              </form>
          )}
      </Modal>

      {/* Main Container - Adjusted for mobile centering without crop */}
      <div className="min-h-[100dvh] flex flex-col bg-brand-black p-4 relative overflow-y-auto">
        {/* Back Button */}
        <button 
            onClick={() => setView(View.Home)} 
            className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors z-10"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline font-medium">{t.back_home}</span>
        </button>

        {/* Language Selector */}
        <div className="absolute top-6 right-6 z-20" ref={langMenuRef}>
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

        {/* Center content wrapper with my-auto for safe vertical centering */}
        <div className="w-full max-w-md mx-auto my-auto pt-20 pb-8">
          <div className="flex justify-center items-center gap-2 mb-8">
            <span className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-brand-green to-brand-blue text-transparent bg-clip-text">GreennSeven</span>
                <span className="text-white"> Invest</span>
            </span>
          </div>
          <Card className="border-brand-green/20">
            <h2 className="text-2xl font-bold text-center text-white mb-2">{t.login_title}</h2>
            <p className="text-center text-gray-400 mb-6">{t.login_subtitle}</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                  label={t.email_label} 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: false }));
                  }}
                  onBlur={handleEmailBlur}
                  error={errors.email}
                  required 
              />
              <div>
                <Input 
                    label={t.password_label} 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if(errors.password) setErrors(prev => ({ ...prev, password: false }));
                    }}
                    error={errors.password}
                    required 
                />
                <div className="flex justify-end mt-1">
                  <a 
                    href="#" 
                    onClick={(e) => {
                        e.preventDefault(); 
                        setIsForgotModalOpen(true);
                        setForgotEmail(email); // Pre-fill if user typed something
                    }} 
                    className="text-xs text-brand-green hover:underline"
                  >
                    {t.forgot_password}
                  </a>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-600 rounded bg-brand-black"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  {t.remember_me}
                </label>
              </div>

              <Button type="submit" fullWidth variant="primary">{t.login_button}</Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              {t.no_account}{' '}
              <a href="#" onClick={(e) => {e.preventDefault(); setView(View.Register)}} className="font-medium text-brand-green hover:text-brand-green-light">
                {t.register_link}
              </a>
            </p>
          </Card>
          <div className="mt-8 text-center text-xs text-gray-500">
             <a href="#" onClick={(e) => {e.preventDefault(); openModal('terms')}} className="hover:text-gray-300">{t.terms_link}</a>
             <span className="mx-2">•</span>
             <a href="#" onClick={(e) => {e.preventDefault(); openModal('privacy')}} className="hover:text-gray-300">{t.privacy_link}</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
