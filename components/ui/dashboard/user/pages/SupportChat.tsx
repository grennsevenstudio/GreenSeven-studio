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
            <img src={avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
            <div className="flex flex-col">
                 <div className={`px-4 py-2 rounded-2xl ${bubbleColor} ${isSender ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    {message.attachment && <AttachmentDisplay attachment={message.attachment} />}
                </div>
                <span className={`text-xs text-gray-500 mt-1 px-2 ${isSender ? 'text-right' : 'text-left'}`}>
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
        <div className="space-y-8">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <div>
                <h1 className="text-3xl font-bold">Suporte ao Cliente</h1>
                <p className="text-gray-400">Precisa de ajuda? Fale conosco diretamente por aqui.</p>
            </div>
            
            <Card className="flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map(msg => (
                        <ChatBubble 
                            key={msg.id}
                            message={msg}
                            isSender={msg.senderId === user.id}
                            avatarUrl={msg.senderId === user.id ? user.avatarUrl : admin.avatarUrl}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-800">
                    <form onSubmit={handleSend}>
                        <div className="flex gap-4 items-center">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-400 hover:text-brand-green transition-colors"
                                aria-label="Anexar arquivo"
                            >
                                {ICONS.attachment}
                            </button>
                            <Input 
                                label="" 
                                id="chat-message" 
                                placeholder="Digite sua mensagem..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit">Enviar</Button>
                        </div>
                         {attachment && (
                            <div className="mt-2 flex items-center gap-2 text-sm bg-brand-black p-2 rounded-lg">
                                {ICONS.file}
                                <span className="text-gray-300 truncate">{attachment.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setAttachment(null)}
                                    className="ml-auto text-gray-500 hover:text-white"
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