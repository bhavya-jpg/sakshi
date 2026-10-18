"use client"
import { useEffect, useState } from "react"

const W = "var(--sheet)", R = "rgba(23,35,68,0.16)", INK = "var(--ink)", G = "var(--accent)"

function Node({ x, y, w = 220, h = 92, title, sub, icon, dark = false }: { x: number; y: number; w?: number; h?: number; title: string; sub: string; icon: React.ReactNode; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height={h} rx="14" fill={dark ? "var(--night)" : W} stroke={dark ? "rgba(255,255,255,0.1)" : R} />
      <g transform="translate(18 22)">{icon}</g>
      <text x="64" y="40" fontSize="16" fontWeight="600" fill={dark ? "#fff" : INK} style={{ letterSpacing: "-0.02em" }}>{title}</text>
      <text x="64" y="62" fontSize="11.5" fill={dark ? "rgba(255,255,255,0.55)" : "var(--ink-3)"} fontFamily="var(--font-geist-mono)">{sub}</text>
    </g>
  )
}

const ico = {
  globe: <g fill="none" stroke={INK} strokeWidth="1.5"><circle cx="16" cy="16" r="14" /><path d="M2 16h28M16 2c4 4 6 9 6 14s-2 10-6 14c-4-4-6-9-6-14s2-10 6-14z" /></g>,
  eye: <g fill="none" strokeWidth="1.5"><path d="M2 16c3.5-6 8-9 14-9s10.5 3 14 9c-3.5 6-8 9-14 9S5.5 22 2 16z" stroke={INK} /><circle cx="16" cy="16" r="4.5" fill={G} /></g>,
  pdf: <g><path d="M5 1h15l7 7v23H5z" fill="none" stroke={INK} strokeWidth="1.5" /><rect x="8" y="19" width="16" height="7" rx="1.5" fill="var(--signal)" /></g>,
  browser: <g fill="none" stroke={INK} strokeWidth="1.5"><rect x="1" y="4" width="30" height="24" rx="4" /><path d="M1 11h30" /><circle cx="6" cy="7.5" r=".8" fill={INK} /><circle cx="9.5" cy="7.5" r=".8" fill={INK} /></g>,
}

const paths = {
  fetch: "M140 132 L140 248",
  write: "M250 294 C 340 294, 350 230, 440 230",
  hash: "M960 132 L960 248",
  query: "M850 278 C 760 278, 750 220, 660 220",
  answer: "M660 250 C 750 250, 760 306, 850 306",
}

function Packet({ d, dur, delay = 0, color = G }: { d: string; dur: number; delay?: number; color?: string }) {
  return (
    <circle r="4.5" fill={color}>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.4 0 0.2 1" />
    </circle>
  )
}

export function FlowDiagram() {
  const [motion, setMotion] = useState(false)
  useEffect(() => setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches), [])

  return (
    <>
      {/* desktop / tablet */}
      <svg viewBox="0 0 1100 360" className="hidden w-full md:block" role="img" aria-label="Diagram: a witness fetches the notice PDF from its URL and writes an observation to Arkiv; your browser hashes your PDF locally, queries Arkiv by that hash, and receives the observation history.">
        <defs>
          <linearGradient id="arkivGlow" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e4502f" stopOpacity=".14" /><stop offset="1" stopColor="#e4502f" stopOpacity="0" /></linearGradient>
        </defs>
        {/* connectors */}
        {Object.entries(paths).map(([k, d]) => (
          <path key={k} d={d} fill="none" stroke={k === "answer" ? G : "rgba(23,35,68,0.3)"} strokeWidth="1.5" className="flow" />
        ))}
        {/* edge labels */}
        <g fontFamily="var(--font-geist-mono)" fontSize="11" fill="var(--ink-3)">
          <text x="152" y="196">GET notice.pdf</text>
          <text x="262" y="262">observation entity</text>
          <text x="972" y="196">SHA-256, on device</text>
          <text x="690" y="208">query doc_sha256</text>
          <text x="700" y="326" fill="var(--accent)">observation history</text>
        </g>

        <Node x={30} y={40} title="Notice URL" sub="publisher's website" icon={ico.globe} />
        <Node x={30} y={248} title="Witness" sub="fetch · hash · diff" icon={ico.eye} />
        <Node x={850} y={40} title="Your PDF" sub="forwarded to you" icon={ico.pdf} />
        <Node x={850} y={248} title="Your browser" sub="no upload, no server" icon={ico.browser} />

        {/* Arkiv: the shared record */}
        <g transform="translate(440 70)">
          <rect x="-30" y="-20" width="280" height="260" rx="40" fill="url(#arkivGlow)" />
          <rect width="220" height="220" rx="18" fill="var(--night)" />
          <text x="22" y="40" fontSize="17" fontWeight="600" fill="#fff" style={{ letterSpacing: "-0.02em" }}>Arkiv</text>
          <text x="22" y="60" fontSize="11" fill="rgba(255,255,255,0.5)" fontFamily="var(--font-geist-mono)">Tiramisu · Web3 database</text>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(22 ${82 + i * 40})`}>
              <rect width="176" height="30" rx="7" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
              <circle cx="14" cy="15" r="4" fill={["#7cc4a4", "#e8b66b", "#f0937f"][i]} />
              <text x="26" y="19" fontSize="10.5" fill="rgba(255,255,255,0.8)" fontFamily="var(--font-geist-mono)">{["seen", "changed", "gone"][i]} · readonly</text>
            </g>
          ))}
        </g>

        {motion && (
          <g>
            <Packet d={paths.fetch} dur={2.4} />
            <Packet d={paths.write} dur={2.4} delay={1.2} />
            <Packet d={paths.hash} dur={2.4} delay={0.6} color="var(--ink)" />
            <Packet d={paths.query} dur={2.4} delay={1.8} color="var(--ink)" />
            <Packet d={paths.answer} dur={2.4} delay={3} />
          </g>
        )}
      </svg>

      {/* phone: the same flow, stacked */}
      <ol className="space-y-3 md:hidden">
        {[
          ["Witness", "Fetches the notice PDF from its URL and hashes it."],
          ["Arkiv", "Stores a readonly observation: URL, hash, time, witness wallet."],
          ["Your browser", "Hashes your PDF locally. Nothing is uploaded."],
          ["Answer", "Arkiv returns every observation of that exact file."],
        ].map(([t, d], i) => (
          <li key={t} className="card flex gap-4 p-4">
            <span className={`mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] ${i === 1 ? "bg-ink text-white" : "bg-forest-tint text-forest"}`}>{i + 1}</span>
            <div><p className="font-semibold tracking-[-0.02em]">{t}</p><p className="mt-0.5 text-[14px] text-ink-2">{d}</p></div>
          </li>
        ))}
      </ol>
    </>
  )
}
