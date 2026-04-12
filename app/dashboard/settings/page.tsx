'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Shield, LogOut } from 'lucide-react';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box' as const,
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block' as const,
  color: 'rgba(255,255,255,0.55)',
  fontSize: 13,
  fontWeight: 600 as const,
  marginBottom: 8,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('notifications');
  const [formData, setFormData] = useState({ fullName: '', bio: '', avatar: '' });
  const [notifState, setNotifState] = useState({ newMessage: true, newSale: true, marketUpdates: false });

  const notifItems = [
    { id: 'newMessage' as const, title: 'New Message', desc: 'Get notified when someone sends you a message' },
    { id: 'newSale' as const, title: 'New Project Sale', desc: 'Get notified when your project is purchased' },
    { id: 'marketUpdates' as const, title: 'Marketplace Updates', desc: 'Get alerts about new featured projects' },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { router.push('/login'); return; }
    const u = JSON.parse(storedUser);
    setUser(u);
    setFormData({ fullName: u.fullName || '', bio: u.bio || '', avatar: u.avatar || '' });
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { router.push('/login'); return; }
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to update profile'); return; }
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) { setError('Failed to update profile'); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_message_check');
    router.push('/');
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  if (!user) return (
    <div style={{ background: '#0d0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ background: '#0d0d14', minHeight: '100vh', color: '#fff' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600 }}>{user.username}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 8 }}>Settings</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Manage your account preferences and profile</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32 }}>

          {/* SIDEBAR TABS */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px', border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: activeTab === id ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: activeTab === id ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
                    fontWeight: activeTab === id ? 700 : 500, fontSize: 14,
                    borderLeft: activeTab === id ? '3px solid #6366f1' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}>
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>

            {/* Danger Zone */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 16 }}>
              <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Danger Zone</p>
              <button onClick={handleLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: '#f87171', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div>

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === 'notifications' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 36 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Notification Preferences</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>Control how and when you receive notifications.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {notifItems.map(({ id, title, desc }, i) => {
                    const on = notifState[id];
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: i < notifItems.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{title}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{desc}</p>
                        </div>
                        <button onClick={() => setNotifState(prev => ({ ...prev, [id]: !on }))}
                          style={{
                            width: 50, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
                            background: on ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.1)',
                            position: 'relative', transition: 'background 0.25s',
                            boxShadow: on ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
                          }}>
                          <div style={{
                            position: 'absolute', top: 4, left: on ? 26 : 4, width: 20, height: 20,
                            background: '#fff', borderRadius: '50%', transition: 'left 0.25s',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                          }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 36 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Security</h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32 }}>Manage your account security settings.</p>

                {/* Account info */}
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 20, marginBottom: 28 }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Account Info</p>
                  {[
                    ['Email', user.email],
                    ['Username', '@' + user.username],
                    ['Account Role', user.role],
                    ['Member Since', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{k}</span>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Shield size={18} color="#fbbf24" />
                    <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: 15 }}>Change Password</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Contact support or use the forgot password feature on the login page to reset your password securely.</p>
                  <Link href="/login">
                    <button style={{ padding: '9px 20px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, color: '#fbbf24', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                      Go to Login Page
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
