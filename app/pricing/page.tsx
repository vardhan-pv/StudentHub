'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Zap, Star, Crown, ArrowRight, Sparkles, MessageCircle, ShieldCheck, Headphones, Infinity, X, ShieldAlert, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

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

  const initiateUpgrade = (plan: any) => {
    if (!user) { router.push('/login?callbackUrl=/pricing'); return; }
    if (plan.id === 'free') {
       // Just call it directly for free tier if it was allowed, but usually you're already free
       handleFinalUpgrade('free');
       return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handleFinalUpgrade = async (tier: string) => {
    setVerifying(true);
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
        setShowPayment(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Upgrade failed:', e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#13131f] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setShowPayment(false)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} className="text-white/40" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2">Complete Payment</h2>
              <p className="text-white/40 text-sm">Scan the QR code below to pay for the <span className="text-white font-bold">{selectedPlan.name}</span> plan.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 mb-8 shadow-inner relative group">
              <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
              <img 
                src="/payment-qr.png" 
                alt="Payment QR Code" 
                className="w-full aspect-square object-contain"
              />
              <div className="mt-4 text-center">
                <p className="text-[#0d0d14] text-xs font-black tracking-widest uppercase">UPI ID: studenthub@upi</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-white/40 text-sm">Plan Price</span>
                <span className="text-xl font-black text-white">₹{selectedPlan.price}</span>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                  Please keep a screenshot of the payment confirmation. After payment, click the button below to activate your plan instantly.
                </p>
              </div>
            </div>

            <Button
              onClick={() => handleFinalUpgrade(selectedPlan.id)}
              disabled={verifying}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-7 text-lg font-black rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {verifying ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                "I've Completed & Paid"
              )}
            </Button>
            
            <p className="text-center text-[10px] text-white/20 mt-6 font-medium">
              By clicking the button you agree that you have scanned and paid the exact amount.
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="text-center pt-20 pb-12 px-4 relative overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute top-10 left-1/4 w-[300px] h-[200px] bg-purple-600/10 blur-[80px] pointer-events-none rounded-full" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Premium Access
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            Choose Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Plan</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Get more projects and chat access. Scan and upgrade in seconds.
          </p>

          {successMsg && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-3 rounded-2xl text-sm font-bold animate-in fade-in zoom-in duration-300">
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
                    onClick={() => initiateUpgrade(plan)}
                    className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${plan.ctaStyle}`}
                  >
                    <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ / Notes */}
        <div className="mt-16 text-center">
          <p className="text-white/30 text-sm mb-2">
            💡 Simply scan the QR code and pay. We provide instant activation upon your confirmation.
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
