export const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan',
  'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta', 'Banten', 'Jawa Barat', 'Jawa Tengah',
  'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
  'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara',
  'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Maluku',
  'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan'
];

/** Business categories shown at signup (GoPay-style), with examples to help merchants choose and a suggested MCC for the team. */
export const BUSINESS_CATEGORIES = [
  { name: 'Makanan & Minuman', examples: 'Warung makan, restoran, kedai kopi, katering, kantin, toko kue', icon: 'food', tone: 'orange', mcc: '5812 - Restoran dan Tempat Makan' },
  { name: 'Grosir & Sembako', examples: 'Toko sembako, kelontong, minimarket, toko alat tulis, toko perabotan', icon: 'cart', tone: 'blue', mcc: '5411 - Toko Kelontong / Supermarket' },
  { name: 'Otomotif', examples: 'Bengkel, toko suku cadang, cuci kendaraan, dealer kendaraan', icon: 'car', tone: 'slate', mcc: '7538 - Bengkel' },
  { name: 'Elektronik & Pulsa', examples: 'Konter HP & pulsa, toko elektronik, aksesoris HP, toko game & konsol', icon: 'phone', tone: 'purple', mcc: '4814 - Pulsa & Telekomunikasi' },
  { name: 'Toko Pakaian', examples: 'Butik, konveksi, toko sepatu, tas & aksesoris, hijab', icon: 'shirt', tone: 'pink', mcc: '5699 - Pakaian & Aksesoris' },
  { name: 'Salon & Kecantikan', examples: 'Salon, barbershop, spa, nail art, toko kosmetik', icon: 'scissors', tone: 'red', mcc: '7230 - Salon & Barbershop' },
  { name: 'Kesehatan', examples: 'Apotek, toko obat, klinik, optik, toko alat kesehatan', icon: 'pill', tone: 'teal', mcc: '5912 - Apotek & Toko Obat' },
  { name: 'Jasa & Laundry', examples: 'Laundry, penjahit, fotokopi & percetakan, servis elektronik, jasa kirim', icon: 'washer', tone: 'blue', mcc: '7210 - Laundry' },
  { name: 'Bangunan & Rumah', examples: 'Toko bangunan, besi & cat, furnitur, perlengkapan rumah, tanaman hias', icon: 'hammer', tone: 'yellow', mcc: '5211 - Bahan Bangunan' },
  { name: 'Pertanian & Peternakan', examples: 'Toko pertanian, pupuk & bibit, pakan ternak, ikan & unggas', icon: 'leaf', tone: 'green', mcc: '5999 - Toko Ritel Lainnya' },
  { name: 'Lainnya', examples: 'Toko mainan, olahraga, buku, hewan peliharaan, oleh-oleh, usaha lain', icon: 'tag', tone: 'slate', mcc: '5999 - Toko Ritel Lainnya' }
] as const;


export const BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI', 'BSI', 'Nobu Bank', 'CIMB Niaga', 'Permata', 'BTN', 'Bank Jago', 'SeaBank', 'Lainnya'];

export const MARKETPLACES = ['Shopee', 'TikTok', 'Tokopedia', 'Lazada', 'Lainnya'];
