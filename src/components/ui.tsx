/** Small shared building blocks. */

export function Index({ n, label, className = "" }: { n: string; label: string; className?: string }) {
  return (
    <p className={`hud flex items-center gap-3 text-muted ${className}`}>
      <span className="text-red">{n}</span>
      <span className="h-px w-8 bg-white/20" aria-hidden />
      <span>{label}</span>
    </p>
  );
}

export function Glow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full bg-red/20 blur-[120px] ${className}`}
    />
  );
}

/** Minimal line-icon set (24px grid, stroke-based so DrawSVG can animate it). */
export function LineIcon({ name, className = "", size }: { name: string; className?: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 21 21" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.4-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3Z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="10.5" cy="7" r="1" />
        <circle cx="15" cy="7.5" r="1" />
      </>
    ),
    rocket: (
      <>
        <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" />
        <path d="M9 15 6 12l3-1c2-4 6-8 12-8 0 6-4 10-8 12l-1 3-3-3Z" />
        <circle cx="15" cy="9" r="1.5" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 6-7" />
      </>
    ),
    loop: (
      <>
        <path d="M20 11a8 8 0 0 0-14.5-4.5L3 9" />
        <path d="M3 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.5 4.5L21 15" />
        <path d="M21 20v-5h-5" />
      </>
    ),
    health: (
      <>
        <path d="M3 12h4l2-5 4 10 2-5h6" />
      </>
    ),
    education: (
      <>
        <path d="m2 9 10-5 10 5-10 5Z" />
        <path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
      </>
    ),
    auto: (
      <>
        <path d="M3 16v-3l2-5h14l2 5v3Z" />
        <circle cx="7.5" cy="16.5" r="1.8" />
        <circle cx="16.5" cy="16.5" r="1.8" />
      </>
    ),
    retail: (
      <>
        <path d="M5 8h14l-1 12H6Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    factory: (
      <>
        <path d="M3 21V10l6 4v-4l6 4V5h6v16Z" />
      </>
    ),
    leaf: (
      <>
        <path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15Z" />
        <path d="M5 19 14 10" />
      </>
    ),
    wellness: (
      <>
        <path d="M12 20s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 10-8 10Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {p[name]}
    </svg>
  );
}
