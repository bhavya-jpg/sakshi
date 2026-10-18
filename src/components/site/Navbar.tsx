"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useBlock } from "@/lib/snapshot"
import { LogoMark } from "./Logo"

const links = [
  { href: "/verify/", label: "Verify" },
  { href: "/timeline/", label: "Timeline" },
  { href: "/board/", label: "Demo board" },
  { href: "/how/", label: "How it works" },
]

export function LiveBlock({ dark }: { dark: boolean }) {
  const block = useBlock()
  return (
    <span className={`mono hidden items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] lg:inline-flex ${dark ? "border-white/10 text-white/70" : "border-rule text-ink-2"}`}
      title="Latest Tiramisu block, read live from the public RPC">
      <span className={`pulse-dot h-1.5 w-1.5 rounded-full ${block ? "bg-forest-2 text-forest-2" : "bg-ink-3 text-ink-3"}`} />
      Tiramisu {block ? `#${block.toLocaleString("en-US")}` : "connecting"}
    </span>
  )
}

export function Navbar() {
  const path = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  useEffect(() => setOpen(false), [path])
  const home = path === "/"
  const dark = home && !scrolled && !open
  const active = (h: string) => path === h || path === h.replace(/\/$/, "")

  return (
    <header className={`sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${dark
      ? "border-b border-transparent bg-transparent"
      : "border-b border-rule bg-paper/80 shadow-[0_1px_0_rgba(12,15,14,0.02)] backdrop-blur-xl"}`}>
      <div className={`mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-8 ${dark ? "text-white" : "text-ink"}`}>
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sakshi home">
          <LogoMark className={`h-7 w-7 ${dark ? "text-white/10" : "text-ink"}`} />
          <span className="text-[17px] font-semibold tracking-[-0.03em]">Sakshi</span>
          <span className={`serif text-[14px] italic ${dark ? "text-white/50" : "text-ink-3"}`}>साक्षी</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-[13.5px] transition-colors ${active(l.href)
                ? dark ? "bg-white/10 text-white" : "bg-ink/5 text-ink"
                : dark ? "text-white/70 hover:text-white" : "text-ink-2 hover:bg-ink/5 hover:text-ink"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <LiveBlock dark={dark} />
          <a href="https://github.com/bhavya-jpg/sakshi" aria-label="Source on GitHub" className={`hidden rounded-lg p-2 sm:block ${dark ? "text-white/70 hover:text-white" : "text-ink-2 hover:text-ink"}`}>
            <svg viewBox="0 0 16 16" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
          </a>
          <Link href="/verify/" className={`btn hidden py-2! sm:inline-flex ${dark ? "btn-green" : "btn-solid"}`}>Verify a PDF</Link>
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu"
            className={`rounded-lg p-2 md:hidden ${dark ? "text-white" : "text-ink"}`}>
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t border-rule bg-paper px-4 pb-4 pt-2 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-2 py-3 text-[15px] text-ink hover:bg-ink/5">{l.label}</Link>
          ))}
          <Link href="/verify/" className="btn btn-solid mt-2 w-full">Verify a PDF</Link>
        </nav>
      )}
    </header>
  )
}
