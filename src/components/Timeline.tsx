"use client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { EXPLORER } from "@/lib/config"
import { normalizeUrl, urlKey } from "@/lib/hash"
import { urlTimeline } from "@/lib/service"
import type { Observation, Run } from "@/lib/schema"
import { DemoBadge, witnessLabel } from "./VerdictView"
import { fmtTime, short } from "./format"

type Data = { url?: string; urlKey: string; observations: Observation[]; runs: Record<string, Run | null> }

const kindTone = { seen: "bg-emerald-600", changed: "bg-amber-500", gone: "bg-rose-600" } as const
const kindText = { seen: "First seen", changed: "Changed", gone: "Gone (URL stopped serving)" } as const

export function Timeline() {
  const sp = useSearchParams()
  const router = useRouter()
  const u = sp.get("u") ?? ""
  const k = sp.get("k") ?? ""
  const [input, setInput] = useState(u)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!u && !k) return
    setBusy(true); setError(null)
    ;(async () => {
      const url = u ? normalizeUrl(u) : undefined
      const key = (k || (await urlKey(url!))).toLowerCase() as `0x${string}`
      if (!/^0x[0-9a-f]{64}$/.test(key)) throw new Error("Not a valid URL key")
      return { url, ...(await urlTimeline(key)) }
    })()
      .then(setData)
      .catch((e) => { setData(null); setError(e.message) })
      .finally(() => setBusy(false))
  }, [u, k])

  const byWitness = new Map<string, Observation[]>()
  for (const o of data?.observations ?? []) byWitness.set(o.creator.toLowerCase(), [...(byWitness.get(o.creator.toLowerCase()) ?? []), o])
  const url = data?.url ?? data?.observations[0]?.payload.url

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); router.push(`/timeline?u=${encodeURIComponent(input)}`) }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://example.gov.in/notice.pdf"
          className="mono flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-sm" />
        <button className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white">Show timeline</button>
      </form>

      {busy && <p className="text-sm text-stone-500">Querying Arkiv…</p>}
      {error && <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {data && !busy && (
        <div className="space-y-6">
          <div className="text-sm">
            {url && <p className="mono break-all font-medium">{url}</p>}
            <p className="mono break-all text-xs text-stone-500">url_key {data.urlKey}</p>
            {data.observations.length === 0 && (
              <p className="mt-3 rounded border border-stone-200 bg-white p-3 text-stone-700">
                No witness has recorded this URL. That says nothing about whether the page is genuine.
              </p>
            )}
          </div>

          {[...byWitness.entries()].map(([w, rows]) => {
            const run = data.runs[w]
            return (
              <div key={w} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{witnessLabel(w)}</span>
                  <a className="mono text-xs text-stone-500 underline" href={`${EXPLORER}/address/${w}`} target="_blank" rel="noopener">{short(w, 8)}</a>
                  {rows[0]?.sourceTier === "demo" && <DemoBadge />}
                  {run && <span className="text-xs text-stone-500">· last run {fmtTime(run.runAt)}</span>}
                </div>
                <ol className="mt-4 space-y-4 border-l-2 border-stone-200 pl-4">
                  {rows.map((o) => (
                    <li key={o.key} className="relative text-sm">
                      <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ${kindTone[o.kind]}`} />
                      <div className="font-medium">{kindText[o.kind]} · {fmtTime(o.fetchedAt)}</div>
                      <div className="text-xs text-stone-600">HTTP {o.httpStatus}</div>
                      {o.docSha256 && <div className="mono break-all text-xs">sha256 {o.docSha256}</div>}
                      {o.prevSha256 && <div className="mono break-all text-xs text-stone-500">previous {o.prevSha256}</div>}
                      <div className="mono break-all text-[11px] text-stone-400">entity {o.key} · block {o.createdAtBlock} · expires at block {o.expiresAtBlock}</div>
                    </li>
                  ))}
                </ol>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
