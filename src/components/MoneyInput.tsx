'use client';

/** Rupiah amount input: digits only, shown with thousand separators. */
export default function MoneyInput({ value, onChange, placeholder = '0', label, prefix = 'Rp', autoFocus }: {
  value: number; onChange: (n: number) => void; placeholder?: string; label?: string; prefix?: string; autoFocus?: boolean;
}) {
  return (
    <span className="money-input">
      {prefix && <span aria-hidden="true">{prefix}</span>}
      <input inputMode="numeric" aria-label={label} placeholder={placeholder} autoFocus={autoFocus}
        value={value ? value.toLocaleString('id-ID') : ''}
        onChange={(e) => onChange(Math.min(1_000_000_000, parseInt(e.target.value.replace(/\D/g, '') || '0', 10)))} />
    </span>
  );
}
