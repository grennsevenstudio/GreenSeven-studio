import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, ChatMessage } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS } from '../../../../../constants';

interface ManageSupportProps {
    adminUser: User;
    allUsers: User[];
    allMessages: ChatMessage[];
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

const ManageSupport: React.FC<ManageSupportProps> = ({ adminUser, allUsers, allMessages, onSendMessage }) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const conversations = useMemo(() => {
        const userChats: { [userId: string]: { lastMessage: ChatMessage, unreadCount: number } } = {};

        allMessages.forEach(msg => {
            const otherUserId = msg.senderId === adminUser.id ? msg.receiverId : msg.senderId;
            if (otherUserId === adminUser.id) return;

            if (!userChats[otherUserId] || new Date(msg.timestamp) > new Date(userChats[otherUserId].lastMessage.timestamp)) {
                userChats[otherUserId] = { ...userChats[otherUserId], lastMessage: msg };
            }

            if (msg.receiverId === adminUser.id && !msg.isRead) {
                 userChats[otherUserId] = { ...userChats[otherUserId], unreadCount: (userChats[otherUserId]?.unreadCount || 0) + 1 };
            }
        });
        
        return Object.entries(userChats)
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a,b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
    }, [allMessages, adminUser.id]);
    
    const selectedConversationMessages = useMemo(() => {
        if (!selectedUserId) return [];
        return allMessages
            .filter(m => (m.senderId === selectedUserId && m.receiverId === adminUser.id) || (m.senderId === adminUser.id && m.receiverId === selectedUserId))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [allMessages, selectedUserId, adminUser.id]);
    
    const selectedUser = useMemo(() => {
        return allUsers.find(u => u.id === selectedUserId);
    }, [selectedUserId, allUsers]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversationMessages]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if ((newMessage.trim() || attachment) && selectedUserId) {
            onSendMessage(adminUser.id, selectedUserId, newMessage.trim(), attachment || undefined);
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
                <h1 className="text-3xl font-bold">Central de Suporte</h1>
                <p className="text-gray-400">Gerencie as conversas com os usuários da plataforma.</p>
            </div>
            
            <div className="flex h-[75vh] gap-6">
                {/* Conversations List */}
                <Card className="w-1/3 flex flex-col">
                    <h2 className="text-xl font-bold p-4 border-b border-gray-800">Conversas</h2>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.map(conv => {
                            const user = allUsers.find(u => u.id === conv.userId);
                            if (!user) return null;
                            return (
                                <div 
                                    key={conv.userId}
                                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-brand-black/50 ${selectedUserId === conv.userId ? 'bg-brand-green/10' : ''}`}
                                    onClick={() => setSelectedUserId(conv.userId)}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold">{user.name}</p>
                                        {conv.unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{conv.unreadCount}</span>}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage.text}</p>
                                </div>
                            )
                        })}
                    </div>
                </Card>

                {/* Chat Window */}
                <Card className="w-2/3 flex flex-col">
                    {selectedUser ? (
                         <>
                            <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                                <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-10 h-10 rounded-full"/>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {selectedConversationMessages.map(msg => (
                                    <ChatBubble 
                                        key={msg.id}
                                        message={msg}
                                        isSender={msg.senderId === adminUser.id}
                                        avatarUrl={msg.senderId === adminUser.id ? adminUser.avatarUrl : selectedUser.avatarUrl}
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
                                            id="admin-chat-message" 
                                            placeholder={`Responder a ${selectedUser.name}...`}
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
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            <p>Selecione uma conversa para começar.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ManageSupport;