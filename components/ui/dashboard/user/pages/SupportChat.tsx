
import React, { useState, useEffect, useRef } from 'react';
import type { User, ChatMessage } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS } from '../../../../../constants';

interface SupportChatProps {
    user: User;
    admin: User;
    messages: ChatMessage[];
    onSendMessage: (senderId: string, receiverId: string, text: string, attachment?: File) => void;
}

const FAQS = [
    { question: "Como faço meu primeiro depósito?", answer: "Para depositar, acesse a aba 'Dashboard' e clique no botão 'Depositar'. Informe o valor em Reais (BRL) e pague através do QR Code PIX gerado. O valor será convertido para Dólar (USD) e creditado após aprovação." },
    { question: "Qual o prazo para saques?", answer: "Solicitações de saque realizadas até as 18:00 (dias úteis) são processadas no mesmo dia. Solicitações após este horário ou em finais de semana serão processadas no próximo dia útil." },
    { question: "Existe taxa de saque?", answer: "Sim, existe uma taxa administrativa de 5% sobre o valor do saque para cobrir custos de transação internacional e conversão cambial." },
    { question: "Como mudo meu plano de investimento?", answer: "Vá até a aba 'Planos', escolha o novo plano desejado e clique em 'Mudar de Plano'. Lembre-se que só é permitida uma troca de plano a cada 30 dias." },
];

const FAQSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-2 mb-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <span className="p-1 bg-brand-green/20 rounded text-brand-green">{ICONS.support}</span>
                Perguntas Frequentes
            </h3>
            {FAQS.map((faq, index) => (
                <div key={index} className="border border-gray-800 rounded-lg overflow-hidden bg-brand-black/40">
                    <button 
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                        <span className="font-medium text-gray-200">{faq.question}</span>
                        <span className={`transform transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''} text-brand-green`}>
                            {ICONS.arrowDown}
                        </span>
                    </button>
                    {openIndex === index && (
                        <div className="p-4 pt-0 text-sm text-gray-400 border-t border-gray-800/50 mt-2">
                            {faq.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const AttachmentDisplay: React.FC<{ attachment: NonNullable<ChatMessage['attachment']> }> = ({ attachment }) => {
    const fileType = attachment.fileType || '';
    const fileName = attachment.fileName || 'Unknown File';
    const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    
    // Safe extension extraction
    let extension = 'FILE';
    if (fileType && fileType.includes('/')) {
        extension = fileType.split('/')[1].toUpperCase();
    } else if (fileName && fileName.includes('.')) {
        extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    }

    if (isImage) {
        return (
            <a 
                href={attachment.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-2 block rounded-xl overflow-hidden border border-gray-800 bg-black transition-all duration-300 hover:border-brand-green/50 hover:shadow-lg hover:shadow-brand-green/10 group max-w-xs"
            >
                <div className="relative aspect-video bg-gray-900 w-full overflow-hidden">
                    <img 
                        src={attachment.fileUrl} 
                        alt={fileName} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <div className="p-3 flex items-center gap-3 bg-gray-900/50">
                     <div className="p-1.5 rounded bg-brand-green/20 text-brand-green">
                        {ICONS.file}
                     </div>
                     <div className="overflow-hidden">
                         <p className="text-xs text-gray-200 font-medium truncate group-hover:text-brand-green transition-colors">{fileName}</p>
                         <p className="text-[10px] text-gray-500 uppercase">{extension}</p>
                     </div>
                </div>
            </a>
        );
    }

    return (
         <a 
            href={attachment.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mt-2 flex items-center gap-3 bg-gray-800/50 border border-gray-700 p-3 rounded-xl hover:bg-gray-700 hover:border-brand-green/30 transition-all max-w-xs group"
        >
            <div className="p-2 bg-gray-900 rounded-lg text-brand-green group-hover:bg-brand-green/20 transition-colors">
                {ICONS.file}
            </div>
            <div className="truncate flex-1">
                <p className="font-semibold text-sm text-gray-200 truncate group-hover:text-brand-green transition-colors">{fileName}</p>
                <p className="text-xs text-gray-500 uppercase">{extension}</p>
            </div>
        </a>
    );
};


const ChatBubble: React.FC<{ message: ChatMessage; isSender: boolean; avatarUrl: string }> = ({ message, isSender, avatarUrl }) => {
    const bubbleColor = isSender ? 'bg-brand-green text-brand-black' : 'bg-brand-black';

    return (
        <div className={`flex items-start gap-3 w-full max-w-lg ${isSender ? 'flex-row-reverse ml-auto' : 'flex-row mr-auto'}`}>
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-700" />
            <div className="flex flex-col">
                 <div className={`px-4 py-2 rounded-2xl shadow-sm ${bubbleColor} ${isSender ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                    {message.attachment && <AttachmentDisplay attachment={message.attachment} />}
                </div>
                <span className={`text-[10px] text-gray-500 mt-1 px-2 ${isSender ? 'text-right' : 'text-left'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

const SupportChat: React.FC<SupportChatProps> = ({ user, admin, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState<'chat' | 'faq'>('chat');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isResolved = user.supportStatus === 'resolved';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (activeTab === 'chat') {
            scrollToBottom();
        }
    }, [messages, activeTab]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() || attachment) {
            onSendMessage(user.id, admin.id, newMessage.trim(), attachment || undefined);
            setNewMessage('');
            setAttachment(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <div className="flex justify-between items-end flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold">Suporte ao Cliente</h1>
                    <p className="text-gray-400">Precisa de ajuda? Fale com nossa equipe ou veja o FAQ.</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${isResolved ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-500/10 border-green-500/30 text-brand-green'} flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${isResolved ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-sm font-bold uppercase">{isResolved ? 'Chamado Encerrado' : 'Chamado Aberto'}</span>
                </div>
            </div>
            
            <div className="flex gap-2 mb-2">
                <button 
                    onClick={() => setActiveTab('chat')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'chat' ? 'bg-brand-green text-brand-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    Chat ao Vivo
                </button>
                <button 
                    onClick={() => setActiveTab('faq')} 
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'faq' ? 'bg-brand-green text-brand-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    Dúvidas Frequentes (FAQ)
                </button>
            </div>

            <Card className="flex flex-col flex-1 overflow-hidden p-0 relative border-gray-800">
                {activeTab === 'chat' ? (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-brand-black/10">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-60">
                                    <div className="p-4 bg-gray-800 rounded-full mb-4">
                                        {React.cloneElement(ICONS.support as React.ReactElement<any>, { className: "w-10 h-10" })}
                                    </div>
                                    <p>Envie uma mensagem para iniciar o atendimento.</p>
                                </div>
                            )}
                            {messages.map(msg => (
                                <ChatBubble 
                                    key={msg.id}
                                    message={msg}
                                    isSender={msg.senderId === user.id}
                                    avatarUrl={msg.senderId === user.id ? user.avatarUrl : admin.avatarUrl}
                                />
                            ))}
                            
                            {isResolved && (
                                <div className="flex justify-center py-4">
                                    <span className="bg-gray-800 text-gray-400 text-xs px-4 py-2 rounded-full border border-gray-700 shadow-sm">
                                        Este atendimento foi marcado como resolvido. Envie uma nova mensagem para reabrir.
                                    </span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-800 bg-brand-black z-10">
                            <form onSubmit={handleSend}>
                                <div className="flex gap-3 items-end">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-400 hover:text-brand-green bg-gray-800 rounded-lg transition-colors"
                                        aria-label="Anexar arquivo"
                                    >
                                        {ICONS.attachment}
                                    </button>
                                    <div className="flex-1">
                                        <Input 
                                            label="" 
                                            id="chat-message" 
                                            placeholder="Digite sua mensagem..." 
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="h-[46px] px-6">Enviar</Button>
                                </div>
                                {attachment && (
                                    <div className="mt-2 flex items-center gap-2 text-sm bg-gray-800 p-2 rounded-lg w-fit">
                                        {ICONS.file}
                                        <span className="text-gray-300 truncate max-w-[200px]">{attachment.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachment(null)}
                                            className="ml-2 text-gray-500 hover:text-white"
                                            aria-label="Remover anexo"
                                        >
                                            {ICONS.close}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="p-6 overflow-y-auto h-full">
                        <FAQSection />
                        <div className="mt-8 p-6 bg-brand-black/30 rounded-xl border border-gray-800 text-center">
                            <h3 className="text-white font-bold mb-2">Não encontrou o que procurava?</h3>
                            <p className="text-gray-400 text-sm mb-4">Nossa equipe de especialistas está pronta para te ajudar em tempo real.</p>
                            <Button onClick={() => setActiveTab('chat')} variant="secondary">Falar com Atendente</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SupportChat;
