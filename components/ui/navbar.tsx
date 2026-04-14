'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Zap } from 'lucide-react';

interface NavbarProps {
  user?: any;
  onLogout?: () => void;
}

export function Navbar({ user: initialUser, onLogout }: NavbarProps) {
  const [user, setUser] = useState<any>(initialUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!initialUser) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage');
        }
      }
    } else {
      setUser(initialUser);
    }
  }, [initialUser]);

  const handleLoggedOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('last_message_check');
      window.location.href = '/';
    }
  };

  return (
    <nav style={{
      backdropFilter: 'blur(20px)',
      background: 'rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      position: 'sticky', top: 0, zIndex: 50
    }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.5)'
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>SH</span>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>Student Hub</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/marketplace">
            <button style={{ color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 8, fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
              Marketplace
            </button>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <button style={{ color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 8, fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}>
                  Dashboard
                </button>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 }}>{user.username}</span>
                <button onClick={handleLoggedOut} style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500
                }}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <button style={{ color: 'rgba(255,255,255,0.75)', background: 'none', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', padding: '8px 18px', borderRadius: 8, fontWeight: 500 }}>Login</button>
              </Link>
              <Link href="/register">
                <button style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
                }}>Sign Up Free</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(13,13,20,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '24px',
          display: 'flex', flexDirection: 'column', gap: 16,
          zIndex: 49
        }} className="md:hidden">
          <Link href="/marketplace" onClick={() => setIsMenuOpen(false)}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, padding: '12px 0' }}>Marketplace</div>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, padding: '12px 0' }}>Dashboard</div>
              </Link>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
              <div className="flex items-center justify-between">
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Logged in as {user.username}</span>
                <button onClick={handleLoggedOut} style={{
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
                }}>Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                <div style={{ color: '#fff', fontSize: 18, fontWeight: 600, padding: '12px 0' }}>Login</div>
              </Link>
              <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                <button style={{
                  width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: '#fff', padding: '14px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16,
                  boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
                }}>Sign Up Free</button>
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
