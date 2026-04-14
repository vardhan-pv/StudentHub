'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import Link from 'next/link';
import { Search, TrendingUp, Download, Star, ArrowRight, Zap, Shield, Users } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_message_check');
    setUser(null);
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=6');
      const data = await response.json();
      if (data.success) setProjects(data.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const response = await fetch(`/api/projects?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      if (data.success) setProjects(data.data.projects);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      
      <Navbar user={user} onLogout={handleLogout} />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px, 10vh, 100px) 24px 80px' }} className="text-center">
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 32
        }}>
          <Zap size={14} color="#a5b4fc" />
          <span style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600 }}>India's #1 Student Project Marketplace</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 8vw, 4.5rem)', fontWeight: 800,
          color: '#fff', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-2px',
          maxWidth: 900, margin: '0 auto 24px'
        }}>
          Buy & Sell Student<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Projects Easily
          </span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(15px, 2vw, 18px)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>
          Connect directly with verified student sellers. Chat, negotiate, and get your project files with ease.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-12">
          <div className="flex-1 relative">
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>
          <button type="submit" className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 whitespace-nowrap">
            Search
          </button>
        </form>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/marketplace" className="w-full sm:w-auto">
            <button style={{
              padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontWeight: 700, fontSize: 15, boxShadow: '0 4px 25px rgba(99,102,241,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'
            }}>Browse Projects <ArrowRight size={16} /></button>
          </Link>
          <Link href="/register?role=seller" className="w-full sm:w-auto">
            <button style={{
              padding: '14px 32px', borderRadius: 12, cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontWeight: 600, fontSize: 15, width: '100%'
            }}>Become a Seller</button>
          </Link>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[['500+', 'Projects Listed'], ['1000+', 'Students Joined'], ['4.9★', 'Avg. Rating']].map(([num, label]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '32px 24px', textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#a5b4fc', marginBottom: 8 }}>{num}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PROJECTS ───────────────────────────────── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
            <div>
              <h2 style={{ color: '#fff', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>Featured Projects</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Hand-picked by our team</p>
            </div>
            <Link href="/marketplace">
              <button style={{
                display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc',
                background: 'none', border: '1px solid rgba(165,180,252,0.3)', padding: '8px 18px',
                borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600
              }}>View All <ArrowRight size={14} /></button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: 16, animation: 'pulse 2s infinite' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <Link key={project.id} href={`/project/${project.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)', height: '100%', boxSizing: 'border-box'
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.5)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                      (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{
                        background: 'rgba(99,102,241,0.2)', color: '#a5b4fc',
                        borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700
                      }}>{project.category}</span>
                    </div>
                    <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{project.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>{project.description?.slice(0, 80)}...</p>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>by <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{project.seller_username}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 13 }}>
                          <Star size={14} fill="#fbbf24" /> {project.rating || 0}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                          <Download size={14} /> {project.downloads}
                        </span>
                      </div>
                      <span style={{ color: '#a5b4fc', fontWeight: 800, fontSize: 20 }}>₹{project.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 16 }}>Why Student Hub?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginBottom: 64 }}>Built for students, by students.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, color: '#6366f1', bg: 'rgba(99,102,241,0.15)', title: 'Verified Sellers', desc: 'Every seller goes through a verification process to ensure quality.' },
              { icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.15)', title: 'Direct Chat', desc: 'Message sellers directly to discuss project details and payment.' },
              { icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', title: 'Best Prices', desc: 'Competitive prices negotiated directly with student sellers.' },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: 32, textAlign: 'left'
              }}>
                <div style={{ width: 52, height: 52, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: '64px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>SH</span>
                </div>
                <span style={{ color: '#fff', fontWeight: 700 }}>Student Hub</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.7 }}>India's top marketplace for student projects. Secure, fast, and easy to use.</p>
            </div>
            {[
              { title: 'Product', links: [['Marketplace', '/marketplace'], ['Dashboard', '/dashboard'], ['Upload Project', '/dashboard/upload']] },
              { title: 'Account', links: [['Login', '/login'], ['Register', '/register'], ['Messages', '/dashboard/messages']] },
              { title: 'Legal', links: [['Terms', '#'], ['Privacy', '#'], ['Guidelines', '#']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>{title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {links.map(([label, href]) => (
                    <li key={label}><Link href={href} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            © 2024 Student Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

