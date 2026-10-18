import Link from "next/link"
import { EXPLORER, WITNESSES } from "@/lib/config"
import type { Verdict, Finding } from "@/lib/verdict"
import { VERDICT_TEXT } from "@/lib/verdict"
import { fmtTime, short } from "./format"

export const witnessLabel = (a: string) =>
  WITNESSES.find((w) => w.address.toLowerCase() === a.toLowerCase())?.label ?? short(a, 8)

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`mono inline-block whitespace-nowrap bg-signal px-1.5 py-[3px] align-middle text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-white ${className}`}>
      Demo source
    </span>
  )
}

const statusTone = {
  SERVED: { text: "text-forest", rule: "border-forest", tint: "bg-forest-tint", dot: "bg-forest" },
  REPLACED: { text: "text-ochre", rule: "border-ochre", tint: "bg-ochre-tint", dot: "bg-ochre" },
  REMOVED: { text: "text-oxblood", rule: "border-oxblood", tint: "bg-oxblood-tint", dot: "bg-oxblood" },
} as const

export function VerdictView({ v }: { v: Verdict }) {
  if (v.overall === "NOT_SEEN") return <NoMatch v={v} />
  const t = VERDICT_TEXT[v.overall]
  const tone = statusTone[v.overall]
  return (
    <section aria-live="polite" className={`reveal fade-in overflow-hidden rounded-2xl border border-rule border-t-4 ${tone.rule} bg-sheet shadow-[0_20px_50px_-30px_rgba(23,35,68,0.35)]`} data-shown="true">
      <header className="grid grid-cols-1 gap-4 border-b border-rule p-5 sm:grid-cols-[1fr_auto] sm:p-7">
        <div>
          <p className="kicker">Evidence found</p>
          <h2 className={`mt-2 text-[clamp(2rem,4.5vw,2.9rem)] font-semibold leading-none tracking-[-0.045em] ${tone.text}`}>
            {t.en} <span className="text-[0.55em] italic text-ink-3">{t.hi}</span>
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-2">{t.note}</p>
        </div>
        <div className="mono self-end text-right text-[11px] text-ink-3">
          <div>{v.findings.length} record{v.findings.length > 1 ? "s" : ""} · {v.witnesses.length} witness{v.witnesses.length > 1 ? "es" : ""}</div>
        </div>
      </header>
      <ol className="divide-y divide-rule">
        {v.findings.map((f) => <FindingRow key={f.witness + f.urlKey} f={f} />)}
      </ol>
      {v.ignored > 0 && (
        <p className="border-t border-rule px-5 py-3 text-[12px] text-ink-3 sm:px-7">
          {v.ignored} record(s) of this fingerprint were written by wallets you have not chosen to trust, and were ignored.
        </p>
      )}
    </section>
  )
}

function FindingRow({ f }: { f: Finding }) {
  const tone = statusTone[f.status]
  return (
    <li className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-12 sm:p-7">
      <div className="sm:col-span-3">
        <span className={`mono inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.text}`}>
          <span className={`h-2 w-2 rounded-full ${tone.dot}`} />{f.status}
        </span>
        <p className="mt-2 text-[13px] text-ink-2">by {witnessLabel(f.witness)}</p>
        {f.sourceTier === "demo" && <DemoBadge className="mt-2" />}
      </div>
      <div className="space-y-4 sm:col-span-9">
        <a href={f.url} className="mono block break-all text-[13px] text-ink ink-link-static" rel="nofollow noopener" target="_blank">{f.url}</a>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[13px]">
          <dt className="kicker pt-0.5">First seen</dt><dd>{fmtTime(f.firstSeen)}</dd>
          <dt className="kicker pt-0.5">{f.status === "SERVED" ? "Still served as of" : "Last confirmed"}</dt><dd>{fmtTime(f.lastConfirmed)}</dd>
          {f.endedAt && (<><dt className={`kicker pt-0.5 ${tone.text}`}>{f.status === "REMOVED" ? "URL gone since" : "Replaced on"}</dt><dd>{fmtTime(f.endedAt)}</dd></>)}
          {f.replacedBy && (<><dt className="kicker pt-0.5">Now serves</dt><dd className="mono break-all text-[12px]">{f.replacedBy}</dd></>)}
        </dl>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
          <Link className="ink-link-static" href={`/timeline/?k=${f.urlKey}`}>Open the URL timeline →</Link>
          <a className="ink-link-static text-ink-2" href={`${EXPLORER}/address/${f.witness}`} target="_blank" rel="noopener">Witness wallet on explorer</a>
        </div>
      </div>
    </li>
  )
}

function NoMatch({ v }: { v: Verdict }) {
  const t = VERDICT_TEXT.NOT_SEEN
  return (
    <section aria-live="polite" className="fade-in rounded-2xl border-2 border-dashed border-ink-3/50 bg-paper p-5 sm:p-7">
      <p className="kicker">No evidence either way</p>
      <h2 className="mt-2 text-[clamp(1.9rem,4.2vw,2.6rem)] font-semibold leading-none tracking-[-0.045em] text-ink-2">
        {t.en} <span className="text-[0.55em] italic text-ink-3">{t.hi}</span>
      </h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed">
        No witness you trust has recorded this exact file. <strong className="font-semibold">This is not evidence that the document is fake.</strong>
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-3 text-[13px] text-ink-2 sm:grid-cols-3">
        <li className="border-t border-rule pt-2">It may never have been witnessed. Witnesses only record the URLs they watch.</li>
        <li className="border-t border-rule pt-2">It may differ by a single byte: re-saved, compressed, or forwarded through an app that alters files.</li>
        <li className="border-t border-rule pt-2">Check the publisher&apos;s official website directly before acting on it.</li>
      </ul>
      {v.ignored > 0 && (
        <p className="mt-5 text-[12px] text-ink-3">
          {v.ignored} record(s) of this fingerprint exist from wallets you have not chosen to trust. They are not counted.
        </p>
      )}
    </section>
  )
}
