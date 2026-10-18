/** Sakshi mark: an eye-shaped seal, the witness. */
export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <rect x="0.5" y="0.5" width="31" height="31" rx="9" fill="currentColor" />
      <path d="M5.5 16c2.8-4.6 6.3-6.9 10.5-6.9S23.7 11.4 26.5 16c-2.8 4.6-6.3 6.9-10.5 6.9S8.3 20.6 5.5 16Z" stroke="var(--paper)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.3" fill="var(--forest-2)" />
    </svg>
  )
}
