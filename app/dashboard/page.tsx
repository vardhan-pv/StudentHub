'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Download, ShoppingCart, Plus, Settings, LogOut, MessageSquare } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    if (!storedUser || !token) { router.push('/login'); return; }
    setUser(JSON.parse(storedUser));
    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const response = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to load dashboard'); return; }
      setStats(data.data);
    } catch (err) { setError('Failed to load dashboard'); } finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_message_check');
    router.push('/');
  };

  if (!user) return <div style={{ background: '#0d0d14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Redirecting...</div>;

  const statCards = [
    { label: 'Total Sales', value: stats?.stats?.totalSales ?? '-', icon: ShoppingCart, gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.25)' },
    { label: 'Total Earnings', value: stats?.stats?.totalEarnings != null ? `₹${stats.stats.totalEarnings}` : '-', icon: TrendingUp, gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.25)' },
    { label: 'Projects', value: stats?.stats?.totalProjects ?? '-', icon: Plus, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.25)' },
    { label: 'Downloads', value: stats?.stats?.totalDownloads ?? '-', icon: Download, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', glow: 'rgba(236,72,153,0.25)' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0d0d14', color: '#fff' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>SH</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>Student Hub</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/marketplace"><button style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Marketplace</button></Link>
            <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 14 }}>{user.username}</span>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 8 }}>Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>Welcome back, <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{user.username}</span> 👋</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[
              { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare, style: { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc' } },
              { label: '+ Upload', href: '/dashboard/upload', icon: null, style: { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' } },
              { label: 'Settings', href: '/dashboard/settings', icon: Settings, style: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' } },
            ].map(({ label, href, icon: Icon, style: btnStyle }) => (
              <Link key={label} href={href} style={{ textDecoration: 'none' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s', ...btnStyle }}>
                  {Icon && <Icon size={15} />} {label}
                </button>
              </Link>
            ))}
          </div>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: 10, marginBottom: 24, fontSize: 14 }}>{error}</div>}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 110, background: 'rgba(255,255,255,0.04)', borderRadius: 16 }} />)}
          </div>
        ) : stats ? (
          <>
            {/* STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
              {statCards.map(({ label, value, icon: Icon, gradient, glow }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: gradient, borderRadius: '50%', opacity: 0.12 }} />
                  <div style={{ width: 44, height: 44, background: gradient, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: `0 4px 15px ${glow}` }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* BOTTOM PANELS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* Recent Sales */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.5px' }}>Recent Sales</h2>
                {stats.recentSales?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No sales yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.recentSales?.map((sale: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{sale.projectTitle}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>by {sale.buyerUsername}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 700, fontSize: 16, color: '#34d399' }}>+₹{sale.amount}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{new Date(sale.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Projects */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.5px' }}>Top Projects</h2>
                {stats.topProjects?.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No projects yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.topProjects?.map((project: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{i + 1}</div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 14 }}>{project.title}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{project.downloads} downloads</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: '#a5b4fc', fontSize: 16 }}>₹{project.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Purchases */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.5px' }}>My Purchases</h2>
              {!stats.purchases || stats.purchases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 16 }}>No purchases yet. Head to the marketplace to explore projects!</p>
                  <Link href="/marketplace">
                    <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                      Browse Marketplace
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {stats.purchases.map((purchase: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{purchase.projectTitle}</p>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{new Date(purchase.date).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 16 }}>₹{purchase.amount}</p>
                        <Link href={`/dashboard/orders/${purchase.orderId}`}>
                          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, cursor: 'pointer', color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>
                            <Download size={13} /> Download
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
