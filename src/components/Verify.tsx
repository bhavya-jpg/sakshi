"use client"
import { useCallback, useRef, useState } from "react"
import { BASE } from "@/lib/base"
import { WITNESSES } from "@/lib/config"
import { sha256Hex } from "@/lib/hash"
import { SAMPLES } from "@/lib/samples"
import { verifyHash } from "@/lib/service"
import type { Verdict } from "@/lib/verdict"
import { CopyHash, HashGrid } from "./Hash"
import { DemoBadge, VerdictView } from "./VerdictView"

type Phase = "idle" | "reading" | "hashing" | "querying" | "done" | "error"
type FileMeta = { name: string; size: number; type: string; lastModified?: number; isPdf: boolean; hash: `0x${string}` }

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`)

export function Verify() {
  const [trusted, setTrusted] = useState<string[]>(WITNESSES.map((w) => w.address))
  const [phase, setPhase] = useState<Phase>("idle")
  const [file, setFile] = useState<FileMeta | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const query = useCallback(async (hash: `0x${string}`, trust: string[]) => {
    setPhase("querying"); setError(null)
    try {
      // Read straight from the public Tiramisu RPC, in this browser.
      setVerdict(await verifyHash(hash, trust))
      setPhase("done")
    } catch (e) {
      setVerdict(null); setPhase("error")
      const msg = (e as Error).message ?? ""
      setError(/429|rate|limit/i.test(msg)
        ? "The public Arkiv RPC is rate-limiting this network right now. Wait a few minutes and try again. Your file was not uploaded anywhere."
        : `Could not reach Arkiv: ${msg.split("\n")[0]}. Your file was not uploaded anywhere.`)
    }
  }, [])

  const examine = useCallback(async (blob: Blob, name: string, lastModified?: number) => {
    setVerdict(null); setError(null); setPhase("reading")
    const buf = await blob.arrayBuffer()
    setPhase("hashing")
    const hash = await sha256Hex(buf)
    const head = new TextDecoder().decode(new Uint8Array(buf.slice(0, 5)))
    setFile({ name, size: blob.size, type: blob.type || "unknown", lastModified, isPdf: head === "%PDF-", hash })
    await query(hash, trusted)
  }, [query, trusted])

  const examineSample = async (f: string) => {
    setPhase("reading")
    const res = await fetch(`${BASE}/samples/${f}`)
    await examine(await res.blob(), f)
  }

  const toggle = (a: string) => {
    const next = trusted.includes(a) ? trusted.filter((x) => x !== a) : [...trusted, a]
    setTrusted(next)
    if (file) query(file.hash, next)
  }

  const busy = phase === "reading" || phase === "hashing" || phase === "querying"
  const stepIndex = { idle: -1, reading: 0, hashing: 1, querying: 2, done: 3, error: 2 }[phase]

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
      {/* ── Instrument ── */}
      <div className="space-y-8 lg:col-span-7">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) examine(f, f.name, f.lastModified) }}
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed bg-sheet transition-[border-color,background-color,box-shadow] duration-500 ${drag ? "border-forest-2 bg-forest-tint shadow-[0_0_0_6px_rgba(25,169,113,0.12)]" : "border-rule-strong hover:border-ink-3 hover:shadow-[0_12px_32px_-16px_rgba(12,15,14,0.25)]"}`}
        >
          <button type="button" onClick={() => input.current?.click()} disabled={busy}
            className="flex w-full flex-col items-start gap-6 p-6 text-left sm:flex-row sm:items-center sm:p-8">
            <DocGlyph active={drag || busy} />
            <span className="block">
              <span className="block text-[21px] font-semibold leading-tight tracking-[-0.03em]">
                {drag ? "Release to examine" : "Drop a notice PDF here"}
              </span>
              <span className="mt-1 block text-[14px] text-ink-2">
                or <span className="ink-link-static text-ink">choose a file</span>. It is fingerprinted on this device and never uploaded.
              </span>
            </span>
          </button>
          <input ref={input} type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) examine(f, f.name, f.lastModified); e.target.value = "" }} />
          {busy && <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden" aria-hidden><div className="progress-sweep h-full w-1/3 bg-forest" /></div>}
        </div>

        {/* progress ledger */}
        <ol className="grid grid-cols-3 overflow-hidden rounded-xl border border-rule bg-sheet text-[12px]" aria-label="Progress">
          {["Read file", "Compute SHA-256", "Query Arkiv"].map((label, i) => {
            const state = stepIndex > i ? "done" : stepIndex === i ? (phase === "error" ? "error" : "active") : "todo"
            return (
              <li key={label} className={`flex items-center gap-2 px-3 py-2.5 ${i > 0 ? "border-l border-rule" : ""}`}>
                <span className={`mono text-[10px] ${state === "done" ? "text-forest" : state === "active" ? "text-ink" : state === "error" ? "text-oxblood" : "text-ink-3"}`}>
                  {state === "done" ? "✓" : state === "error" ? "✕" : `0${i + 1}`}
                </span>
                <span className={state === "todo" ? "text-ink-3" : "text-ink"}>{label}</span>
                {state === "active" && <span className="mono text-ink-3 caret" aria-hidden />}
              </li>
            )
          })}
        </ol>

        {/* file record */}
        {file && (
          <section className="reveal card p-5 sm:p-6" data-shown="true" aria-label="File examined">
            <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
              <h2 className="kicker text-ink!">The file</h2>
              <CopyHash hash={file.hash} />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 py-4 text-[13px]">
              <dt className="kicker pt-0.5">Name</dt><dd className="break-all">{file.name}</dd>
              <dt className="kicker pt-0.5">Size</dt><dd>{fmtSize(file.size)} <span className="text-ink-3">({file.size.toLocaleString("en-IN")} bytes)</span></dd>
              <dt className="kicker pt-0.5">Type</dt>
              <dd>{file.isPdf ? "PDF (starts with %PDF-)" : <span className="text-ochre">Not a PDF by its contents. The fingerprint is still valid.</span>}</dd>
              {file.lastModified && (<><dt className="kicker pt-0.5">Modified</dt><dd>{new Date(file.lastModified).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} <span className="text-ink-3">(on this device)</span></dd></>)}
            </dl>
            <div className="border-t border-rule pt-4">
              <p className="kicker mb-2">SHA-256 fingerprint</p>
              <HashGrid hash={file.hash} className="text-[13px] sm:text-[14px]" />
            </div>
          </section>
        )}

        {phase === "querying" && (
          <p className="mono text-[12px] text-ink-3" aria-live="polite">Asking Arkiv for observations with this fingerprint…</p>
        )}
        {error && <p className="border-l-2 border-oxblood bg-oxblood-tint p-4 text-[13px] text-oxblood" role="alert">{error}</p>}
        {verdict && phase === "done" && <VerdictView v={verdict} />}
      </div>

      {/* ── Sidebar: trust + samples ── */}
      <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
        <fieldset>
          <legend className="kicker text-ink! border-b border-rule pb-2 w-full">Witnesses you trust</legend>
          <p className="mt-3 text-[13px] text-ink-2">Only records created by these wallets are counted. Trust comes from the immutable creator of each record.</p>
          <div className="card mt-4 divide-y divide-rule px-4">
            {WITNESSES.map((w) => (
              <label key={w.address} className="flex cursor-pointer items-start gap-3 py-3 text-[13px]">
                <input type="checkbox" className="mt-0.5 accent-forest" checked={trusted.includes(w.address)} onChange={() => toggle(w.address)} />
                <span>
                  <span className="block">{w.label}</span>
                  <span className="mono block break-all text-[11px] text-ink-3">{w.address}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <section>
          <h2 className="kicker text-ink! flex items-center justify-between border-b border-rule pb-2">Specimens <DemoBadge /></h2>
          <p className="mt-3 text-[13px] text-ink-2">Synthetic notices from the demonstration board. They are not real government documents.</p>
          <ul className="card mt-4 divide-y divide-rule px-4">
            {SAMPLES.map((s) => (
              <li key={s.file} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="mono block truncate text-[12px]">{s.file}</span>
                  <span className="block text-[12px] text-ink-3">{s.note}</span>
                </span>
                <span className="flex shrink-0 gap-3 text-[12px]">
                  <button type="button" disabled={busy} onClick={() => examineSample(s.file)} className="ink-link-static text-forest disabled:opacity-40">Examine</button>
                  <a className="ink-link-static text-ink-2" href={`${BASE}/samples/${s.file}`} download>Download</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}

function DocGlyph({ active }: { active: boolean }) {
  return (
    <svg width="56" height="72" viewBox="0 0 56 72" fill="none" aria-hidden className="shrink-0">
      <path d="M1 1h38l16 16v54H1z" stroke="var(--ink)" strokeWidth="1" fill="var(--sheet)" />
      <path d="M39 1v16h16" stroke="var(--ink)" strokeWidth="1" />
      {[26, 33, 40, 47, 54].map((y, i) => (
        <line key={y} x1="9" x2={i % 2 ? 38 : 46} y1={y} y2={y} stroke="var(--ink-3)" strokeWidth="1"
          style={{ transition: "stroke 0.4s", transitionDelay: `${i * 60}ms`, stroke: active ? "var(--forest)" : undefined }} />
      ))}
      <path d="M38 58l5 5 9-11" stroke="var(--forest)" strokeWidth="1.5"
        style={{ strokeDasharray: 24, strokeDashoffset: active ? 0 : 24, transition: "stroke-dashoffset 0.6s var(--ease)" }} />
    </svg>
  )
}
