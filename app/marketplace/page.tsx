'use client';

import { useState, useEffect } from 'react';
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

      {/* NAV */}
      <nav style={{ background: 'rgba(13,13,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>SH</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Student Hub</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Marketplace', 'Dashboard'].map((item) => (
              <Link key={item} href={item === 'Marketplace' ? '/marketplace' : '/dashboard'}>
                <button style={{ color: item === 'Marketplace' ? '#a5b4fc' : 'rgba(255,255,255,0.6)', background: item === 'Marketplace' ? 'rgba(99,102,241,0.15)' : 'none', border: 'none', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{item}</button>
              </Link>
            ))}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16, marginLeft: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{user.username}</span>
                <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Logout</button>
              </div>
            ) : (
              <Link href="/login">
                <button style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Login</button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ padding: '48px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>Marketplace</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 32 }}>Discover and buy student projects at the best prices</p>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
              <input
                placeholder="Search projects by title, category, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              <Search size={16} /> Search
            </button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <Filter size={16} /> Filters {showFilters && <X size={14} />}
            </button>
          </div>
        </form>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 80px', display: 'flex', gap: 32 }}>

        {/* SIDEBAR */}
        {showFilters && (
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 20, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['All Categories', ...CATEGORIES].map((cat) => {
                  const val = cat === 'All Categories' ? '' : cat;
                  const active = selectedCategory === val;
                  return (
                    <button key={cat} onClick={() => { setSelectedCategory(val); setPage(1); }}
                      style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400, background: active ? 'rgba(99,102,241,0.25)' : 'transparent', color: active ? '#a5b4fc' : 'rgba(255,255,255,0.55)', transition: 'all 0.15s' }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* GRID */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 240, background: 'rgba(255,255,255,0.04)', borderRadius: 16, animation: 'pulse 2s infinite' }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.4)' }}>
              <p style={{ fontSize: 18, marginBottom: 16 }}>No projects found</p>
              <button onClick={() => { setSelectedCategory(''); setSearchTerm(''); setPage(1); fetchProjects(); }}
                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
                {projects.map((project: any) => (
                  <Link key={project._id} href={`/project/${project._id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 18, padding: 24, cursor: 'pointer', height: '100%', boxSizing: 'border-box',
                      transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column'
                    }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.borderColor = 'rgba(99,102,241,0.45)'; el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)'; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.borderColor = 'rgba(255,255,255,0.09)'; el.style.boxShadow = 'none'; }}>
                      <span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-block', marginBottom: 14 }}>{project.category}</span>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{project.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 14, lineHeight: 1.6, flex: 1 }}>{project.description?.slice(0, 90)}...</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 14 }}>by <span
                        style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, cursor: 'pointer' }}
                        onClick={(e) => { e.preventDefault(); router.push(`/profile/${project.sellerUsername}`); }}>
                        {project.sellerUsername}
                      </span></p>
                      {project.metadata?.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                          {project.metadata.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 13 }}><Star size={13} fill="#fbbf24" />{project.rating || 0}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}><Download size={13} />{project.downloads}</span>
                        </div>
                        <span style={{ color: '#a5b4fc', fontWeight: 800, fontSize: 20 }}>₹{project.price}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                    style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: 14 }}>← Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: page === p ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>{p}</button>
                  ))}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                    style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, fontSize: 14 }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
