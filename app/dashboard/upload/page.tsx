'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileUp, AlertCircle, CheckCircle, Github, Search, Globe, Lock, ArrowRight, Zap, Loader2, Code2, Sparkles, BrainCircuit, Wand2 } from 'lucide-react';
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
  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // Auto-trigger GitHub fetch on paste/input change
  useEffect(() => {
    if (method !== 'github' || !githubUrl) return;

    const regex = /(?:github\.com\/)([^\/]+)\/([^\/\s#\?]+)/;
    if (!regex.test(githubUrl)) return;

    const timer = setTimeout(() => {
      fetchRepoInfo();
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [githubUrl, method]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateAIDescription = async (owner: string, repo: string, title: string, framework: string, language: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
      if (!res.ok) throw new Error('No readme');
      
      const data = await res.json();
      const rawReadme = atob(data.content);
      
      // Smart Analysis Logic:
      // 1. Extract first paragraph that isn't a heading
      // 2. Extract bullet points from a "Features" or "overview" section
      
      const lines = rawReadme.split('\n');
      let featurePoints: string[] = [];
      let summary = '';
      
      let inFeatures = false;
      for (const line of lines) {
        const clean = line.trim();
        // Look for feature section
        if (clean.toLowerCase().includes('feature') || clean.toLowerCase().includes('functionality')) {
          inFeatures = true;
          continue;
        }
        if (inFeatures && (clean.startsWith('-') || clean.startsWith('*'))) {
          featurePoints.push(clean.substring(1).trim());
          if (featurePoints.length > 5) inFeatures = false; // Limit bullet points
        }
        // Grab early descriptive text
        if (!summary && clean.length > 50 && !clean.startsWith('#') && !clean.startsWith('!')) {
          summary = clean;
        }
      }

      // Format as professional Student Hub description
      const finalDesc = `🚀 ${title} - ${framework || language} Project\n\n${summary || 'A professional repository snapshot automatically imported from GitHub.'}\n\n✨ Key Features:\n${featurePoints.length > 0 
        ? featurePoints.map(p => `• ${p}`).join('\n') 
        : `• Clean and optimized ${language} implementation\n• Modular architecture for easy customization\n• Fully functional and well-documented code`}\n\n🛠️ Setup & Usage:\nRefer to the included files for detailed installation instructions. Perfect for students and developers looking to jumpstart their project.`;

      setFormData(prev => ({ ...prev, description: finalDesc }));
    } catch (e) {
      // Fallback description if no README
      const fallback = `Experience this high-quality ${framework || language} project: ${title}. \n\nThis project features a clean architecture, professional code standards, and is perfectly suited for learning or production use. \n\nIncludes:\n• Full source code snapshot\n• ${language} implementation\n• Ready-to-deploy structure`;
      setFormData(prev => ({ ...prev, description: fallback }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectFrameworkAndCategory = async (owner: string, repo: string, defaultLang: string) => {
    setIsDeepScanning(true);
    let detectedFramework = '';
    let detectedTags: string[] = [];
    let detectedCategory = 'Web Development';

    try {
      // 1. Try to fetch package.json for JS/TS
      const pkgRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`);
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        const content = JSON.parse(atob(pkgData.content));
        const deps = { ...(content.dependencies || {}), ...(content.devDependencies || {}) };

        if (deps['next']) detectedFramework = 'Next.js';
        else if (deps['react']) detectedFramework = 'React';
        else if (deps['vue']) detectedFramework = 'Vue.js';
        else if (deps['@angular/core']) detectedFramework = 'Angular';
        else if (deps['express']) detectedFramework = 'Express.js';
        
        if (deps['tailwindcss']) detectedTags.push('Tailwind CSS');
        if (deps['typescript']) detectedTags.push('TypeScript');
      }

      // 2. Try to fetch manage.py or requirements.txt for Python
      if (!detectedFramework) {
        const manageRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/manage.py`);
        if (manageRes.ok) {
           detectedFramework = 'Django';
           detectedCategory = 'Python';
        } else {
           const reqRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`);
           if (reqRes.ok) {
             const reqData = await reqRes.json();
             const content = atob(reqData.content);
             if (content.includes('flask')) {
               detectedFramework = 'Flask';
               detectedCategory = 'Python';
             }
           }
        }
      }

      // 3. Fallback/Adjust Category
      if (defaultLang === 'Jupyter Notebook' || defaultLang === 'Python' && !detectedFramework) {
        detectedCategory = 'Data Science';
      } else if (defaultLang === 'Java' || defaultLang === 'Kotlin' || defaultLang === 'Swift') {
        detectedCategory = 'Mobile Development';
      }

    } catch (e) {
      console.warn('Deep scanning partially failed:', e);
    } finally {
      setIsDeepScanning(false);
    }

    return { detectedFramework, detectedTags, detectedCategory };
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
      
      // Deep Scan for Frameworks
      const { detectedFramework, detectedTags, detectedCategory } = await detectFrameworkAndCategory(owner, cleanRepo, data.language);

      const title = data.name.charAt(0).toUpperCase() + data.name.slice(1).replace(/-/g, ' ');

      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        title,
        language: data.language || '',
        framework: detectedFramework || prev.framework,
        category: detectedCategory,
        tags: [...(data.topics || []), ...detectedTags].join(', ')
      }));

      // Generate AI Description
      generateAIDescription(owner, cleanRepo, title, detectedFramework || '', data.language || '');

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
            description: formData.description,
            framework: formData.framework
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
    <div className="min-h-screen bg-white font-sans">
      {/* Premium Header */}
      <div className="bg-[#0f172a] text-white py-14 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-all group">
            <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-tight">Return to Dashboard</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight">Create Listing</h1>
              <p className="text-white/40 text-lg md:text-xl font-medium max-w-xl">Share your specialized projects and start earning from your expertise.</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-[28px] backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Listing Type</p>
                <p className="font-black text-lg">{method === 'manual' ? 'Standard Upload' : 'Smart GitHub Import'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 pb-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="overflow-hidden border-0 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[40px] bg-white">
              
              {/* Intelligent Method Switcher */}
              <div className="flex p-3 bg-gray-50/80 border-b border-gray-100/50">
                <button 
                  onClick={() => setMethod('manual')}
                  className={`flex-1 py-4 px-6 rounded-[24px] font-black transition-all flex items-center justify-center gap-3 text-sm tracking-tight ${
                    method === 'manual' ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.08)] scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50 scale-95'
                  }`}
                >
                  <FileUp size={18} />
                  Manual Upload
                </button>
                <button 
                  onClick={() => setMethod('github')}
                  className={`flex-1 py-4 px-6 rounded-[24px] font-black transition-all flex items-center justify-center gap-3 text-sm tracking-tight ${
                    method === 'github' ? 'bg-white text-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.08)] scale-100' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50 scale-95'
                  }`}
                >
                  <Github size={18} />
                  Smart GitHub Import
                </button>
              </div>

              <div className="p-8 md:p-12">
                {error && (
                  <div className="bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 px-8 py-5 rounded-[28px] mb-10 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-black tracking-tight">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 text-emerald-600 px-8 py-5 rounded-[28px] mb-10 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-black tracking-tight">{success}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-16">
                  
                  {/* Step 1: Source */}
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black text-sm">1</div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Source Material</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Where is the code located?</p>
                      </div>
                    </div>

                    {method === 'manual' ? (
                      <div className="group relative">
                        <div className={`border-2 border-dashed rounded-[40px] p-12 transition-all duration-500 ${
                          uploadedFile ? 'bg-blue-50/30 border-blue-400 shadow-inner' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/80'
                        }`}>
                          {uploadedFile ? (
                            <div className="flex items-center gap-8">
                              <div className="w-24 h-24 bg-blue-600 rounded-[30px] flex items-center justify-center shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)]">
                                <FileUp className="w-12 h-12 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xl font-black tracking-tight">{uploadedFile.fileName}</p>
                                <p className="text-blue-600 font-black text-sm mt-1">
                                  {(uploadedFile.fileSize / (1024 * 1024)).toFixed(2)} MB • Package verified
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                className="rounded-2xl font-black text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all px-6 h-12"
                                onClick={() => setUploadedFile(null)}
                              >
                                Replace
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-500">
                                <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <h3 className="text-xl font-black tracking-tight mb-2">Package your project</h3>
                              <p className="text-gray-400 font-bold text-sm mb-10">Upload ZIP, RAR, 7Z, or PDF (Max 100MB)</p>
                              
                              <div className="flex flex-wrap justify-center gap-4">
                                <Button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploading}
                                  className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-[20px] font-black text-sm tracking-tight shadow-[0_12px_24px_-8px_rgba(37,99,235,0.3)] hover:translate-y-[-2px] transition-all"
                                >
                                  {uploading ? 'Processing...' : 'Browse Local Files'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => folderInputRef.current?.click()}
                                  disabled={uploading}
                                  className="h-14 px-10 rounded-[20px] font-black text-sm tracking-tight border-gray-200 hover:bg-gray-50 transition-all"
                                >
                                  {uploading ? 'Zipping...' : 'Select Folder'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} accept=".zip,.rar,.7z,.pdf" />
                        <input ref={folderInputRef} type="file" hidden onChange={handleFolderSelect} {...{webkitdirectory: "true", directory: "true", multiple: true} as any} />
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="relative group">
                          <Github className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors duration-300" size={26} />
                          <Input
                            type="text"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            placeholder="Paste GitHub Repository URL..."
                            className="h-20 pl-16 pr-40 rounded-[28px] border-gray-100 focus:ring-blue-500 font-black text-lg bg-gray-50/50 shadow-inner group-hover:bg-gray-50 transition-all"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             {fetchingRepo && (
                               <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl animate-pulse">
                                 <Loader2 size={16} className="animate-spin" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Scanning</span>
                               </div>
                             )}
                             <Button
                                type="button"
                                onClick={fetchRepoInfo}
                                disabled={fetchingRepo || !githubUrl}
                                className="bg-white hover:bg-gray-50 text-blue-600 px-8 h-14 rounded-2xl font-black border border-gray-100 shadow-sm transition-all active:scale-95"
                              >
                                {isDeepScanning ? 'AI Scan...' : 'Import'}
                              </Button>
                          </div>
                        </div>
                        
                        {repoPreview && (
                          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 rounded-[40px] shadow-xl shadow-gray-200/20 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden group">
                            
                            {/* Deep Scan Loading Overlay */}
                            {(isDeepScanning || isAnalyzing) && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-4">
                                <BrainCircuit size={44} className="text-blue-600 animate-pulse" />
                                <div className="text-center">
                                  <p className="font-black text-blue-600 text-sm tracking-widest uppercase mb-1">
                                    {isDeepScanning ? 'Deep Scanning Tech Stack...' : 'AI Analyzing Project...'}
                                  </p>
                                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Building professional description</p>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                              <div className="flex items-center gap-5">
                                <div className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-50 group-hover:rotate-6 transition-transform duration-500">
                                  <Globe className="text-blue-600" size={28} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-black text-2xl tracking-tight">{repoPreview.name}</h4>
                                  <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Zap size={14} className="text-yellow-500 fill-yellow-500" /> {repoPreview.stargazers_count} stars</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-200" />
                                    <span>{repoPreview.language || 'Multiple'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {formData.framework && (
                                  <span className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                                    <Sparkles size={12} /> {formData.framework} Detected
                                  </span>
                                )}
                                <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">Verified Repo</span>
                              </div>
                            </div>
                            <div className="pt-6 border-t border-gray-100/50">
                              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-3">Repository Summary</p>
                              <p className="text-gray-500 font-medium leading-relaxed">{repoPreview.description || 'No description provided.'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Step 2: Content */}
                  <section>
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black text-sm">2</div>
                        <div>
                          <h2 className="text-2xl font-black tracking-tight">Project Presentation</h2>
                          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">What are you selling?</p>
                        </div>
                      </div>
                      
                      {method === 'github' && (
                        <Button 
                          type="button"
                          onClick={fetchRepoInfo}
                          disabled={isAnalyzing || !repoPreview}
                          className="h-10 px-5 rounded-xl border border-blue-100 text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                        >
                          <Wand2 size={14} /> Regenerate with AI
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FieldGroup className="md:col-span-2">
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Project Title *</FieldLabel>
                        <Input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Professional React SaaS Dashboard"
                          className="h-16 rounded-[22px] border-gray-100 focus:ring-blue-500 font-black text-lg bg-gray-50/20"
                          required
                        />
                      </FieldGroup>

                      <FieldGroup className="md:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                           <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">Smart Description *</FieldLabel>
                           {isAnalyzing && (
                              <div className="flex items-center gap-2 text-blue-600 animate-pulse">
                                 <Sparkles size={12} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">AI Writing...</span>
                              </div>
                           )}
                        </div>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="What makes this project special? List features, tech stack, and setup instructions..."
                          rows={12}
                          className={`w-full px-8 py-6 border border-gray-100 rounded-[36px] focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed bg-gray-50/20 text-gray-600 transition-all ${isAnalyzing ? 'opacity-40 blur-[1px]' : 'opacity-100'}`}
                          required
                        />
                        <div className="flex justify-between mt-4 px-3">
                          <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Min. 20 Chars</p>
                          <p className="text-[10px] text-gray-400 font-black tracking-widest">{formData.description.length} / 2000</p>
                        </div>
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Category *</FieldLabel>
                        <div className="relative">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full h-16 px-6 border border-gray-100 rounded-[22px] focus:ring-blue-500 font-black text-sm appearance-none bg-gray-50/20 pr-12"
                            required
                          >
                            <option value="">Select Primary Field</option>
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <ArrowRight size={16} className="rotate-90" />
                          </div>
                        </div>
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Valuation (₹) *</FieldLabel>
                        <div className="relative">
                          <span className="absolute left-7 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl">₹</span>
                          <Input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="499"
                            className="h-16 pl-14 rounded-[22px] border-gray-100 focus:ring-blue-500 font-black text-xl bg-gray-50/20"
                            min="1"
                            required
                          />
                        </div>
                      </FieldGroup>
                    </div>
                  </section>

                  {/* Step 3: Meta */}
                  <section>
                     <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-black text-sm">3</div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">Tech Classification</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Refine your listing's reach</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FieldGroup className="md:col-span-2">
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Tech Stack / Tags</FieldLabel>
                        <Input
                          type="text"
                          name="tags"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="e.g., React, TypeScript, Node.js, Stripe"
                          className="h-16 rounded-[22px] border-gray-100 font-black text-sm bg-gray-50/20"
                        />
                      </FieldGroup>
                      
                      <FieldGroup>
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Primary Language</FieldLabel>
                        <Input
                          type="text"
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          className="h-16 rounded-[22px] border-gray-100 font-black text-sm bg-gray-50/20"
                          placeholder="Auto-detected or Enter..."
                        />
                      </FieldGroup>

                      <FieldGroup>
                        <FieldLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 block">Framework</FieldLabel>
                        <Input
                          type="text"
                          name="framework"
                          value={formData.framework}
                          onChange={handleInputChange}
                          className="h-16 rounded-[22px] border-gray-100 font-black text-sm bg-gray-50/20 text-blue-600"
                          placeholder="Detecting..."
                        />
                      </FieldGroup>
                    </div>
                  </section>

                  {/* Global Actions */}
                  <div className="pt-12 border-t border-gray-100 flex flex-col sm:flex-row gap-6">
                    <Button
                      type="submit"
                      disabled={loading || uploading || (method === 'manual' && !uploadedFile) || (method === 'github' && !githubUrl)}
                      className="flex-[2] h-20 rounded-[30px] bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-[0_24px_48px_-12px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4 group"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={24} />
                          Finalizing Listing...
                        </>
                      ) : (
                        <>
                          Launch Project <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="ghost" type="button" className="w-full h-20 rounded-[30px] font-black text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </Card>
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-8">
            <Card className="p-10 border-0 shadow-2xl rounded-[40px] bg-blue-600 text-white relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <h3 className="text-2xl font-black mb-8 tracking-tight">Smart Import</h3>
              <ul className="space-y-8 relative z-10">
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Zap size={22} /></div>
                  <div>
                    <p className="font-black text-sm">Instant Detect</p>
                    <p className="text-white/60 text-xs mt-1.5 font-bold leading-relaxed">Just paste the link — we'll handle the rest automatically.</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><Code2 size={22} /></div>
                  <div>
                    <p className="font-black text-sm">AI Tech Scan</p>
                    <p className="text-white/60 text-xs mt-1.5 font-bold leading-relaxed">We read manifest files to detect frameworks like React & Django.</p>
                  </div>
                </li>
                <li className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10"><BrainCircuit size={22} /></div>
                  <div>
                    <p className="font-black text-sm">AI Content Engine</p>
                    <p className="text-white/60 text-xs mt-1.5 font-bold leading-relaxed">Our AI analyzes your README to write professional sales descriptions.</p>
                  </div>
                </li>
              </ul>
            </Card>

            <Card className="p-10 border-0 shadow-xl rounded-[40px] bg-gray-50/50">
              <h3 className="font-black text-lg mb-6 tracking-tight">Selling Tips</h3>
              <div className="space-y-6 text-sm font-bold text-gray-500 leading-relaxed">
                <div className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                   <p>Use high-quality screenshots in your description text.</p>
                </div>
                <div className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                   <p>Mention if you offer setup support to justify a higher price.</p>
                </div>
                <div className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                   <p>Categorize correctly to ensure your project reaches your target audience.</p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
