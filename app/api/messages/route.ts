import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';

// GET /api/messages
// If ?conversationId is present, returns messages for that thread.
// Otherwise, returns a list of active conversations for the logged-in user.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');
    if (!valid) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }
    const userId = (tokenData as any).userId;

    const { supabase } = await import('@/lib/supabase');
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (conversationId) {
      // In Supabase, we transition to using separate fields, but for backward compatibility
      // we'll filter by what we can. Standard logic: conversationId was `${projectId}_${p1}_${p2}`
      // For now, let's treat the content we have.
      const [projectId, p1, p2] = conversationId.split('_');

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .or(`and(sender_id.eq.${p1},receiver_id.eq.${p2}),and(sender_id.eq.${p2},receiver_id.eq.${p1})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return NextResponse.json(successResponse({ 
        messages: messages.map(m => ({
          ...m,
          conversationId, // restore for frontend
          projectId: m.project_id,
          senderId: m.sender_id,
          receiverId: m.receiver_id,
        }))
      }));
    } else {
      // Fetch all user's messages to deduce active conversations
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select(`
          *,
          projects (
            id,
            title,
            seller_id
          ),
          sender:users!sender_id (username),
          receiver:users!receiver_id (username)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
         
      const conversationsMap = new Map();
      
      for (const msg of allMessages) {
        const participants = [msg.sender_id, msg.receiver_id].sort();
        const convKey = `${msg.project_id}_${participants[0]}_${participants[1]}`;

        if (!conversationsMap.has(convKey)) {
          const isSender = msg.sender_id === userId;
          const otherUserId = isSender ? msg.receiver_id : msg.sender_id;
          const project = msg.projects;

          let myRole = 'Participant';
          let otherRole = 'Participant';

          if (project) {
            if (userId === project.seller_id) {
                myRole = 'Seller';
                otherRole = 'Buyer';
            } else if (otherUserId === project.seller_id) {
                myRole = 'Buyer';
                otherRole = 'Seller';
            }
          }

          conversationsMap.set(convKey, {
            conversationId: convKey,
            projectId: msg.project_id,
            projectTitle: project ? project.title : 'Deleted Project',
            otherUserId,
            otherUsername: isSender ? msg.receiver?.username : msg.sender?.username,
            myRole,
            otherRole,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            lastMessageIsFromMe: isSender,
            unread: !msg.read && !isSender
          });
        }
      }

      return NextResponse.json(successResponse({ 
        conversations: Array.from(conversationsMap.values()) 
      }));
    }
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(errorResponse('Failed to fetch messages'), { status: 500 });
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { valid, token } = validateAuthHeader(authHeader || '');
    if (!valid) return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });

    const tokenData = await verifyToken(token!);
    if (!tokenData || typeof tokenData === 'string') {
      return NextResponse.json(errorResponse('Invalid token'), { status: 401 });
    }
    const senderId = (tokenData as any).userId;

    const body = await request.json();
    const { receiverId, projectId, content } = body;

    if (!receiverId || !content || !projectId) {
      return NextResponse.json(errorResponse('Missing required fields'), { status: 400 });
    }

    const { supabase } = await import('@/lib/supabase');

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        read: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      successResponse(
        { messageId: newMessage.id, ...newMessage, projectId, senderId, receiverId },
        'Message sent successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(errorResponse('Failed to send message'), { status: 500 });
  }
}
