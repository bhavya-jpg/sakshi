// Minimal Arkiv integration test on Tiramisu: create one observation, read it back, query it,
// verify creator and payload; then one batch (create + Lifetime Extension).
// Usage: npx tsx scripts/preflight.ts            (needs WITNESS_A_PRIVATE_KEY in .env)
import "dotenv/config"
import { createWalletClient, ExpirationTime, jsonToPayload, str } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { eq, gte } from "@arkiv-network/sdk/query"
import { bytes32, u64 } from "@arkiv-network/sdk"
import { http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { publicClient } from "../src/lib/arkiv"
import { PROJECT, explorerTx } from "../src/lib/config"
import { sha256Hex, urlKey } from "../src/lib/hash"
import { observationAttributes, toObservation } from "../src/lib/schema"

const pk = process.env.WITNESS_A_PRIVATE_KEY as `0x${string}` | undefined
if (!pk) throw new Error("WITNESS_A_PRIVATE_KEY missing from .env")
const account = privateKeyToAccount(pk)
const wallet = createWalletClient({ chain: tiramisu, transport: http(), account })

let failures = 0
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`)
}
const t0 = Date.now()
const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`

console.log(`SDK @arkiv-network/sdk 0.8.1 · chain ${tiramisu.id} · account ${account.address}`)

// 1. Connect
const chainId = await publicClient.getChainId()
const balance = await publicClient.getBalance({ address: account.address })
check("connect to Tiramisu", chainId === 7738577, `chainId=${chainId} block=${await publicClient.getBlockNumber()}`)
check("wallet funded", balance > 0n, `balance=${balance} wei`)
if (balance === 0n) process.exit(1)

// 2. Create one observation entity (synthetic document)
const testUrl = `https://sakshi.example/preflight/${Date.now()}.pdf`
const docHash = await sha256Hex(new TextEncoder().encode(`sakshi preflight ${Date.now()} ${Math.random()}`))
const uKey = await urlKey(testUrl)
const fetchedAt = Math.floor(Date.now() / 1000)
const payloadIn = { url: testUrl, title: "Preflight synthetic notice", witness_label: "preflight" }

const created = await wallet.createEntity({
  payload: jsonToPayload(payloadIn),
  contentType: "application/json",
  attributes: observationAttributes({
    kind: "seen", urlKey: uKey, domain: "sakshi.example", docSha256: docHash,
    fetchedAt, httpStatus: 200, sourceTier: "demo",
  }),
  expires: ExpirationTime.fromDays(30),
  flags: { readonly: true, permissionlessExtension: true },
})
console.log(`      entityKey=${created.entityKey}\n      tx=${explorerTx(created.txHash)}\n      expiresAt(block)=${created.expiresAt}  [${elapsed()}]`)

// 3. Confirmation (createEntity already awaited the receipt; check it explicitly)
const receipt = await publicClient.getTransactionReceipt({ hash: created.txHash })
check("transaction confirmed", receipt.status === "success", `block=${receipt.blockNumber} status=${receipt.status}`)

// 4. Read back
const got = await publicClient.getEntity(created.entityKey)
const obs = toObservation(got as never)
check("getEntity returns entity", got.key?.toLowerCase() === created.entityKey.toLowerCase())
check("creator == wallet", got.creator?.toLowerCase() === account.address.toLowerCase(), `creator=${got.creator}`)
check("payload round-trips", JSON.stringify(got.toJson()) === JSON.stringify(payloadIn), got.toText())
check("doc_sha256 attribute", obs.docSha256 === docHash, `${obs.docSha256}`)
check("fetched_at u64", obs.fetchedAt === fetchedAt, `${obs.fetchedAt} (attr type ${got.attributes?.fetched_at?.type})`)
check("flags readonly+permissionlessExtension", !!got.creationFlags?.readonly && !!got.creationFlags?.permissionlessExtension, JSON.stringify(got.creationFlags))

// 5. Query by project identifier + document hash
const q1 = await publicClient.select()
  .where(eq("project", str(PROJECT)), eq("entity_type", str("observation")), eq("doc_sha256", bytes32(docHash)))
  .fetch()
check("query project+doc_sha256 → 1 row", q1.entities.length === 1, `rows=${q1.entities.length} [${elapsed()}]`)
check("query row creator == wallet", q1.entities[0]?.creator?.toLowerCase() === account.address.toLowerCase())
check("query row payload url", (q1.entities[0]?.toJson() as { url?: string })?.url === testUrl)

const q2 = await publicClient.select()
  .where(eq("project", str(PROJECT)), eq("url_key", bytes32(uKey)), gte("fetched_at", u64(fetchedAt - 60)))
  .createdBy(account.address)
  .fetch()
check("query url_key+gte(fetched_at)+createdBy → 1 row", q2.entities.length === 1, `rows=${q2.entities.length}`)

const q3 = await publicClient.select()
  .where(eq("project", str(PROJECT)), eq("doc_sha256", bytes32(docHash)))
  .createdBy("0x000000000000000000000000000000000000dEaD")
  .fetch()
check("createdBy(other wallet) → 0 rows", q3.entities.length === 0, `rows=${q3.entities.length}`)

// 6. One batch: create a run-like entity + extend the observation (Lifetime Extension)
try {
  const batch = await wallet.executeBatch({
    creates: [{
      payload: jsonToPayload({ preflight: true }),
      contentType: "application/json",
      attributes: { project: str(PROJECT), entity_type: str("preflight"), run_at: u64(fetchedAt) },
      expires: ExpirationTime.fromDays(30),
    }],
    extensions: [{ entityKey: created.entityKey, expires: ExpirationTime.fromDays(31) }],
  })
  const after = await publicClient.getEntity(created.entityKey)
  check("executeBatch create+extension in one tx", batch.createdEntities.length === 1, `tx=${explorerTx(batch.txHash)}`)
  check("expiresAt increased", (after.expiresAt ?? 0n) > created.expiresAt, `${created.expiresAt} → ${after.expiresAt}`)
} catch (e) {
  check("executeBatch create+extension in one tx", false, (e as Error).message.split("\n")[0])
}

console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILURE(S)`}  [${elapsed()}]`)
process.exit(failures === 0 ? 0 : 1)
