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

export type SessionInfo = { id: string; issuedAt: number }; // issuedAt in ms

async function info(name: string, t: string): Promise<SessionInfo | null> {
  const p = await read(name);
  if (!p || p.t !== t || typeof p.sub !== 'string') return null;
  return { id: p.sub, issuedAt: typeof p.iat === 'number' ? p.iat * 1000 : 0 };
}

export const merchantSession = () => info(MERCHANT_COOKIE, 'm');
export const adminSession = () => info(ADMIN_COOKIE, 'a');

/** True when the session was issued before the password last changed (JWT iat has 1 s precision). */
export function staleSession(s: SessionInfo, changedAt: Date | null) {
  return !!changedAt && s.issuedAt + 1000 < changedAt.getTime();
}

export async function endMerchantSession() {
  (await cookies()).delete(MERCHANT_COOKIE);
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
