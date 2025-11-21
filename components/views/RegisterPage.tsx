
import React, { useState, useMemo, useEffect } from 'react';
import { View } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../layout/Modal';
import { TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    referralCode?: string;
}

interface RegisterPageProps {
  setView: (view: View) => void;
  onRegister: (data: RegisterData) => void;
}

const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (!password) return 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
};

const RegisterPage: React.FC<RegisterPageProps> = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
    });
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: boolean | string }>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            setReferralCode(ref);
        }
    }, []);

    const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: false }));
    };

    const validateForm = (): boolean => {
        const newErrors: {[key: string]: boolean | string} = {};
        
        if (!formData.name.trim()) newErrors.name = 'Nome completo é obrigatório';
        if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
        
        if (formData.password.length < 6) newErrors.password = 'A senha deve ter no mínimo 6 caracteres';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';
        
        if (!agreedToTerms) newErrors.terms = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        onRegister({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            referralCode: referralCode || undefined
        });
        setIsSubmitted(true);
    };

    const openModal = (type: 'terms' | 'privacy') => {
      if (type === 'terms') {
        setModalContent({ title: 'Termos de Uso', content: TERMS_OF_USE_CONTENT });
      } else {
        setModalContent({ title: 'Política de Privacidade', content: PRIVACY_POLICY_CONTENT });
      }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-black p-4">
                <Card className="text-center w-full max-w-md animate-scale-in border-brand-green/20">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green text-3xl">
                            ✓
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-brand-green mb-4">Cadastro Realizado!</h2>
                    <p className="text-gray-400 mb-6">
                        Sua conta foi criada com sucesso. Você já pode acessar a plataforma.
                    </p>
                    <Button onClick={() => setView(View.Login)}>Ir para o Login</Button>
                </Card>
            </div>
        );
    }

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
            <h2 className="text-2xl font-bold text-center text-white mb-2">Crie sua Conta</h2>
            <p className="text-center text-gray-400 mb-6">
                Preencha seus dados básicos para começar.
            </p>

            {referralCode && (
                <div className="mb-6 bg-brand-green/10 border border-brand-green/30 rounded-lg p-3 flex items-center justify-center gap-2 text-sm text-brand-green">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Indicação aplicada: <strong>{referralCode}</strong></span>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                    label="Nome Completo" 
                    id="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    error={errors.name} 
                    required 
                />
                <Input 
                    label="Email" 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    error={errors.email} 
                    required 
                />
                <div>
                    <Input 
                        label="Senha (mín. 6 caracteres)" 
                        id="password" 
                        type="password" 
                        value={formData.password} 
                        onChange={handleInputChange} 
                        error={errors.password} 
                        required 
                    />
                    <PasswordStrengthIndicator strength={passwordStrength} />
                </div>
                <Input 
                    label="Confirmar Senha" 
                    id="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword} 
                    onChange={handleInputChange} 
                    error={errors.confirmPassword} 
                    required 
                />
                
                <div className="pt-2">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input 
                                id="terms" 
                                type="checkbox" 
                                checked={agreedToTerms} 
                                onChange={(e) => { 
                                    setAgreedToTerms(e.target.checked); 
                                    if (errors.terms) setErrors(p => ({...p, terms: false}))
                                }} 
                                className={`h-4 w-4 text-brand-green bg-gray-800 border-gray-600 rounded focus:ring-brand-green ${errors.terms ? 'ring-2 ring-red-500' : ''}`} 
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="terms" className="text-gray-400">
                                Eu li e concordo com os <a href="#" onClick={(e) => {e.preventDefault(); openModal('terms')}} className="font-medium text-brand-green hover:underline">Termos de Uso</a> e a <a href="#" onClick={(e) => {e.preventDefault(); openModal('privacy')}} className="font-medium text-brand-green hover:underline">Política de Privacidade</a>.
                            </label>
                            {errors.terms && <p className="text-red-500 text-xs mt-1">Você deve aceitar os termos.</p>}
                        </div>
                    </div>
                </div>

                <Button type="submit" fullWidth className="mt-4">Criar Conta</Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-400">
              Já tem uma conta?{' '}
              <a href="#" onClick={(e) => {e.preventDefault(); setView(View.Login)}} className="font-medium text-brand-green hover:text-brand-green-light">
                Faça login
              </a>
            </p>

          </Card>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;
