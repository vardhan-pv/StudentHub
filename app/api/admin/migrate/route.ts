import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';

// One-time migration endpoint to add subscription columns (safe to call multiple times)
export async function POST(request: NextRequest) {
  try {
    const { supabase } = await import('@/lib/supabase');

    // Try updating a test user to see if column exists
    const { error: checkError } = await supabase
      .from('users')
      .select('subscription_tier, purchases_count')
      .limit(1);

    if (!checkError) {
      return NextResponse.json(successResponse({ message: 'Columns already exist. No migration needed.' }));
    }

    // If columns don't exist, use RPC to add them
    const { error: alterError } = await supabase.rpc('add_subscription_columns');
    if (alterError) {
      // Columns likely already exist or RPC not set up - try direct insert instead
      console.error('Migration note:', alterError.message);
    }

    return NextResponse.json(successResponse({ message: 'Migration attempted. Check Supabase dashboard.' }));
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(errorResponse('Migration failed'), { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(successResponse({ 
    sql: `
-- Run this SQL in your Supabase SQL Editor:
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS purchases_count INTEGER DEFAULT 0;
    `,
    instructions: 'Copy the SQL above and run it in your Supabase project SQL Editor.'
  }));
}
