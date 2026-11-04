import LegalPage, { type Section } from '@/components/LegalPage';

export const metadata = { title: 'Syarat & Ketentuan Merchant · AIPOS' };

const sections: Section[] = [
  {
    h: 'Para pihak dan persetujuan',
    p: [
      'Syarat & Ketentuan ini berlaku antara PT Global Platform Asiatic ("AIPOS") dan Anda sebagai pemilik usaha yang mendaftar layanan QRIS dan/atau Soundbox QRIS AIPOS ("Merchant"). Dengan membuat akun dan mengirim pendaftaran, Anda menyatakan telah membaca dan menyetujui Syarat & Ketentuan ini serta Kebijakan Privasi AIPOS.'
    ]
  },
  {
    h: 'Layanan',
    list: [
      'QRIS saja: pendaftaran QRIS tanpa biaya pendaftaran. Merchant menerima stiker QRIS untuk dicetak sendiri.',
      'Soundbox QRIS: QRIS ditambah perangkat Soundbox yang menyuarakan setiap pembayaran masuk, dengan harga Rp349.000 sekali bayar. Soundbox menjadi milik Merchant, tanpa biaya sewa.',
      'QRIS diterbitkan oleh bank atau penyelenggara jasa pembayaran mitra AIPOS. AIPOS memilih mitra penerbit berdasarkan data pendaftaran.'
    ]
  },
  {
    h: 'Syarat menjadi Merchant',
    list: [
      'Warga negara Indonesia berusia minimal 17 tahun atau sudah menikah, dengan e-KTP yang masih berlaku.',
      'Menjalankan usaha yang sah dan tidak termasuk usaha yang dilarang oleh hukum atau oleh ketentuan bank mitra, misalnya perjudian, barang ilegal, atau usaha yang menyesatkan konsumen.',
      'Memiliki rekening bank atas nama yang sama dengan nama di e-KTP untuk pencairan dana.'
    ]
  },
  {
    h: 'Kebenaran data',
    p: [
      'Merchant wajib memberikan data dan foto yang benar, lengkap, dan milik sendiri, serta memperbaruinya bila berubah. AIPOS dan bank mitra berhak memeriksa, meminta perbaikan, menunda, atau menolak pendaftaran. QRIS biasanya aktif dalam 1–2 hari kerja setelah data lengkap dan rekening ditambahkan, namun waktu ini bergantung pada proses bank mitra dan bukan jaminan.'
    ]
  },
  {
    h: 'Biaya transaksi dan pencairan',
    list: [
      'Pencairan H+1: MDR 0% untuk transaksi di bawah Rp500.000 dan 0,3% untuk transaksi mulai Rp500.000, ditambah biaya Rp2.000 per pencairan.',
      'Pencairan hari yang sama: MDR 0,7% per transaksi, tanpa biaya pencairan.',
      'Tidak ada biaya bulanan atau sewa.',
      'Biaya dipotong dari dana yang dicairkan. Perubahan biaya, termasuk karena perubahan ketentuan Bank Indonesia, akan diberitahukan lebih dulu lewat email atau aplikasi.'
    ]
  },
  {
    h: 'Pencairan dana',
    p: [
      'Dana transaksi dicairkan ke rekening yang didaftarkan Merchant sesuai pilihan waktu pencairan, pada hari kerja, kecuali ada gangguan sistem, hari libur, atau penahanan karena dugaan penipuan atau permintaan otoritas. Merchant bertanggung jawab atas kebenaran nomor rekening. Perubahan rekening dapat memerlukan verifikasi ulang.'
    ]
  },
  {
    h: 'Pembelian dan garansi Soundbox',
    list: [
      'Soundbox yang dibeli lewat aplikasi dibayar melalui link pembayaran yang dikirim setelah pendaftaran disetujui, dan dikirim setelah QRIS aktif.',
      'Soundbox yang dibeli lewat marketplace resmi AIPOS atau sales AIPOS dicocokkan dengan nomor pesanan atau nama sales yang Merchant isi.',
      'Setelah Soundbox diterima, Merchant dapat memindai nomor seri (SN) di aplikasi agar tim CS memandu aktivasi.',
      'Garansi, penukaran, dan pengembalian mengikuti ketentuan yang tertera pada kemasan atau halaman produk tempat pembelian.'
    ]
  },
  {
    h: 'Kewajiban Merchant',
    list: [
      'Memakai QRIS hanya untuk transaksi penjualan barang atau jasa yang sebenarnya dari usaha yang didaftarkan.',
      'Tidak membebankan biaya tambahan kepada pembeli yang membayar dengan QRIS (surcharge).',
      'Menjaga kerahasiaan kata sandi akun dan segera memberi tahu AIPOS bila akun diduga disalahgunakan.',
      'Memasang stiker QRIS asli dari AIPOS dan tidak menggantinya dengan kode lain.'
    ]
  },
  {
    h: 'Penangguhan dan pengakhiran',
    p: [
      'AIPOS atau bank mitra dapat menangguhkan atau menghentikan QRIS bila Merchant melanggar Syarat & Ketentuan ini, memberikan data palsu, ada dugaan penipuan atau pencucian uang, atau atas perintah otoritas. Merchant dapat berhenti kapan saja dengan menghubungi AIPOS; dana yang sudah menjadi hak Merchant tetap dicairkan setelah dikurangi biaya yang berlaku.'
    ]
  },
  {
    h: 'Batas tanggung jawab',
    p: [
      'AIPOS berupaya menjaga layanan tetap berjalan, namun tidak bertanggung jawab atas kerugian tidak langsung, atau gangguan yang disebabkan oleh bank mitra, jaringan, listrik, perangkat Merchant, atau keadaan di luar kendali wajar AIPOS. Hal ini tidak mengurangi hak Merchant yang dilindungi peraturan perundang-undangan di bidang perlindungan konsumen.'
    ]
  },
  {
    h: 'Hukum yang berlaku dan pengaduan',
    p: [
      'Syarat & Ketentuan ini tunduk pada hukum Republik Indonesia. Pertanyaan dan pengaduan dapat dikirim ke support@aipos.co.id. Perselisihan diselesaikan lebih dulu secara musyawarah; bila tidak tercapai, melalui lembaga penyelesaian sengketa atau pengadilan yang berwenang di Indonesia.'
    ]
  },
  {
    h: 'Perubahan',
    p: ['AIPOS dapat mengubah Syarat & Ketentuan ini. Perubahan penting diberitahukan lewat email atau aplikasi sebelum berlaku. Bila Merchant tetap memakai layanan setelah tanggal berlaku, Merchant dianggap menyetujui perubahan tersebut.']
  }
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Syarat & Ketentuan Merchant"
      updated="3 November 2026"
      intro="Ketentuan ini mengatur pendaftaran dan pemakaian layanan QRIS dan Soundbox QRIS AIPOS, termasuk biaya, pencairan dana, serta hak dan kewajiban Anda sebagai Merchant."
      sections={sections}
      other={{ href: '/kebijakan-privasi', label: 'Kebijakan Privasi' }}
    />
  );
}
