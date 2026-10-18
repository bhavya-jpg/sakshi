// Read-only verification without the Sakshi website: hashes a local PDF and queries the public
// Tiramisu RPC directly. No key needed.
// Usage: npx tsx scripts/verify.ts <file.pdf> [--trust 0xWitness,0xWitness]
import { readFileSync } from "node:fs"
import { WITNESSES } from "../src/lib/config"
import { sha256Hex } from "../src/lib/hash"
import { verifyHash } from "../src/lib/service"
import { VERDICT_TEXT } from "../src/lib/verdict"

const file = process.argv[2]
if (!file) throw new Error("usage: npx tsx scripts/verify.ts <file.pdf> [--trust 0xA,0xB]")
const ti = process.argv.indexOf("--trust")
const trusted = ti > 0 ? process.argv[ti + 1].split(",") : WITNESSES.map((w) => w.address)

const iso = (t: number) => new Date(t * 1000).toISOString().replace(".000Z", "Z")
const hash = await sha256Hex(readFileSync(file))
const v = await verifyHash(hash, trusted)

console.log(`file      ${file}`)
console.log(`sha256    ${hash}`)
console.log(`trusting  ${trusted.join(", ")}`)
console.log(`verdict   ${v.overall}  (${VERDICT_TEXT[v.overall].en} · ${VERDICT_TEXT[v.overall].hi})`)
console.log(`          ${VERDICT_TEXT[v.overall].note}`)
for (const f of v.findings) {
  console.log(`\n  ${f.status}${f.sourceTier === "demo" ? "  [DEMO SOURCE]" : ""}`)
  console.log(`  url             ${f.url}`)
  console.log(`  witness         ${f.witness}`)
  console.log(`  first seen      ${iso(f.firstSeen)}`)
  console.log(`  last confirmed  ${iso(f.lastConfirmed)}`)
  if (f.endedAt) console.log(`  ${f.status === "REMOVED" ? "removed" : "replaced"}        ${iso(f.endedAt)}${f.replacedBy ? `  by ${f.replacedBy}` : ""}`)
  for (const o of f.evidence) console.log(`    ${iso(o.fetchedAt)}  ${o.kind.padEnd(7)} ${o.docSha256 ?? "-"}  entity ${o.key}`)
}
if (v.ignored) console.log(`\n${v.ignored} record(s) of this hash from wallets you do not trust were ignored.`)
