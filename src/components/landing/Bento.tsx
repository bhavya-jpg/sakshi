"use client"
import { useEffect, useRef, useState } from "react"
import { SAMPLES } from "@/lib/samples"

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { rootMargin: "0px 0px -15% 0px" })
    io.observe(el); return () => io.disconnect()
  }, [])
  return [ref, seen] as const
}

/** Animation clock. Returns -1 when the viewer prefers reduced motion: callers then render their final frame. */
function useTick(ms: number, on: boolean) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(-1); return }
    if (!on) return
    const id = setInterval(() => setN((x) => x + 1), ms); return () => clearInterval(id)
  }, [ms, on])
  return n
}
const NOISE = (i: number, n: number) => "0123456789abcdef"[((i * 2654435761) ^ (n * 40503 + i * 97)) >>> 0 & 15]

function Tile({ className = "", title, body, children, dark = false }: { className?: string; title: string; body: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`group relative flex flex-col overflow-hidden ${dark ? "card-night bg-night text-white" : "card"} ${className}`}>
      <div className="relative min-h-[170px] flex-1 overflow-hidden">{children}</div>
      <div className={`border-t p-5 ${dark ? "border-white/10" : "border-rule"}`}>
        <h3 className="text-[17px] font-semibold tracking-[-0.025em]">{title}</h3>
        <p className={`mt-1 text-[14px] leading-relaxed ${dark ? "text-white/60" : "text-ink-2"}`}>{body}</p>
      </div>
    </div>
  )
}

/* 1 · fingerprint on device */
function FingerprintViz() {
  const [ref, on] = useInView<HTMLDivElement>()
  const n = useTick(90, on)
  const target = SAMPLES[1].sha256.slice(2)
  const locked = n < 0 ? 64 : Math.min(64, n % 110)
  return (
    <div ref={ref} className="flex h-full items-center gap-6 p-6">
      <svg viewBox="0 0 48 60" className="float h-20 w-16 shrink-0" aria-hidden>
        <path d="M2 2h30l14 14v42H2z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="1.5" />
        <path d="M32 2v14h14" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        {[24, 31, 38].map((y) => <line key={y} x1="9" x2="38" y1={y} y2={y} stroke="var(--ink-3)" strokeWidth="1.5" />)}
        <rect x="9" y="45" width="22" height="7" rx="1.5" fill="var(--signal)" />
      </svg>
      <svg viewBox="0 0 40 12" className="h-3 w-10 shrink-0" aria-hidden><path d="M0 6h36m-5-5 5 5-5 5" stroke="var(--forest)" strokeWidth="1.5" fill="none" className="flow" /></svg>
      <p className="mono grid min-w-0 grid-cols-4 gap-x-2.5 gap-y-1 text-[11.5px] sm:text-[12.5px]" aria-label={`SHA-256 ${target}`}>
        {Array.from({ length: 8 }, (_, g) => (
          <span key={g}>{Array.from({ length: 8 }, (_, k) => {
            const i = g * 8 + k
            return <span key={k} className={i < locked ? "text-ink" : "text-ink-3/40"}>{i < locked ? target[i] : NOISE(i, n)}</span>
          })}</span>
        ))}
      </p>
    </div>
  )
}

/* 2 · one byte changes everything (real: demo notice 2, deadline moved) */
function DiffViz() {
  const a = SAMPLES[1].sha256.slice(2, 34), b = SAMPLES[2].sha256.slice(2, 34)
  return (
    <div className="space-y-3 p-6">
      <div className="flex items-center justify-between text-[12px]"><span className="text-ink-2">Last date: <b className="font-medium text-ink">30 Nov</b></span><span className="mono text-ink-3">v1</span></div>
      <p className="mono break-all text-[12px] leading-5">{a}…</p>
      <div className="flex items-center justify-between text-[12px]"><span className="text-ink-2">Last date: <b className="bg-ochre-tint px-1 font-medium text-ochre">05 Nov</b></span><span className="mono text-ink-3">v2</span></div>
      <p className="mono break-all text-[12px] leading-5">
        {b.split("").map((ch, i) => <span key={i} className={ch !== a[i] ? "text-oxblood" : "text-ink-3"}>{ch}</span>)}…
      </p>
    </div>
  )
}

