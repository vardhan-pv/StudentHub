// lib/auth-edge.ts
// Edge-compatible authentication utilities (No Node.js dependencies)

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export async function generateToken(payload: object, expiresIn = '7d'): Promise<string> {
  const encoder = new TextEncoder();
  
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + (7 * 24 * 60 * 60); // 7 days default
  const body = base64UrlEncode(JSON.stringify({ ...payload, iat: now, exp: expiration }));

  const keyData = encoder.encode(JWT_SECRET);
  const key = await crypto.subtle.importKey(
    'raw', 
    keyData, 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${body}`)
  );

  // Convert buffer to base64
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = btoa(String.fromCharCode.apply(null, signatureArray))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${header}.${body}.${signature}`;
}

export async function verifyToken(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const encoder = new TextEncoder();

    const keyData = encoder.encode(JWT_SECRET);
    const key = await crypto.subtle.importKey(
      'raw', 
      keyData, 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['verify']
    );

    // Decode signature
    const sigStr = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigBytes = new Uint8Array(atob(sigStr).split('').map(c => c.charCodeAt(0)));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(`${header}.${body}`)
    );

    if (!isValid) return null;
    
    const decoded = JSON.parse(base64UrlDecode(body));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    
    return decoded;
  } catch (error) {
    console.error('Edge token verification error:', error);
    return null;
  }
}
