import crypto from 'crypto';

// Authentication utilities using native Node.js crypto APIs
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// Simple password hashing using crypto
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = hash.split(':');
    const salt = parts[0];
    const key = parts[1];
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

// Simple JWT-like token generation using crypto
export function generateToken(payload: object, expiresIn = '7d'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + (7 * 24 * 60 * 60); // 7 days default
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: expiration })).toString('base64');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64');
    
    if (signature !== expectedSignature) return null;
    
    const decoded = JSON.parse(Buffer.from(body, 'base64').toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

export function generateRefreshToken(userId: string): string {
  return generateToken({ userId }, '30d');
}

export async function validateEmail(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
