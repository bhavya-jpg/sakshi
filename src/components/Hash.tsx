"use client"
import { useState } from "react"

/** A SHA-256 set as eight groups of eight, the way a forensic report prints it. */
export function HashGrid({ hash, className = "" }: { hash: string; className?: string }) {
  const hex = hash.replace(/^0x/, "")
  const groups = hex.match(/.{1,8}/g) ?? []
  return (
    <div className={`mono grid grid-cols-4 gap-x-3 gap-y-1 text-[12px] leading-5 tracking-[0.02em] ${className}`} aria-label={`SHA-256 ${hex}`}>
      {groups.map((g, i) => <span key={i}>{g}</span>)}
    </div>
  )
}

export function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* clipboard blocked */ } }}
      className="mono inline-flex items-center gap-1.5 border border-rule px-2 py-1 text-[11px] uppercase tracking-[0.1em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
      aria-live="polite">
      {copied ? "Copied" : "Copy hash"}
    </button>
  )
}
