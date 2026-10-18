# Sakshi — Arkiv schema (public data contract)

> Network **Tiramisu** (chain id `7738577`) · SDK `@arkiv-network/sdk@0.8.1` · namespace `project = "sakshi-v1"` · `schema_version = 1`
> Anyone may read these entities or run their own witness without asking us. No personal data is stored; only hashes of public notice PDFs and their URLs.

## Trust model

A record means: **wallet `$creator` committed, no later than the block it landed in, that URL U returned bytes with SHA-256 H.**
Trust is chosen by the reader: results are filtered by on-chain `$creator` (`createdBy`) against a list of witnesses the reader trusts. Attribute values are never used for trust.
It does **not** prove the witness fetched honestly (no TLS proof), or that the official site wasn't compromised. In this submission both witnesses are operated by the Sakshi team.

## Witness wallets

| Address | Label | Role |
|---|---|---|
| `0x__________` | Witness A | creates `observation` and `run` |
| `0x__________` | Witness B | creates `observation` and `run` (same operator, separate key and run) |
| `0x__________` | Pinner | extends records it does not own (permissionless extension) |

## Entity types

All entities: `project` (str), `entity_type` (str), `schema_version` (i32), `contentType: application/json`, creation flags `readonly: true`, `permissionlessExtension: true`.

### `observation`
| Attribute | Type | Meaning |
|---|---|---|
| `kind` | str | `seen` · `changed` · `gone` |
| `url_key` | bytes32 | sha256 of the normalized URL (lowercase scheme and host, fragment removed, path and query kept) |
| `domain` | str | lowercase hostname, e.g. `ssc.gov.in` |
| `doc_sha256` | bytes32 | SHA-256 of the served bytes (absent when `kind = gone`) |
| `prev_sha256` | bytes32 | previous hash (`changed`, `gone`) |
| `fetched_at` | u64 | unix seconds of the fetch |
| `http_status` | i32 | HTTP status |
| `source_tier` | str | `official` or `demo` (our labelled demo board) |

Payload: `{ "url", "final_url", "title", "content_type", "content_length", "etag", "last_modified", "witness_label" }`

**Entity Expiration:** 30 days from creation.
**Lifetime Extension:** a lease renewed by activity. Every witness run that sees the same hash again extends the current observation by 30 days from now; records that stop being re-confirmed expire on their own unless pinned (`pin.ts` → 180 days, from any wallet).
**Why readonly:** a witness can never edit what it said it saw; a change is a new `changed` record.

### `run`
| Attribute | Type | Meaning |
|---|---|---|
| `run_at` | u64 | unix seconds |
| `sources_checked` | i32 | number of URLs checked |
| `changes` | i32 | number of new observations in this run |

Payload: `{ "witness_label", "url_keys_checked": [...], "sdk": "0.8.1" }`. **Entity Expiration:** 30 days.
Gives "still served as of <run_at>" for URLs whose file didn't change.

### Atomic run
Each witness run is one `executeBatch` transaction: `creates` = new observations + the `run` entity; `extensions` = observations re-confirmed in this run. A run's findings and its summary land together or not at all.

## Queries

```ts
import { eq, gte, or } from "@arkiv-network/sdk/query";
import { bytes32, u64 } from "@arkiv-network/sdk/attr";
const P = eq("project", "sakshi-v1"), OBS = eq("entity_type", "observation");

// Q1 verify an uploaded file (hash computed in the browser)
select().where(P, OBS, eq("doc_sha256", bytes32(h)))                 // keep rows whose creator is a trusted witness

// Q2 timeline of one URL by one witness
select().where(P, OBS, eq("url_key", bytes32(k))).createdBy(W)       // sort by fetched_at on the client

// Q3 latest run of a witness
select().where(P, eq("entity_type", "run")).createdBy(W)              // client picks max run_at

// Q5 recent changes (stretch)
select().where(P, OBS, or(eq("kind", "changed"), eq("kind", "gone")), gte("fetched_at", u64(now - 7 * 86400)))
```

## Verdicts

| Verdict | Condition |
|---|---|
| SERVED | a trusted witness's latest observation for that URL has this hash; "still served as of" = that witness's latest `run_at` |
| REPLACED | this hash was seen, and the witness's latest observation for that URL is `changed` |
| REMOVED | this hash was seen, and the latest observation is `gone` |
| NOT SEEN | no trusted witness has this hash; this does **not** mean the file is fake |

## Kept off Arkiv on purpose
The PDFs themselves (the user already has the file; copies for judges are in `public/samples/`), any page containing personal names (we never witness result or merit lists), and all private keys.

## Reproduce
1. Download from the live app: `samples/<official>.pdf`, `samples/notice-2-v1.pdf`, `samples/notice-3.pdf`, plus edit any byte of a PDF.
2. Verify page → SERVED / REPLACED / REMOVED / NOT SEEN.
3. `npx tsx scripts/verify.ts public/samples/<file>.pdf` gives the same verdict, reading the public RPC directly.
4. Explorer: each witness address → its `executeBatch` transactions.
