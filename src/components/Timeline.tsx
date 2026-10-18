"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BASE } from "@/lib/base"
import { EXPLORER } from "@/lib/config"
import { normalizeUrl, urlKey } from "@/lib/hash"
import type { Observation, ObservationKind, Run } from "@/lib/schema"
import { urlTimeline } from "@/lib/service"
import { DemoBadge, witnessLabel } from "./VerdictView"
import { short } from "./format"

export type Data = { url?: string; urlKey: string; observations: Observation[]; runs: Record<string, Run | null> }

const KIND: Record<ObservationKind, { label: string; verb: string; text: string }> = {
  seen: { label: "Seen", verb: "First recorded serving", text: "text-forest" },
  changed: { label: "Changed", verb: "Began serving a different file", text: "text-ochre" },
  gone: { label: "Gone", verb: "Stopped serving the file", text: "text-oxblood" },
}

function Marker({ kind }: { kind: ObservationKind }) {
  if (kind === "seen") return <span className="block h-3 w-3 rounded-full bg-forest ring-4 ring-paper" />
  if (kind === "changed") return <span className="block h-3 w-3 rotate-45 bg-ochre ring-4 ring-paper" />
  return (
    <span className="relative block h-3 w-3 rounded-full border border-oxblood bg-paper ring-4 ring-paper">
      <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-oxblood" />
    </span>
  )
}

const day = (t: number) => new Date(t * 1000).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })
const clock = (t: number) => new Date(t * 1000).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) + " IST"

