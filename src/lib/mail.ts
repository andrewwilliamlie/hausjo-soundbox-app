import nodemailer from 'nodemailer';

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transport;
}

type Attachment = { filename: string; content: Buffer; contentType?: string };

/** Sends an email; logs and carries on when SMTP is not configured or sending fails. */
export async function sendMail(to: string, subject: string, text: string, attachments: Attachment[] = []) {
  const t = getTransport();
  if (!t) {
    console.log(`[mail] SMTP not configured, skipped "${subject}" to ${to}`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, attachments });
    console.log(`[mail] sent "${subject}" to ***@${to.split('@')[1] ?? '?'}`);
  } catch (e) {
    console.error('[mail] send failed', e);
  }
}

const APP = () => process.env.APP_URL || 'https://app.aipos.co.id';

type ShopKind = 'STIKER' | 'EDC' | 'SOUNDBOX' | 'KERTAS';
const SHOP: Record<ShopKind, { name: string; long: string; after: string; path: string }> = {
  STIKER: { name: 'stiker', long: 'stiker QRIS', after: 'Stiker dicetak', path: 'stiker' },
  EDC: { name: 'EDC', long: 'EDC', after: 'EDC disiapkan', path: 'edc' },
  SOUNDBOX: { name: 'Soundbox', long: 'Soundbox QRIS', after: 'Soundbox disiapkan', path: 'soundbox' },
  KERTAS: { name: 'kertas struk', long: 'kertas struk', after: 'Kertas struk disiapkan', path: 'kertas' }
};

export const mails = {
  submitted: (ticket: string) => ({
    subject: `Pendaftaran AIPOS diterima · ${ticket}`,
    text: `Terima kasih, pendaftaran Anda (${ticket}) sudah kami terima.\n\nTim kami memeriksa data dalam 1–2 hari kerja. Sambil menunggu, tambahkan rekening pencairan di aplikasi agar QRIS bisa diterbitkan:\n${APP()}/app\n\nAIPOS`
  }),
  revision: (ticket: string, items: string[]) => ({
    subject: `Perlu perbaikan foto · ${ticket}`,
    text: `Ada foto yang perlu diganti:\n${items.map((i) => '- ' + i).join('\n')}\n\nFoto lain sudah disetujui. Unggah ulang di:\n${APP()}/app\n\nAIPOS`
  }),
  stickerOrdered: (no: string, store: string, items: string, total: string, kind: ShopKind = 'STIKER') => ({
    subject: `Pesanan ${SHOP[kind].name} diterima · ${no}`,
    text: `Pesanan ${SHOP[kind].long} untuk ${store} sudah kami terima.\n\n${items}\nTotal: ${total}\n\nTim AIPOS akan mengirim link pembayaran ke WhatsApp Anda di jam kerja. ${SHOP[kind].after} setelah pembayaran diterima. Lihat status pesanan:\n${APP()}/app/${SHOP[kind].path}\n\nAIPOS`
  }),
  stickerStatus: (no: string, status: string, extra = '', kind: ShopKind = 'STIKER') => ({
    subject: `${status} · ${no}`,
    text: `Status pesanan ${SHOP[kind].name} ${no}: ${status}.${extra ? '\n\n' + extra : ''}\n\nLihat detailnya:\n${APP()}/app/${SHOP[kind].path}\n\nAIPOS`
  }),
  active: (ticket: string, name: string) => ({
    subject: `QRIS Anda sudah aktif · ${name}`,
    text: `Selamat, QRIS untuk ${name} (${ticket}) sudah aktif. Stiker QRIS terlampir dan bisa diunduh kapan saja di:\n${APP()}/app\n\nAIPOS`
  })
};
