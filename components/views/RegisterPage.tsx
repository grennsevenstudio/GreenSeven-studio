
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Language } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../layout/Modal';
import { TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import { formatCPF } from '../../lib/utils';
import { ICONS } from '../../constants';
import { TRANSLATIONS } from '../../lib/translations';

export interface ExtendedRegisterData {
    name: string;
    email: string;
    password: string;
    referralCode?: string;
    cpf: string;
    phone: string;
    address: {
        cep: string;
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
    };
    documents: {
        idFrontUrl: string;
        idBackUrl: string;
        selfieUrl: string;
    };
    kycAnalysis?: string;
}

interface RegisterPageProps {
  setView: (view: View) => void;
  onRegister: (data: ExtendedRegisterData) => Promise<{ success: boolean; message?: string; }>;
  language: Language;
  setLanguage: (lang: Language) => void;
  initialReferralCode?: string | null;
}

const LANGUAGE_OPTIONS: { code: Language; flag: string; label: string }[] = [
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (!password) return 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
};

const FileUploadField: React.FC<{ 
    label: string; 
    id: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    fileName?: string; 
    error?: boolean | string; 
    placeholderText?: string;
}> = ({ label, id, onChange, fileName, error, placeholderText = "Clique para enviar foto" }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${error ? 'border-red-500 bg-red-500/10' : 'border-gray-700 hover:border-brand-green hover:bg-brand-green/5'}`}>
             <input type="file" id={id} onChange={onChange} className="hidden" accept="image/jpeg, image/png, image/webp" />
             <label htmlFor={id} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                {fileName ? (
                    <div className="flex flex-col items-center gap-2 text-brand-green animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
                    </div>
                ) : (
                    <>
                        <div className="text-gray-400 mb-2">
                            {ICONS.upload}
                        </div>
                        <span className="text-sm text-gray-400">{placeholderText}</span>
                    </>
                )}
             </label>
        </div>
        {typeof error === 'string' && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
);

const RegisterPage: React.FC<RegisterPageProps> = ({ setView, onRegister, language, setLanguage, initialReferralCode }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Step 1: Account
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        referralCode: '',
        // Step 2: Personal
        cpf: '',
        phone: '',
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
    });
    
    // Separate state for files
    const [files, setFiles] = useState<{
        idFront: File | null,
        idBack: File | null,
        selfie: File | null
    }>({ idFront: null, idBack: null, selfie: null });

    const [errors, setErrors] = useState<{ [key: string]: boolean | string }>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Language Dropdown
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);

    const t = TRANSLATIONS[language].auth;
    
    useEffect(() => {
        const code = initialReferralCode || localStorage.getItem('referral_code');
        if (code) {
            setFormData(prev => ({ ...prev, referralCode: code }));
        }
    }, [initialReferralCode]);

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
    
    const isRefCodeFromUrl = !!initialReferralCode || !!localStorage.getItem('referral_code');

    const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

    const fetchAddress = async (cleanCep: string) => {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street,
                    neighborhood: data.bairro || prev.neighborhood,
                    city: data.localidade || prev.city,
                    state: data.uf || prev.state
                }));
                
                // Clear errors for filled fields
                setErrors(prev => ({
                    ...prev,
                    street: false,
                    neighborhood: false,
                    city: false,
                    state: false
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        let formattedValue = value;
        
        if (id === 'cpf') formattedValue = formatCPF(value);
        // Simple phone mask
        if (id === 'phone') {
             formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
        }
        // Simple CEP mask & Auto Fetch
        if (id === 'cep') {
             formattedValue = value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
             
             const cleanCep = formattedValue.replace(/\D/g, '');
             if (cleanCep.length === 8) {
                 fetchAddress(cleanCep);
             }
        }

        setFormData(prev => ({ ...prev, [id]: formattedValue }));
        if (errors[id]) setErrors(prev => ({ ...prev, [id]: false }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idFront' | 'idBack' | 'selfie') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [field]: file }));
            if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const validateStep1 = (): boolean => {
        const newErrors: {[key: string]: boolean | string} = {};
        
        if (!formData.name.trim()) newErrors.name = 'Nome obrigatório';
        if (!formData.email.trim()) newErrors.email = 'Email obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
        
        // Strong Password Validation
        const pass = formData.password;
        if (!pass) newErrors.password = 'Senha obrigatória';
        else if (pass.length < 8) newErrors.password = 'Mínimo 8 caracteres';
        else if (!/[A-Z]/.test(pass)) newErrors.password = 'Requer letra maiúscula';
        else if (!/[0-9]/.test(pass)) newErrors.password = 'Requer número';
        else if (!/[^a-zA-Z0-9]/.test(pass)) newErrors.password = 'Requer caractere especial (!@#)';

        if (pass !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = (): boolean => {
        const newErrors: {[key: string]: boolean | string} = {};
        if (!formData.cpf || formData.cpf.length < 14) newErrors.cpf = 'CPF inválido';
        if (!formData.phone || formData.phone.length < 14) newErrors.phone = 'Telefone inválido';
        if (!formData.cep || formData.cep.length < 9) newErrors.cep = 'CEP inválido';
        if (!formData.street) newErrors.street = 'Rua obrigatória';
        if (!formData.number) newErrors.number = 'Número obrigatório';
        if (!formData.neighborhood) newErrors.neighborhood = 'Bairro obrigatório';
        if (!formData.city) newErrors.city = 'Cidade obrigatória';
        if (!formData.state) newErrors.state = 'UF obrigatório';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        const newErrors: {[key: string]: boolean | string} = {};
        if (!files.idFront) newErrors.idFront = 'Frente do RG/CNH obrigatória';
        if (!files.idBack) newErrors.idBack = 'Verso do RG/CNH obrigatório';
        if (!files.selfie) newErrors.selfie = 'Selfie obrigatória';
        if (!agreedToTerms) newErrors.terms = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) setStep(2);
        if (step === 2 && validateStep2()) setStep(3);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep3()) return;
        setIsProcessing(true);

        try {
            // Convert files to Base64
            const idFrontUrl = files.idFront ? await convertToBase64(files.idFront) : '';
            const idBackUrl = files.idBack ? await convertToBase64(files.idBack) : '';
            const selfieUrl = files.selfie ? await convertToBase64(files.selfie) : '';

            const registerData: ExtendedRegisterData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                referralCode: formData.referralCode || undefined,
                cpf: formData.cpf,
                phone: formData.phone,
                address: {
                    cep: formData.cep,
                    street: formData.street,
                    number: formData.number,
                    neighborhood: formData.neighborhood,
                    city: formData.city,
                    state: formData.state,
                },
                documents: {
                    idFrontUrl,
                    idBackUrl,
                    selfieUrl
                }
            };
            
            const result = await onRegister(registerData);

            if (!result.success) {
                setIsProcessing(false);
                if (result.message && result.message.includes('indicação')) {
                    setErrors(prev => ({...prev, referralCode: result.message}));
                } else {
                    alert(result.message || 'Ocorreu um erro no cadastro. Tente novamente.');
                }
            } else {
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Erro ao processar cadastro. Tente novamente.");
            setIsProcessing(false);
        }
    };

    const openModal = (type: 'terms' | 'privacy') => {
      if (type === 'terms') {
        setModalContent({ title: t.terms_link, content: TERMS_OF_USE_CONTENT });
      } else {
        setModalContent({ title: t.privacy_link, content: PRIVACY_POLICY_CONTENT });
      }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-[100dvh] flex items-center justify-center bg-brand-black p-4">
                <Card className="text-center w-full max-w-md animate-scale-in border-brand-green/20">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green text-3xl">
                            ✓
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-brand-green mb-4">{t.success_title}</h2>
                    <p className="text-gray-400 mb-6">
                        {t.success_desc}
                    </p>
                    <Button onClick={() => setView(View.Login)}>{t.goto_login}</Button>
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

      {/* Adjusted wrapper for mobile centering without cutoff */}
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
        <div className="w-full max-w-lg mx-auto my-auto pt-20 pb-8">
          <div 
            className="flex justify-center items-center gap-2 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setView(View.Login)}
          >
            <span className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-brand-green to-brand-blue text-transparent bg-clip-text">GreennSeven</span>
                <span className="text-white"> Invest</span>
            </span>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8 px-4 relative">
             <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 transform -translate-y-1/2"></div>
             <div className={`flex flex-col items-center gap-1 ${step >= 1 ? 'text-brand-green' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 1 ? 'bg-brand-black border-brand-green' : 'bg-gray-800 border-gray-600'}`}>1</div>
                 <span className="text-xs font-semibold bg-brand-black px-1">{t.account_step}</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${step >= 2 ? 'text-brand-green' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 2 ? 'bg-brand-black border-brand-green' : 'bg-gray-800 border-gray-600'}`}>2</div>
                 <span className="text-xs font-semibold bg-brand-black px-1">{t.personal_step}</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${step >= 3 ? 'text-brand-green' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 3 ? 'bg-brand-black border-brand-green' : 'bg-gray-800 border-gray-600'}`}>3</div>
                 <span className="text-xs font-semibold bg-brand-black px-1">{t.docs_step}</span>
             </div>
          </div>

          <Card className="border-brand-green/20">
            <h2 className="text-2xl font-bold text-center text-white mb-2">
                {step === 1 && t.register_title}
                {step === 2 && t.personal_step}
                {step === 3 && t.docs_step}
            </h2>
            <p className="text-center text-gray-400 mb-6 text-sm">
                {step === 1 && t.register_subtitle}
                {step === 2 && 'Precisamos de alguns dados para validar sua conta.'}
                {step === 3 && 'Envie fotos legíveis dos seus documentos.'}
            </p>

            <form onSubmit={handleSubmit}>
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <Input label={t.name_label} id="name" value={formData.name} onChange={handleInputChange} error={errors.name} required />
                        <Input label={t.email_label} id="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
                        <div>
                            <Input label={t.password_label} id="password" type="password" value={formData.password} onChange={handleInputChange} error={errors.password} required />
                            <PasswordStrengthIndicator strength={passwordStrength} />
                            <p className="text-[10px] text-gray-500 mt-1">{t.pass_min}</p>
                        </div>
                        <Input label={t.confirm_password_label} id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} error={errors.confirmPassword} required />
                        <div>
                            <Input 
                                label={t.referral_label}
                                id="referralCode"
                                value={formData.referralCode}
                                onChange={handleInputChange}
                                readOnly={isRefCodeFromUrl}
                                className={isRefCodeFromUrl ? 'bg-black !border-gray-600 focus:!ring-0 cursor-not-allowed' : ''}
                                error={errors.referralCode}
                            />
                            {isRefCodeFromUrl && <p className="text-xs text-brand-green/80 mt-1">✓ Código de indicação aplicado via link.</p>}
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                         <div className="grid grid-cols-2 gap-4">
                            <Input label={t.cpf_label} id="cpf" value={formData.cpf} onChange={handleInputChange} error={errors.cpf} placeholder="000.000.000-00" maxLength={14} required />
                            <Input label={t.phone_label} id="phone" value={formData.phone} onChange={handleInputChange} error={errors.phone} placeholder="(00) 00000-0000" maxLength={15} required />
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                                <Input label={t.cep_label} id="cep" value={formData.cep} onChange={handleInputChange} error={errors.cep} placeholder="00000-000" maxLength={9} required />
                             </div>
                             <div className="col-span-2">
                                <Input label={t.city_label} id="city" value={formData.city} onChange={handleInputChange} error={errors.city} required />
                             </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-2">
                                <Input label={t.street_label} id="street" value={formData.street} onChange={handleInputChange} error={errors.street} required />
                             </div>
                             <div className="col-span-1">
                                <Input label={t.number_label} id="number" value={formData.number} onChange={handleInputChange} error={errors.number} required />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <Input label={t.neighborhood_label} id="neighborhood" value={formData.neighborhood} onChange={handleInputChange} error={errors.neighborhood} required />
                            <Input label={t.state_label} id="state" value={formData.state} onChange={handleInputChange} error={errors.state} maxLength={2} required />
                         </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                         <FileUploadField 
                            label={t.doc_front_label} 
                            id="idFront" 
                            onChange={(e) => handleFileChange(e, 'idFront')} 
                            fileName={files.idFront?.name} 
                            error={errors.idFront} 
                            placeholderText={t.click_upload}
                         />
                         <FileUploadField 
                            label={t.doc_back_label} 
                            id="idBack" 
                            onChange={(e) => handleFileChange(e, 'idBack')} 
                            fileName={files.idBack?.name} 
                            error={errors.idBack} 
                            placeholderText={t.click_upload}
                         />
                         <FileUploadField 
                            label={t.selfie_label} 
                            id="selfie" 
                            onChange={(e) => handleFileChange(e, 'selfie')} 
                            fileName={files.selfie?.name} 
                            error={errors.selfie} 
                            placeholderText={t.click_upload}
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
                                        {t.terms_agree} <a href="#" onClick={(e) => {e.preventDefault(); openModal('terms')}} className="font-medium text-brand-green hover:underline">{t.terms_link}</a> e <a href="#" onClick={(e) => {e.preventDefault(); openModal('privacy')}} className="font-medium text-brand-green hover:underline">{t.privacy_link}</a>.
                                    </label>
                                    {errors.terms && <p className="text-red-500 text-xs mt-1">Você deve aceitar os termos.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex gap-3 mt-8">
                    {step > 1 && (
                        <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">{t.back_btn}</Button>
                    )}
                    {step < 3 ? (
                        <Button type="button" variant="primary" onClick={handleNext} fullWidth>{t.next_btn}</Button>
                    ) : (
                        <Button type="submit" variant="primary" fullWidth isLoading={isProcessing} disabled={isProcessing}>
                            {isProcessing ? 'Enviando...' : t.finish_btn}
                        </Button>
                    )}
                </div>

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
    </>
  );
};

export default RegisterPage;
