// KTP OCR. The provider is not chosen yet (see spec, open questions), so with no
// OCR_PROVIDER set this returns null and the merchant types the fields by hand.
// A provider adapter only has to return KtpFields plus a 0–100 confidence.

export type KtpFields = {
  ktpName?: string;
  nik?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  religion?: string;
  occupation?: string;
  ktpAddress?: string;
};

export type OcrResult = { fields: KtpFields; confidence: number } | null;

export async function readKtp(_image: Buffer, _mime: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER;
  if (!provider) return null;
  // Adapters are added here once the provider is decided.
  console.warn(`[ocr] provider "${provider}" is not implemented yet`);
  return null;
}
