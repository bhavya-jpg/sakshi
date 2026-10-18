"use client"
import { useEffect, useState } from "react"
import { verifyHash } from "@/lib/service"
import { VERDICT_TEXT, type Overall } from "@/lib/verdict"

/** Asks Arkiv, live, what the trusted witnesses have recorded for a hash. Never a canned answer. */
export function LiveStatus({ hash }: { hash: `0x${string}` }) {
  const [state, setState] = useState<{ overall: Overall; witnesses: number } | "loading" | "error">("loading")
  useEffect(() => {
    verifyHash(hash).then((v) => setState({ overall: v.overall, witnesses: v.witnesses.length })).catch(() => setState("error"))
  }, [hash])
  if (state === "loading") return <span className="mono text-ink-3 caret">querying Arkiv</span>
  if (state === "error") return <span className="text-ink-3">Arkiv unreachable right now</span>
  const t = VERDICT_TEXT[state.overall]
  const dot = state.overall === "SERVED" ? "bg-forest" : state.overall === "NOT_SEEN" ? "border border-ink-3" : state.overall === "REPLACED" ? "bg-ochre" : "bg-oxblood"
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{t.en}</span>
      {state.witnesses > 0 && <span className="text-ink-3">· {state.witnesses} witness{state.witnesses > 1 ? "es" : ""}</span>}
    </span>
  )
}
