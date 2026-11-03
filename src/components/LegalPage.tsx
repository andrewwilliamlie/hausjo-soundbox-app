import Link from 'next/link';

export type Section = { h: string; p?: string[]; list?: string[] };

/** Plain, readable layout for legal text: numbered sections, phone-width column. */
export default function LegalPage({ title, updated, intro, sections, other }: {
  title: string; updated: string; intro: string; sections: Section[]; other: { href: string; label: string };
}) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand" aria-label="HausJo beranda">HAUS<span>JO</span></Link>
        <Link href="/daftar" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '10px 4px' }}>Daftar</Link>
      </header>
      <main className="content legal" style={{ gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{title}</h1>
          <span className="hint">Berlaku sejak {updated} · PT Hausjo Digital Pro</span>
        </div>
        <p style={{ margin: 0 }}>{intro}</p>
        <nav aria-label="Daftar isi" className="card" style={{ gap: 6, padding: 14 }}>
          {sections.map((s, i) => <a key={s.h} href={`#b${i + 1}`} style={{ fontSize: 13.5, textDecoration: 'none' }}>{i + 1}. {s.h}</a>)}
        </nav>
        {sections.map((s, i) => (
          <section key={s.h} id={`b${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 8, scrollMarginTop: 16 }}>
            <h2 className="h2" style={{ fontSize: 16 }}>{i + 1}. {s.h}</h2>
            {s.p?.map((t, j) => <p key={j} style={{ margin: 0 }}>{t}</p>)}
            {s.list && <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>{s.list.map((t, j) => <li key={j}>{t}</li>)}</ul>}
          </section>
        ))}
        <p className="hint" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
          Baca juga: <Link href={other.href} style={{ fontWeight: 700 }}>{other.label}</Link>
        </p>
      </main>
    </div>
  );
}
