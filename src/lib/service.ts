// Read paths combining queries + verdict. Runs on the server (route handlers) and in the CLI.
import { observationsByHash, observationsByUrlKey, runsByWitness } from "./arkiv"
import { WITNESSES } from "./config"
import type { Hex32, Observation, Run } from "./schema"
import { computeVerdict, timelineKey, type Verdict } from "./verdict"

/**
 * Everything needed to judge one hash for any subset of `candidates`: all hits (any creator), plus the
 * timelines and runs of each candidate witness that has a hit. Fetch once, then call
 * {@link verdictFromEvidence} for each trust selection without querying again.
 */
export type Evidence = {
  hash: Hex32
  hits: Observation[]
  timelines: Map<string, Observation[]>
  runs: Map<string, Run[]>
  candidates: string[] // lowercase witness addresses whose timelines were fetched
}

export async function fetchEvidence(hash: Hex32, candidates: string[] = WITNESSES.map((w) => w.address)): Promise<Evidence> {
  const hits = await observationsByHash(hash)
  const cand = new Set(candidates.map((t) => t.toLowerCase()))
  const pairs = new Map<string, { creator: Hex32; urlKey: Hex32 }>()
  for (const o of hits) if (cand.has(o.creator.toLowerCase())) pairs.set(timelineKey(o.creator, o.urlKey), o)
  const creators = [...new Set([...pairs.values()].map((p) => p.creator.toLowerCase() as Hex32))]

  const [timelineList, runList] = await Promise.all([
    Promise.all([...pairs.entries()].map(async ([k, p]) => [k, await observationsByUrlKey(p.urlKey, p.creator)] as const)),
    Promise.all(creators.map(async (c) => [c, await runsByWitness(c)] as const)),
  ])
  return { hash, hits, timelines: new Map(timelineList), runs: new Map(runList), candidates: [...cand] }
}

/** Pure: the verdict for `trusted`, which must be a subset of the evidence's candidates. */
export function verdictFromEvidence(ev: Evidence, trusted: string[]): Verdict {
  const cand = new Set(ev.candidates)
  const outside = trusted.filter((t) => !cand.has(t.toLowerCase()))
  if (outside.length) throw new Error(`evidence was not fetched for ${outside.join(", ")}; call fetchEvidence with them`)
  return computeVerdict(ev.hash, ev.hits, ev.timelines, ev.runs, trusted)
}

export async function verifyHash(hash: Hex32, trusted: string[] = WITNESSES.map((w) => w.address)): Promise<Verdict> {
  return verdictFromEvidence(await fetchEvidence(hash, trusted), trusted)
}

export type Timeline = { urlKey: Hex32; observations: Observation[]; runs: Record<string, Run | null> }

export async function urlTimeline(urlKey: Hex32): Promise<Timeline> {
  const observations = await observationsByUrlKey(urlKey)
  const creators = [...new Set(observations.map((o) => o.creator.toLowerCase()))]
  const runs: Record<string, Run | null> = {}
  await Promise.all(creators.map(async (c) => { runs[c] = (await runsByWitness(c as Hex32))[0] ?? null }))
  return { urlKey, observations, runs }
}
