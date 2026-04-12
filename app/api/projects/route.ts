import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader, paginate } from '@/lib/api-response';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  category: z.string().min(3),
  price: z.number().positive(),
  fileUrl: z.string(),
  fileKey: z.string(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    language: z.string().optional(),
    framework: z.string().optional(),
    techStack: z.array(z.string()).optional(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase');
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(20, parseInt(url.searchParams.get('limit') || '10'));
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const sellerId = url.searchParams.get('sellerId');

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (sellerId) query = query.eq('seller_id', sellerId);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { skip } = paginate(0, limit, page); // total will be from response
    
    const { data: projects, count, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    const total = count || 0;

    return NextResponse.json(
      successResponse({
        projects,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch projects'),
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');
    if (!valid) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const tokenData = verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(
        errorResponse('Invalid token'),
        { status: 401 }
      );
    }

    const userId = (tokenData as any).userId;
    const userRole = (tokenData as any).role;

    console.log('[DEBUG] Token User ID:', userId);

    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('[DEBUG] Invalid UUID format in token. Old session detected.');
      return NextResponse.json(
        errorResponse('Your session is from the old database. Please Logout and Login/Register again.'),
        { status: 401 }
      );
    }

    if (userRole !== 'seller' && userRole !== 'both') {
      return NextResponse.json(
        errorResponse('Only sellers can create projects'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      console.error('[DEBUG] Validation error:', validation.error.format());
      return NextResponse.json(
        errorResponse('Invalid project data'),
        { status: 400 }
      );
    }

    const { supabase } = await import('@/lib/supabase');

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[DEBUG] Supabase User Fetch Error:', userError);
    }

    if (!user) {
      console.warn('[DEBUG] User not found in Supabase users table for ID:', userId);
      return NextResponse.json(
        errorResponse('User not found. Please log out and log in again.'),
        { status: 404 }
      );
    }

    // Create project
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert({
        title: validation.data.title,
        description: validation.data.description,
        category: validation.data.category,
        price: validation.data.price,
        file_url: validation.data.fileUrl,
        file_key: validation.data.fileKey,
        file_name: validation.data.fileName,
        file_size: validation.data.fileSize,
        seller_id: userId,
        seller_username: user.username,
        tags: validation.data.metadata.tags || [],
        language: validation.data.metadata.language,
        framework: validation.data.metadata.framework,
        tech_stack: validation.data.metadata.techStack || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DEBUG] Project insertion failed:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        errorResponse(`Database error: ${insertError.message || 'Check terminal for details'}`),
        { status: 500 }
      );
    }

    return NextResponse.json(
      successResponse(
        {
          projectId: project.id,
          ...validation.data,
        },
        'Project created successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json(
      errorResponse('Failed to create project'),
      { status: 500 }
    );
  }
}
