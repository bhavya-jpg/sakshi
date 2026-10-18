"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const nav = [
  { href: "/verify/", label: "Verify", n: "01" },
  { href: "/timeline/", label: "Timeline", n: "02" },
  { href: "/board/", label: "Demo board", n: "03" },
  { href: "/how/", label: "Method", n: "04" },
]

export function Nav() {
  const path = usePathname()
  const active = (h: string) => path === h || path === h.replace(/\/$/, "")
  return (
    <nav aria-label="Main" className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
      {nav.map((n) => (
        <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
          className={`group flex items-baseline gap-1.5 ${active(n.href) ? "text-ink" : "text-ink-2 hover:text-ink"}`}>
          <span className="mono text-[10px] text-ink-3">{n.n}</span>
          <span className={`ink-link ${active(n.href) ? "[background-size:100%_1px]" : ""}`}>{n.label}</span>
        </Link>
      ))}
    </nav>
  )
}
