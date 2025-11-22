
import React, { useState, useMemo, useEffect } from 'react';
import { View } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Modal from '../layout/Modal';
import { TERMS_OF_USE_CONTENT, PRIVACY_POLICY_CONTENT } from '../legal/TermsAndPrivacy';
import PasswordStrengthIndicator from '../ui/PasswordStrengthIndicator';
import { formatCPF } from '../../lib/utils';
import { ICONS } from '../../constants';

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
    }
}

interface RegisterPageProps {
  setView: (view: View) => void;
  onRegister: (data: ExtendedRegisterData) => void;
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

const FileUploadField: React.FC<{ 
    label: string; 
    id: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    fileName?: string; 
    error?: boolean | string; 
}> = ({ label, id, onChange, fileName, error }) => (
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
                        <span className="text-sm text-gray-400">Clique para enviar foto</span>
                    </>
                )}
             </label>
        </div>
        {typeof error === 'string' && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
);

const RegisterPage: React.FC<RegisterPageProps> = ({ setView, onRegister }) => {
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            setFormData(prev => ({ ...prev, referralCode: ref }));
        }
    }, []);

    const passwordStrength = useMemo(() => calculatePasswordStrength(formData.password), [formData.password]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        let formattedValue = value;
        
        if (id === 'cpf') formattedValue = formatCPF(value);
        // Simple phone mask
        if (id === 'phone') {
             formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
        }
        // Simple CEP mask
        if (id === 'cep') {
             formattedValue = value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
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
        if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';
        
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

            await onRegister(registerData);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Registration error:", error);
            alert("Erro ao processar cadastro. Tente novamente.");
        } finally {
            setIsProcessing(false);
        }
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
                        Sua conta foi criada e enviada para análise. Você será notificado assim que aprovada.
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
        <div className="w-full max-w-lg">
          <div className="flex justify-center items-center gap-2 mb-6">
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
                 <span className="text-xs font-semibold bg-brand-black px-1">Conta</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${step >= 2 ? 'text-brand-green' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 2 ? 'bg-brand-black border-brand-green' : 'bg-gray-800 border-gray-600'}`}>2</div>
                 <span className="text-xs font-semibold bg-brand-black px-1">Pessoal</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${step >= 3 ? 'text-brand-green' : 'text-gray-500'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${step >= 3 ? 'bg-brand-black border-brand-green' : 'bg-gray-800 border-gray-600'}`}>3</div>
                 <span className="text-xs font-semibold bg-brand-black px-1">Documentos</span>
             </div>
          </div>

          <Card className="border-brand-green/20">
            <h2 className="text-2xl font-bold text-center text-white mb-2">
                {step === 1 && 'Dados de Acesso'}
                {step === 2 && 'Dados Pessoais'}
                {step === 3 && 'Verificação KYC'}
            </h2>
            <p className="text-center text-gray-400 mb-6 text-sm">
                {step === 1 && 'Crie suas credenciais de acesso.'}
                {step === 2 && 'Precisamos de alguns dados para validar sua conta.'}
                {step === 3 && 'Envie fotos legíveis dos seus documentos.'}
            </p>

            <form onSubmit={handleSubmit}>
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <Input label="Nome Completo" id="name" value={formData.name} onChange={handleInputChange} error={errors.name} required />
                        <Input label="Email" id="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
                        <div>
                            <Input label="Senha (mín. 6 caracteres)" id="password" type="password" value={formData.password} onChange={handleInputChange} error={errors.password} required />
                            <PasswordStrengthIndicator strength={passwordStrength} />
                        </div>
                        <Input label="Confirmar Senha" id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} error={errors.confirmPassword} required />
                        {formData.referralCode && (
                             <div className="text-xs text-center text-brand-green">
                                 Código de indicação aplicado: <strong>{formData.referralCode}</strong>
                             </div>
                        )}
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                         <div className="grid grid-cols-2 gap-4">
                            <Input label="CPF" id="cpf" value={formData.cpf} onChange={handleInputChange} error={errors.cpf} placeholder="000.000.000-00" maxLength={14} required />
                            <Input label="Celular" id="phone" value={formData.phone} onChange={handleInputChange} error={errors.phone} placeholder="(00) 00000-0000" maxLength={15} required />
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-1">
                                <Input label="CEP" id="cep" value={formData.cep} onChange={handleInputChange} error={errors.cep} placeholder="00000-000" maxLength={9} required />
                             </div>
                             <div className="col-span-2">
                                <Input label="Cidade" id="city" value={formData.city} onChange={handleInputChange} error={errors.city} required />
                             </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                             <div className="col-span-2">
                                <Input label="Rua" id="street" value={formData.street} onChange={handleInputChange} error={errors.street} required />
                             </div>
                             <div className="col-span-1">
                                <Input label="Número" id="number" value={formData.number} onChange={handleInputChange} error={errors.number} required />
                             </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <Input label="Bairro" id="neighborhood" value={formData.neighborhood} onChange={handleInputChange} error={errors.neighborhood} required />
                            <Input label="Estado (UF)" id="state" value={formData.state} onChange={handleInputChange} error={errors.state} maxLength={2} required />
                         </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="space-y-4 animate-fade-in">
                         <FileUploadField 
                            label="Foto do RG ou CNH (Frente)" 
                            id="idFront" 
                            onChange={(e) => handleFileChange(e, 'idFront')} 
                            fileName={files.idFront?.name} 
                            error={errors.idFront} 
                         />
                         <FileUploadField 
                            label="Foto do RG ou CNH (Verso)" 
                            id="idBack" 
                            onChange={(e) => handleFileChange(e, 'idBack')} 
                            fileName={files.idBack?.name} 
                            error={errors.idBack} 
                         />
                         <FileUploadField 
                            label="Selfie segurando o documento" 
                            id="selfie" 
                            onChange={(e) => handleFileChange(e, 'selfie')} 
                            fileName={files.selfie?.name} 
                            error={errors.selfie} 
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
                                        Li e concordo com os <a href="#" onClick={(e) => {e.preventDefault(); openModal('terms')}} className="font-medium text-brand-green hover:underline">Termos de Uso</a> e <a href="#" onClick={(e) => {e.preventDefault(); openModal('privacy')}} className="font-medium text-brand-green hover:underline">Privacidade</a>.
                                    </label>
                                    {errors.terms && <p className="text-red-500 text-xs mt-1">Você deve aceitar os termos.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="flex gap-3 mt-8">
                    {step > 1 && (
                        <Button type="button" variant="secondary" onClick={handleBack} className="w-1/3">Voltar</Button>
                    )}
                    {step < 3 ? (
                        <Button type="button" variant="primary" onClick={handleNext} fullWidth>Próximo</Button>
                    ) : (
                        <Button type="submit" variant="primary" fullWidth isLoading={isProcessing} disabled={isProcessing}>
                            {isProcessing ? 'Enviando...' : 'Finalizar Cadastro'}
                        </Button>
                    )}
                </div>

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
