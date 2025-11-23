
import React, { useState, useEffect, useRef } from 'react';
import { View, Language } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { ICONS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';

interface ForgotPasswordPageProps {
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

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setView, language, setLanguage }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  
  // Language Dropdown
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language].auth;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(true);
      return;
    }
    alert('Link de recuperação enviado (simulação)!');
    setView(View.Login);
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 relative">
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

      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-2 mb-8">
            <span className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-brand-green to-brand-blue text-transparent bg-clip-text">GreennSeven</span>
                <span className="text-white"> Invest</span>
            </span>
        </div>
        <Card className="border-brand-green/20">
          <h2 className="text-2xl font-bold text-center text-white mb-2">{t.recovery_title}</h2>
          <p className="text-center text-gray-400 mb-6">{t.recovery_subtitle}</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label={t.email_label}
                id="email" 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(false);
                }}
                error={error}
                required 
            />
            <Button type="submit" fullWidth variant="primary">{t.send_link_btn}</Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-gray-400">
            {t.back_login_link}{' '}
            <a href="#" onClick={(e) => {e.preventDefault(); setView(View.Login)}} className="font-medium text-brand-green hover:text-brand-green-light">
              {t.login_link}
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
