// Read paths combining queries + verdict. Runs on the server (route handlers) and in the CLI.
import { observationsByHash, observationsByUrlKey, runsByWitness } from "./arkiv"
import { WITNESSES } from "./config"
import type { Hex32, Observation, Run } from "./schema"
import { computeVerdict, timelineKey, type Verdict } from "./verdict"

export async function verifyHash(hash: Hex32, trusted: string[] = WITNESSES.map((w) => w.address)): Promise<Verdict> {
  const hits = await observationsByHash(hash)
  const trust = new Set(trusted.map((t) => t.toLowerCase()))
  const pairs = new Map<string, { creator: Hex32; urlKey: Hex32 }>()
  for (const o of hits) if (trust.has(o.creator.toLowerCase())) pairs.set(timelineKey(o.creator, o.urlKey), o)
  const creators = [...new Set([...pairs.values()].map((p) => p.creator.toLowerCase() as Hex32))]

  const [timelineList, runList] = await Promise.all([
    Promise.all([...pairs.entries()].map(async ([k, p]) => [k, await observationsByUrlKey(p.urlKey, p.creator)] as const)),
    Promise.all(creators.map(async (c) => [c, await runsByWitness(c)] as const)),
  ])
  return computeVerdict(hash, hits, new Map(timelineList), new Map(runList), trusted)
}

export type Timeline = { urlKey: Hex32; observations: Observation[]; runs: Record<string, Run | null> }

export async function urlTimeline(urlKey: Hex32): Promise<Timeline> {
  const observations = await observationsByUrlKey(urlKey)
  const creators = [...new Set(observations.map((o) => o.creator.toLowerCase()))]
  const runs: Record<string, Run | null> = {}
  await Promise.all(creators.map(async (c) => { runs[c] = (await runsByWitness(c as Hex32))[0] ?? null }))
  return { urlKey, observations, runs }
}
