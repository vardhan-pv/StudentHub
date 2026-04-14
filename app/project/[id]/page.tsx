'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Download, ShoppingCart, ArrowLeft, ShieldCheck, Clock, Zap, Crown, Lock, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [buyError, setBuyError] = useState('');
  const [purchased, setPurchased] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => {
    params.then(p => {
      setProjectId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (!projectId) return;
    fetchCurrentUser();
    fetchProject();
  }, [projectId]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
        // Also sync to localStorage for navbar compatibility
        localStorage.setItem('user', JSON.stringify(data.data));

        // Fetch subscription status
        const subRes = await fetch('/api/users/subscription');
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscription(subData.data);
        }
      } else {
        // Clear stale localStorage tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    } catch (e) {}
  };

  const fetchProject = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load project');
        return;
      }
      setProject(data.data);
    } catch (err) {
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push(`/login?callbackUrl=/project/${projectId}`);
      return;
    }

    setBuyError('');
    setBuying(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Subscription limit hit
          setBuyError(data.error);
          setShowUpgrade(true);
        } else if (res.status === 409) {
          // Already purchased
          setPurchased(true);
          setBuyError('');
          router.push(`/dashboard/messages?projectId=${projectId}&sellerId=${project.seller_id}&sellerUsername=${project.seller_username}`);
        } else {
          setBuyError(data.error || 'Purchase failed. Please try again.');
        }
        return;
      }

      setPurchased(true);
      // Redirect to chat with seller
      setTimeout(() => {
        router.push(`/dashboard/messages?projectId=${projectId}&sellerId=${data.data.sellerId}&sellerUsername=${data.data.sellerUsername}`);
      }, 1500);

      // Refresh subscription count
      const subRes = await fetch('/api/users/subscription');
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.data);
      }
    } catch (e) {
      setBuyError('Network error. Please try again.');
    } finally {
      setBuying(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier);
    try {
      const res = await fetch('/api/users/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscription(data.data);
        setShowUpgrade(false);
        setBuyError('');
      }
    } catch (e) {}
    finally { setUpgrading(''); }
  };

  // — Loading —
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading project details...</p>
        </div>
      </div>
    );
  }

  // — Error —
  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-bold mb-2">Project Not Found</p>
          <p className="text-white/40 text-sm mb-6">{error || 'This project may have been removed or the link is incorrect.'}</p>
          <Link href="/marketplace" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const tierConfig = {
    free:  { icon: <Zap className="w-4 h-4" />,    label: 'Free',  color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20',  limit: '1 project' },
    pro:   { icon: <Star className="w-4 h-4" />,   label: 'Pro',   color: 'text-indigo-400',   bg: 'bg-indigo-500/10 border-indigo-500/20',   limit: '10 projects' },
    max:   { icon: <Crown className="w-4 h-4" />,  label: 'Max',   color: 'text-purple-400',   bg: 'bg-purple-500/10 border-purple-500/20',   limit: 'Unlimited' },
  };

  const currentTier = subscription?.tier || 'free';
  const tc = tierConfig[currentTier as keyof typeof tierConfig];

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black mb-2">Upgrade Your Plan</h2>
              <p className="text-white/50 text-sm">You've reached your purchase limit. Upgrade to buy more projects.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {/* Free */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold">Free</span>
                </div>
                <p className="text-3xl font-black mb-1">₹0</p>
                <p className="text-white/40 text-xs mb-4">Forever</p>
                <ul className="text-sm text-white/60 space-y-2 flex-1">
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 1 project purchase</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Chat with sellers</li>
                </ul>
                {currentTier === 'free' ? (
                  <span className="mt-4 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2 rounded-xl">Current Plan</span>
                ) : (
                  <button onClick={() => handleUpgrade('free')} disabled={!!upgrading} className="mt-4 w-full py-2 rounded-xl border border-white/10 text-white/60 text-sm font-bold hover:bg-white/5 disabled:opacity-50 transition-colors">
                    {upgrading === 'free' ? 'Activating...' : 'Downgrade'}
                  </button>
                )}
              </div>

              {/* Pro */}
              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5 flex flex-col relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">POPULAR</div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-indigo-300">Pro</span>
                </div>
                <p className="text-3xl font-black mb-1">₹499</p>
                <p className="text-white/40 text-xs mb-4">per month</p>
                <ul className="text-sm text-white/60 space-y-2 flex-1">
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> 10 project purchases</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Chat with sellers</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Priority support</li>
                </ul>
                {currentTier === 'pro' ? (
                  <span className="mt-4 text-center text-xs font-bold text-indigo-400 bg-indigo-500/10 py-2 rounded-xl">Current Plan</span>
                ) : (
                  <button onClick={() => handleUpgrade('pro')} disabled={!!upgrading} className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black disabled:opacity-50 transition-colors shadow-lg shadow-indigo-600/30">
                    {upgrading === 'pro' ? 'Activating...' : 'Upgrade to Pro'}
                  </button>
                )}
              </div>

              {/* Max */}
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-purple-300">Max</span>
                </div>
                <p className="text-3xl font-black mb-1">₹999</p>
                <p className="text-white/40 text-xs mb-4">per month</p>
                <ul className="text-sm text-white/60 space-y-2 flex-1">
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Unlimited purchases</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Chat with sellers</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Priority support</li>
                  <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Early access</li>
                </ul>
                {currentTier === 'max' ? (
                  <span className="mt-4 text-center text-xs font-bold text-purple-400 bg-purple-500/10 py-2 rounded-xl">Current Plan</span>
                ) : (
                  <button onClick={() => handleUpgrade('max')} disabled={!!upgrading} className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm font-black disabled:opacity-50 transition-opacity shadow-lg shadow-purple-600/20">
                    {upgrading === 'max' ? 'Activating...' : 'Upgrade to Max'}
                  </button>
                )}
              </div>
            </div>

            <button onClick={() => setShowUpgrade(false)} className="w-full py-3 text-white/40 hover:text-white text-sm transition-colors">
              Maybe later
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Back */}
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold">Back to Marketplace</span>
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <span className="inline-block bg-indigo-600/20 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                {project.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">{project.title}</h1>

              <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-white/10">
                <Link href={`/profile/${project.seller_username}`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="font-black text-white text-lg">{project.seller_username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">@{project.seller_username}</p>
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Top Rated Seller</p>
                  </div>
                </Link>

                <div className="h-8 w-px bg-white/10 hidden sm:block" />

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <div>
                      <p className="font-bold leading-none">{project.rating || 0}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase mt-1">{project.reviews || 0} reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="font-bold leading-none">{project.downloads || 0}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase mt-1">Downloads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-12">
              <h2 className="text-2xl font-bold mb-4">About this project</h2>
              <p className="text-white/60 leading-relaxed text-lg whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.tags && project.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Project Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string) => (
                    <span key={tag} className="bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/5 border border-white/10 rounded-3xl">
              {project.language && <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Language</p><p className="font-bold">{project.language}</p></div>}
              {project.framework && <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Framework</p><p className="font-bold">{project.framework}</p></div>}
              <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">File Size</p><p className="font-bold">{project.file_size ? (project.file_size / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'}</p></div>
              <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Posted On</p><p className="font-bold">{new Date(project.created_at).toLocaleDateString()}</p></div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white/5 border border-indigo-500/20 rounded-[32px] p-8 lg:sticky lg:top-24 shadow-2xl shadow-indigo-500/5">

              {/* Success state */}
              {purchased ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-green-400">Purchase Successful!</h3>
                  <p className="text-white/50 text-sm mb-4">Redirecting you to chat with the seller...</p>
                  <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-bold text-green-500 uppercase tracking-widest">Available for Instant Access</span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-black text-white">₹{project.price}</span>
                    <span className="text-white/40 font-semibold text-lg ml-2">one-time</span>
                  </div>

                  {/* Subscription Badge */}
                  {user && subscription && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold mb-6 ${tc.bg} ${tc.color}`}>
                      {tc.icon}
                      <span>{tc.label} Plan — {subscription.purchasesCount}/{subscription.purchasesLimit ?? '∞'} purchases used</span>
                      {!subscription.canPurchase && <Lock className="w-3.5 h-3.5 ml-auto" />}
                    </div>
                  )}

                  {/* Error */}
                  {buyError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-2xl mb-4 leading-relaxed">
                      {buyError}
                      {showUpgrade && (
                        <button onClick={() => setShowUpgrade(true)} className="block mt-2 text-indigo-400 font-bold hover:underline text-xs">
                          View upgrade options →
                        </button>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  {!user ? (
                    <Link href={`/login?callbackUrl=/project/${projectId}`} className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-5 text-lg font-black rounded-2xl mb-8 shadow-xl shadow-indigo-600/25 transition-all active:scale-95">
                      <Lock size={20} /> Log In to Purchase
                    </Link>
                  ) : (
                    <button
                      onClick={handleBuyNow}
                      disabled={buying || (subscription && !subscription.canPurchase)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-5 text-lg font-black rounded-2xl mb-8 shadow-xl shadow-indigo-600/25 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {buying ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                      ) : subscription?.canPurchase === false ? (
                        <><Lock size={20} /> Upgrade to Purchase</>
                      ) : (
                        <><ShoppingCart size={20} /> Buy Now &amp; Get Access</>
                      )}
                    </button>
                  )}

                  {subscription && !subscription.canPurchase && (
                    <button onClick={() => setShowUpgrade(true)} className="w-full py-3 border border-indigo-500/40 text-indigo-400 font-bold rounded-2xl hover:bg-indigo-500/10 transition-colors text-sm mb-6 flex items-center justify-center gap-2">
                      <Crown size={16} /> Upgrade Plan
                    </button>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Secure Purchase</p>
                        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">Direct connection with seller. Safe file transfer guaranteed.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Chat with Seller</p>
                        <p className="text-xs text-white/40 mt-0.5 leading-relaxed">Instantly connect with the seller after purchase to get your files.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10 text-center">
                    <Link href="/pricing" className="text-indigo-400 hover:underline text-xs font-bold">
                      View all pricing plans →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
