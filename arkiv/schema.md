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
| `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa` | Witness A: creates `observation` and `run` | not yet funded (see friction.md item 1); no entities written yet |

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
