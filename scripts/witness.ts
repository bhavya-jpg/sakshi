// Witness CLI: fetch each source URL, hash what it serves, compare with this witness's own latest
// record on Arkiv, and write one atomic batch (new observations + run summary + Lifetime Extensions).
//
// Usage:
//   npx tsx scripts/witness.ts [--sources sources.json] [--key-env WITNESS_A_PRIVATE_KEY]
//                              [--label "Sakshi witness A"] [--only demo|official] [--dry-run]
import "dotenv/config"
import { readFileSync } from "node:fs"
import { createWalletClient, ExpirationTime, jsonToPayload, type CreateEntityParameters, type ExtendEntityParameters } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { observationsByUrlKey, publicClient } from "../src/lib/arkiv"
import { explorerTx } from "../src/lib/config"
import { normalizeUrl, sha256Hex, urlKey } from "../src/lib/hash"
import { observationAttributes, runAttributes, type ObservationInput, type ObservationPayload, type SourceTier } from "../src/lib/schema"

const LIFETIME_DAYS = 30
const BLOCKS_PER_DAY = 43_200n // 2 s blocks (SDK BLOCK_TIME)

type Source = { url: string; title?: string; tier: SourceTier }

const args = process.argv.slice(2)
const opt = (name: string, dflt?: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : dflt
}
const dryRun = args.includes("--dry-run")
const keyEnv = opt("key-env", "WITNESS_A_PRIVATE_KEY")!
const label = opt("label", process.env.WITNESS_LABEL ?? "Sakshi witness A")!
const only = opt("only")
const sources: Source[] = JSON.parse(readFileSync(opt("sources", "sources.json")!, "utf8"))
  .filter((s: Source) => !only || s.tier === only)

const pk = process.env[keyEnv] as `0x${string}` | undefined
if (!pk) throw new Error(`${keyEnv} missing from .env`)
const account = privateKeyToAccount(pk)
const wallet = createWalletClient({ chain: tiramisu, transport: http(), account })

type FetchResult =
  | { ok: true; status: number; bytes: Uint8Array; finalUrl: string; headers: Headers }
  | { ok: false; status: number; error?: string }

async function fetchPdf(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "SakshiWitness/0.1 (+https://github.com/bhavya-jpg/sakshi)", "cache-control": "no-cache" },
    })
    if (!res.ok) return { ok: false, status: res.status }
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") return { ok: false, status: res.status, error: "not a PDF" }
    return { ok: true, status: res.status, bytes, finalUrl: res.url, headers: res.headers }
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message }
  }
}

const now = Math.floor(Date.now() / 1000)
const currentBlock = await publicClient.getBlockNumber()
const extendTarget = currentBlock + BigInt(LIFETIME_DAYS) * BLOCKS_PER_DAY

const creates: CreateEntityParameters[] = []
const extensions: ExtendEntityParameters[] = []
const checked: string[] = []
const log: string[] = []

for (const s of sources) {
  const url = normalizeUrl(s.url)
  const domain = new URL(url).hostname
  const key = await urlKey(url)
  const mine = await observationsByUrlKey(key, account.address)
  const latest = mine.at(-1)
  const r = await fetchPdf(url)
  checked.push(key)

  const base = { urlKey: key, domain, fetchedAt: now, sourceTier: s.tier } as const
  const payload: ObservationPayload = { url, title: s.title, witness_label: label }

  if (r.ok) {
    const hash = await sha256Hex(r.bytes)
    Object.assign(payload, {
      final_url: r.finalUrl !== url ? r.finalUrl : undefined,
      content_type: r.headers.get("content-type") ?? undefined,
      content_length: r.bytes.length,
      etag: r.headers.get("etag") ?? undefined,
      last_modified: r.headers.get("last-modified") ?? undefined,
    })
    let o: ObservationInput | undefined
    if (!latest) o = { ...base, kind: "seen", docSha256: hash, httpStatus: r.status }
    else if (latest.kind !== "gone" && latest.docSha256 === hash) {
      if (BigInt(latest.expiresAtBlock || 0) < extendTarget) extensions.push({ entityKey: latest.key, expires: ExpirationTime.fromDays(LIFETIME_DAYS) })
      log.push(`same     ${url}  ${hash.slice(0, 18)}…  (extend ${latest.key.slice(0, 12)}…)`)
    } else o = { ...base, kind: "changed", docSha256: hash, prevSha256: latest.docSha256, httpStatus: r.status }
    if (o) {
      creates.push(obsEntity(o, payload))
      log.push(`${o.kind.padEnd(8)} ${url}  ${hash.slice(0, 18)}…`)
    }
  } else if ((r.status === 404 || r.status === 410) && latest && latest.kind !== "gone") {
    creates.push(obsEntity({ ...base, kind: "gone", prevSha256: latest.docSha256, httpStatus: r.status }, payload))
    log.push(`gone     ${url}  HTTP ${r.status}`)
  } else {
    log.push(`skip     ${url}  HTTP ${r.status} ${r.error ?? ""}`.trim())
  }
}

function obsEntity(o: ObservationInput, payload: ObservationPayload): CreateEntityParameters {
  return {
    payload: jsonToPayload(JSON.parse(JSON.stringify(payload))),
    contentType: "application/json",
    attributes: observationAttributes(o),
    expires: ExpirationTime.fromDays(LIFETIME_DAYS),
    flags: { readonly: true, permissionlessExtension: true },
  }
}

const changes = creates.length
creates.push({
  payload: jsonToPayload({ witness_label: label, url_keys_checked: checked, sdk: "0.8.1" }),
  contentType: "application/json",
  attributes: runAttributes({ runAt: now, sourcesChecked: sources.length, changes }),
  expires: ExpirationTime.fromDays(LIFETIME_DAYS),
  flags: { readonly: true, permissionlessExtension: true },
})

console.log(`witness ${label} ${account.address} · ${sources.length} sources · block ${currentBlock}`)
for (const l of log) console.log("  " + l)
console.log(`batch: ${changes} new observations + 1 run, ${extensions.length} extensions`)
if (dryRun) process.exit(0)

const res = await wallet.executeBatch({ creates, extensions })
console.log(`tx ${explorerTx(res.txHash)}`)
for (const k of res.createdEntities) console.log(`  created ${k}`)
for (const k of res.extendedEntities) console.log(`  extended ${k}`)
