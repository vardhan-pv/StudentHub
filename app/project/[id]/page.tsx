'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Download, ShoppingCart, ArrowLeft } from 'lucide-react';
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
      setUser(JSON.parse(storedUser));
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
    router.push(`/dashboard/messages?projectId=${projectId}&sellerId=${project.sellerId}&sellerUsername=${project.sellerUsername}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-600 mb-4">{error || 'Project not found'}</p>
        <Link href="/marketplace">
          <Button className="bg-blue-600 hover:bg-blue-700">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/marketplace" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <span className="font-bold text-lg">Student Hub</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <Card className="p-6 mb-6">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {project.category}
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{project.title}</h1>

              <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                <Link href={`/seller/${project.sellerId}`} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <span className="font-bold text-blue-600">
                      {project.sellerUsername.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold hover:underline">{project.sellerUsername}</p>
                    <p className="text-sm text-gray-600">Seller</p>
                  </div>
                </Link>

                <div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{project.rating || 0}</span>
                    <span className="text-gray-600">({project.reviews || 0} reviews)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">{project.downloads} downloads</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
              </div>

              {project.metadata?.tags && project.metadata.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.metadata.tags.map((tag: string) => (
                      <span key={tag} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.metadata?.language && (
                  <div>
                    <p className="text-sm text-gray-600">Language</p>
                    <p className="font-semibold">{project.metadata.language}</p>
                  </div>
                )}
                {project.metadata?.framework && (
                  <div>
                    <p className="text-sm text-gray-600">Framework</p>
                    <p className="font-semibold">{project.metadata.framework}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">File Size</p>
                  <p className="font-semibold">{(project.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Posted</p>
                  <p className="font-semibold">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Purchase Card */}
          <div>
            <Card className="p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">₹{project.price}</div>
                <p className="text-gray-600">One-time payment</p>
              </div>

              <Button
                onClick={handleBuyNow}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg mb-4 flex items-center justify-center gap-2 shadow-sm"
              >
                Contact Seller
              </Button>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Instant Download</p>
                    <p className="text-gray-600">Get access immediately after purchase</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">5 Downloads</p>
                    <p className="text-gray-600">Download 5 times within 30 days</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t text-xs text-gray-600">
                <p>By purchasing, you agree to our Terms of Service and accept the student code of conduct.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
