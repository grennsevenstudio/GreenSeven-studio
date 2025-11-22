
import React, { useState } from 'react';
import { View } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { ICONS } from '../../constants';

interface ForgotPasswordPageProps {
  setView: (view: View) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(true);
      return;
    }
    alert('Link de recuperação enviado (simulação)!');
    setView(View.Login);
  };

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
          <h2 className="text-2xl font-bold text-center text-white mb-2">Recuperar Senha</h2>
          <p className="text-center text-gray-400 mb-6">Insira seu email para receber o link de recuperação.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label="Email" 
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
            <Button type="submit" fullWidth variant="primary">Enviar Link</Button>
          </form>
          
          <p className="mt-6 text-center text-sm text-gray-400">
            Lembrou a senha?{' '}
            <a href="#" onClick={(e) => {e.preventDefault(); setView(View.Login)}} className="font-medium text-brand-green hover:text-brand-green-light">
              Faça login
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
