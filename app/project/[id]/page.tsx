'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Download, ShoppingCart, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) {}
    }

    // Fetch project
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load project');
        return;
      }

      setProject(data.data);
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_message_check');
    setUser(null);
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Redirect to conversation page instead of Razorpay
    router.push(`/dashboard/messages?projectId=${projectId}&sellerId=${project.seller_id}&sellerUsername=${project.seller_username}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-white/40">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md">
          <p className="text-red-400 text-lg mb-6">{error || 'Project not found'}</p>
          <Link href="/marketplace">
            <Button className="bg-white text-black hover:bg-white/90 px-8 py-3 rounded-xl font-bold">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Back Link */}
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
                    <span className="font-black text-white text-lg">
                      {project.seller_username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">@{project.seller_username}</p>
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Top Rated Seller</p>
                  </div>
                </Link>

                <div className="h-8 w-px bg-white/10 hidden sm:block"></div>

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
                      <p className="font-bold leading-none">{project.downloads}</p>
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
              {project.language && (
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Language</p>
                  <p className="font-bold">{project.language}</p>
                </div>
              )}
              {project.framework && (
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Framework</p>
                  <p className="font-bold">{project.framework}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">File Size</p>
                <p className="font-bold">{(project.file_size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Posted On</p>
                <p className="font-bold">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white/5 border border-indigo-500/20 rounded-[32px] p-8 lg:sticky lg:top-24 shadow-2xl shadow-indigo-500/5">
              <div className="flex items-center gap-2 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold text-green-500 uppercase tracking-widest">Available for Instant Access</span>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-black text-white">₹{project.price}</span>
                <span className="text-white/40 font-semibold text-lg ml-2">one-time</span>
              </div>

              <Button
                onClick={handleBuyNow}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-black rounded-2xl mb-8 shadow-xl shadow-indigo-600/25 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Buy Now & Download
              </Button>

              <div className="space-y-6">
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
                    <Clock className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Instant Delivery</p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed">Get access to the source code immediately after confirmation.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-[10px] text-white/30 text-center leading-relaxed font-medium">
                Protected by Student Hub Buyer Guarantee. Need help? <span className="text-indigo-400 cursor-pointer hover:underline">Contact Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

