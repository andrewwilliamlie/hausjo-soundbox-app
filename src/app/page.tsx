import Link from 'next/link';

// Public landing page for hausjo.co.id: two clear signup options.
export default function Home() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="HausJo beranda">
          HAUS<span>JO</span>
        </Link>
        <Link href="/masuk" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '10px 4px' }}>
          Masuk
        </Link>
      </header>

      <main className="content" style={{ gap: 22 }}>
        <section className="hero">
          <p className="eyebrow">SOUNDBOX QRIS HAUSJO</p>
          <h1>Setiap pembayaran QRIS, ada suaranya.</h1>
          <p>Daftar dalam 3 langkah, gratis. QRIS aktif dalam 1–2 hari kerja.</p>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="h2">Mau daftar apa?</h2>

          <Link href="/daftar?produk=soundbox" className="card plan featured">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>Soundbox QRIS</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>Rp349.000</span>
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: '#2b3a57' }}>
              QRIS + Soundbox yang menyebut setiap pembayaran masuk. Sekali bayar, jadi milik Anda.
            </span>
            <div className="note">
              <strong>Sudah pesan Soundbox</strong> di Shopee, TikTok, Tokopedia, Lazada atau lewat sales? Pilih ini, tidak
              perlu bayar lagi.
            </div>
            <span className="btn btn-primary btn-block">Daftar Soundbox QRIS</span>
          </Link>

          <Link href="/daftar?produk=qris" className="card plan">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>QRIS saja</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ok)' }}>Gratis</span>
            </div>
            <span className="hint" style={{ fontSize: 13 }}>
              Stiker QRIS untuk dicetak sendiri, tanpa Soundbox. Bisa tambah Soundbox kapan saja.
            </span>
            <span className="btn btn-ghost btn-block">Daftar QRIS saja</span>
          </Link>
        </div>

        <section className="card" style={{ gap: 4 }}>
          <h2 className="h2" style={{ fontSize: 16 }}>Biaya jelas dari awal</h2>
          <p className="hint" style={{ marginBottom: 6 }}>Pilih kapan uang dicairkan. Bisa diubah nanti.</p>
          <div className="fee"><span>Cair H+1, transaksi &lt; Rp500.000</span><strong style={{ color: 'var(--ok)' }}>MDR 0%</strong></div>
          <div className="fee"><span>Cair H+1, transaksi ≥ Rp500.000</span><strong>MDR 0,3%</strong></div>
          <div className="fee"><span>Biaya pencairan H+1</span><strong>Rp2.000 / pencairan</strong></div>
          <div className="fee"><span>Cair hari yang sama</span><strong>MDR 0,7%</strong></div>
          <div className="fee"><span>Biaya bulanan / sewa</span><strong style={{ color: 'var(--ok)' }}>Tidak ada</strong></div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h2" style={{ fontSize: 16 }}>Daftar dalam 3 langkah</h2>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            <li><strong>Foto e-KTP &amp; selfie</strong></li>
            <li><strong>Data usaha</strong>: lokasi dari peta dan foto toko</li>
            <li><strong>Konfirmasi</strong>, lalu langsung masuk aplikasi</li>
          </ol>
        </section>

        <p className="hint" style={{ textAlign: 'center' }}>
          Diproses bersama BCA dan Nobu Bank. Data Anda hanya dipakai untuk pendaftaran merchant.
        </p>
      </main>
    </div>
  );
}
