"use client"
import Link from "next/link"
import { EXPLORER, WITNESSES } from "@/lib/config"
import { ago, useBlock, useSnapshot } from "@/lib/snapshot"

const kindStyle = {
  seen: "bg-forest-tint text-forest",
  changed: "bg-ochre-tint text-ochre",
  gone: "bg-oxblood-tint text-oxblood",
} as const

/** Real counts from Arkiv. While loading, shows a dash, never a made-up number. */
export function LiveStats() {
  const { data, error } = useSnapshot()
  const block = useBlock()
  // distinct configured witness wallets that have written observations (anyone can write to the project, so others are not counted)
  const configured = new Set(WITNESSES.map((w) => w.address.toLowerCase()))
  const witnesses = data ? new Set(data.observations.map((o) => o.creator.toLowerCase()).filter((c) => configured.has(c))).size : null
  const urls = data ? new Set(data.observations.map((o) => o.urlKey)).size : null
  const stats = [
    { k: "Latest block", v: block ? `#${block.toLocaleString("en-US")}` : "—", live: true },
    { k: "Observations on Arkiv", v: data ? String(data.observations.length) : "—" },
    { k: "URLs watched", v: urls !== null ? String(urls) : "—" },
    { k: "Witness wallets", v: witnesses !== null ? String(witnesses) : "—" },
    { k: "Last witness run", v: data?.runs[0] ? ago(data.runs[0].runAt) : "—" },
  ]
  return (
    <div className="grid grid-cols-2 divide-rule overflow-hidden rounded-2xl border border-rule bg-sheet sm:grid-cols-5 sm:divide-x">
      {stats.map((s, i) => (
        <div key={s.k} className={`p-5 ${i < 4 ? "border-b border-rule sm:border-b-0" : "col-span-2 sm:col-span-1"} ${i % 2 === 0 && i < 4 ? "border-r border-rule sm:border-r-0" : ""}`}>
          <p className="mono flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
            {s.live && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-forest-2 text-forest-2" />}{s.k}
          </p>
          <p className="mt-2 text-[26px] font-semibold tabular-nums tracking-[-0.04em]">{error && !s.live ? "—" : s.v}</p>
        </div>
      ))}
    </div>
  )
}

export function RecordFeed() {
  const { data, error } = useSnapshot()
  const rows = data?.observations.slice(0, 6) ?? []
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3.5">
        <p className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.02em]">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-forest-2 text-forest-2" /> Latest observations
        </p>
        <span className="mono text-[11px] text-ink-3">read from Tiramisu just now</span>
      </div>
      {error && <p className="px-5 py-6 text-[14px] text-ink-2">Arkiv could not be reached from this browser right now.</p>}
      {!data && !error && (
        <ul className="divide-y divide-rule" aria-hidden>{[0, 1, 2, 3].map((i) => <li key={i} className="px-5 py-4"><div className="h-3 w-2/3 animate-pulse rounded bg-ink/5" /></li>)}</ul>
      )}
      {data && (
        <ul className="divide-y divide-rule">
          {rows.map((o) => {
            const url = o.payload.url || ""
            return (
              <li key={o.key} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-paper/70">
                <span className={`mono rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${kindStyle[o.kind]}`}>{o.kind}</span>
                <div className="min-w-0">
                  <Link href={`/timeline/?k=${o.urlKey}`} className="mono block truncate text-[12.5px] text-ink hover:underline">{url.replace(/^https?:\/\//, "")}</Link>
                  <p className="mono truncate text-[11px] text-ink-3">
                    {o.docSha256 ? `sha256 ${o.docSha256.slice(0, 14)}…` : `HTTP ${o.httpStatus}`} · entity {o.key.slice(0, 10)}… {o.sourceTier === "demo" && "· demo source"}
                  </p>
                </div>
                <a href={`${EXPLORER}/address/${o.creator}`} target="_blank" rel="noopener" className="text-right text-[12px] text-ink-2 hover:text-ink">{ago(o.fetchedAt)}</a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
