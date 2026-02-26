import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search,
    Send,
    Plus,
    User,
    MessageSquare,
    Users,
    X,
    CheckCheck,
    Paperclip,
    ArrowLeft,
    Settings
} from 'lucide-react';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    text: string;
    attachments: any[];
    created_at: string;
}

interface Conversation {
    id: string;
    participants: string[];
    type: 'direct' | 'department';
    department: string | null;
    title: string;
    last_message: {
        text: string;
        sender_id: string;
        timestamp: string;
        attachments?: any[];
    } | null;
    updated_at: string;
    unread_counts: Record<string, number>;
}

const Communications: React.FC = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [officers, setOfficers] = useState<any[]>([]);
    const [selectingDirect, setSelectingDirect] = useState(false);

    useEffect(() => {
        fetchConversations();
        fetchOfficers();
        
        // Refresh conversations every 30 seconds
        const interval = setInterval(fetchConversations, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            markAsRead(activeConversation.id);
            
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => fetchMessages(activeConversation.id), 5000);
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/messages/conversations');
            if (res.data.success) {
                setConversations(res.data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            const res = await api.get(`/messages/conversations/${id}/messages`);
            if (res.data.success) {
                setMessages(res.data.messages);
                // Scroll to bottom
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/messages/conversations/${id}/read`);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const fetchOfficers = async () => {
        try {
            const res = await api.get('/messages/officers');
            if (res.data.success) setOfficers(res.data.officers);
        } catch (error) {
            console.error('Failed to fetch officers:', error);
        }
    };

    const handleStartChat = async (type: 'direct' | 'department', dept?: string, participantId?: string, name?: string) => {
        try {
            const res = await api.post('/messages/conversations', {
                type,
                department: dept,
                title: type === 'direct' ? `Chat with ${name}` : undefined,
                participants: participantId ? [participantId] : []
            });
            if (res.data.success) {
                const newConv = res.data.conversation;
                setConversations(prev => {
                    const exists = prev.find(c => c.id === newConv.id);
                    if (exists) return prev;
                    return [newConv, ...prev];
                });
                setActiveConversation(newConv);
                setShowNewChat(false);
                setSelectingDirect(false);
                setMobileView('chat');
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeConversation || (!newMessage.trim() && attachments.length === 0)) return;

        try {
            const res = await api.post('/messages/messages', {
                conversation_id: activeConversation.id,
                text: newMessage,
                attachments: attachments
            });

            if (res.data.success) {
                setMessages([...messages, res.data.message]);
                setNewMessage('');
                setAttachments([]);
                
                // Update conversation list item last message
                setConversations(conversations.map(c => 
                    c.id === activeConversation.id 
                    ? { ...c, last_message: { text: newMessage, sender_id: user?.id || '', timestamp: new Date().toISOString() } }
                    : c
                ));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/messages/messages/upload', formData);
            if (res.data.success) {
                setAttachments([...attachments, res.data.file]);
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredConversations = conversations.filter(c =>
        (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.last_message?.text?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
            <div className="flex flex-1 overflow-hidden h-full">

                {/* Conversation List */}
                <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-surface/30 backdrop-blur-xl ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black tracking-tight flex items-center">
                                <MessageSquare className="w-6 h-6 mr-3 text-primary" />
                                Chats
                            </h2>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-black transition-all"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center p-3 space-x-3">
                                    <div className="w-12 h-12 bg-white/5 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                        <div className="h-3 bg-white/5 rounded w-3/4"></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-10 text-center text-gray-500 text-sm font-bold">No conversations found</div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConversation(conv);
                                        setMobileView('chat');
                                    }}
                                    className={`w-full flex items-center p-4 rounded-2xl transition-all group relative ${activeConversation?.id === conv.id
                                        ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                        : 'hover:bg-white/5 text-gray-400'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative ${activeConversation?.id === conv.id ? 'bg-black/10' : 'bg-primary/10 text-primary'
                                        }`}>
                                        {conv.type === 'direct' ? <User className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-surface rounded-full"></div>
                                    </div>
                                    <div className="ml-4 flex-1 text-left overflow-hidden">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className="font-bold text-sm truncate">{conv.title}</h4>
                                            <span className={`text-[10px] font-black uppercase ${activeConversation?.id === conv.id ? 'text-black/60' : 'text-gray-500'}`}>
                                                {conv.last_message ? formatTime(conv.last_message.timestamp) : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate flex-1 mr-2 ${activeConversation?.id === conv.id ? 'text-black/70' : 'text-gray-500'}`}>
                                                {conv.last_message 
                                                    ? (conv.last_message.text || (conv.last_message.attachments?.length ? '[Attachment]' : 'Start a conversation'))
                                                    : 'Start a conversation'}
                                            </p>
                                            {user && conv.unread_counts?.[user.id] > 0 && (
                                                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                    activeConversation?.id === conv.id ? 'bg-black text-primary' : 'bg-primary text-black'
                                                }`}>
                                                    {conv.unread_counts[user.id]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 flex flex-col bg-surface/10 relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-surface/30 backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setMobileView('list')}
                                        className="md:hidden p-2 mr-2 bg-white/5 rounded-xl text-gray-400"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                                        {activeConversation.type === 'direct' ? <User className="w-6 h-6 text-primary" /> : <Users className="w-6 h-6 text-primary" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{activeConversation.title}</h3>
                                        <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-green-500">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                            Online
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-primary transition-all ${uploading ? 'animate-pulse' : ''}`}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] group`}>
                                                {!isMe && (
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-4">
                                                        {msg.sender_name}
                                                    </p>
                                                )}
                                                <div className={`p-4 rounded-3xl relative ${isMe
                                                    ? 'bg-primary text-black font-medium rounded-tr-sm shadow-xl shadow-primary/10'
                                                    : 'bg-white/5 text-gray-200 rounded-tl-sm'
                                                    }`}>
                                                    {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                                                    
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className={`mt-3 space-y-2 ${isMe ? 'text-black' : 'text-gray-200'}`}>
                                                            {msg.attachments.map((att, idx) => {
                                                                const isImage = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name);
                                                                return (
                                                                    <div key={idx} className="group relative">
                                                                        {isImage ? (
                                                                            <div className="mb-2 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                                                                <img 
                                                                                    src={att.url} 
                                                                                    alt={att.name} 
                                                                                    className="max-w-full h-auto max-h-[300px] object-contain cursor-pointer transition-transform hover:scale-[1.02]"
                                                                                    onClick={() => window.open(att.url, '_blank')}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <a 
                                                                                href={att.url} 
                                                                                target="_blank" 
                                                                                rel="noopener noreferrer"
                                                                                className={`flex items-center p-3 rounded-2xl border transition-all ${
                                                                                    isMe ? 'bg-black/10 border-black/10 hover:bg-black/20' : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                                                }`}
                                                                            >
                                                                                <div className={`p-2 rounded-xl mr-3 ${isMe ? 'bg-black/20' : 'bg-primary/10'}`}>
                                                                                    <Paperclip className={`w-4 h-4 ${isMe ? 'text-black' : 'text-primary'}`} />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-bold truncate">{att.name}</p>
                                                                                    <p className={`text-[10px] font-black uppercase opacity-60`}>
                                                                                        {att.type?.split('/')[1] || 'FILE'}
                                                                                    </p>
                                                                                </div>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    <div className={`flex items-center mt-2 space-x-2 ${isMe ? 'justify-end text-black/50' : 'justify-start text-gray-500'}`}>
                                                        <span className="text-[10px] font-black uppercase">
                                                            {formatTime(msg.created_at)}
                                                        </span>
                                                        {isMe && <CheckCheck className="w-3 h-3" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Footer */}
                            <div className="p-6 bg-surface/30 backdrop-blur-md border-t border-white/5">
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {attachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center bg-primary/20 border border-primary/30 rounded-full px-4 py-2 text-xs font-bold text-primary animate-in slide-in-from-bottom-2">
                                                <Paperclip className="w-3 h-3 mr-2" />
                                                <span className="max-w-[100px] truncate">{att.name}</span>
                                                <button 
                                                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                    className="ml-2 hover:text-red-500 transition-all font-black"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="relative">
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 pr-20 text-sm focus:outline-none focus:border-primary transition-all font-bold placeholder:text-gray-600 shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-black rounded-full flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 group hover:rotate-0 transition-transform duration-500">
                                <MessageSquare className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Internal Secure Messaging</h3>
                            <p className="text-gray-500 max-w-sm leading-relaxed mb-8">
                                Connect with departments and staff members instantly. Shared documents and approvals are tracked here.
                            </p>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="px-8 py-4 bg-primary text-black font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                            >
                                Start New Conversation
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="glass p-10 rounded-[3rem] border border-white/10 max-w-lg w-full relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                        <div className="flex justify-between items-center mb-10">
                            <button 
                                onClick={() => selectingDirect ? setSelectingDirect(false) : setShowNewChat(false)} 
                                className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-primary transition-all"
                            >
                                {selectingDirect ? <ArrowLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
                            </button>
                            <h3 className="text-2xl font-black tracking-tight">
                                {selectingDirect ? 'Select Officer' : 'New Conversation'}
                            </h3>
                            <div className="w-12 h-12"></div>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {selectingDirect ? (
                                officers.filter(o => o.id !== user?.id).map((off) => (
                                    <button
                                        key={off.id}
                                        onClick={() => handleStartChat('direct', undefined, off.id, off.name)}
                                        className="w-full flex items-center p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all group overflow-hidden relative"
                                    >
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform overflow-hidden">
                                            {off.profile_photo ? (
                                                <img src={off.profile_photo} alt={off.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold">{off.name}</p>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{(off.role || 'staff').replace(/_/g, ' ')}</p>
                                        </div>
                                        <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                                    </button>
                                ))
                            ) : (
                                <>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Select Department</p>
                                    {[
                                        { name: 'Operations', icon: Activity, color: 'blue-500' },
                                        { name: 'Finance', icon: Banknote, color: 'green-500' },
                                        { name: 'Driver Relations', icon: Users, color: 'primary' },
                                        { name: 'IT Support', icon: Settings, color: 'purple-500' },
                                        { name: 'Direct Message', icon: User, color: 'orange-500' }
                                    ].map((dept) => (
                                        <button
                                            key={dept.name}
                                            onClick={() => dept.name === 'Direct Message' ? setSelectingDirect(true) : handleStartChat('department', dept.name)}
                                            className="w-full flex items-center p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-primary/30 hover:-translate-y-1 transition-all group overflow-hidden relative"
                                        >
                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
                                                <dept.icon className="w-7 h-7 text-primary" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-lg">{dept.name}</p>
                                                <p className="text-xs text-gray-500 font-medium tracking-tight">
                                                    {dept.name === 'Direct Message' ? 'Chat with a specific officer' : `Secure channel for ${dept.name} staff`}
                                                </p>
                                            </div>
                                            <ArrowLeft className="w-5 h-5 ml-auto rotate-180 opacity-0 group-hover:opacity-100 transition-all text-primary" />
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Banknote = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
);

const Activity = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);

export default Communications;