/* 3 · history that can't be rewritten */
function TimelineViz() {
  const [ref, on] = useInView<HTMLDivElement>()
  const n = useTick(1200, on)
  const step = n < 0 ? 3 : on ? (n % 5) + 1 : 1
  const rows = [
    { k: "seen", c: "bg-forest-2", t: "00:15", d: "notice-2.pdf · 0x1a89d9…" },
    { k: "changed", c: "bg-[#e0a33a]", t: "00:17", d: "now 0xcc8071… · prev struck" },
    { k: "gone", c: "bg-oxblood", t: "00:17", d: "notice-3.pdf · HTTP 404" },
  ]
  return (
    <div ref={ref} className="relative p-6 pl-10">
      <span className="absolute bottom-6 left-[27px] top-6 w-px bg-rule-strong" aria-hidden />
      <ul className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.k} className={`relative transition-all duration-500 ${i < step ? "opacity-100" : "translate-y-1 opacity-20"}`}>
            <span className={`absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-sheet ${r.c}`} />
            <p className="mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">{r.k} · {r.t} IST</p>
            <p className="mono text-[12px] text-ink">{r.d}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* 4 · you choose who to trust */
function TrustViz() {
  const [ref, on] = useInView<HTMLDivElement>()
  const n = useTick(2200, on)
  const unknownOn = n > 0 && n % 2 === 1
  const Row = ({ label, addr, active, note }: { label: string; addr: string; active: boolean; note: string }) => (
    <div className="flex items-center gap-3 rounded-lg border border-rule bg-paper/60 px-3 py-2.5">
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ${active ? "bg-forest-2" : "bg-ink/15"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${active ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <div className="min-w-0"><p className="text-[13px] font-medium">{label}</p><p className="mono truncate text-[10.5px] text-ink-3">{addr}</p></div>
      <span className={`mono ml-auto shrink-0 text-[10.5px] ${active ? "text-forest" : "text-ink-3"}`}>{note}</span>
    </div>
  )
  return (
    <div ref={ref} className="space-y-2.5 p-6">
      <Row label="Sakshi witness A" addr="0xCB16…3bFa" active note="counted" />
      <Row label="Another wallet" addr="any wallet can claim any domain" active={unknownOn} note={unknownOn ? "you opted in" : "ignored"} />
    </div>
  )
}

/* 5 · no server */
function ServerlessViz() {
  return (
    <div className="flex h-full items-center justify-center gap-3 p-6">
      {[["Your browser", "static site"], ["Tiramisu RPC", "public, CORS *"]].map(([a, b], i) => (
        <div key={a} className="contents">
          {i === 1 && (
            <svg viewBox="0 0 120 20" className="h-5 w-24 shrink-0" aria-hidden>
              <line x1="0" y1="10" x2="120" y2="10" stroke="var(--forest-2)" strokeWidth="1.5" className="flow" />
            </svg>
          )}
          <div className={`rounded-xl border px-4 py-3 text-center ${i === 1 ? "border-white/10 bg-night text-white" : "border-rule bg-sheet"}`}>
            <p className="text-[13px] font-semibold">{a}</p><p className={`mono text-[10.5px] ${i === 1 ? "text-white/50" : "text-ink-3"}`}>{b}</p>
          </div>
        </div>
      ))}
      <span className="mono absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-dashed border-rule-strong px-2 py-0.5 text-[10.5px] text-ink-3 line-through">sakshi server</span>
    </div>
  )
}

/* 6 · verify from the terminal (output of a real run of scripts/verify.ts) */
const TERM = [
  ["$ ", "npx tsx scripts/verify.ts demo-notice-2-v1.pdf"],
  ["", "sha256    0x1a89d92e6a8fc8430aa495c255b88d2b…"],
  ["", "verdict   REPLACED  (Replaced · बदला गया)"],
  ["", "  first seen      2026-10-18T18:45:51Z"],
  ["", "  replaced        2026-10-18T18:47:38Z"],
  ["", "    seen    0x1a89d92e…  entity 0x09ab88cd…"],
  ["", "    changed 0xcc807160…  entity 0xde3d2faa…"],
]
function TerminalViz() {
  const [ref, on] = useInView<HTMLDivElement>()
  const n = useTick(45, on)
  const total = TERM.reduce((s, [, l]) => s + l.length, 0) + 60
  let budget = n < 0 ? total : on ? n % total : 0
  return (
    <div ref={ref} className="mono h-full p-5 text-[11.5px] leading-[1.7] text-white/80 sm:text-[12px]">
      <div className="mb-3 flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/15" />)}</div>
      {TERM.map(([p, l], i) => {
        const show = Math.max(0, Math.min(l.length, budget)); budget -= l.length
        if (show === 0 && i > 0) return null
        return (
          <div key={i} className={`truncate ${l.startsWith("verdict") ? "text-[#f0b54a]" : i === 0 ? "text-white" : ""}`}>
            <span className="text-forest-2">{p}</span>{l.slice(0, show)}{show < l.length && <span className="caret" />}
          </div>
        )
      })}
    </div>
  )
}

export function Bento() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      <Tile className="md:col-span-4" title="Fingerprinted on your device" body="Your browser computes the PDF's SHA-256. The file itself never leaves your phone or laptop."><FingerprintViz /></Tile>
      <Tile className="md:col-span-2" title="One edit, a new fingerprint" body="The demo board moved a deadline. The two files look alike; their hashes do not."><DiffViz /></Tile>
      <Tile className="md:col-span-2" title="History that can't be rewritten" body="Records are readonly. A change is a new record, never an edit."><TimelineViz /></Tile>
      <Tile className="md:col-span-2" title="You choose who to trust" body="Results count only wallets you trust. A record that merely claims a domain is ignored."><TrustViz /></Tile>
      <Tile className="md:col-span-2" title="No server to take down" body="This site is static files. Your browser reads Arkiv directly."><ServerlessViz /></Tile>
      <Tile className="md:col-span-6 lg:col-span-6" dark title="Verify without this website" body="The same check from a terminal, straight against the public RPC. No key, no Sakshi server. This is real output from the demo record."><TerminalViz /></Tile>
    </div>
  )
}
