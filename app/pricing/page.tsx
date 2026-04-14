'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Zap, Star, Crown, ArrowRight, Sparkles, MessageCircle, ShieldCheck, Headphones, Infinity } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started with your first project purchase.',
    icon: Zap,
    color: 'emerald',
    gradient: 'from-emerald-600/20 to-teal-600/10',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-500/30',
    badge: null,
    features: [
      { text: '1 project purchase', icon: Check },
      { text: 'Chat with sellers', icon: MessageCircle },
      { text: 'Secure file transfer', icon: ShieldCheck },
      { text: 'Access to marketplace', icon: Check },
    ],
    cta: 'Get Started Free',
    ctaStyle: 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    period: 'per month',
    description: 'For serious students who need more projects.',
    icon: Star,
    color: 'indigo',
    gradient: 'from-indigo-600/30 to-blue-600/10',
    border: 'border-indigo-500/40',
    ring: 'ring-indigo-500/40',
    badge: 'Most Popular',
    features: [
      { text: '10 project purchases', icon: Check },
      { text: 'Chat with sellers', icon: MessageCircle },
      { text: 'Secure file transfer', icon: ShieldCheck },
      { text: 'Priority support', icon: Headphones },
      { text: 'Early access to new projects', icon: Sparkles },
    ],
    cta: 'Upgrade to Pro',
    ctaStyle: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30',
  },
  {
    id: 'max',
    name: 'Max',
    price: 999,
    period: 'per month',
    description: 'For power users who want it all.',
    icon: Crown,
    color: 'purple',
    gradient: 'from-purple-600/20 to-pink-600/10',
    border: 'border-purple-500/30',
    ring: 'ring-purple-500/30',
    badge: 'Best Value',
    features: [
      { text: 'Unlimited project purchases', icon: Infinity },
      { text: 'Chat with sellers', icon: MessageCircle },
      { text: 'Secure file transfer', icon: ShieldCheck },
      { text: '24/7 Priority support', icon: Headphones },
      { text: 'Early access to new projects', icon: Sparkles },
      { text: 'Exclusive seller insights', icon: Star },
    ],
    cta: 'Upgrade to Max',
    ctaStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-purple-600/20',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [upgrading, setUpgrading] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/users/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.data) {
        setUser(d.data);
        localStorage.setItem('user', JSON.stringify(d.data));
      }
    });
    fetch('/api/users/subscription').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.data) setCurrentTier(d.data.tier);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const handleUpgrade = async (tier: string) => {
    if (!user) { router.push('/login?callbackUrl=/pricing'); return; }
    setUpgrading(tier);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/users/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentTier(tier);
        setSuccessMsg(data.message || `Successfully switched to ${tier} plan!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {}
    setUpgrading('');
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Hero */}
      <div className="text-center pt-20 pb-12 px-4 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-10 left-1/4 w-[300px] h-[200px] bg-purple-600/10 blur-[80px] pointer-events-none rounded-full" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Simple Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Plan</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Start free, upgrade when you need more. No hidden fees. Simulated payments — upgrade instantly.
          </p>

          {successMsg && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-2xl text-sm font-bold">
              <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentTier === plan.id;
            const isPopular = plan.id === 'pro';

            return (
              <div
                key={plan.id}
                className={`relative bg-gradient-to-b ${plan.gradient} border ${plan.border} rounded-3xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isPopular ? 'ring-2 ' + plan.ring : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isPopular ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'bg-purple-600 text-white'}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                    plan.color === 'emerald' ? 'bg-emerald-500/10' :
                    plan.color === 'indigo' ? 'bg-indigo-500/10' : 'bg-purple-500/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      plan.color === 'emerald' ? 'text-emerald-400' :
                      plan.color === 'indigo' ? 'text-indigo-400' : 'text-purple-400'
                    }`} />
                  </div>
                  <h2 className="text-2xl font-black mb-1">{plan.name}</h2>
                  <p className="text-white/40 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black">
                      {plan.price === 0 ? '₹0' : `₹${plan.price}`}
                    </span>
                    <span className="text-white/40 text-sm ml-1">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, j) => {
                    const FIcon = feature.icon;
                    return (
                      <li key={j} className="flex items-center gap-3 text-sm text-white/70">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.color === 'emerald' ? 'bg-emerald-500/20' :
                          plan.color === 'indigo' ? 'bg-indigo-500/20' : 'bg-purple-500/20'
                        }`}>
                          <FIcon className={`w-3 h-3 ${
                            plan.color === 'emerald' ? 'text-emerald-400' :
                            plan.color === 'indigo' ? 'text-indigo-400' : 'text-purple-400'
                          }`} />
                        </div>
                        {feature.text}
                      </li>
                    );
                  })}
                </ul>

                {isCurrentPlan ? (
                  <div className={`w-full py-3.5 rounded-2xl text-center text-sm font-black ${
                    plan.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    plan.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    ✓ Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!upgrading}
                    className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${plan.ctaStyle}`}
                  >
                    {upgrading === plan.id ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Activating...</>
                    ) : (
                      <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / Notes */}
        <div className="mt-16 text-center">
          <p className="text-white/30 text-sm mb-2">
            💡 This is a simulated payment system. Clicking upgrade instantly activates your plan.
          </p>
          <p className="text-white/20 text-xs">
            All plans include chat access with sellers after purchase. Need help?{' '}
            <Link href="/dashboard/messages" className="text-indigo-400 hover:underline">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
