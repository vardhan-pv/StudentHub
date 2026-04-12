'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

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
          if (existingConv) { handleSelectConversation(existingConv, token); }
          else {
            setActiveConversation({ conversationId: expectedConvId, projectId: initProjectId, otherUserId: initOtherId, otherUsername: initOtherUsername, myRole: 'Buyer', otherRole: 'Seller', projectTitle: 'Project ' + initProjectId });
            setMessages([]);
          }
        } else if (data.data.conversations.length > 0) {
          handleSelectConversation(data.data.conversations[0], token);
        }
      }
    } catch (err) { console.error('Failed to load conversations', err); } finally { setLoading(false); }
  };

  const handleSelectConversation = async (conv: any, tokenOverride?: string) => {
    setActiveConversation(conv);
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
    const optimisticMsg = { _id: Date.now().toString(), senderId: user.userId, senderUsername: user.username, content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimisticMsg]);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: activeConversation.otherUserId, receiverUsername: activeConversation.otherUsername, projectId: activeConversation.projectId, content })
      });
      const data = await response.json();
      if (!data.success) throw new Error('Failed to send');
      toast.success('Message sent!');
      handleSelectConversation(activeConversation, token!);
      fetchConversations(token!);
    } catch (err) { console.error('Error sending message', err); toast.error('Failed to send message'); }
  };

  if (!user || loading) return (
    <div style={{ background: '#0d0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading messages...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#0d0d14', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Messages</span>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '32px auto', padding: '0 24px', display: 'flex' }}>
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 140px)' }}>

          {/* SIDEBAR */}
          <div style={{ width: 300, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Conversations</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 && !activeConversation && (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  <MessageCircle size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No conversations yet.</p>
                  <p style={{ marginTop: 6 }}>Browse the marketplace to contact sellers!</p>
                </div>
              )}

              {activeConversation && !conversations.find(c => c.conversationId === activeConversation.conversationId) && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(99,102,241,0.12)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{activeConversation.otherUsername}</div>
                  <div style={{ color: '#a5b4fc', fontSize: 12, marginTop: 4 }}>New Conversation</div>
                </div>
              )}

              {conversations.map((conv) => {
                const isActive = activeConversation?.conversationId === conv.conversationId;
                return (
                  <div key={conv.conversationId} onClick={() => handleSelectConversation(conv)}
                    style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent', transition: 'background 0.15s', borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{conv.otherUsername}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: conv.otherRole === 'Seller' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: conv.otherRole === 'Seller' ? '#c4b5fd' : '#6ee7b7' }}>
                        {conv.otherRole}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginBottom: 4 }}>📁 {conv.projectTitle}</p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.lastMessage}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHAT WINDOW */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div style={{ padding: '18px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                      {activeConversation.otherUsername?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{activeConversation.otherUsername}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: activeConversation.otherRole === 'Seller' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: activeConversation.otherRole === 'Seller' ? '#c4b5fd' : '#6ee7b7' }}>
                          {activeConversation.otherRole}
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>📁 {activeConversation.projectTitle}</p>
                    </div>
                  </div>
                  <Link href={`/project/${activeConversation.projectId}`}>
                    <button style={{ padding: '7px 16px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#a5b4fc', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      View Project
                    </button>
                  </Link>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>
                      <MessageCircle size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                      <p>Start the conversation!</p>
                      <p style={{ marginTop: 8, fontSize: 13 }}>Ask about payment details, project features, or anything else.</p>
                    </div>
                  )}

                  {messages.map((msg, index) => {
                    const isMe = msg.senderId === user.userId;
                    return (
                      <div key={msg._id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, paddingLeft: 4, paddingRight: 4 }}>
                          {msg.senderUsername || user.username} · {isMe ? activeConversation.myRole : activeConversation.otherRole}
                        </span>
                        <div style={{
                          maxWidth: '72%', padding: '12px 16px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                          color: '#fff', fontSize: 14, lineHeight: 1.6,
                          boxShadow: isMe ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.08)'
                        }}>
                          {msg.content}
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      style={{
                        flex: 1, padding: '13px 18px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button type="submit" disabled={!newMessage.trim()} style={{
                      width: 46, height: 46, background: newMessage.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                      border: 'none', borderRadius: 12, cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: newMessage.trim() ? '0 4px 15px rgba(99,102,241,0.4)' : 'none', transition: 'all 0.2s'
                    }}>
                      <Send size={18} color={newMessage.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)' }}>
                <MessageCircle size={56} style={{ marginBottom: 16, opacity: 0.2 }} />
                <p style={{ fontSize: 16, fontWeight: 600 }}>Select a conversation</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
