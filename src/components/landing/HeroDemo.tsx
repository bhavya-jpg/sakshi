"use client"
import { useEffect, useMemo, useState } from "react"
import { BASE } from "@/lib/base"
import { sha256Hex } from "@/lib/hash"
import { SAMPLES } from "@/lib/samples"
import { loadSnapshot, verdictFromSnapshot } from "@/lib/snapshot"
import { VERDICT_TEXT, type Verdict } from "@/lib/verdict"

// The hero loop: four real verifications against Arkiv, replayed as the product would show them.
// Every hash, verdict and timestamp below is computed or queried live; nothing is canned.
type Case = { file: string; label: string; hash?: `0x${string}`; verdict?: Verdict | "error" }

const CYCLE = 7000
const tone = {
  SERVED: { text: "text-forest-2", ring: "ring-forest-2/40", bg: "bg-forest-2/10", dot: "bg-forest-2" },
  REPLACED: { text: "text-[#e8b66b]", ring: "ring-[#e8b66b]/40", bg: "bg-[#e8b66b]/10", dot: "bg-[#e8b66b]" },
  REMOVED: { text: "text-[#f0937f]", ring: "ring-[#f0937f]/40", bg: "bg-[#f0937f]/10", dot: "bg-[#f0937f]" },
  NOT_SEEN: { text: "text-white/80", ring: "ring-white/20", bg: "bg-white/5", dot: "bg-white/40" },
} as const

const fmt = (t: number) => new Date(t * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) + " IST"

