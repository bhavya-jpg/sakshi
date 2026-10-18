"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { BASE } from "@/lib/base"

const PHASE = process.env.NEXT_PUBLIC_BOARD_PHASE === "2" ? "2" : "1"

// Mirrors scripts/make-board.ts (synthetic content; the PDFs themselves are generated there).
const notices = [
  { n: 1, ref: "DEMO/2026/001", title: "Junior Assistant Recruitment 2026", posts: "120 posts", opens: "20 Oct 2026", last: "15 Nov 2026" },
  { n: 2, ref: "DEMO/2026/002", title: "Field Surveyor Examination 2026", posts: "45 posts", opens: "20 Oct 2026", last: PHASE === "2" ? "05 Nov 2026" : "30 Nov 2026" },
  { n: 3, ref: "DEMO/2026/003", title: "Scholarship Entrance Test 2026", posts: "300 seats", opens: "21 Oct 2026", last: "10 Dec 2026" },
]

export function Board() {
  const [origin, setOrigin] = useState("")
  const [status, setStatus] = useState<Record<number, number>>({})
  useEffect(() => {
    setOrigin(window.location.origin + BASE)
    notices.forEach(({ n }) =>
      fetch(`${BASE}/board/notice-${n}.pdf`, { method: "HEAD", cache: "no-store" })
        .then((r) => setStatus((s) => ({ ...s, [n]: r.status })))
        .catch(() => setStatus((s) => ({ ...s, [n]: 0 }))),
    )
  }, [])

  return (
    <div className="overflow-hidden rounded-2xl border border-rule-strong bg-sheet shadow-[0_30px_60px_-40px_rgba(23,35,68,0.4)]">
      {/* fictional portal masthead */}
      <div className="flex flex-wrap items-center gap-4 border-b border-rule-strong bg-paper-2 px-5 py-4 sm:px-7">
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden className="shrink-0">
          <circle cx="22" cy="22" r="21" fill="none" stroke="var(--ink)" />
          <circle cx="22" cy="22" r="16" fill="none" stroke="var(--ink)" strokeDasharray="2 3" />
          <text x="22" y="26" textAnchor="middle" fontSize="10" fontFamily="var(--font-geist-mono)" fill="var(--ink)">DSSB</text>
        </svg>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-tight tracking-[-0.01em]">Demo Staff Selection Board</p>
          <p className="text-[12px] text-ink-2">A fictional recruitment authority · not a government body</p>
        </div>
        <nav className="ml-auto hidden gap-5 text-[12px] text-ink-2 md:flex" aria-label="Demo portal (decorative)">
          <span>Notices</span><span>Results</span><span>Contact</span>
        </nav>
      </div>

      <div className="flex items-baseline justify-between gap-4 px-5 pb-2 pt-5 sm:px-7">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em]">Latest notices</h2>
        <span className="mono text-[11px] text-ink-3">Board phase {PHASE}</span>
      </div>

      <ul className="divide-y divide-rule border-t border-rule">
        {notices.map((x) => {
          const path = `/board/notice-${x.n}.pdf`
          const st = status[x.n]
          const live = st === 200
          return (
            <li key={x.n} className={`grid gap-3 px-5 py-4 transition-colors sm:grid-cols-12 sm:items-center sm:px-7 ${st !== undefined && !live ? "bg-paper-2/60" : "hover:bg-paper/60"}`}>
              <div className="sm:col-span-7">
                <p className="mono text-[11px] text-ink-3">{x.ref}</p>
                <p className={`mt-0.5 text-[15px] font-medium ${st !== undefined && !live ? "text-ink-3 line-through decoration-1" : ""}`}>{x.title}</p>
                <p className="mt-1 text-[12px] text-ink-2">
                  {x.posts} · opens {x.opens} · last date <span className={x.n === 2 && PHASE === "2" ? "bg-ochre-tint px-1 text-ochre" : ""}>{x.last}</span>
                </p>
                <p className="mono mt-1 break-all text-[11px] text-ink-3">{origin}{path}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] sm:col-span-5 sm:justify-end">
                {st === undefined ? <span className="mono text-ink-3 caret">checking</span>
                  : live ? <a className="ink-link-static" href={BASE + path} target="_blank" rel="noopener">Download PDF</a>
                  : <span className="mono border border-rule-strong px-1.5 py-0.5 text-[11px]">HTTP {st || "error"} · withdrawn</span>}
                {origin && <Link className="ink-link-static text-forest" href={`/timeline/?u=${encodeURIComponent(origin + path)}`}>Witness record →</Link>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
