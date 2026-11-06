// "Bantuan" help center: categories, problems and the steps a merchant tries before calling CS.
// Edit the wording here; ids are used in links and in callback requests, so keep them stable.
import type { IconName } from '@/components/Icon';

export type HelpCategory = { id: string; title: string; sub: string; icon: IconName; tone: 'blue' | 'orange' | 'green' | 'purple' };
export type HelpTopic = {
  id: string; cat: string; title: string; summary: string;
  steps: string[];          // simple things to try, in order
  note?: string;            // extra tip under the steps
  action?: { label: string; href: string }; // in-app shortcut that solves it (requests)
  request?: boolean;        // a request rather than a problem: no "sudah teratasi?" question
};

export const CATEGORIES: HelpCategory[] = [
  { id: 'hardware', title: 'Hardware & EDC', sub: 'Mesin rusak, layar, kartu, kertas struk', icon: 'edc', tone: 'blue' },
  { id: 'koneksi', title: 'Gangguan komunikasi', sub: 'Koneksi, jaringan, Soundbox diam', icon: 'spark', tone: 'orange' },
  { id: 'pencairan', title: 'Pencairan & transaksi', sub: 'Dana belum masuk, selisih, status QRIS/EDC', icon: 'wallet', tone: 'green' },
  { id: 'fasilitas', title: 'Pengajuan fasilitas', sub: 'Tambah EDC, QRIS dinamis, toko/cabang', icon: 'plus', tone: 'purple' }
];

