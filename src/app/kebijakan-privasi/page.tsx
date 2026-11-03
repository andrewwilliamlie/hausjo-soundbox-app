import LegalPage, { type Section } from '@/components/LegalPage';

export const metadata = { title: 'Kebijakan Privasi · HausJo' };

const CONTACT = 'hausjoapp@gmail.com';

const sections: Section[] = [
  {
    h: 'Siapa kami',
    p: [
      'Layanan pendaftaran merchant QRIS dan Soundbox QRIS di hausjo.co.id dikelola oleh PT Hausjo Digital Pro ("HausJo", "kami"). Untuk data yang Anda berikan saat mendaftar, HausJo bertindak sebagai pengendali data pribadi sebagaimana dimaksud dalam Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).'
    ]
  },
  {
    h: 'Data yang kami kumpulkan',
    list: [
      'Data akun: nomor WhatsApp, alamat email, kata sandi (disimpan dalam bentuk terenkripsi satu arah, tidak bisa dibaca siapa pun), dan kode referral bila ada.',
      'Data identitas pemilik usaha: foto e-KTP, selfie dengan e-KTP, nama lengkap, NIK, tempat dan tanggal lahir, jenis kelamin, serta alamat sesuai e-KTP.',
      'Data usaha: nama dan jenis usaha, alamat dan titik lokasi toko (bila Anda mengizinkan akses lokasi), foto depan toko dan foto produk, cara berjualan, link toko online, dan perkiraan omzet.',
      'Data pencairan: nama bank, nomor rekening, nama pemilik rekening, dan pilihan waktu pencairan.',
      'Data Soundbox: cara pembelian, nomor pesanan marketplace, nama sales, nomor seri (SN) perangkat, dan data pengiriman.',
      'Data teknis: catatan masuk dan aktivitas di aplikasi yang diperlukan untuk keamanan, termasuk catatan setiap kali petugas kami membuka foto e-KTP atau selfie Anda.'
    ]
  },
  {
    h: 'Untuk apa data dipakai',
    list: [
      'Memverifikasi identitas dan usaha Anda (prinsip mengenal pelanggan) sesuai ketentuan Bank Indonesia untuk penerbitan QRIS.',
      'Mendaftarkan Anda sebagai merchant QRIS ke bank atau penyelenggara jasa pembayaran mitra, lalu menyampaikan NMID dan stiker QRIS kepada Anda.',
      'Mencairkan dana hasil transaksi QRIS ke rekening Anda.',
      'Memproses pembelian, pengiriman, dan aktivasi Soundbox, termasuk menghubungi Anda lewat WhatsApp untuk panduan aktivasi.',
      'Mengirim pemberitahuan penting tentang status pendaftaran, revisi foto, dan keamanan akun.',
      'Mencegah penipuan dan penyalahgunaan, serta memenuhi kewajiban hukum dan permintaan otoritas yang berwenang.'
    ],
    p: ['Dasar pemrosesan adalah persetujuan Anda saat mendaftar, pelaksanaan perjanjian layanan merchant, dan pemenuhan kewajiban hukum. Kami tidak menjual data pribadi Anda dan tidak memakainya untuk iklan pihak lain.']
  },
  {
    h: 'Kepada siapa data dibagikan',
    p: ['Data hanya dibagikan sebatas yang diperlukan untuk tujuan di atas, kepada:'],
    list: [
      'Bank dan penyelenggara jasa pembayaran mitra yang menerbitkan QRIS Anda, yaitu PT Bank Central Asia Tbk (BCA), PT Bank Nationalnobu Tbk (Nobu Bank), atau PT Bayarind (Bayarind), sesuai bank yang dipilih untuk pendaftaran Anda.',
      'Penyedia layanan yang bekerja atas nama kami: penyedia server dan penyimpanan data, layanan email, penyedia pembayaran untuk pembelian Soundbox, kurir pengiriman, dan, bila diaktifkan, layanan pembacaan otomatis e-KTP (OCR). Mereka hanya boleh memakai data sesuai instruksi kami.',
      'Otoritas yang berwenang, seperti Bank Indonesia, aparat penegak hukum, atau lembaga lain, bila diwajibkan oleh peraturan perundang-undangan.'
    ]
  },
  {
    h: 'Penyimpanan dan keamanan',
    list: [
      'Data disimpan di server yang hanya bisa diakses tim HausJo yang berwenang. Foto e-KTP, selfie, dan dokumen lain tidak bisa dibuka lewat link publik.',
      'Setiap petugas punya akun sendiri dengan hak akses sesuai perannya, dan setiap pembukaan foto identitas tercatat.',
      'Koneksi ke situs dienkripsi (HTTPS). Data dicadangkan secara berkala untuk mencegah kehilangan.',
      'Bila terjadi kegagalan pelindungan data pribadi, kami akan memberi tahu Anda dan lembaga yang berwenang sesuai ketentuan UU PDP.'
    ]
  },
  {
    h: 'Berapa lama data disimpan',
    p: [
      'Data disimpan selama Anda menjadi merchant HausJo, dan setelah itu selama jangka waktu yang diwajibkan peraturan di bidang sistem pembayaran dan pencegahan pencucian uang. Setelah masa itu berakhir, data dihapus atau dianonimkan. Data pendaftaran yang tidak pernah dikirim (masih draf) dapat kami hapus setelah 6 bulan tidak aktif.'
    ]
  },
  {
    h: 'Hak Anda',
    p: ['Sesuai UU PDP, Anda berhak:'],
    list: [
      'mendapat informasi tentang pemrosesan data Anda dan mengakses atau meminta salinannya;',
      'memperbaiki data yang salah atau tidak lengkap;',
      'menarik persetujuan, meminta pemrosesan dihentikan, atau meminta data dihapus, kecuali data yang wajib kami simpan menurut hukum;',
      'mengajukan keberatan dan mengadukan pelanggaran pelindungan data pribadi.'
    ]
  },
  {
    h: 'Cara menghubungi kami',
    p: [
      `Kirim permintaan atau pertanyaan tentang data pribadi Anda ke ${CONTACT} dengan menyebut nomor WhatsApp akun atau nomor tiket pendaftaran. Untuk keamanan, kami dapat meminta Anda membuktikan bahwa Anda pemilik akun sebelum memproses permintaan.`,
      'Menarik persetujuan atau menghapus data berarti layanan QRIS dan pencairan tidak dapat dilanjutkan.'
    ]
  },
  {
    h: 'Perubahan kebijakan',
    p: ['Kebijakan ini dapat diperbarui. Perubahan penting akan kami beritahukan lewat email atau aplikasi sebelum berlaku. Tanggal berlaku terbaru tercantum di bagian atas halaman ini.']
  }
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      updated="3 November 2026"
      intro="Kebijakan ini menjelaskan data pribadi apa yang kami kumpulkan saat Anda mendaftar dan memakai layanan merchant HausJo, untuk apa data itu dipakai, kepada siapa dibagikan, dan hak Anda atas data tersebut."
      sections={sections}
      other={{ href: '/syarat-ketentuan', label: 'Syarat & Ketentuan Merchant' }}
    />
  );
}
