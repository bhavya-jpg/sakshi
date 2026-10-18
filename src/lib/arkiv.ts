// Read-only Arkiv access. No keys here: this module is safe for the web app and the CLI.
import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { eq } from "@arkiv-network/sdk/query"
import { bytes32, str } from "@arkiv-network/sdk"
import { http } from "viem"
import { PROJECT } from "./config"
import { toObservation, toRun, type Hex32, type Observation, type Run } from "./schema"

// The public RPC rate-limits bursts (HTTP 429); back off and retry rather than fail the page.
export const publicClient = createPublicClient({ chain: tiramisu, transport: http(undefined, { retryCount: 5, retryDelay: 600 }) })

const P = eq("project", str(PROJECT))
const OBS = eq("entity_type", str("observation"))
const RUN = eq("entity_type", str("run"))

// Only the fields the app reads. Queries are metered per IP (cost units), so ask for no more than needed.
const OBS_FIELDS = { key: true, creator: true, createdAt: true, expiresAt: true, attributes: true, payload: true } as const
const RUN_FIELDS = { key: true, creator: true, attributes: true } as const

type Builder = { fetch: () => Promise<{ entities: readonly unknown[]; hasNextPage(): boolean; next(): Promise<unknown> }> }

/** Follows the cursor until the result set is exhausted (bounded, to be safe). */
async function fetchAll<T>(builder: Builder, map: (e: never) => T, maxPages = 10): Promise<T[]> {
  const out: T[] = []
  let page = (await builder.fetch()) as Awaited<ReturnType<Builder["fetch"]>>
  for (let i = 0; i < maxPages; i++) {
    for (const e of page.entities) out.push(map(e as never))
    if (!page.hasNextPage()) break
    page = (await page.next()) as typeof page
  }
  return out
}

// Q1: every observation of this exact file, from any creator. Trust filtering happens in verdict.ts.
export async function observationsByHash(docSha256: Hex32): Promise<Observation[]> {
  const q = publicClient.select(OBS_FIELDS).where(P, OBS, eq("doc_sha256", bytes32(docSha256))).limit(200)
  return fetchAll(q, toObservation)
}

// Q2: timeline of one URL, optionally by one witness. Sorted by fetched_at on the client.
export async function observationsByUrlKey(urlKey: Hex32, creator?: Hex32): Promise<Observation[]> {
  let q = publicClient.select(OBS_FIELDS).where(P, OBS, eq("url_key", bytes32(urlKey))).limit(200)
  if (creator) q = q.createdBy(creator)
  const rows = await fetchAll(q, toObservation)
  return rows.sort((a, b) => a.fetchedAt - b.fetchedAt || Number(a.createdAtBlock) - Number(b.createdAtBlock))
}

// Q3: runs of one witness. Latest first.
export async function runsByWitness(creator: Hex32): Promise<Run[]> {
  const q = publicClient.select(RUN_FIELDS).where(P, RUN).createdBy(creator).limit(200)
  const rows = await fetchAll(q, toRun)
  return rows.sort((a, b) => b.runAt - a.runAt)
}

/** Pure: keep only runs created by `addresses` (case-insensitive), latest first. */
export function selectWitnessRuns(runs: Run[], addresses: string[]): Run[] {
  const keep = new Set(addresses.map((a) => a.toLowerCase()))
  return runs.filter((r) => keep.has(r.creator.toLowerCase())).sort((a, b) => b.runAt - a.runAt)
}

// Q3b: runs of several witnesses in one query (no createdBy), filtered locally. Same result as calling
// runsByWitness for each address, at the cost of one query instead of one per witness.
export async function runsOfWitnesses(addresses: string[]): Promise<Run[]> {
  const q = publicClient.select(RUN_FIELDS).where(P, RUN).limit(200)
  return selectWitnessRuns(await fetchAll(q, toRun), addresses)
}

// Every observation in the project (used for the board page and the "recently witnessed" list).
export async function allObservations(): Promise<Observation[]> {
  const q = publicClient.select(OBS_FIELDS).where(P, OBS).limit(200)
  return fetchAll(q, toObservation)
}
