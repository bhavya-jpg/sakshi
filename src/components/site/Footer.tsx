import Link from "next/link"
import { EXPLORER, PROJECT, WITNESSES } from "@/lib/config"
import { LogoMark } from "./Logo"

const GH = "https://github.com/bhavya-jpg/sakshi"

const cols = [
  { title: "Product", links: [
    { label: "Verify a PDF", href: "/verify/" }, { label: "URL timeline", href: "/timeline/" },
    { label: "Demo board", href: "/board/" }, { label: "How it works", href: "/how/" },
  ] },
  { title: "Developers", links: [
    { label: "Source code", href: GH, ext: true }, { label: "Data schema", href: `${GH}/blob/main/arkiv/schema.md`, ext: true },
    { label: "Friction report", href: `${GH}/blob/main/arkiv/friction.md`, ext: true }, { label: "Run a witness", href: `${GH}#run-a-witness-writes-to-arkiv`, ext: true },
  ] },
  { title: "Network", links: [
    { label: "Arkiv docs", href: "https://docs.arkiv.network", ext: true }, { label: "Block explorer", href: EXPLORER, ext: true },
    ...WITNESSES.map((w) => ({ label: `${w.label.replace("Sakshi ", "")} wallet`, href: `${EXPLORER}/address/${w.address}`, ext: true })), { label: "Arkiv status", href: "https://status.arkiv.network", ext: true },
  ] },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-white/70">
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5 text-white">
              <LogoMark className="h-7 w-7 text-white/10" />
              <span className="text-[17px] font-semibold tracking-[-0.03em]">Sakshi</span>
            </div>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed">
              An independent witness for public notices. Records live on Arkiv, so they outlast the page they describe.
            </p>
            <p className="mono mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-2" /> No server · no keys in this site
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title} className="lg:col-span-2 lg:col-start-auto">
              <p className="mono text-[11px] uppercase tracking-[0.12em] text-white/40">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {"ext" in l && l.ext
                      ? <a href={l.href} className="hover:text-white" target="_blank" rel="noopener">{l.label} <span aria-hidden className="text-white/30">↗</span></a>
                      : <Link href={l.href} className="hover:text-white">{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Sakshi contributors · MIT licence · Built for Arkiv: Global Tour Stop</p>
          <p className="mono">chain 7738577 · project “{PROJECT}”</p>
        </div>
        <p aria-hidden className="pointer-events-none mt-10 select-none text-center text-[clamp(4rem,18vw,15rem)] font-semibold leading-none tracking-[-0.06em] text-white/[0.04]">sakshi</p>
      </div>
    </footer>
  )
}
