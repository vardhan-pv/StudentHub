import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await import('@/lib/supabase');

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!project || error) {
      return NextResponse.json(
        errorResponse('Project not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(project));
  } catch (error) {
    console.error('Project fetch error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch project'),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { supabase } = await import('@/lib/supabase');

    // Check if user is the owner
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!project || fetchError) {
      return NextResponse.json(
        errorResponse('Project not found'),
        { status: 404 }
      );
    }

    if (project.seller_id !== userId) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Map body to SQL fields if necessary, or just pick what to update
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        errorResponse('Failed to update project'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      successResponse(updatedProject, 'Project updated successfully')
    );
  } catch (error) {
    console.error('Project update error:', error);
    return NextResponse.json(
      errorResponse('Failed to update project'),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { supabase } = await import('@/lib/supabase');

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('seller_id')
      .eq('id', id)
      .single();

    if (!project || fetchError) {
      return NextResponse.json(
        errorResponse('Project not found'),
        { status: 404 }
      );
    }

    if (project.seller_id !== userId) {
      return NextResponse.json(
        errorResponse('Forbidden'),
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
        throw deleteError;
    }

    return NextResponse.json(
      successResponse(null, 'Project deleted successfully')
    );
  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      errorResponse('Failed to delete project'),
      { status: 500 }
    );
  }
}
