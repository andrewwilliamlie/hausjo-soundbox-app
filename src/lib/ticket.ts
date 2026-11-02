import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Ticket numbers in the existing HausJo format: HJO-YYYYMMDD-XXXXX (Jakarta date). */
export function newTicket(now = new Date()): string {
  const jkt = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const ymd = jkt.toISOString().slice(0, 10).replace(/-/g, '');
  let tail = '';
  for (let i = 0; i < 5; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `HJO-${ymd}-${tail}`;
}
