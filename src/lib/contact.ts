// AIPOS customer service contact shown in the app.
export const CS_WHATSAPP_DISPLAY = '0812-6225-6444';
export const CS_WHATSAPP = '6281262256444';
export const waLink = (text?: string) => `https://wa.me/${CS_WHATSAPP}${text ? '?text=' + encodeURIComponent(text) : ''}`;
export const CS_EMAIL = 'cs@aipos.co.id';
// CS operating hours (WIB).
export const CS_HOURS = 'Senin–Jumat 09.00–17.00, Sabtu–Minggu 10.00–16.00 WIB';
export const CS_HOURS_SHORT = 'Sen–Jum 09.00–17.00 · Sab–Min 10.00–16.00 WIB';