export const TOPICS: HelpTopic[] = [
  // Hardware & EDC
  {
    id: 'edc-mati', cat: 'hardware', title: 'EDC tidak menyala atau mati sendiri', summary: 'Biasanya karena baterai habis atau mesin hang.',
    steps: [
      'Sambungkan EDC ke charger bawaan dan stopkontak yang berfungsi. Tunggu minimal 30 menit.',
      'Tekan dan tahan tombol power sekitar 3–5 detik sampai layar menyala.',
      'Jika layar macet, tahan tombol power sekitar 10 detik untuk memaksa restart.',
      'Coba stopkontak atau kabel charger lain untuk memastikan bukan chargernya yang rusak.'
    ],
    note: 'Jangan membuka casing mesin sendiri, agar garansi tetap berlaku.'
  },
  {
    id: 'kertas-struk', cat: 'hardware', title: 'Struk tidak keluar atau ganti kertas struk', summary: 'Kertas habis, terpasang terbalik, atau penutup printer kurang rapat.',
    steps: [
      'Buka penutup printer di bagian atas EDC.',
      'Pasang gulungan kertas thermal baru. Sisi kertas yang licin/mengkilap harus menghadap ke kepala printer; kalau terbalik, struk keluar kosong.',
      'Tarik ujung kertas keluar sedikit, lalu tutup penutup printer sampai berbunyi klik.',
      'Cetak ulang struk terakhir dari menu aplikasi EDC untuk mencoba.'
    ],
    note: 'Gunakan kertas thermal ukuran 58 mm (sering ditulis 57 mm). Simpan kertas di tempat kering dan tidak panas.',
    action: { label: 'Beli kertas struk · Rp20.000 isi 10', href: '/app/kertas' }
  },
  {
    id: 'layar', cat: 'hardware', title: 'Layar tidak merespons atau EDC hang', summary: 'Aplikasi macet atau layar kotor.',
    steps: [
      'Bersihkan layar dengan kain kering. Pastikan tangan tidak basah.',
      'Tahan tombol power, lalu pilih Restart. Jika tidak bisa, tahan tombol power sekitar 10 detik.',
      'Setelah menyala, buka lagi aplikasi pembayaran dan coba transaksi kecil.'
    ]
  },
  {
    id: 'kartu', cat: 'hardware', title: 'Kartu debit/kredit tidak terbaca', summary: 'Posisi kartu, chip kotor, atau cara tap kurang tepat.',
    steps: [
      'Untuk kartu chip: masukkan kartu dengan chip menghadap ke atas, dorong sampai mentok, dan jangan dicabut sebelum diminta.',
      'Untuk tap (contactless): tempelkan kartu di atas layar/area logo tap selama 1–2 detik, jangan digeser.',
      'Bersihkan chip kartu dengan kain kering, lalu coba lagi.',
      'Coba kartu lain. Jika kartu lain bisa, masalahnya ada di kartu pembeli, bukan EDC.'
    ],
    note: 'Jika semua kartu gagal dibaca, kemungkinan pembaca kartu rusak. Hubungi CS.'
  },
  // Gangguan komunikasi
  {
    id: 'edc-offline', cat: 'koneksi', title: 'EDC tidak terhubung atau gagal kirim transaksi', summary: 'Sinyal lemah, Wi-Fi terputus, atau kuota SIM habis.',
    steps: [
      'Lihat ikon sinyal/Wi-Fi di bagian atas layar EDC.',
      'Jika memakai Wi-Fi: buka Pengaturan → Wi-Fi, sambungkan ulang ke Wi-Fi toko, dan pastikan internet toko berjalan (coba buka situs di HP).',
      'Jika memakai kartu SIM: pastikan SIM terpasang, data seluler aktif, dan kuota masih ada.',
      'Pindahkan EDC ke dekat jendela atau tempat yang sinyalnya lebih kuat.',
      'Restart EDC, lalu coba transaksi kecil.'
    ],
    note: 'Untuk tes cepat, sambungkan EDC ke hotspot HP. Jika lewat hotspot bisa, masalahnya ada di jaringan toko.'
  },
  {
    id: 'soundbox-diam', cat: 'koneksi', title: 'Soundbox tidak bersuara saat ada pembayaran', summary: 'Volume kecil, baterai habis, atau Soundbox tidak terhubung internet.',
    steps: [
      'Tekan tombol volume naik pada Soundbox.',
      'Isi daya Soundbox minimal 30 menit, lalu nyalakan lagi.',
      'Pastikan Soundbox terhubung ke jaringan (lampu indikator jaringan menyala) dan sinyal di lokasi cukup kuat.',
      'Matikan lalu nyalakan lagi Soundbox.',
      'Uji dengan pembayaran QRIS kecil, misalnya Rp1.000.'
    ],
    note: 'Soundbox hanya memberi tahu pembayaran. Uang tetap masuk walau Soundbox diam; cek di menu Mutasi.'
  },
  {
    id: 'qris-gagal-scan', cat: 'koneksi', title: 'Pembeli gagal scan QRIS', summary: 'Stiker rusak, cahaya kurang, atau aplikasi pembeli bermasalah.',
    steps: [
      'Pastikan stiker QRIS bersih, tidak sobek, tidak tertutup plastik yang memantulkan cahaya.',
      'Minta pembeli mendekatkan kamera dan memastikan cahaya cukup.',
      'Minta pembeli memperbarui aplikasinya atau mencoba aplikasi bank/e-wallet lain.',
      'Cek di menu QRIS bahwa status QRIS toko Anda sudah aktif.'
    ],
    note: 'Stiker rusak atau pudar? Pesan stiker baru lewat menu Pesan stiker.'
  },
  // Pencairan & transaksi
  {
    id: 'dana-belum-masuk', cat: 'pencairan', title: 'Dana belum masuk ke rekening', summary: 'Biasanya karena jadwal pencairan atau hari libur.',
    steps: [
      'Buka menu Pencairan dan lihat jadwal Anda: H+1 atau hari yang sama.',
      'Ingat bahwa pencairan pada akhir pekan atau hari libur nasional bisa bergeser ke hari kerja berikutnya.',
      'Pastikan nomor rekening dan nama pemilik rekening di menu Pencairan sudah benar.',
      'Cek mutasi rekening bank Anda sekali lagi, termasuk transaksi masuk dengan nama pengirim pihak bank/penyedia QRIS.'
    ],
    note: 'Jika sudah lewat jadwal dan dana belum masuk, siapkan tanggal transaksi dan nominalnya sebelum menghubungi CS.'
  },
  {
    id: 'selisih', cat: 'pencairan', title: 'Jumlah pencairan berbeda (selisih)', summary: 'Selisih kecil biasanya potongan biaya transaksi (MDR).',
    steps: [
      'Jumlahkan transaksi di menu Mutasi untuk periode yang sama dengan pencairan.',
      'Kurangi dengan biaya transaksi (MDR) sesuai ketentuan Bank Indonesia dan paket pencairan Anda.',
      'Periksa apakah ada transaksi yang masuk ke pencairan hari berikutnya (transaksi malam hari atau hari libur).',
      'Periksa apakah ada transaksi yang dibatalkan atau dikembalikan (refund).'
    ],
    note: 'Jika setelah dihitung masih ada selisih, catat tanggal dan nominalnya, lalu hubungi CS.'
  },
  {
    id: 'status-transaksi', cat: 'pencairan', title: 'Pembeli sudah bayar tapi belum tercatat', summary: 'Pembayaran QRIS atau EDC tertunda di jaringan.',
    steps: [
      'Tunggu 1–5 menit, lalu cek lagi di menu Mutasi atau di EDC.',
      'Minta bukti pembayaran dari pembeli: nominal, jam, dan nomor referensi.',
      'Pastikan pembeli membayar ke QRIS toko Anda (nama toko di aplikasi pembeli sama dengan nama toko Anda).',
      'Jangan meminta pembeli membayar ulang sebelum status jelas, untuk menghindari pembayaran ganda.'
    ],
    note: 'Simpan foto bukti bayar pembeli. CS memerlukannya untuk menelusuri transaksi.'
  },
  // Pengajuan fasilitas
  {
    id: 'tambah-edc', cat: 'fasilitas', request: true, title: 'Tambah mesin EDC', summary: 'Beli EDC baru langsung di aplikasi.',
    steps: ['Buka menu Beli EDC.', 'Pilih PAX A620 (QRIS dinamis) atau PAX A920 Pro (debit, kredit & QRIS).', 'Isi alamat pengiriman lalu buat pesanan. Tim AIPOS mengirim link pembayaran.'],
    action: { label: 'Buka Beli EDC', href: '/app/edc' }
  },
  {
    id: 'qris-dinamis', cat: 'fasilitas', request: true, title: 'Ajukan QRIS dinamis', summary: 'Nominal tampil otomatis, pembeli tinggal scan.',
    steps: ['QRIS dinamis memunculkan kode QR dengan nominal yang sudah terisi, jadi pembeli tidak perlu mengetik jumlah.', 'Di AIPOS, QRIS dinamis tersedia lewat mesin PAX A620.', 'Pesan lewat menu Beli EDC. CS memandu aktivasi setelah mesin sampai.'],
    action: { label: 'Pesan PAX A620', href: '/app/edc' }
  },
  {
    id: 'tambah-toko', cat: 'fasilitas', request: true, title: 'Tambah toko atau cabang baru', summary: 'Setiap toko punya QRIS sendiri.',
    steps: ['Buka menu Toko saya.', 'Pilih Tambah toko dan isi data usaha cabang baru.', 'Pilih rekening yang sama atau rekening lain, lalu kirim untuk diperiksa.'],
    action: { label: 'Buka Toko saya', href: '/app/toko' }
  },
  {
    id: 'pesan-stiker', cat: 'fasilitas', request: true, title: 'Stiker QRIS atau stand akrilik', summary: 'Pesan stiker cetak dengan QRIS toko Anda.',
    steps: ['Buka menu Pesan stiker.', 'Pilih Paket Hemat atau Paket Akrilik.', 'Isi alamat lalu buat pesanan.'],
    action: { label: 'Buka Pesan stiker', href: '/app/stiker' }
  },
  {
    id: 'ubah-rekening', cat: 'fasilitas', request: true, title: 'Ganti rekening pencairan', summary: 'Perlu verifikasi tim AIPOS.',
    steps: ['Demi keamanan, rekening yang sudah aktif hanya bisa diganti lewat CS.', 'Siapkan nama bank, nomor rekening, dan nama pemilik rekening baru (harus sama dengan pemilik usaha).', 'Pilih "Minta CS menelepon saya" di bawah.']
  }
];

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const CALL_TIMES = ['Secepatnya', 'Pagi', 'Siang', 'Sore'];

export type HelpStatus = 'OPEN' | 'CALLED' | 'DONE';
export const HELP_STATUS_LABEL: Record<HelpStatus, string> = { OPEN: 'Menunggu ditelepon', CALLED: 'Sudah dihubungi', DONE: 'Selesai' };
