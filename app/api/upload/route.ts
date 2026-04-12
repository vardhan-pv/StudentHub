import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, getFileSize } from '@/lib/s3';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse, validateAuthHeader } from '@/lib/api-response';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        errorResponse('No file provided'),
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        errorResponse('File size exceeds 100MB limit'),
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/pdf',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        errorResponse('Invalid file type. Only ZIP, RAR, 7Z, and PDF files are allowed'),
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const { key, url } = await uploadToS3(buffer, file.name, file.type);
    const fileSize = await getFileSize(buffer);

    return NextResponse.json(
      successResponse(
        {
          fileKey: key,
          fileUrl: url,
          fileName: file.name,
          fileSize,
          mimeType: file.type,
        },
        'File uploaded successfully',
        201
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      errorResponse('Failed to upload file'),
      { status: 500 }
    );
  }
}
