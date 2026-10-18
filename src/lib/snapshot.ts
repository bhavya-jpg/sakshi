"use client"
// One cached read of the public record for the landing page: every Sakshi observation plus each
// trusted witness's runs. All numbers shown on the landing page come from here, never from constants.
import { useEffect, useState } from "react"
import { allObservations, publicClient, runsByWitness } from "./arkiv"
import { WITNESSES } from "./config"
import type { Hex32, Observation, Run } from "./schema"
import { computeVerdict, timelineKey, type Verdict } from "./verdict"

export type Snapshot = { observations: Observation[]; runs: Run[]; block: bigint }

let cache: Promise<Snapshot> | null = null
const SESSION_KEY = "sakshi.snapshot.v1"
const SESSION_TTL = 120_000 // reuse a read for 2 minutes across page navigations

export function loadSnapshot(): Promise<Snapshot> {
  if (!cache) {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const s = JSON.parse(raw) as Omit<Snapshot, "block"> & { block: string; at: number }
        if (Date.now() - s.at < SESSION_TTL) cache = Promise.resolve({ ...s, block: BigInt(s.block) })
      }
    } catch { /* storage unavailable: read fresh */ }
  }
  cache ??= (async () => {
    const [observations, runLists, block] = await Promise.all([
      allObservations(),
      Promise.all(WITNESSES.map((w) => runsByWitness(w.address))),
      publicClient.getBlockNumber(),
    ])
    observations.sort((a, b) => b.fetchedAt - a.fetchedAt || Number(b.createdAtBlock) - Number(a.createdAtBlock))
    const snap = { observations, runs: runLists.flat().sort((a, b) => b.runAt - a.runAt), block }
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...snap, block: String(block), at: Date.now() })) } catch { /* ignore */ }
    return snap
  })().catch((e) => { cache = null; throw e })
  return cache
}

export function useSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => { loadSnapshot().then(setData).catch(() => setError(true)) }, [])
  return { data, error }
}

/** Verdict for a hash computed from the snapshot (same pure logic as /verify, no extra queries). */
export function verdictFromSnapshot(snap: Snapshot, hash: Hex32, trusted: string[] = WITNESSES.map((w) => w.address)): Verdict {
  const h = hash.toLowerCase()
  const hits = snap.observations.filter((o) => o.docSha256?.toLowerCase() === h)
  const timelines = new Map<string, Observation[]>()
  for (const o of snap.observations) {
    const k = timelineKey(o.creator, o.urlKey)
    timelines.set(k, [...(timelines.get(k) ?? []), o])
  }
  const runs = new Map<string, Run[]>()
  for (const r of snap.runs) runs.set(r.creator.toLowerCase(), [...(runs.get(r.creator.toLowerCase()) ?? []), r])
  return computeVerdict(hash, hits, timelines, runs, trusted)
}

/* One shared block poller for the whole page (navbar + stats), to stay well inside RPC rate limits. */
let latestBlock: bigint | null = null
const listeners = new Set<(b: bigint) => void>()
let timer: ReturnType<typeof setInterval> | null = null
function startPolling(ms: number) {
  if (timer) return
  const tick = () => document.hidden ? Promise.resolve() : publicClient.getBlockNumber().then((b) => { latestBlock = b; listeners.forEach((l) => l(b)) }).catch(() => {})
  tick()
  timer = setInterval(tick, ms)
}

/** Live block height (shared poller, every 12 s). */
export function useBlock() {
  const [block, setBlock] = useState<bigint | null>(latestBlock)
  useEffect(() => {
    listeners.add(setBlock)
    startPolling(12000)
    return () => {
      listeners.delete(setBlock)
      if (listeners.size === 0 && timer) { clearInterval(timer); timer = null }
    }
  }, [])
  return block
}

export const ago = (t: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - t))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}
