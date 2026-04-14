'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/navbar';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle, MoreVertical, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const initProjectId = searchParams.get('projectId');
  const initOtherId = searchParams.get('sellerId');
  const initOtherUsername = searchParams.get('sellerUsername');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (!storedUser || !token) { router.push('/login'); return; }
    setUser(JSON.parse(storedUser));
    fetchConversations(token);
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (token: string) => {
    try {
      const response = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data.conversations);
        if (initProjectId && initOtherId && initOtherUsername) {
          const participants = [JSON.parse(localStorage.getItem('user')!).userId, initOtherId].sort();
          const expectedConvId = `${initProjectId}_${participants[0]}_${participants[1]}`;
          const existingConv = data.data.conversations.find((c: any) => c.conversationId === expectedConvId);
          if (existingConv) { 
            handleSelectConversation(existingConv, token); 
          } else {
            setActiveConversation({ 
              conversationId: expectedConvId, 
              projectId: initProjectId, 
              otherUserId: initOtherId, 
              otherUsername: initOtherUsername, 
              myRole: 'Buyer', 
              otherRole: 'Seller', 
              projectTitle: 'New Project Inquiry' 
            });
            setMessages([]);
            setIsMobileListOpen(false);
          }
        }
      }
    } catch (err) { console.error('Failed to load conversations', err); } finally { setLoading(false); }
  };

  const handleSelectConversation = async (conv: any, tokenOverride?: string) => {
    setActiveConversation(conv);
    setIsMobileListOpen(false);
    const token = tokenOverride || localStorage.getItem('auth_token');
    try {
      const response = await fetch(`/api/messages?conversationId=${conv.conversationId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (data.success) setMessages(data.data.messages);
    } catch (err) { console.error('Failed to load messages', err); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;
    const token = localStorage.getItem('auth_token');
    const content = newMessage.trim();
    setNewMessage('');
    const optimisticMsg = { id: Date.now().toString(), senderId: user.userId, senderUsername: user.username, content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: activeConversation.otherUserId, receiverUsername: activeConversation.otherUsername, projectId: activeConversation.projectId, content })
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to send');
      handleSelectConversation(activeConversation, token!);
      fetchConversations(token!);
    } catch (err) { console.error('Error sending message', err); toast.error('Failed to send message'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user || loading) return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center text-white">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-white/40 font-medium">Loading your conversations...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white flex flex-col h-screen overflow-hidden">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="flex-1 w-full max-w-7xl mx-auto md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* SIDEBAR - CONVERSATION LIST */}
        <div className={`w-full md:w-80 lg:w-96 bg-white/[0.03] md:border border-white/10 md:rounded-[32px] flex flex-col shrink-0 overflow-hidden ${!isMobileListOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 md:p-8 border-b border-white/10">
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Messages</h1>
            <p className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">Inboxes</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2 custom-scrollbar">
            {conversations.length === 0 && !activeConversation && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} className="text-white/20" />
                </div>
                <h3 className="text-sm font-bold mb-1">No chats yet</h3>
                <p className="text-xs text-white/30 leading-relaxed">Visit the marketplace to contact project sellers.</p>
              </div>
            )}

            {activeConversation && !conversations.find(c => c.conversationId === activeConversation.conversationId) && (
              <div className="px-4 py-4 mx-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">New Message To</p>
                <p className="font-bold text-sm">@{activeConversation.otherUsername}</p>
              </div>
            )}

            {conversations.map((conv) => {
              const isActive = activeConversation?.conversationId === conv.conversationId;
              return (
                <button 
                  key={conv.conversationId} 
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${
                    isActive ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-transparent border-transparent hover:bg-white/5 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-white/90'}`}>@{conv.otherUsername}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : conv.otherRole === 'Seller' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {conv.otherRole}
                    </span>
                  </div>
                  <p className={`text-[10px] font-bold truncate mb-1 ${isActive ? 'text-white/70' : 'text-white/30'}`}>📁 {conv.projectTitle}</p>
                  <p className={`text-xs truncate ${isActive ? 'text-white/90' : 'text-white/50'}`}>{conv.lastMessage || '...'}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className={`flex-1 bg-white/[0.03] md:border border-white/10 md:rounded-[32px] flex flex-col overflow-hidden ${isMobileListOpen ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsMobileListOpen(true)}
                    className="md:hidden p-2 -ml-2 text-white/40 hover:text-white"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-lg">
                    {activeConversation.otherUsername?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base">@{activeConversation.otherUsername}</span>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/10 text-white/60">
                        {activeConversation.otherRole}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs text-white/30 font-bold tracking-tight truncate max-w-[120px] sm:max-w-[200px]">📁 {activeConversation.projectTitle}</p>
                  </div>
                </div>
                
                <Link href={`/project/${activeConversation.projectId}`}>
                  <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-black text-xs hover:bg-indigo-500/20 transition-all">
                    Project Details <ExternalLink size={12} />
                  </button>
                </Link>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                    <MessageCircle size={48} className="mb-4" />
                    <h3 className="text-base font-bold mb-1">Begin standard inquiry</h3>
                    <p className="text-sm">Ask about technical availability or pricing.</p>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isMe = msg.senderId === user.userId;
                  return (
                    <div key={msg.id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl ${
                        isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10' 
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-white/20 mt-2 px-1">
                        {msg.senderUsername || user.username} · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 md:p-6 border-t border-white/10 bg-white/[0.02]">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-while placeholder-white/20 outline-none focus:border-indigo-500/50 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 relative">
                 <MessageCircle size={40} className="text-white/10" />
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full"></div>
              </div>
              <h2 className="text-xl font-black mb-2 tracking-tight">Access Secure Messaging</h2>
              <p className="text-sm text-white/30 max-w-xs mx-auto leading-relaxed">Select a secure conversation from the sidebar to coordinate with verified developers.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center text-white">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 font-medium tracking-tight">Initializing secure session...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

