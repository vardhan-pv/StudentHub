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
    const body = await request.json();
    const { githubUrl, price, category, tags, title: bodyTitle, description: bodyDescription, framework: bodyFramework } = body;

    if (!githubUrl || !price || !category) {
      return NextResponse.json(errorResponse('Missing required fields (URL, Price, or Category)'), { status: 400 });
    }

    // 3. Extract owner/repo
    const regex = /(?:github\.com\/)([^\/]+)\/([^\/\s#\?]+)/;
    const match = githubUrl.match(regex);
    if (!match) {
      return NextResponse.json(errorResponse('Invalid GitHub URL format'), { status: 400 });
    }

    const [_, owner, repoName] = match;
    const cleanRepoName = repoName.replace('.git', '');

    // 4. Fetch repository info from GitHub
    console.log(`[IMPORT] Fetching metadata for ${owner}/${cleanRepoName}`);
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
      headers: { 'User-Agent': 'StudentHub-App' }
    });

    if (!repoInfoRes.ok) {
      const errText = await repoInfoRes.text();
      console.error('[IMPORT] GitHub Metadata Fetch Failed:', errText);
      return NextResponse.json(errorResponse('Failed to fetch repository info from GitHub. Ensure the repo is public.'), { status: 400 });
    }

    const repoData = await repoInfoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    // 5. Download the ZIP file
    console.log(`[IMPORT] Downloading ZIP from ${defaultBranch} branch`);
    const zipUrl = `https://github.com/${owner}/${cleanRepoName}/archive/refs/heads/${defaultBranch}.zip`;
    const zipRes = await fetch(zipUrl);

    if (!zipRes.ok) {
      console.error('[IMPORT] ZIP Download Failed:', zipUrl);
      return NextResponse.json(errorResponse('Failed to download repository snapshot from GitHub.'), { status: 400 });
    }

    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Upload to our storage
    const { key, url } = await uploadToS3(buffer, `${cleanRepoName}.zip`, 'application/zip');

    // 7. Create project in Supabase
    const { supabase } = await import('@/lib/supabase');
    
    // Get user info safely
    const { data: user } = await supabase.from('users').select('username').eq('id', userId).maybeSingle();

    const insertData = {
      title: bodyTitle || repoData.name.charAt(0).toUpperCase() + repoData.name.slice(1).replace(/-/g, ' '),
      description: bodyDescription || repoData.description || `Automatic import of ${repoData.full_name}`,
      category,
      price: parseFloat(price),
      file_url: url,
      file_key: key,
      file_name: `${cleanRepoName}.zip`,
      file_size: buffer.length,
      seller_id: userId,
      seller_username: user?.username || 'Seller',
      tags: tags || [],
      language: repoData.language || undefined,
      framework: bodyFramework || undefined,
      tech_stack: repoData.topics || [],
    };

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[IMPORT] Database Insert Error:', JSON.stringify(insertError));
      return NextResponse.json(errorResponse(`Database error: ${insertError.message}`), { status: 500 });
    }

    console.log('[IMPORT] Success:', project.id);
    return NextResponse.json(successResponse(project, 'Repository imported and snapshot stored!'), { status: 201 });

  } catch (error: any) {
    console.error('[IMPORT] CRITICAL ERROR:', error.message, error.stack);
    return NextResponse.json(errorResponse(`Unexpected Error: ${error.message}`), { status: 500 });
  }
}
