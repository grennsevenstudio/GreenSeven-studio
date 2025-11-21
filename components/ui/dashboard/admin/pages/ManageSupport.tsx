
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, ChatMessage, SupportStatus } from '../../../../../types';
import Card from '../../../../ui/Card';
import Input from '../../../../ui/Input';
import Button from '../../../../ui/Button';
import { ICONS } from '../../../../../constants';

interface ManageSupportProps {
    adminUser: User;
    allUsers: User[];
    allMessages: ChatMessage[];
    onSendMessage: (senderId: string, receiverId: string, text: string, attachment?: File) => void;
    onUpdateUser: (user: User) => void;
}

const QUICK_REPLIES = [
    { label: "Saudação", text: "Olá! Bem-vindo ao suporte da GreennSeven. Como posso ajudar você hoje?" },
    { label: "Prazo de Saque", text: "Nossos saques são processados de segunda a sexta, das 09:00 às 18:00. O prazo médio para compensação é de 24 horas úteis." },
    { label: "Depósito PIX", text: "Para depositar via PIX, vá até o Dashboard e clique em 'Depositar'. O valor é convertido automaticamente para Dólar." },
    { label: "Resetar Senha", text: "Você pode redefinir sua senha clicando em 'Esqueceu a senha?' na tela de login ou nas configurações do seu perfil." },
    { label: "Encerrar", text: "Obrigado pelo contato! Se precisar de mais alguma coisa, estamos à disposição. Tenha um ótimo dia!" },
];

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

