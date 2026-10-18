"use client"
import Link from "next/link"
import { useEffect, useState } from "react"

const notices = [
  { n: 1, title: "Junior Assistant Recruitment 2026" },
  { n: 2, title: "Field Surveyor Examination 2026" },
  { n: 3, title: "Scholarship Entrance Test 2026" },
]

export function Board() {
  const [origin, setOrigin] = useState("")
  const [status, setStatus] = useState<Record<number, number>>({})
  useEffect(() => {
    setOrigin(window.location.origin)
    notices.forEach(({ n }) =>
      fetch(`/board/notice-${n}.pdf`, { method: "HEAD", cache: "no-store" }).then((r) => setStatus((s) => ({ ...s, [n]: r.status }))),
    )
  }, [])
  return (
    <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
      {notices.map(({ n, title }) => {
        const path = `/board/notice-${n}.pdf`
        const live = status[n] === 200
        return (
          <li key={n} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium">Notice {n}: {title}</div>
              <div className="mono break-all text-xs text-stone-500">{origin}{path}</div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs">
              {status[n] === undefined ? <span className="text-stone-400">checking…</span>
                : live ? <a className="underline" href={path} target="_blank">Open PDF</a>
                : <span className="rounded bg-stone-200 px-1.5 py-0.5">HTTP {status[n]} · removed</span>}
              {origin && <Link className="underline" href={`/timeline?u=${encodeURIComponent(origin + path)}`}>Witness record</Link>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
