
import React, { useState, useEffect } from 'react';
import { View } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../layout/Modal';
import { ICONS } from '../../constants';
import { TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';

interface LoginPageProps {
  setView: (view: View) => void;
  onLogin: (email: string, password?: string) => boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ setView, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: boolean | string; password: boolean }>({ email: false, password: false });
  const [rememberMe, setRememberMe] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    // onLogin now returns a boolean indicating success
    const loginSuccess = onLogin(email, password);
    if (!loginSuccess) {
        // Optionally handle specific UI feedback here if needed
    }
  };

  const openModal = (type: 'terms' | 'privacy') => {
    if (type === 'terms') {
      setModalContent({ title: 'Termos de Uso', content: TERMS_OF_USE_CONTENT });
    } else {
      setModalContent({ title: 'Política de Privacidade', content: PRIVACY_POLICY_CONTENT });
    }
  };

  return (
    <>
      <Modal 
        isOpen={!!modalContent}
        onClose={() => setModalContent(null)}
        title={modalContent?.title || ''}
      >
        <div className="prose prose-invert prose-sm max-h-[60vh] overflow-y-auto pr-4 text-gray-300">
           {modalContent?.content}
        </div>
      </Modal>

      <div className="min-h-screen flex items-center justify-center bg-brand-black p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center items-center gap-2 mb-8">
            <span className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-brand-green to-brand-blue text-transparent bg-clip-text">GreennSeven</span>
                <span className="text-white"> Invest</span>
            </span>
          </div>
          <Card className="border-brand-green/20">
            <h2 className="text-2xl font-bold text-center text-white mb-2">Acesse sua Conta</h2>
            <p className="text-center text-gray-400 mb-6">Bem-vindo de volta, investidor.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input 
                  label="Email" 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: false }));
                  }}
                  error={errors.email}
                  required 
              />
              <div>
                <Input 
                    label="Senha" 
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
                  <a href="#" onClick={(e) => {e.preventDefault(); setView(View.ForgotPassword)}} className="text-xs text-brand-green hover:underline">
                    Esqueceu a senha?
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
                  Lembrar de mim
                </label>
              </div>

              <Button type="submit" fullWidth variant="primary">Entrar</Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              Não tem uma conta?{' '}
              <a href="#" onClick={(e) => {e.preventDefault(); setView(View.Register)}} className="font-medium text-brand-green hover:text-brand-green-light">
                Cadastre-se
              </a>
            </p>
          </Card>
          <div className="mt-8 text-center text-xs text-gray-500">
             <a href="#" onClick={(e) => {e.preventDefault(); openModal('terms')}} className="hover:text-gray-300">Termos de Uso</a>
             <span className="mx-2">•</span>
             <a href="#" onClick={(e) => {e.preventDefault(); openModal('privacy')}} className="hover:text-gray-300">Privacidade</a>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
