'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileUp, AlertCircle, CheckCircle, Github, Search, Globe, Lock, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FieldGroup, FieldLabel } from '@/components/ui/field';

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Python',
  'JavaScript',
  'React',
  'Database Design',
  'Cloud Computing',
  'Other',
];

type UploadMethod = 'manual' | 'github';

export default function UploadProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [method, setMethod] = useState<UploadMethod>('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Manual Upload State
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // GitHub Import State
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [repoPreview, setRepoPreview] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    tags: '',
    language: '',
    framework: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchRepoInfo = async () => {
    if (!githubUrl) return;
    setError('');
    setFetchingRepo(true);
    setRepoPreview(null);

    try {
      // Basic extraction for preview
      const regex = /(?:github\.com\/)([^\/]+)\/([^\/\s#\?]+)/;
      const match = githubUrl.match(regex);
      if (!match) {
        setError('Invalid GitHub URL format');
        return;
      }
      const [_, owner, repo] = match;
      const cleanRepo = repo.replace('.git', '');

      const res = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
      if (!res.ok) throw new Error('Repository not found or private');
      
      const data = await res.json();
      setRepoPreview(data);
      
      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        title: data.name.charAt(0).toUpperCase() + data.name.slice(1).replace(/-/g, ' '),
        description: data.description || '',
        language: data.language || '',
        tags: data.topics?.join(', ') || ''
      }));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository info');
    } finally {
      setFetchingRepo(false);
    }
  };

  const uploadFileToServer = async (file: File) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload,
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Upload failed');
      setUploading(false);
      setSuccess('');
      return;
    }

    setUploadedFile(data.data);
    setSuccess('Uploaded successfully!');
    setUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }

    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.zip')) {
      setError('Invalid file type. Only ZIP, RAR, 7Z, and PDF files are allowed');
      return;
    }

    setError('');
    setUploading(true);
    setSuccess('Uploading file...');

    try {
      await uploadFileToServer(file);
    } catch (err) {
      setError('Failed to upload file');
      setSuccess('');
      setUploading(false);
    }
  };

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError('');
    setUploading(true);
    setSuccess('Zipping folder locally, please wait...');

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      let totalSize = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        totalSize += file.size;
        
        const path = file.webkitRelativePath || file.name;
        if (!path.includes('node_modules') && !path.includes('.git/')) {
           zip.file(path, file);
        }
      }

      if (totalSize > 100 * 1024 * 1024) {
        throw new Error('Folder size exceeds 100MB limit');
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const folderName = files[0].webkitRelativePath?.split('/')[0] || 'project';
      const zipFile = new File([blob], `${folderName}.zip`, { type: 'application/zip' });

      setSuccess('Uploading zipped folder...');
      await uploadFileToServer(zipFile);
    } catch (err: any) {
      setError(err.message || 'Failed to zip and upload folder');
      setSuccess('');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (method === 'manual' && !uploadedFile) {
      setError('Please upload a file');
      return;
    }

    if (method === 'github' && !githubUrl) {
      setError('Please provide a GitHub URL');
      return;
    }

    if (!formData.title.trim()) {
      setError('Project title is required');
      return;
    }

    if (!formData.description.trim() || formData.description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiPath = method === 'github' ? '/api/github/import' : '/api/projects';
      const payload = method === 'github' 
        ? {
            githubUrl,
            price: parseFloat(formData.price),
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            title: formData.title,
            description: formData.description
          }
        : {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            price: parseFloat(formData.price),
            fileUrl: uploadedFile.fileUrl,
            fileKey: uploadedFile.fileKey,
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            metadata: {
              tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
              language: formData.language || undefined,
              framework: formData.framework || undefined,
            },
          };

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to process project');
        return;
      }

      setSuccess(method === 'github' ? 'Repository imported and published!' : 'Project uploaded successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <div className="bg-[#0f172a] text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors">
            <Github size={18} className="rotate-180" />
            <span className="font-bold">Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Create Listing</h1>
          <p className="text-white/40 text-lg font-medium">Choose how you want to share your project with the community.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-0 shadow-2xl rounded-[32px]">
              {/* Method Switcher */}
              <div className="flex p-2 bg-gray-100/50">
                <button 
                  onClick={() => setMethod('manual')}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                    method === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'
                  }`}
                >
                  <FileUp size={20} />
                  Manual Upload
                </button>
                <button 
                  onClick={() => setMethod('github')}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                    method === 'github' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'
                  }`}
                >
                  <Github size={20} />
                  GitHub Import
                </button>
              </div>

              <div className="p-8 md:p-10">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-bold">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-bold">{success}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {/* Step 1: Source */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">1</div>
                      <h2 className="text-xl font-black">Project Source</h2>
                    </div>

                    {method === 'manual' ? (
                      <div className="group relative">
                        <div className={`border-2 border-dashed rounded-[32px] p-10 transition-all ${
                          uploadedFile ? 'bg-blue-50/50 border-blue-200' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
                        }`}>
                          {uploadedFile ? (
                            <div className="flex items-center gap-6">
                              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                                <FileUp className="w-10 h-10 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-black">{uploadedFile.fileName}</p>
                                <p className="text-blue-600 font-bold text-sm">
                                  {(uploadedFile.fileSize / (1024 * 1024)).toFixed(2)} MB • Ready to publish
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                className="rounded-2xl font-bold text-gray-400 hover:text-red-500"
                                onClick={() => setUploadedFile(null)}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                              <h3 className="text-lg font-black mb-2">Drag & drop your code</h3>
                              <p className="text-gray-400 font-medium mb-8">ZIP, RAR, 7Z, or PDF up to 100MB</p>
                              
                              <div className="flex flex-wrap justify-center gap-4">
                                <Button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="bg-blue-600 hover:bg-blue-700 h-12 px-8 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
                                >
                                  {uploading ? 'Uploading...' : 'Choose File'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => folderInputRef.current?.click()}
                                  disabled={uploading}
                                  className="h-12 px-8 rounded-2xl font-bold border-gray-200"
                                >
                                  {uploading ? 'Zipping...' : 'Choose Folder'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} accept=".zip,.rar,.7z,.pdf" />
                        <input ref={folderInputRef} type="file" hidden onChange={handleFolderSelect} {...{webkitdirectory: "true", directory: "true", multiple: true} as any} />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="relative group">
                          <Github className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
                          <Input
                            type="text"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            onBlur={fetchRepoInfo}
                            placeholder="https://github.com/username/repository"
                            className="h-16 pl-14 pr-32 rounded-2xl border-gray-200 focus:ring-blue-500 font-bold bg-gray-50/50"
                          />
                          <Button
                            type="button"
                            onClick={fetchRepoInfo}
                            disabled={fetchingRepo || !githubUrl}
                            className="absolute right-2 top-2 bottom-2 bg-white hover:bg-gray-50 text-blue-600 px-6 rounded-xl font-bold border border-gray-100 shadow-sm"
                          >
                            {fetchingRepo ? 'Fetching...' : 'Fetch Repo'}
                          </Button>
                        </div>
                        
                        {repoPreview && (
                          <div className="bg-gray-50 border border-gray-100 p-6 rounded-[28px] animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                                  <Globe className="text-blue-600" size={24} />
                                </div>
                                <div>
                                  <h4 className="font-black text-lg">{repoPreview.name}</h4>
                                  <div className="flex items-center gap-3 text-sm font-bold text-gray-400 mt-1">
                                    <span className="flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> {repoPreview.stargazers_count} stars</span>
                                    <span>•</span>
                                    <span>{repoPreview.language || 'Multiple'}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Verified Repo</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{repoPreview.description || 'No description provided.'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Step 2: Content */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">2</div>
                      <h2 className="text-xl font-black">Project Details</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FieldGroup className="md:col-span-2">
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Project Title</FieldLabel>
                        <Input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., React Todo App with Redux"
                          className="h-14 rounded-2xl border-gray-200 focus:ring-blue-500 font-bold"
                          required
                        />
                      </FieldGroup>

                      <FieldGroup className="md:col-span-2">
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Description</FieldLabel>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your project, features, and what's included..."
                          rows={6}
                          className="w-full px-5 py-4 border border-gray-200 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed bg-gray-50/30"
                          required
                        />
                        <div className="flex justify-between mt-3 px-2">
                          <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">At least 20 characters</p>
                          <p className="text-[10px] text-gray-400 font-black tracking-widest">{formData.description.length}/2000</p>
                        </div>
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Category</FieldLabel>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full h-14 px-5 border border-gray-200 rounded-2xl focus:ring-blue-500 font-bold appearance-none bg-white"
                          required
                        >
                          <option value="">Select Category</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Price (₹)</FieldLabel>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 text-lg">₹</span>
                          <Input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="299"
                            className="h-14 pl-12 rounded-2xl border-gray-200 focus:ring-blue-500 font-black text-lg"
                            min="1"
                            required
                          />
                        </div>
                      </FieldGroup>
                    </div>
                  </section>

                  {/* Step 3: Meta */}
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm">3</div>
                      <h2 className="text-xl font-black">Optimization (Optional)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FieldGroup className="md:col-span-2">
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Tags (comma-separated)</FieldLabel>
                        <Input
                          type="text"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="React, JavaScript, CSS, Node.js"
                          className="h-14 rounded-2xl border-gray-200 font-bold"
                        />
                      </FieldGroup>
                      
                      <FieldGroup>
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Language</FieldLabel>
                        <Input
                          type="text"
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="h-14 rounded-2xl border-gray-200 font-bold"
                        />
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Framework</FieldLabel>
                        <Input
                          type="text"
                          name="framework"
                          value={formData.framework}
                          onChange={handleInputChange}
                          className="h-14 rounded-2xl border-gray-200 font-bold"
                        />
                      </FieldGroup>
                    </div>
                  </section>

                  {/* Action */}
                  <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                    <Button
                      type="submit"
                      disabled={loading || uploading || (method === 'manual' && !uploadedFile) || (method === 'github' && !githubUrl)}
                      className="flex-1 h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-2xl shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <>Processing...</>
                      ) : (
                        <div className="flex items-center gap-3">
                          Publish Listing <ArrowRight size={20} />
                        </div>
                      )}
                    </Button>
                    <Link href="/dashboard" className="sm:w-1/3">
                      <Button variant="ghost" type="button" className="w-full h-16 rounded-[24px] font-bold text-gray-400 hover:bg-gray-100">
                        Discard
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6">
            <Card className="p-8 border-0 shadow-lg rounded-[32px] bg-blue-600 text-white">
              <h3 className="text-xl font-black mb-6">Why GitHub Import?</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Zap size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">Lightning Fast</p>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">Import projects in seconds by simply pasting a URL.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Lock size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">Secure Snapshots</p>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">We snapshot your code at import to ensure buyers always have access.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0"><Github size={18} /></div>
                  <div>
                    <p className="font-bold text-sm">Repo Details</p>
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">We automatically fetch details like stars, language and readme.</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-0 shadow-lg rounded-[32px]">
              <h3 className="font-black mb-4">Upload Guidelines</h3>
              <div className="space-y-4 text-sm font-bold text-gray-500">
                <p>• Only upload complete work.</p>
                <p>• Avoid including node_modules or secret API keys.</p>
                <p>• Provide a clear description and README for buyers.</p>
                <p>• Ensure category and price match the value provided.</p>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
