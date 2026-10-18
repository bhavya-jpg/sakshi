// Read-only Arkiv access. No keys here: this module is safe for the web app and the CLI.
import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { eq } from "@arkiv-network/sdk/query"
import { bytes32, str } from "@arkiv-network/sdk"
import { http } from "viem"
import { PROJECT } from "./config"
import { toObservation, toRun, type Hex32, type Observation, type Run } from "./schema"

export const publicClient = createPublicClient({ chain: tiramisu, transport: http() })

const P = eq("project", str(PROJECT))
const OBS = eq("entity_type", str("observation"))
const RUN = eq("entity_type", str("run"))

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
  const q = publicClient.select().where(P, OBS, eq("doc_sha256", bytes32(docSha256))).limit(200)
  return fetchAll(q, toObservation)
}

// Q2: timeline of one URL, optionally by one witness. Sorted by fetched_at on the client.
export async function observationsByUrlKey(urlKey: Hex32, creator?: Hex32): Promise<Observation[]> {
  let q = publicClient.select().where(P, OBS, eq("url_key", bytes32(urlKey))).limit(200)
  if (creator) q = q.createdBy(creator)
  const rows = await fetchAll(q, toObservation)
  return rows.sort((a, b) => a.fetchedAt - b.fetchedAt || Number(a.createdAtBlock) - Number(b.createdAtBlock))
}

// Q3: runs of one witness. Latest first.
export async function runsByWitness(creator: Hex32): Promise<Run[]> {
  const q = publicClient.select().where(P, RUN).createdBy(creator).limit(200)
  const rows = await fetchAll(q, toRun)
  return rows.sort((a, b) => b.runAt - a.runAt)
}

// Every observation in the project (used for the board page and the "recently witnessed" list).
export async function allObservations(): Promise<Observation[]> {
  const q = publicClient.select().where(P, OBS).limit(200)
  return fetchAll(q, toObservation)
}
