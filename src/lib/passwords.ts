import { createHash, randomBytes, randomInt } from 'node:crypto';

// No look-alike characters (0/O, 1/l/I) so a temporary password can be read out or typed from WhatsApp.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Readable temporary password, e.g. "Kp7m-Qx4t-Wn9r". */
export function tempPassword() {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${part()}-${part()}-${part()}`;
}

export const MIN_PASSWORD = 8;
export const MIN_ADMIN_PASSWORD = 10;

/** Random URL-safe token and the hash that is stored in the database. */
export function newToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