const ManageSupport: React.FC<ManageSupportProps> = ({ adminUser, allUsers, allMessages, onSendMessage, onUpdateUser }) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');
    
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
        
        let chats = Object.entries(userChats)
            .map(([userId, data]) => {
                const user = allUsers.find(u => u.id === userId);
                return { userId, user, ...data };
            })
            .filter(item => item.user); // Ensure user exists

        // Filter by Search Term
        if (searchTerm) {
            chats = chats.filter(c => c.user?.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Filter by Status
        if (filterStatus !== 'all') {
            chats = chats.filter(c => {
                const status = c.user?.supportStatus || 'open'; // Default to open if undefined
                return status === filterStatus;
            });
        }

        // Sort: Unread first, then by last message
        return chats.sort((a,b) => {
            if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
            if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
            return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
        });
    }, [allMessages, adminUser.id, allUsers, searchTerm, filterStatus]);
    
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
            // If sending a message, ensure status is open
            if (selectedUser && selectedUser.supportStatus === 'resolved') {
                onUpdateUser({ ...selectedUser, supportStatus: 'open' });
            }
        }
    };

    const handleQuickReply = (text: string) => {
        setNewMessage(text);
    };

    const toggleTicketStatus = () => {
        if (!selectedUser) return;
        const newStatus: SupportStatus = selectedUser.supportStatus === 'resolved' ? 'open' : 'resolved';
        onUpdateUser({ ...selectedUser, supportStatus: newStatus });
    };

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <div className="flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold">Central de Suporte</h1>
                    <p className="text-gray-400">Gerencie tickets e atendimentos.</p>
                </div>
            </div>
            
            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar List */}
                <Card className="w-1/3 flex flex-col p-0 overflow-hidden border-gray-800">
                    <div className="p-4 border-b border-gray-800 space-y-3 bg-brand-black/20">
                        <Input 
                            label="" 
                            id="search-users" 
                            placeholder="Buscar usuário..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="text-sm"
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setFilterStatus('all')}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${filterStatus === 'all' ? 'bg-brand-green text-brand-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                Todos
                            </button>
                            <button 
                                onClick={() => setFilterStatus('open')}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${filterStatus === 'open' ? 'bg-brand-green text-brand-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                Abertos
                            </button>
                            <button 
                                onClick={() => setFilterStatus('resolved')}
                                className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${filterStatus === 'resolved' ? 'bg-brand-green text-brand-black font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                Resolvidos
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                             <p className="text-center text-gray-500 text-sm mt-10">Nenhuma conversa encontrada.</p>
                        ) : (
                            conversations.map(conv => {
                                const isSelected = selectedUserId === conv.userId;
                                const isResolved = conv.user?.supportStatus === 'resolved';
                                return (
                                    <div 
                                        key={conv.userId}
                                        className={`p-4 border-b border-gray-800 cursor-pointer transition-all hover:bg-brand-gray/80 ${isSelected ? 'bg-brand-gray border-l-4 border-l-brand-green' : 'border-l-4 border-l-transparent'}`}
                                        onClick={() => setSelectedUserId(conv.userId)}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>{conv.user?.name}</h4>
                                                {/* Status Indicator Dot */}
                                                <div className={`w-2 h-2 rounded-full ${isResolved ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`} title={isResolved ? "Resolvido" : "Aberto"}></div>
                                            </div>
                                            {conv.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{conv.unreadCount}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage.text}</p>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </Card>

                {/* Chat Window */}
                <Card className="w-2/3 flex flex-col p-0 overflow-hidden border-gray-800 relative">
                    {selectedUser ? (
                         <>
                            <div className="p-4 border-b border-gray-800 bg-brand-black/20 flex justify-between items-center shadow-md z-10">
                                <div className="flex items-center gap-3">
                                    <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="w-10 h-10 rounded-full border border-gray-600"/>
                                    <div>
                                        <h2 className="text-lg font-bold leading-tight">{selectedUser.name}</h2>
                                        <p className="text-xs text-gray-400">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedUser.supportStatus === 'resolved' ? 'bg-gray-700 text-gray-300' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                        {selectedUser.supportStatus === 'resolved' ? 'Resolvido' : 'Em Aberto'}
                                    </span>
                                    <button 
                                        onClick={toggleTicketStatus}
                                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                                        title={selectedUser.supportStatus === 'resolved' ? "Reabrir Ticket" : "Marcar como Resolvido"}
                                    >
                                        {selectedUser.supportStatus === 'resolved' ? ICONS.archive : ICONS.check}
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-black/10">
                                {selectedConversationMessages.length > 0 ? (
                                    selectedConversationMessages.map(msg => (
                                        <ChatBubble 
                                            key={msg.id}
                                            message={msg}
                                            isSender={msg.senderId === adminUser.id}
                                            avatarUrl={msg.senderId === adminUser.id ? adminUser.avatarUrl : selectedUser.avatarUrl}
                                        />
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                        {ICONS.support}
                                        <p className="mt-2 text-sm">Início da conversa</p>
                                    </div>
                                )}
                                {selectedUser.supportStatus === 'resolved' && (
                                    <div className="text-center py-4">
                                        <span className="bg-gray-800 text-gray-400 text-xs px-4 py-1 rounded-full border border-gray-700">
                                            Atendimento marcado como resolvido
                                        </span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Replies */}
                            <div className="px-4 py-2 bg-brand-black border-t border-gray-800 flex gap-2 overflow-x-auto">
                                <div className="flex items-center text-gray-500 text-xs mr-2 flex-shrink-0">
                                    {ICONS.flash} Rápidas:
                                </div>
                                {QUICK_REPLIES.map((qr, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickReply(qr.text)}
                                        className="flex-shrink-0 px-3 py-1 bg-gray-800 hover:bg-brand-gray border border-gray-700 rounded-full text-xs text-gray-300 transition-colors whitespace-nowrap"
                                    >
                                        {qr.label}
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 border-t border-gray-800 bg-brand-black">
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
                                                id="admin-chat-message" 
                                                placeholder={selectedUser.supportStatus === 'resolved' ? "Enviar mensagem reabrirá o ticket..." : "Digite sua mensagem..."}
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
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="p-4 bg-gray-800 rounded-full mb-4 opacity-50">
                                {React.cloneElement(ICONS.support as React.ReactElement<any>, { className: "w-12 h-12" })}
                            </div>
                            <p className="text-lg font-medium">Nenhuma conversa selecionada</p>
                            <p className="text-sm mt-2">Escolha um usuário à esquerda para iniciar o atendimento.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default ManageSupport;
