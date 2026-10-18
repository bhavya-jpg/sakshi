"use client"
import { useCallback, useState } from "react"
import { WITNESSES } from "@/lib/config"
import { sha256Hex } from "@/lib/hash"
import type { Verdict } from "@/lib/verdict"
import { VerdictView } from "./VerdictView"

export function Verify() {
  const [trusted, setTrusted] = useState<string[]>(WITNESSES.map((w) => w.address))
  const [file, setFile] = useState<{ name: string; size: number; hash: `0x${string}` } | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const check = useCallback(async (hash: string, trust: string[]) => {
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/verify?h=${hash}&w=${trust.join(",")}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? res.statusText)
      setVerdict(body)
    } catch (e) {
      setVerdict(null)
      setError(`Could not reach Arkiv: ${(e as Error).message}. The file was not uploaded anywhere; try again.`)
    } finally { setBusy(false) }
  }, [])

  const onFile = useCallback(async (f: File) => {
    setVerdict(null)
    const hash = await sha256Hex(await f.arrayBuffer())
    setFile({ name: f.name, size: f.size, hash })
    await check(hash, trusted)
  }, [check, trusted])

  const toggle = (a: string) => {
    const next = trusted.includes(a) ? trusted.filter((x) => x !== a) : [...trusted, a]
    setTrusted(next)
    if (file) check(file.hash, next)
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${drag ? "border-teal-600 bg-teal-50" : "border-stone-300 bg-white hover:border-stone-400"}`}
      >
        <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
        <span className="font-medium">Drop a notice PDF here, or tap to choose</span>
        <span className="mt-1 text-sm text-stone-500">The file is hashed on your device. It is never uploaded.</span>
      </label>

      {file && (
        <div className="text-sm text-stone-600">
          <span className="font-medium text-stone-900">{file.name}</span> · {(file.size / 1024).toFixed(1)} KB
          <div className="mono break-all text-xs">SHA-256 {file.hash}</div>
        </div>
      )}

      <fieldset className="text-sm">
        <legend className="mb-1 text-stone-500">Witnesses you trust (filtered by the wallet that created each record)</legend>
        <div className="flex flex-wrap gap-3">
          {WITNESSES.map((w) => (
            <label key={w.address} className="flex items-center gap-2 rounded border border-stone-200 bg-white px-2 py-1">
              <input type="checkbox" checked={trusted.includes(w.address)} onChange={() => toggle(w.address)} />
              <span>{w.label}</span>
              <span className="mono text-xs text-stone-400">{w.address.slice(0, 8)}…</span>
            </label>
          ))}
        </div>
      </fieldset>

      {busy && <p className="text-sm text-stone-500">Querying Arkiv…</p>}
      {error && <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {verdict && !busy && <VerdictView v={verdict} />}
    </div>
  )
}