export function HeroDemo() {
  const [cases, setCases] = useState<Case[]>([
    { file: SAMPLES[0].file, label: "Still on the board", hash: SAMPLES[0].sha256 },
    { file: SAMPLES[1].file, label: "Original, later edited", hash: SAMPLES[1].sha256 },
    { file: SAMPLES[3].file, label: "Later withdrawn", hash: SAMPLES[3].sha256 },
    { file: "forwarded-copy.pdf", label: "One byte different" },
  ])
  const [t, setT] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    let alive = true
    ;(async () => {
      // the "forwarded copy": sample 1 with a single trailing byte added, hashed here in the browser
      const bytes = new Uint8Array(await (await fetch(`${BASE}/samples/${SAMPLES[0].file}`)).arrayBuffer())
      const edited = new Uint8Array(bytes.length + 1); edited.set(bytes); edited[bytes.length] = 0x20
      const editedHash = await sha256Hex(edited)
      if (alive) setCases((c) => c.map((x, i) => (i === 3 ? { ...x, hash: editedHash } : x)))
      const hashes = [SAMPLES[0].sha256, SAMPLES[1].sha256, SAMPLES[3].sha256, editedHash] as const
      // one shared read of the record (also used by the stats and the feed), then the same verdict logic as /verify
      const snap = await loadSnapshot().catch(() => null)
      if (alive) setCases((c) => c.map((x, i) => ({ ...x, verdict: snap ? verdictFromSnapshot(snap, hashes[i]) : "error" })))
    })().catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (reduced) return
    const start = performance.now()
    const id = setInterval(() => setT(performance.now() - start), 50)
    return () => clearInterval(id)
  }, [reduced])

  const idx = reduced ? 0 : Math.floor(t / CYCLE) % cases.length
  const p = reduced ? CYCLE : t % CYCLE // position within the current cycle
  const c = cases[idx]
  const stage = p < 600 ? 0 : p < 2200 ? 1 : p < 3000 ? 2 : 3 // drop · hash · query · result
  const hex = (c.hash ?? "0x" + "0".repeat(64)).slice(2)
  const shown = stage === 0 ? 0 : stage === 1 ? Math.floor(((p - 600) / 1600) * 64) : 64
  const noise = useMemo(() => Array.from({ length: 64 }, (_, i) => "0123456789abcdef"[(i * 7 + idx * 3) % 16]).join(""), [idx])

  const v = c.verdict && c.verdict !== "error" ? c.verdict : null
  const overall = v?.overall ?? "NOT_SEEN"
  const tn = tone[overall]
  const f = v?.findings[0]

  return (
    <div className="relative" aria-label="Animated demo of a verification, using live data from Arkiv">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-night-2/90 shadow-[0_50px_100px_-50px_rgba(23,35,68,0.6),0_0_0_1px_rgba(23,35,68,0.04)]">
        {/* window chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/15" />)}</span>
          <span className="mono mx-auto flex min-w-0 items-center gap-2 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/50">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="currentColor" aria-hidden><path d="M6 1a2.5 2.5 0 00-2.5 2.5V5H3a1 1 0 00-1 1v4a1 1 0 001 1h6a1 1 0 001-1V6a1 1 0 00-1-1h-.5V3.5A2.5 2.5 0 006 1zm1.5 4h-3V3.5a1.5 1.5 0 013 0V5z" /></svg>
            bhavya-jpg.github.io/sakshi/verify
          </span>
          <span className="mono hidden text-[10px] uppercase tracking-[0.12em] text-[#f3a08c] sm:inline">● live</span>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-[1.05fr_1fr]">
          {/* left: the file and its fingerprint */}
          <div className="space-y-5 border-b border-white/10 p-5 sm:p-6 md:border-b-0 md:border-r">
            <div className="relative h-[92px] rounded-xl border border-dashed border-white/15 bg-white/[0.02]">
              <div key={idx} className={`absolute inset-x-4 top-1/2 flex -translate-y-1/2 items-center gap-3 rounded-lg border border-white/10 bg-night px-3 py-2.5 transition-all duration-500 ${stage === 0 && !reduced ? "-translate-y-[140%] opacity-0" : "opacity-100"}`}>
                <svg viewBox="0 0 24 30" className="h-8 w-6 shrink-0" aria-hidden>
                  <path d="M1 1h15l7 7v21H1z" fill="#fff" fillOpacity=".06" stroke="#fff" strokeOpacity=".3" />
                  <path d="M16 1v7h7" stroke="#fff" strokeOpacity=".3" fill="none" />
                  <rect x="4" y="19" width="16" height="6" rx="1" fill="#e4502f" />
                </svg>
                <div className="min-w-0">
                  <p className="mono truncate text-[12px] text-white">{c.file}</p>
                  <p className="text-[11px] text-white/45">{c.label}</p>
                </div>
                <span className={`mono ml-auto text-[10px] ${stage >= 3 ? tn.text : "text-white/40"}`}>{stage >= 3 ? "done" : stage === 2 ? "querying" : stage === 1 ? "hashing" : ""}</span>
              </div>
            </div>

            <div>
              <p className="mono mb-2 text-[10px] uppercase tracking-[0.14em] text-white/40">SHA-256 · computed on device</p>
              <p className="mono grid grid-cols-4 gap-x-3 gap-y-1 text-[12px] leading-5 sm:text-[12.5px]" aria-hidden>
                {Array.from({ length: 8 }, (_, g) => (
                  <span key={g}>
                    {Array.from({ length: 8 }, (_, k) => {
                      const i = g * 8 + k
                      return <span key={k} className={i < shown ? "text-white" : "text-white/15"}>{i < shown ? hex[i] : noise[i]}</span>
                    })}
                  </span>
                ))}
              </p>
            </div>

            <ol className="grid grid-cols-3 gap-2 text-[11px]">
              {["Read", "Fingerprint", "Query Arkiv"].map((s, i) => {
                const done = stage > i || (i === 0 && stage >= 1)
                const act = stage === i + 1 || (i === 2 && stage === 2)
                return (
                  <li key={s} className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-colors ${done ? "border-forest-2/30 text-white" : act ? "border-white/20 text-white" : "border-white/10 text-white/35"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-forest-2" : act ? "bg-white/70" : "bg-white/20"}`} />{s}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* right: the evidence */}
          <div className="relative min-h-[260px] p-5 sm:p-6">
            {stage < 3 ? (
              <div className="flex h-full flex-col justify-center gap-3" aria-hidden>
                {[80, 60, 70].map((w, i) => (
                  <div key={i} className="h-3 overflow-hidden rounded bg-white/5" style={{ width: `${w}%` }}>
                    {stage === 2 && <div className="progress-sweep h-full w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
                  </div>
                ))}
                <p className="mono mt-2 text-[11px] text-white/35">{stage === 2 ? "eq(doc_sha256, bytes32(h)) → Tiramisu" : "waiting for fingerprint"}</p>
              </div>
            ) : (
              <div key={`r${idx}`} className="fade-in space-y-4">
                <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ring-1 ${tn.ring} ${tn.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${tn.dot}`} />
                  <span className={`mono text-[10.5px] uppercase tracking-[0.12em] ${tn.text}`}>{v ? (overall === "NOT_SEEN" ? "No evidence either way" : "Evidence found") : c.verdict === "error" ? "Arkiv unreachable" : "Querying Arkiv"}</span>
                </div>
                <p className={`text-[30px] font-semibold leading-none tracking-[-0.04em] ${tn.text}`}>
                  {v ? VERDICT_TEXT[overall].en : "…"} {v && <span className="serif text-[18px] font-normal italic text-white/40">{VERDICT_TEXT[overall].hi}</span>}
                </p>
                {f ? (
                  <dl className="space-y-2 text-[12px]">
                    <div className="mono truncate text-white/70">{f.url.replace("https://", "")}</div>
                    <div className="flex justify-between gap-4 border-t border-white/10 pt-2"><dt className="text-white/40">First seen</dt><dd className="text-white/85">{fmt(f.firstSeen)}</dd></div>
                    {f.endedAt
                      ? <div className="flex justify-between gap-4"><dt className="text-white/40">{f.status === "REMOVED" ? "URL gone" : "Replaced"}</dt><dd className="text-white/85">{fmt(f.endedAt)}</dd></div>
                      : <div className="flex justify-between gap-4"><dt className="text-white/40">Still served as of</dt><dd className="text-white/85">{fmt(f.lastConfirmed)}</dd></div>}
                    <div className="flex justify-between gap-4"><dt className="text-white/40">Witnesses</dt><dd className="text-white/85">{v!.witnesses.length}</dd></div>
                  </dl>
                ) : v ? (
                  <p className="text-[13px] leading-relaxed text-white/60">No trusted witness recorded this exact file. That is <span className="text-white">not</span> evidence it is fake. Check the official source.</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* case selector dots */}
      <div className="mt-4 flex justify-center gap-2" aria-hidden>
        {cases.map((_, i) => <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === idx ? "w-8 bg-accent" : "w-3 bg-ink/15"}`} />)}
      </div>
    </div>
  )
}