export function Timeline() {
  const sp = useSearchParams()
  const router = useRouter()
  const u = sp.get("u") ?? ""
  const k = sp.get("k") ?? ""
  const [input, setInput] = useState(u)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [origin, setOrigin] = useState("")

  useEffect(() => setOrigin(window.location.origin + BASE), [])
  useEffect(() => setInput(u), [u])
  useEffect(() => {
    if (!u && !k) { setData(null); return }
    setBusy(true); setError(null)
    ;(async () => {
      const url = u ? normalizeUrl(u) : undefined
      const key = (k || (await urlKey(url!))).toLowerCase() as `0x${string}`
      if (!/^0x[0-9a-f]{64}$/.test(key)) throw new Error("That is not a valid URL key.")
      return { url, ...(await urlTimeline(key)) }
    })()
      .then(setData)
      .catch((e) => { setData(null); setError(e.message) })
      .finally(() => setBusy(false))
  }, [u, k])

  const demoUrls = [1, 2, 3].map((n) => `${origin}/board/notice-${n}.pdf`)

  return (
    <div className="space-y-12">
      <form className="border-b border-rule" onSubmit={(e) => { e.preventDefault(); if (input.trim()) router.push(`/timeline/?u=${encodeURIComponent(input.trim())}`) }}>
        <label htmlFor="u" className="kicker">Notice URL</label>
        <div className="flex flex-col gap-3 pb-3 pt-2 sm:flex-row sm:items-end">
          <input id="u" value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.gov.in/notice.pdf" inputMode="url" autoComplete="off" spellCheck={false}
            className="mono min-w-0 flex-1 bg-transparent py-2 text-[15px] placeholder:text-ink-3 focus:outline-none sm:text-[17px]" />
          <button className="btn btn-solid shrink-0">Read the record <span className="arrow" aria-hidden>→</span></button>
        </div>
      </form>

      {!u && !k && origin && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <p className="kicker lg:col-span-3">Try a demo URL</p>
          <ul className="divide-y divide-rule border-y border-rule lg:col-span-9">
            {demoUrls.map((d) => (
              <li key={d} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/timeline/?u=${encodeURIComponent(d)}`} title={d} className="min-w-0 ink-link-static">
                  <span className="mono block text-[13px]">{d.slice(d.indexOf("/board/"))}</span>
                  <span className="mono block truncate text-[11px] text-ink-3">{d}</span>
                </Link>
                <DemoBadge />
              </li>
            ))}
          </ul>
        </section>
      )}

      {busy && <p className="mono text-[12px] text-ink-3 caret" aria-live="polite">Reading the record from Arkiv</p>}
      {error && <p className="border-l-2 border-oxblood bg-oxblood-tint p-4 text-[13px] text-oxblood" role="alert">{error}</p>}

      {data && !busy && <TimelineView data={data} />}
    </div>
  )
}

/** Presentational: one URL's observation history, grouped by witness. */
export function TimelineView({ data }: { data: Data }) {
  const byWitness = new Map<string, Observation[]>()
  for (const o of data.observations) byWitness.set(o.creator.toLowerCase(), [...(byWitness.get(o.creator.toLowerCase()) ?? []), o])
  const url = data.url ?? data.observations[0]?.payload.url
  return (
        <div className="space-y-14">
      <header className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="kicker">The subject</p>
          {url && <p className="mono mt-2 break-all text-[15px] leading-snug sm:text-[17px]">{url}</p>}
          <p className="mono mt-2 break-all text-[11px] text-ink-3">url_key {data.urlKey}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 self-end text-[12px] text-ink-2 lg:col-span-4 lg:justify-end" aria-label="Legend">
          {(Object.keys(KIND) as ObservationKind[]).map((kd) => (
            <li key={kd} className="flex items-center gap-2"><Marker kind={kd} />{KIND[kd].label}</li>
          ))}
        </ul>
      </header>

      {data.observations.length === 0 && (
        <section className="border border-dashed border-ink-3 p-6">
          <p className="serif text-[26px] leading-tight">No witness has recorded this URL.</p>
          <p className="mt-2 max-w-xl text-[14px] text-ink-2">
            That says nothing about whether the page or its documents are genuine. Witnesses only record the URLs they watch.
          </p>
        </section>
      )}

      {[...byWitness.entries()].map(([w, rows]) => {
        const run = data.runs[w]
        return (
          <section key={w} className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label={`Record by ${witnessLabel(w)}`}>
            <div className="lg:col-span-3">
              <p className="kicker">Witness</p>
              <p className="serif mt-1 text-[22px] leading-tight">{witnessLabel(w)}</p>
              <a className="mono mt-1 block text-[11px] text-ink-3 ink-link-static" href={`${EXPLORER}/address/${w}`} target="_blank" rel="noopener">{short(w, 10)}</a>
              {rows[0]?.sourceTier === "demo" && <DemoBadge className="mt-3" />}
              {run && <p className="mt-3 text-[12px] text-ink-2">Last run {day(run.runAt)}, {clock(run.runAt)} · checked {run.sourcesChecked} URL{run.sourcesChecked === 1 ? "" : "s"}</p>}
            </div>
            <ol className="relative lg:col-span-9">
              <span className="absolute bottom-2 left-[5.5px] top-2 w-px bg-rule-strong sm:left-[126.5px]" aria-hidden />
              {rows.map((o) => (
                <li key={o.key} className="relative grid grid-cols-[12px_1fr] gap-x-5 pb-10 last:pb-0 sm:grid-cols-[110px_12px_1fr] sm:gap-x-[11px]">
                  <div className="col-start-2 row-start-1 mb-1 sm:col-start-1 sm:mb-0 sm:pr-3 sm:text-right">
                    <p className="serif text-[17px] leading-tight">{day(o.fetchedAt)}</p>
                    <p className="mono text-[11px] text-ink-3">{clock(o.fetchedAt)}</p>
                  </div>
                  <div className="col-start-1 row-start-1 row-span-2 pt-1.5 sm:col-start-2 sm:row-span-1"><Marker kind={o.kind} /></div>
                  <div className="col-start-2 sm:col-start-3 sm:row-start-1">
                    <p className={`mono text-[11px] font-semibold uppercase tracking-[0.12em] ${KIND[o.kind].text}`}>{KIND[o.kind].label} · HTTP {o.httpStatus}</p>
                    <p className="mt-1 text-[14px] text-ink-2">{KIND[o.kind].verb}{o.kind === "gone" ? "" : ":"}</p>
                    {o.docSha256 && <p className="mono mt-1 break-all text-[12.5px]">{o.docSha256}</p>}
                    {o.prevSha256 && <p className="mono mt-1 break-all text-[11.5px] text-ink-3 line-through decoration-ink-3/60">{o.prevSha256}</p>}
                    <details className="group mt-3 border-t border-rule">
                      <summary className="flex items-center gap-2 py-2 text-[12px] text-ink-2 hover:text-ink">
                        <span className="chev mono inline-block text-[13px] leading-none">+</span> Record details
                      </summary>
                      <div className="details-body">
                        <div className="overflow-hidden">
                          <dl className="mono grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 pb-3 text-[11px] text-ink-2">
                            <dt className="text-ink-3">entity</dt><dd className="break-all">{o.key}</dd>
                            <dt className="text-ink-3">creator</dt><dd className="break-all">{o.creator}</dd>
                            <dt className="text-ink-3">created</dt><dd>block {o.createdAtBlock}</dd>
                            <dt className="text-ink-3">expires</dt><dd>block {o.expiresAtBlock}</dd>
                            <dt className="text-ink-3">domain</dt><dd>{o.domain}</dd>
                            {o.payload.content_length !== undefined && (<><dt className="text-ink-3">bytes</dt><dd>{o.payload.content_length}</dd></>)}
                            {o.payload.etag && (<><dt className="text-ink-3">etag</dt><dd className="break-all">{o.payload.etag}</dd></>)}
                          </dl>
                        </div>
                      </div>
                    </details>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
