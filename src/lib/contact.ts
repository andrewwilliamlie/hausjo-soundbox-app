// AIPOS customer service contact shown in the app.
export const CS_WHATSAPP_DISPLAY = '0812-6225-6444';
export const CS_WHATSAPP = '6281262256444';
export const waLink = (text?: string) => `https://wa.me/${CS_WHATSAPP}${text ? '?text=' + encodeURIComponent(text) : ''}`;
export const CS_EMAIL = 'support@aipos.co.id';
