import { SAMPLES } from "@/lib/samples"
import { HashGrid } from "./Hash"
import { LiveStatus } from "./LiveStatus"

const S = SAMPLES[0]

/** The hero exhibit: a synthetic demo notice, its real SHA-256, its source, and a live Arkiv status. */
export function Specimen() {
  return (
    <figure className="relative mx-auto w-full max-w-[440px] lg:mx-0" aria-label="Exhibit: a synthetic demo notice and its fingerprint">
      {/* the document */}
      <div className="fade-in relative ml-auto w-[78%] rotate-[-1.2deg] border border-rule-strong bg-sheet shadow-[0_1px_0_var(--rule),0_30px_60px_-30px_rgba(21,20,15,0.35)]" style={{ aspectRatio: "1 / 1.414", animationDelay: "300ms" }}>
        <div className="flex h-[7%] items-center bg-signal px-[6%]">
          <span className="mono text-[7px] font-semibold uppercase tracking-[0.12em] text-white sm:text-[8px]">Demo source · synthetic notice</span>
        </div>
        <div className="space-y-[3.5%] px-[8%] pt-[8%]">
          <div className="h-[6px] w-[64%] bg-ink/80" />
          <div className="h-[5px] w-[82%] bg-ink/60" />
          <div className="pt-[4%] space-y-[6px]">
            {[92, 70, 86, 0, 58, 74, 66, 0, 80, 44].map((w, i) =>
              w ? <div key={i} className="h-[3px] bg-ink/20" style={{ width: `${w}%` }} /> : <div key={i} className="h-[6px]" />)}
          </div>
        </div>
        {/* the scan */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scanline h-1/3 w-full bg-gradient-to-b from-transparent via-forest/10 to-transparent" />
        </div>
        <span className="mono absolute bottom-[3%] left-[8%] text-[7px] text-ink-3">DEMO/2026/001</span>
      </div>

      {/* the evidence tag */}
      <figcaption className="fade-in relative -mt-[34%] w-[86%] border border-ink bg-paper p-4 sm:p-5" style={{ animationDelay: "700ms" }}>
        <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2">
          <span className="kicker text-ink!">Exhibit A</span>
          <span className="mono truncate text-[11px] text-ink-3">{S.file}</span>
        </div>
        <dl className="mt-3 space-y-3 text-[13px]">
          <div>
            <dt className="kicker mb-1">SHA-256 fingerprint</dt>
            <dd><HashGrid hash={S.sha256} /></dd>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="kicker pt-0.5">Source</dt>
            <dd className="mono break-all text-[12px]">/sakshi/board/notice-1.pdf</dd>
            <dt className="kicker pt-0.5">Status</dt>
            <dd><LiveStatus hash={S.sha256} /></dd>
          </div>
        </dl>
      </figcaption>

      {/* tie line from tag to document */}
      <svg className="pointer-events-none absolute right-[6%] top-[36%] hidden h-24 w-16 sm:block" viewBox="0 0 64 96" fill="none" aria-hidden>
        <path d="M2 94 C 30 70, 20 30, 60 4" stroke="var(--ink)" strokeWidth="1" style={{ strokeDasharray: 120, strokeDashoffset: 120, animation: "draw 1.4s var(--ease) 1.1s forwards" }} />
        <circle cx="60" cy="4" r="2.5" fill="var(--ink)" className="fade-in" style={{ animationDelay: "2.2s" }} />
      </svg>
    </figure>
  )
}
