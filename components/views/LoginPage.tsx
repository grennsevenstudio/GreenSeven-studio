
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

  // Forgot Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Formato de email inválido' }));
    }
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
      setModalContent({ title: 'Termos de Uso', content: TERMS_OF_USE_CONTENT });
    } else {
      setModalContent({ title: 'Política de Privacidade', content: PRIVACY_POLICY_CONTENT });
    }
  };

  return (
    <>
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
        title="Recuperar Senha"
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
                      <Button onClick={closeForgotModal} fullWidth>Voltar para o Login</Button>
                  </div>
              </div>
          ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-400 mb-4">
                      Insira o endereço de email associado à sua conta e enviaremos um link para redefinir sua senha.
                  </p>
                  <Input 
                      label="Email de Cadastro" 
                      id="forgotEmail" 
                      type="email" 
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required 
                  />
                  <div className="pt-2">
                      <Button type="submit" fullWidth isLoading={isForgotLoading}>
                          Enviar Link de Recuperação
                      </Button>
                  </div>
              </form>
          )}
      </Modal>

      <div className="min-h-screen flex items-center justify-center bg-brand-black p-4 relative">
        {/* Back Button */}
        <button 
            onClick={() => setView(View.Home)} 
            className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-brand-green transition-colors z-10"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline font-medium">Voltar para Home</span>
        </button>

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
                  onBlur={handleEmailBlur}
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
                  <a 
                    href="#" 
                    onClick={(e) => {
                        e.preventDefault(); 
                        setIsForgotModalOpen(true);
                        setForgotEmail(email); // Pre-fill if user typed something
                    }} 
                    className="text-xs text-brand-green hover:underline"
                  >
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
