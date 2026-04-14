import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { hashPassword, validateEmail, validatePassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['buyer', 'seller', 'both']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.errors[0]?.message || 'Invalid input data';
      return NextResponse.json(
        errorResponse(errorMsg),
        { status: 400 }
      );
    }

    const { email, username, fullName, password, role } = validation.data;



    const { supabase } = await import('@/lib/supabase');

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        errorResponse('User already exists'),
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        username,
        full_name: fullName,
        password: hashedPassword,
        role,
        avatar: null,
        bio: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Registration insert error:', insertError);
      return NextResponse.json(
        errorResponse('Failed to create user'),
        { status: 500 }
      );
    }

    // Generate token
    const token = await generateToken({
      userId: newUser.id,
      email,
      username,
      role,
    });

    const response = NextResponse.json(
      successResponse(
        {
          token,
          user: {
            userId: newUser.id,
            email,
            username,
            fullName: newUser.full_name,
            role,
            avatar: null,
          },
        },
        'User registered successfully',
        201
      ),
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
