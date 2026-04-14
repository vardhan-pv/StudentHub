'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/navbar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Star, Download, Filter, X } from 'lucide-react';

const CATEGORIES = ['Web Development','Mobile Development','Data Science','Machine Learning','Python','JavaScript','React','Database Design','Cloud Computing','Other'];

export default function MarketplacePage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetchProjects(); }, [page, selectedCategory]);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) {} }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('last_message_check');
    setUser(null);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let url = `/api/projects?page=${page}&limit=12`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) { setProjects(data.data.projects); setTotalPages(data.data.pagination.pages); }
    } catch (error) { console.error('Failed:', error); } finally { setLoading(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/projects?search=${encodeURIComponent(searchTerm)}&limit=12`);
      const data = await response.json();
      if (data.success) { setProjects(data.data.projects); setTotalPages(data.data.pagination.pages); setPage(1); }
    } catch (error) { console.error('Search failed:', error); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0d14', color: '#fff' }}>
      
      <Navbar user={user} onLogout={handleLogout} />

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>Marketplace</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>Discover and buy student projects at the best prices</p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-semibold sm:hidden"
          >
            {showFilters ? <X size={18} /> : <Filter size={18} />}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
              <input
                placeholder="Search projects by title, category, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                <Search size={18} /> Search
              </button>
              <button 
                type="button" 
                onClick={() => setShowFilters(!showFilters)} 
                className="hidden sm:flex px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors items-center gap-2 whitespace-nowrap"
              >
                <Filter size={18} /> Filters {showFilters && <X size={16} />}
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* SIDEBAR */}
          {showFilters && (
            <div className="w-full lg:w-64 flex-shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:sticky lg:top-24">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-6 px-3">Filter by Category</h3>
                <div className="flex flex-col gap-1">
                  {['All Categories', ...CATEGORIES].map((cat) => {
                    const val = cat === 'All Categories' ? '' : cat;
                    const active = selectedCategory === val;
                    return (
                      <button 
                        key={cat} 
                        onClick={() => { setSelectedCategory(val); setPage(1); }}
                        className={`text-left px-4 py-2.5 rounded-xl transition-all text-sm ${
                          active ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* GRID */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X size={32} className="text-white/20" />
                </div>
                <h3 className="text-xl font-bold mb-2">No projects found</h3>
                <p className="text-white/40 mb-8 max-w-xs mx-auto">Try adjusting your search terms or filters to find what you're looking for.</p>
                <button onClick={() => { setSelectedCategory(''); setSearchTerm(''); setPage(1); fetchProjects(); }}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-transform active:scale-95">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {projects.map((project: any) => (
                    <Link key={project.id} href={`/project/${project.id}`}>
                      <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-white/10 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 shadow-xl hover:shadow-indigo-500/10">
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{project.category}</span>
                          <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-500 px-2 py-1 rounded-lg">
                            <Star size={12} fill="currentColor" />
                            <span className="text-[11px] font-bold">{project.rating || 0}</span>
                          </div>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-3 leading-tight group-hover:text-indigo-400 transition-colors">{project.title}</h3>
                        <p className="text-white/40 text-[13px] leading-relaxed mb-6 line-clamp-2 flex-grow">{project.description}</p>
                        
                        <div className="flex items-center gap-2 mb-6 text-white/30 text-xs">
                          <span>by</span>
                          <span className="text-white/60 font-semibold hover:text-indigo-400 transition-colors">{project.seller_username}</span>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-white/40 text-xs">
                              <Download size={14} />
                              <span>{project.downloads}</span>
                            </div>
                          </div>
                          <div className="text-2xl font-black text-white">₹{project.price}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      onClick={() => setPage(Math.max(1, page - 1))} 
                      disabled={page === 1}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <div className="flex items-center gap-2">
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button 
                          key={p} 
                          onClick={() => setPage(p)}
                          className={`w-11 h-11 rounded-xl font-bold transition-all ${
                            page === p ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-white/50 hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setPage(Math.min(totalPages, page + 1))} 
                      disabled={page === totalPages}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reuse lucide arrow for pagination
const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
