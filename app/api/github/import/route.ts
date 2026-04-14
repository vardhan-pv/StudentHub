import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';
import { uploadToS3 } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');
    if (!valid) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }
    const userId = (tokenData as any).userId;

    // 2. Parse body
    const { githubUrl, price, category, tags } = await request.json();

    if (!githubUrl || !price || !category) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 });
    }

    // 3. Extract owner/repo
    // Regex matches: https://github.com/owner/repo or github.com/owner/repo
    const regex = /(?:github\.com\/)([^\/]+)\/([^\/\s#\?]+)/;
    const match = githubUrl.match(regex);
    if (!match) {
      return NextResponse.json(errorResponse('Invalid GitHub URL'), { status: 400 });
    }

    const [_, owner, repoName] = match;
    const cleanRepoName = repoName.replace('.git', '');

    // 4. Fetch repository info from GitHub
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
      headers: { 'User-Agent': 'StudentHub-App' }
    });

    if (!repoInfoRes.ok) {
      return NextResponse.json(errorResponse('Failed to fetch repository info from GitHub'), { status: 400 });
    }

    const repoData = await repoInfoRes.json();
    const title = repoData.name;
    const description = repoData.description || `Automatic import of ${repoData.full_name} from GitHub.`;
    const defaultBranch = repoData.default_branch || 'main';

    // 5. Download the ZIP file
    const zipUrl = `https://github.com/${owner}/${cleanRepoName}/archive/refs/heads/${defaultBranch}.zip`;
    const zipRes = await fetch(zipUrl);

    if (!zipRes.ok) {
      return NextResponse.json(errorResponse('Failed to download repository ZIP from GitHub'), { status: 400 });
    }

    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to our storage (using existing S3 logic)
    const { key, url } = await uploadToS3(buffer, `${cleanRepoName}.zip`, 'application/zip');

    // 7. Create project in Supabase
    const { supabase } = await import('@/lib/supabase');
    
    // Get user info for username
    const { data: user } = await supabase.from('users').select('username').eq('id', userId).single();

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        title: title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' '),
        description,
        category,
        price: parseFloat(price),
        file_url: url,
        file_key: key,
        file_name: `${cleanRepoName}.zip`,
        file_size: buffer.length,
        seller_id: userId,
        seller_username: user?.username || 'Unknown',
        tags: tags || [],
        language: repoData.language || undefined,
        framework: undefined, // Could be parsed later
        tech_stack: repoData.topics || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Import insert error:', insertError);
      return NextResponse.json(errorResponse('Failed to save project to database'), { status: 500 });
    }

    return NextResponse.json(successResponse(project, 'Repository imported successfully!'), { status: 201 });

  } catch (error) {
    console.error('GitHub Import Error:', error);
    return NextResponse.json(errorResponse('An unexpected error occurred during import'), { status: 500 });
  }
}
