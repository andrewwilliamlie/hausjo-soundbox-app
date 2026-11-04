import { db } from './db';
import { sendMail } from './mail';
import { newToken } from './passwords';

const APP = () => process.env.APP_URL || 'https://beta.hausjo.co.id';

/**
 * Creates a one-time link to set a new password and emails it to the merchant.
 * Self-service links last 1 hour; links an admin sends last 24 hours (they often travel by WhatsApp).
 * Returns null when the merchant already asked for 3 links in the past hour.
 */
export async function createResetLink(userId: string, byAdminId?: string) {
  if (!byAdminId) {
    const recent = await db.passwordReset.count({ where: { userId, byAdminId: null, createdAt: { gt: new Date(Date.now() - 3600_000) } } });
    if (recent >= 3) return null;
  }
  const { token, hash } = newToken();
  const hours = byAdminId ? 24 : 1;
  await db.passwordReset.create({
    data: { userId, tokenHash: hash, expiresAt: new Date(Date.now() + hours * 3600_000), byAdminId: byAdminId ?? null }
  });
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const link = `${APP()}/masuk/reset?t=${token}`;
  await sendMail(
    user.email,
    'Atur ulang kata sandi AIPOS',
    `Ada permintaan untuk mengatur ulang kata sandi akun AIPOS Anda (${user.phone}).\n\nBuat kata sandi baru lewat link ini (berlaku ${hours} jam, hanya sekali pakai):\n${link}\n\nJika Anda tidak memintanya, abaikan email ini. Kata sandi lama tetap berlaku.\n\nAIPOS`
  );
  return { link, hours };
}
