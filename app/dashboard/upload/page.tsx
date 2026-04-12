'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
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

export default function UploadProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

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

    if (!uploadedFile) {
      setError('Please upload a file');
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

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          fileUrl: uploadedFile.fileUrl,
          fileKey: uploadedFile.fileKey,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          metadata: {
            tags: formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
            language: formData.language || undefined,
            framework: formData.framework || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }

      setSuccess('Project uploaded successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <span className="font-bold text-lg">Student Hub</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2">Upload Project</h1>
          <p className="text-gray-600 mb-8">Share your project with students worldwide</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Step 1: Upload File</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                {uploadedFile ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{uploadedFile.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {(uploadedFile.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 mb-2 font-semibold">Drop your file here</p>
                    <p className="text-gray-600 text-sm mb-4">
                      or click to browse (ZIP, RAR, 7Z, PDF up to 100MB)
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Choose File'}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => folderInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {uploading ? 'Zipping...' : 'Choose Folder'}
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={handleFileSelect}
                  accept=".zip,.rar,.7z,.pdf"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  hidden
                  onChange={handleFolderSelect}
                  {...{webkitdirectory: "true", directory: "true", multiple: true} as any}
                />
              </div>
            </div>

            {/* Project Details */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Step 2: Project Details</h2>

              <FieldGroup>
                <FieldLabel>Project Title *</FieldLabel>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., React Todo App with Redux"
                  maxLength={200}
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Description *</FieldLabel>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project, features, and what's included..."
                  rows={5}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">
                  {formData.description.length}/2000
                </p>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Category *</FieldLabel>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Tags (comma-separated)</FieldLabel>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., React, JavaScript, CSS, Node.js"
                />
              </FieldGroup>

              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <FieldLabel>Language</FieldLabel>
                  <Input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    placeholder="e.g., JavaScript, Python, Java"
                  />
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Framework/Library</FieldLabel>
                  <Input
                    type="text"
                    name="framework"
                    value={formData.framework}
                    onChange={handleInputChange}
                    placeholder="e.g., React, Django, Laravel"
                  />
                </FieldGroup>
              </div>

              <FieldGroup>
                <FieldLabel>Price (₹) *</FieldLabel>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 299"
                  min="1"
                  step="1"
                  required
                />
              </FieldGroup>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-8 border-t">
              <Link href="/dashboard" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading || uploading || !uploadedFile}
              >
                {loading ? 'Publishing...' : 'Publish Project'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
