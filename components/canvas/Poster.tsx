/** Static fallback for reduced-motion / no-WebGL: a soft sky gradient with a Concorde silhouette. */
export function Poster() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0"
      style={{ background: "linear-gradient(180deg, var(--sky-top) 0%, var(--sky-bottom) 100%)" }}
    >
      <svg viewBox="0 0 1200 400" className="absolute left-1/2 top-1/2 w-[min(90vw,1100px)] -translate-x-1/2 -translate-y-1/2 opacity-80" fill="none">
        <path d="M40 210 L560 200 L1120 192 L1100 204 L560 228 L300 236 L40 222 Z" fill="var(--paper)" opacity="0.9" />
        <path d="M380 200 L600 150 L700 200 Z" fill="var(--paper)" opacity="0.6" />
        <path d="M560 204 L1120 192" stroke="var(--ink)" strokeOpacity="0.25" />
      </svg>
    </div>
  );
}
