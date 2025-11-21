
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
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-4">
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
