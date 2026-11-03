import Link from 'next/link';
import Icon, { IconTile } from '@/components/Icon';
import SoundboxArt from '@/components/SoundboxArt';

// Public landing page for hausjo.co.id: two clear signup options.
export default function Home() {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="HausJo beranda">HAUS<span>JO</span></Link>
        <Link href="/masuk" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '10px 4px' }}>Masuk</Link>
      </header>

      <main className="content" style={{ gap: 22 }}>
        <section className="hero rise" style={{ overflow: 'hidden' }}>
          <p className="eyebrow">SOUNDBOX QRIS HAUSJO</p>
          <h1>Setiap pembayaran QRIS, ada suaranya.</h1>
          <p>Daftar dalam 3 langkah, gratis. QRIS aktif dalam 1–2 hari kerja.</p>
          <SoundboxArt />
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="h2 rise rise-1">Mau daftar apa?</h2>

          <Link href="/daftar?produk=soundbox" className="card plan featured rise rise-2">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <IconTile name="speaker" />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 800 }}>Soundbox QRIS</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>Rp349.000</span>
              </div>
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: '#2b3a57' }}>QRIS + Soundbox yang menyebut setiap pembayaran masuk. Sekali bayar, jadi milik Anda.</span>
            <div className="note"><strong>Sudah pesan Soundbox</strong> di Shopee, TikTok, Tokopedia, Lazada atau lewat sales? Pilih ini, tidak perlu bayar lagi.</div>
            <span className="btn btn-primary btn-block">Daftar Soundbox QRIS <Icon name="chevron" size={18} /></span>
          </Link>

          <Link href="/daftar?produk=qris" className="card plan rise rise-3">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <IconTile name="qris" tone="green" />
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 800 }}>QRIS saja</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ok)' }}>Gratis</span>
              </div>
            </div>
            <span className="hint" style={{ fontSize: 13 }}>Stiker QRIS untuk dicetak sendiri, tanpa Soundbox. Bisa tambah Soundbox kapan saja.</span>
            <span className="btn btn-ghost btn-block">Daftar QRIS saja</span>
          </Link>
        </div>

        <section className="card rise rise-4" style={{ gap: 4 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}><IconTile name="wallet" size={36} /><h2 className="h2" style={{ fontSize: 16 }}>Biaya jelas dari awal</h2></div>
          <p className="hint" style={{ marginBottom: 6 }}>Pilih kapan uang dicairkan. Bisa diubah nanti.</p>
          <div className="fee"><span>Cair H+1, transaksi &lt; Rp500.000</span><strong style={{ color: 'var(--ok)' }}>MDR 0%</strong></div>
          <div className="fee"><span>Cair H+1, transaksi ≥ Rp500.000</span><strong>MDR 0,3%</strong></div>
          <div className="fee"><span>Biaya pencairan H+1</span><strong>Rp2.000 / pencairan</strong></div>
          <div className="fee"><span>Cair hari yang sama</span><strong>MDR 0,7%</strong></div>
          <div className="fee"><span>Biaya bulanan / sewa</span><strong style={{ color: 'var(--ok)' }}>Tidak ada</strong></div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 className="h2" style={{ fontSize: 16 }}>Daftar dalam 3 langkah</h2>
          {([
            ['ktp', 'Foto e-KTP & selfie', 'Siapkan e-KTP asli', 'blue'],
            ['store', 'Data usaha', 'Lokasi dan foto toko', 'orange'],
            ['checkCircle', 'Konfirmasi', 'Lalu langsung masuk aplikasi', 'green']
          ] as const).map(([icon, title, sub, tone], i) => (
            <div key={title} className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 }}>
              <IconTile name={icon} tone={tone} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><strong style={{ fontSize: 15 }}>{i + 1} · {title}</strong><span className="hint">{sub}</span></span>
            </div>
          ))}
        </section>

        <p className="hint" style={{ textAlign: 'center', display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="shield" size={16} /> Diproses bersama BCA dan Nobu Bank. Data Anda hanya untuk pendaftaran merchant.
        </p>
        <nav className="legal-links" aria-label="Informasi">
          <Link href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>
          <Link href="/kebijakan-privasi">Kebijakan Privasi</Link>
          <span className="hint">© PT Hausjo Digital Pro</span>
        </nav>
      </main>
    </div>
  );
}
