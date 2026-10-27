// Drawn, not iconographic: a concentrate vial and an IV bag, so the product form
// is visible before any text is read.
export function VialGlyph({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect x="14" y="4" width="8" height="3.4" rx="1.2" fill="currentColor" opacity="0.55" />
      <path
        d="M13 8.4h10v20.2a3.4 3.4 0 0 1-3.4 3.4h-3.2a3.4 3.4 0 0 1-3.4-3.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M13 19.5h10v9.1a3.4 3.4 0 0 1-3.4 3.4h-3.2a3.4 3.4 0 0 1-3.4-3.4z" fill="currentColor" opacity="0.22" />
      <path d="M13 19.5h10" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function BagGlyph({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path d="M18 2.5v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <path
        d="M11 6.2h14a1.6 1.6 0 0 1 1.6 1.6v16.9c0 1-.4 1.9-1.1 2.6l-3.1 3.1a2 2 0 0 1-1.4.6h-6a2 2 0 0 1-1.4-.6l-3.1-3.1a3.6 3.6 0 0 1-1.1-2.6V7.8A1.6 1.6 0 0 1 11 6.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9.4 16.5h17.2v8.2c0 1-.4 1.9-1.1 2.6l-3.1 3.1a2 2 0 0 1-1.4.6h-6a2 2 0 0 1-1.4-.6l-3.1-3.1a3.6 3.6 0 0 1-1.1-2.6z"
        fill="currentColor"
        opacity="0.22"
      />
      <path d="M9.4 16.5h17.2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function FormGlyph({ isPremix, className }: { isPremix: boolean; className?: string }) {
  return isPremix ? <BagGlyph className={className} /> : <VialGlyph className={className} />;
}
