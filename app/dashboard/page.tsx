'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Download, ShoppingCart, Plus, Settings, LogOut, MessageSquare, PlusCircle } from 'lucide-react';

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
    { label: 'Projects', value: stats?.stats?.totalProjects ?? '-', icon: PlusCircle, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.25)' },
    { label: 'Downloads', value: stats?.stats?.totalDownloads ?? '-', icon: Download, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', glow: 'rgba(236,72,153,0.25)' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0d0d14', color: '#fff' }}>
      
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Dashboard</h1>
            <p className="text-white/40 text-sm md:text-base font-medium">Welcome back, <span className="text-indigo-400 font-bold">@{user.username}</span> 👋</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Link href="/dashboard/messages" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-500/20 transition-all">
                <MessageSquare size={18} /> Messages
              </button>
            </Link>
            <Link href="/dashboard/upload" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                <Plus size={18} /> Upload Project
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : stats ? (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {statCards.map(({ label, value, icon: Icon, gradient, glow }) => (
                <div key={label} className="group bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden transition-all hover:border-white/20">
                  <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: gradient, borderRadius: '50%', opacity: 0.05 }} />
                  <div className="flex items-center gap-4 mb-4">
                    <div style={{ background: gradient, boxShadow: `0 4px 15px ${glow}` }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <Icon size={18} color="#fff" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{label}</p>
                      <p className="text-2xl font-black text-white">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTTOM PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Recent Sales */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight">Recent Sales</h2>
                  <ShoppingCart size={20} className="text-white/20" />
                </div>
                {stats.recentSales?.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-sm italic">You haven't made any sales yet.</div>
                ) : (
                  <div className="space-y-4">
                    {stats.recentSales?.map((sale: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{sale.projectTitle}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase mt-1">by {sale.buyerUsername}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-black text-green-400">+₹{sale.amount}</p>
                          <p className="text-[9px] text-white/30 font-bold mt-1 uppercase">{new Date(sale.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Projects */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black tracking-tight">Top Projects</h2>
                  <TrendingUp size={20} className="text-white/20" />
                </div>
                {stats.topProjects?.length === 0 ? (
                  <div className="text-center py-12 text-white/30 text-sm italic">Upload projects to see your top performing ones here.</div>
                ) : (
                  <div className="space-y-4">
                    {stats.topProjects?.map((project: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{project.title}</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase mt-1">{project.downloads} downloads</p>
                          </div>
                        </div>
                        <span className="font-black text-white/80 ml-4 shrink-0">₹{project.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Purchases */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tight">My Purchases</h2>
                <Download size={20} className="text-white/20" />
              </div>
              {!stats.purchases || stats.purchases.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-white/40 text-sm mb-8">Explore the marketplace to find projects and resources.</p>
                  <Link href="/marketplace">
                    <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                      Browse Marketplace
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {stats.purchases.map((purchase: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                      <div className="min-w-0">
                        <p className="font-bold text-base truncate mb-1">{purchase.projectTitle}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase">{new Date(purchase.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0 ml-4">
                        <p className="font-black text-lg text-white/90">₹{purchase.amount}</p>
                        <Link href={`/dashboard/orders/${purchase.orderId}`}>
                          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-[11px] shadow-lg shadow-indigo-600/10 hover:scale-105 transition-transform">
                            <Download size={14} /> Download
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

