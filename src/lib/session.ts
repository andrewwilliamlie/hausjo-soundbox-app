import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Two separate cookies so a merchant session can never act as an admin.
const MERCHANT_COOKIE = 'hj_m';
const ADMIN_COOKIE = 'hj_a';
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days for merchants
const ADMIN_MAX_AGE = 60 * 60 * 10; // 10 hours for admins

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

async function sign(payload: Record<string, string>, maxAge: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(key());
}

async function read(name: string): Promise<Record<string, unknown> | null> {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

const cookieOpts = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge
});

export async function startMerchantSession(userId: string) {
  (await cookies()).set(MERCHANT_COOKIE, await sign({ sub: userId, t: 'm' }, MAX_AGE), cookieOpts(MAX_AGE));
}

export async function startAdminSession(adminId: string) {
  (await cookies()).set(ADMIN_COOKIE, await sign({ sub: adminId, t: 'a' }, ADMIN_MAX_AGE), cookieOpts(ADMIN_MAX_AGE));
}

export async function merchantId(): Promise<string | null> {
  const p = await read(MERCHANT_COOKIE);
  return p && p.t === 'm' && typeof p.sub === 'string' ? p.sub : null;
}

export async function adminId(): Promise<string | null> {
  const p = await read(ADMIN_COOKIE);
  return p && p.t === 'a' && typeof p.sub === 'string' ? p.sub : null;
}

export async function endMerchantSession() {
  (await cookies()).delete(MERCHANT_COOKIE);
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
