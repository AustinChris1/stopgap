// Two supply bars stopping short of each other, with the signature rule left open in the gap.
export function Mark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Stopgap">
      <rect x="3.5" y="9" width="6.5" height="6" rx="1.4" fill="currentColor" />
      <rect x="14" y="9" width="6.5" height="6" rx="1.4" fill="currentColor" />
      <path d="M10.6 18.2h2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark className={compact ? "h-6 w-6 text-ink" : "h-8 w-8 text-ink"} />
      <span className={`font-display font-semibold tracking-tight text-ink ${compact ? "text-lg" : "text-2xl"}`}>
        Stopgap
      </span>
    </span>
  );
}
