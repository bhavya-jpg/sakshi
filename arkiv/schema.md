# Sakshi: Arkiv schema (public data contract)

> Network **Tiramisu** (chain id `7738577`) · SDK `@arkiv-network/sdk@0.8.1` · namespace `project = "sakshi-v1"` · `schema_version = 1`
> Anyone may read these entities, or run their own witness, without asking us. No personal data is stored: only hashes of public notice PDFs, their URLs, and HTTP metadata.
> Source of truth in code: [`src/lib/schema.ts`](../src/lib/schema.ts) (attributes), [`src/lib/arkiv.ts`](../src/lib/arkiv.ts) (queries), [`scripts/witness.ts`](../scripts/witness.ts) (writes).

## Trust model
A record means: **wallet `$creator` committed, no later than the block it landed in, that URL U returned bytes with SHA-256 H.**
Readers choose which witnesses they trust. Results are filtered by the immutable on-chain `$creator` (`createdBy` / client-side filter); attribute values such as `domain` are never used for trust.
A record does **not** prove that the witness fetched honestly (there is no TLS proof), or that the official site was not compromised. In this submission every witness is operated by the Sakshi team.

## Witness wallets
| Address | Role | Status |
|---|---|---|
| [`0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`](https://tiramisu.explorer.arkiv.network/address/0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa) | Witness A: creates `observation` and `run` (also ran `scripts/preflight.ts`) | active since 19 Oct 2026, 00:15 IST |
| [`0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA`](https://tiramisu.explorer.arkiv.network/address/0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA) | Witness B: creates `observation` and `run` | active since 19 Oct 2026, 01:42 IST; funded with 0.01 GLM from A |

A and B are **distinct witness identities** (separate keys and wallets) operated by the same team. They are not independent organisations.

## On-chain evidence (Tiramisu)
Witness runs against the demo board (A twice, B once), `https://bhavya-jpg.github.io/sakshi/board/notice-{1,2,3}.pdf`:

| Run | Board phase | Transaction | What it wrote |
|---|---|---|---|
| 1 · 19 Oct 00:15 IST | 1 | [`0x7707c7e1…1745`](https://tiramisu.explorer.arkiv.network/tx/0x7707c7e1c68b65127c5d46b2225be787a19a7faef5af88c1b12fc2f2eec51745) | `seen` ×3 + `run` |
| 2 · 19 Oct 00:17 IST | 2 | [`0x6969dab4…c519`](https://tiramisu.explorer.arkiv.network/tx/0x6969dab4b65b72853304c36fe7679007cd5f2c4aa5bdc06ff9e24342232fc519) | `changed` (notice 2) + `gone` (notice 3) + `run`, plus a Lifetime Extension of notice 1's `seen` |
| B1 · 19 Oct 01:42 IST | 2 | [`0xbab0f459…9d4f`](https://tiramisu.explorer.arkiv.network/tx/0xbab0f4599b2afc706e640e519d9921d6b9259a88421e17f8c447277f160a9d4f) | Witness B: `seen` (notice 1) + `run` |

Example entities:
| Entity key | Type | Meaning |
|---|---|---|
| `0x9d2d6d533d5a57b8ba385270507c41922fbda002c32d976a09ed63dc88f8fd42` | observation `seen` | notice 1 serves `0xedfaad04…a397`; extended in run 2 |
| `0x09ab88cd3eb609ee9c9d6758ea6266856277cbe36e4b9ff1107b540d6438745c` | observation `seen` | notice 2 served `0x1a89d92e…6c5a` (v1) |
| `0xde3d2faa8ea128156f65b0031b05dcf80652ddf8b837c11e7e523c6b04bfdd14` | observation `changed` | notice 2 now serves `0xcc807160…6e06` (v2) |
| `0x4b6e75fc6dac4bbd35a0cfacf2b586a2123fe46451b4574986b39d6e9ff634ee` | observation `seen` | notice 3 served `0x7d4de10e…6e61` |
| `0x67acc4d5242d98710ca8d817ed5a876ebda1d716e0d784c074e756daa3462696` | observation `gone` | notice 3 returned HTTP 404 |
| `0x989289eada88a62e74fef32070c51e37367ca4f6c4dd4ff763a00a3a1d063925` | run | run 1 summary |
| `0x52ca1acceb714cec3c48d7fd7e21ebcb7abaeaab30723a81b62c06804fe651eb` | observation `seen` | Witness B: notice 1 serves `0xedfaad04…a397`, the same file A saw, so it is now seen by 2 witness identities |

The preflight test also left one synthetic `observation` (`0xa61a7141…e0e5`, URL `https://sakshi.example/preflight/…`, `source_tier = demo`) and one `entity_type = "preflight"` entity under the same project.

## Entity types
All entities: `contentType: application/json`, creation flags `readonly: true` and `permissionlessExtension: true`, plus these common attributes:

| Attribute | Type | Value |
|---|---|---|
| `project` | str | `sakshi-v1` |
| `entity_type` | str | `observation` or `run` |
| `schema_version` | i32 | `1` |

### `observation`: what one URL served at one moment
| Attribute | Type | Meaning |
|---|---|---|
| `kind` | str | `seen` (first record of this URL by this witness) · `changed` (URL now serves a different hash) · `gone` (URL now returns 404/410) |
| `url_key` | bytes32 | SHA-256 of the normalized URL (lowercase scheme and host, `#fragment` dropped, path and query kept exactly) |
| `domain` | str | lowercase hostname |
| `doc_sha256` | bytes32 | SHA-256 of the served bytes (absent when `kind = gone`) |
| `prev_sha256` | bytes32 | the witness's previous hash for this URL (`changed`, `gone`) |
| `fetched_at` | u64 | unix seconds of the fetch |
| `http_status` | i32 | HTTP status |
| `source_tier` | str | `official` or `demo` (our labelled mock board) |

Payload (JSON): `{ url, final_url?, title?, content_type?, content_length?, etag?, last_modified?, witness_label }`. URLs live in the payload because a `str` attribute is limited to 128 bytes; queries go through `url_key`.

- **Entity Expiration:** `ExpirationTime.fromDays(30)` at creation.
- **Lifetime Extension:** when a later run sees the same hash at the same URL again, the run extends that observation by `fromDays(30)` from now, but only if that is later than its current expiry (the engine reverts an extension that is not later). An observation that is no longer re-confirmed expires on its own about 30 days after its last confirmation. Because of `permissionlessExtension`, any third party can extend a record to keep it as evidence.
- **Why readonly:** a witness can never edit what it said it saw; a change is a new `changed` record.

### `run`: one witness pass
| Attribute | Type | Meaning |
|---|---|---|
| `run_at` | u64 | unix seconds |
| `sources_checked` | i32 | number of URLs fetched |
| `changes` | i32 | number of new observations in this run |

Payload: `{ witness_label, url_keys_checked: [...], sdk: "0.8.1" }`. **Entity Expiration:** `fromDays(30)`.
Gives "still served as of `run_at`" for URLs whose file did not change (the observation itself is readonly and is not rewritten).

### Atomic run
Each witness run is **one `executeBatch` transaction**: `creates` = new observations plus the `run` entity, and `extensions` = observations re-confirmed in this run. A run's findings and its summary land together or not at all.

## Queries the app runs
```ts
import { eq } from "@arkiv-network/sdk/query"
import { bytes32, str } from "@arkiv-network/sdk"
const P = eq("project", str("sakshi-v1"))
const OBS = eq("entity_type", str("observation")), RUN = eq("entity_type", str("run"))

// Q1 verify an uploaded file (hash computed in the browser); trusted-witness filter applied to $creator
client.select().where(P, OBS, eq("doc_sha256", bytes32(h))).limit(200).fetch()

// Q2 timeline of one URL (optionally by one witness); sorted by fetched_at on the client (no server-side ordering)
client.select().where(P, OBS, eq("url_key", bytes32(k))).createdBy(W).limit(200).fetch()

// Q3 runs of one witness; client picks max run_at
client.select().where(P, RUN).createdBy(W).limit(200).fetch()
```
All three follow `cursor` pages via `QueryResult.hasNextPage()` / `next()`. The browser runs them directly against `https://rpc.tiramisu.db-chain.testnet.arkiv.network` (CORS allows any origin); the CLI `scripts/verify.ts` runs the same code from Node.

## Verdicts ([`src/lib/verdict.ts`](../src/lib/verdict.ts), unit-tested)
For each (trusted `$creator`, `url_key`) pair that has observed hash H:
| Verdict | Condition |
|---|---|
| SERVED | no later record by that witness for that URL shows a different hash or `gone`; "still served as of" = that witness's latest `run_at` |
| REPLACED | a later `changed` record shows a different hash |
| REMOVED | a later `gone` record exists |
| NO MATCHING RECORD | no trusted witness has H. This does **not** mean the file is fake. |

## Kept off Arkiv on purpose
The PDFs themselves (the user already has the file; synthetic samples are in `public/samples/`), any page containing personal names (we never witness result lists, merit lists or admit cards), and all private keys.
