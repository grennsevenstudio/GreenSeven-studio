
import React from 'react';
import Modal from '../../../layout/Modal';
import Button from '../../../ui/Button';
import { ICONS } from '../../../../constants';

interface WelcomePopupProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    type: 'new' | 'returning' | null;
    onCallToAction: () => void;
}

const RETURNING_MESSAGES = [
    { title: "Continue Construindo seu Futuro!", body: "Cada dia é uma nova oportunidade de crescimento. Continue investindo e veja seus objetivos se aproximarem." },
    { title: "A Consistência é a Chave!", body: "O sucesso financeiro não é um evento, é um hábito. Estamos felizes em ver você de volta, trilhando o caminho da prosperidade." },
    { title: "Seu Patrimônio, Nosso Cuidado.", body: "Enquanto você foca nos seus sonhos, nós cuidamos para que seu capital continue crescendo forte em dólar." },
    { title: "Bem-vindo de volta, Visionário!", body: "Você está no lugar certo para transformar seu capital em liberdade financeira. Qual será seu próximo grande passo?" },
    { title: "O Poder do Dólar ao seu Alcance.", body: "Continue protegendo seu dinheiro e potencializando seus ganhos na moeda mais forte do mundo." },
];

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isOpen, onClose, userName, type, onCallToAction }) => {
    if (!isOpen || !type) return null;

    const isNewUser = type === 'new';
    const randomReturningMessage = RETURNING_MESSAGES[Math.floor(Math.random() * RETURNING_MESSAGES.length)];

    const title = isNewUser ? `Bem-vindo à GreennSeven, ${userName}!` : `${randomReturningMessage.title}`;
    const body = isNewUser 
        ? "Você deu o primeiro passo para dolarizar seu futuro. Faça seu primeiro depósito agora e comece a ver seu capital render em uma moeda forte e segura!" 
        : randomReturningMessage.body;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="text-center p-4">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-brand-green to-brand-blue rounded-full flex items-center justify-center text-brand-black shadow-lg shadow-brand-green/20 animate-pulse-slow">
                        {isNewUser ? 
                            React.cloneElement(ICONS.logo as React.ReactElement<any>, { className: "w-10 h-10" }) :
                            React.cloneElement(ICONS.trendingUp as React.ReactElement<any>, { className: "w-10 h-10" })
                        }
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>
                <p className="text-gray-400 leading-relaxed mb-8">{body}</p>

                <div className="space-y-3">
                    <Button onClick={onCallToAction} fullWidth>
                        {isNewUser ? "Fazer meu Primeiro Depósito" : "Ir para o Dashboard"}
                    </Button>
                    <Button onClick={onClose} variant="ghost" fullWidth>
                        Fechar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default WelcomePopup;
