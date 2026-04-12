import fs from 'fs';
import path from 'path';

export async function uploadToS3(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ key: string; url: string }> {
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `uploads/${timestamp}-${safeFileName}`;
  
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(publicDir, fileKey);
  fs.writeFileSync(filePath, fileBuffer);

  const url = `/${fileKey}`;
  return { key: fileKey, url };
}

export async function generateDownloadUrl(fileKey: string): Promise<string> {
  return `/${fileKey}`;
}

export async function deleteFromS3(fileKey: string): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), 'public', fileKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Local delete error:', error);
  }
}

export async function getFileSize(fileBuffer: Buffer): Promise<number> {
  return fileBuffer.length;
}
