import Link from "next/link"
import { EXPLORER, WITNESSES } from "@/lib/config"
import type { Verdict } from "@/lib/verdict"
import { VERDICT_TEXT } from "@/lib/verdict"
import { fmtTime, short } from "./format"

const tone = {
  SERVED: "border-emerald-300 bg-emerald-50 text-emerald-900",
  REPLACED: "border-amber-300 bg-amber-50 text-amber-900",
  REMOVED: "border-rose-300 bg-rose-50 text-rose-900",
  NOT_SEEN: "border-stone-300 bg-stone-100 text-stone-800",
} as const

export const witnessLabel = (a: string) =>
  WITNESSES.find((w) => w.address.toLowerCase() === a.toLowerCase())?.label ?? short(a, 8)

export function DemoBadge() {
  return <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">DEMO SOURCE</span>
}

export function VerdictView({ v }: { v: Verdict }) {
  const t = VERDICT_TEXT[v.overall]
  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 ${tone[v.overall]}`}>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-2xl font-semibold">{t.en}</span>
          <span className="text-lg">{t.hi}</span>
          {v.witnesses.length > 0 && (
            <span className="text-sm">
              · {v.witnesses.length} witness{v.witnesses.length > 1 ? "es" : ""}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm">{t.note}</p>
        <p className="mono mt-2 break-all text-xs opacity-75">SHA-256 {v.hash}</p>
        {v.ignored > 0 && (
          <p className="mt-2 text-xs">
            {v.ignored} record(s) of this hash were written by wallets you have not chosen to trust, and were ignored.
          </p>
        )}
      </div>

      {v.findings.map((f) => (
        <div key={f.witness + f.urlKey} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-xs font-semibold ${tone[f.status]}`}>{f.status}</span>
            {f.sourceTier === "demo" && <DemoBadge />}
            <span className="text-stone-500">by {witnessLabel(f.witness)}</span>
          </div>
          <a href={f.url} className="mono mt-2 block break-all text-stone-900 underline" rel="nofollow noopener" target="_blank">{f.url}</a>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-stone-700">
            <dt className="text-stone-500">First seen</dt><dd>{fmtTime(f.firstSeen)}</dd>
            <dt className="text-stone-500">{f.status === "SERVED" ? "Still served as of" : "Last confirmed"}</dt><dd>{fmtTime(f.lastConfirmed)}</dd>
            {f.endedAt && (<><dt className="text-stone-500">{f.status === "REMOVED" ? "URL gone since" : "Replaced on"}</dt><dd>{fmtTime(f.endedAt)}</dd></>)}
            {f.replacedBy && (<><dt className="text-stone-500">Now serves</dt><dd className="mono break-all text-xs">{f.replacedBy}</dd></>)}
          </dl>
          <div className="mt-3 flex flex-wrap gap-x-4 text-xs">
            <Link className="underline" href={`/timeline?k=${f.urlKey}`}>Full URL timeline</Link>
            <a className="underline" href={`${EXPLORER}/address/${f.witness}`} target="_blank" rel="noopener">Witness on explorer</a>
          </div>
        </div>
      ))}
    </div>
  )
}
