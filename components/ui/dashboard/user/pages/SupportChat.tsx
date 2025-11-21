
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

const AttachmentDisplay: React.FC<{ attachment: NonNullable<ChatMessage['attachment']> }> = ({ attachment }) => (
    <a 
        href={attachment.fileUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded-lg hover:bg-black/40 transition-colors w-full max-w-xs"
    >
        {ICONS.file}
        <div className="truncate">
            <p className="font-semibold text-sm truncate">{attachment.fileName}</p>
            <p className="text-xs opacity-70">{attachment.fileType}</p>
        </div>
    </a>
);


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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isResolved = user.supportStatus === 'resolved';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    <p className="text-gray-400">Precisa de ajuda? Fale com nossa equipe.</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border ${isResolved ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-500/10 border-green-500/30 text-brand-green'} flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${isResolved ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></div>
                    <span className="text-sm font-bold uppercase">{isResolved ? 'Chamado Encerrado' : 'Chamado Aberto'}</span>
                </div>
            </div>
            
            <Card className="flex flex-col flex-1 overflow-hidden p-0 relative border-gray-800">
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
            </Card>
        </div>
    );
};

export default SupportChat;
