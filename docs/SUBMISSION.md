# Sakshi: Devfolio submission pack

Every value below is real and was checked on 19 Oct 2026 (IST). Nothing here describes unbuilt work.

## Gate checklist
- [x] Live app, no login: https://bhavya-jpg.github.io/sakshi/ (GitHub Pages, static; the browser reads Tiramisu directly)
- [x] Public repo, MIT `LICENSE`, README with setup + reproduction: https://github.com/bhavya-jpg/sakshi
- [x] `/arkiv/schema.md`: entity types, attributes, expiration, queries, wallets, transactions
- [x] `/arkiv/friction.md`: real issues with versions and repro steps
- [x] Wallet addresses that create entities (below)
- [ ] Demo video ≤ 3:00 (script below)
- [ ] Devfolio form, tracks, declarations
- Entities use `fromDays(30)` and outlive judging (23 Oct)
- No personal data on Arkiv; the demo board is synthetic and labelled

## Standard fields
- **Name:** Sakshi (साक्षी, "witness")
- **Tagline:** Proof of what a notice page actually published: check a forwarded PDF against public witness records on Arkiv.
- **The problem it solves:** Indian job and exam candidates act on notice PDFs forwarded through WhatsApp and Telegram. "Check the official site" fails when the page has been silently edited, the file was withdrawn, or the site is down, and the main public archive (the Wayback Machine) has been blocked in India before (Aug 2017). Sakshi lets anyone check, without trusting a server, whether a witness they trust recorded that exact file at that URL, when it was first seen, and whether the URL later changed or stopped serving it. It never calls a document fake.
- **Challenges I ran into:** (1) The Hub faucet page crashed on load (`invalid border=0`, from a QR component), so no GLM could be claimed for almost three hours; root cause and repro in friction.md #1. (2) Browser QA exhausted our per-IP `arkiv_query` budget (`limit=10000, remaining=0, reset=1079`); we cut the landing page from about 18 queries to 2, project query fields, cache for 2 minutes, and recompute trust toggles locally (friction.md #11). (3) Lifetime Extension reverts when the new expiry isn't later, which would fail a whole batch; the witness only extends when the new expiry is later.

## Organizer questions

**1. Live app URL:** https://bhavya-jpg.github.io/sakshi/

**2. Indian nationality:** Yes.

**3. Why Arkiv?**
The product is a record of "wallet W saw URL U serve file H at time T" that the operator cannot quietly edit, that outlives the website it describes, and that anyone can query without us.
- **Postgres or our own API:** we could backdate, edit or delete observations, and readers would have to trust our server. Sakshi has no server: the site is static files and the browser queries the Tiramisu RPC.
- **IPFS:** stores files but gives no queryable index of "every witness that saw this hash" or "this URL's history".
- **A subgraph:** needs contracts and indexing infrastructure for what are plain typed records.
- **What we rely on from Arkiv:** the immutable `$creator` (trust is per wallet and can't be faked by an attribute); typed attribute queries (`bytes32` hash equality, `u64` times) from any browser or CLI; `readonly` creation so a witness can't revise history; Entity Expiration with Lifetime Extension so re-confirmed records stay alive; `executeBatch` so a witness run lands whole or not at all.
- **Kept off Arkiv:** the PDFs themselves, any personal data, all keys.

**4. How do you use Arkiv?**
- **Typed attributes vs payload:** `doc_sha256`, `url_key`, `prev_sha256` as `bytes32`; `fetched_at`, `run_at` as `u64`; `kind`, `domain`, `source_tier` as `str`. The URL and HTTP metadata live in the payload (URLs exceed the 128-byte `str` limit). → `src/lib/schema.ts`
- **Queries:** `eq(project) + eq(entity_type) + eq("doc_sha256", bytes32(h))` to verify a file; `eq(url_key)` (+ `createdBy`) for a URL timeline; runs per project filtered to configured witnesses; field projection via `select({...})`. → `src/lib/arkiv.ts`
- **`$creator` as the trust anchor:** verdicts count distinct creator addresses the reader trusts; untrusted records are shown as ignored. → `src/lib/verdict.ts`, `src/lib/service.ts`
- **Creation flags:** every entity is `readonly` and `permissionlessExtension`. → `scripts/witness.ts`
- **Batch writes + Lifetime Extension:** one `executeBatch` per witness run (new observations + run summary + extensions of re-confirmed records). Run 2 extended notice 1's record in the same transaction. → `scripts/witness.ts`
- **Browser reads, no backend:** the static site uses the SDK public client directly (no WASM on the read path; RPC CORS is `*`). → `src/components/Verify.tsx`

**5. Friction report:** https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/friction.md

**6. Wallet addresses**
- Witness A `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`: creates `observation` and `run` entities; ran the preflight test; funded Witness B.
- Witness B `0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA`: creates `observation` and `run` entities.
- A and B are distinct witness identities (separate keys and wallets), operated by the same team. They are not independent organisations.

**7. Schema:** https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/schema.md

**8. How judges can reproduce**
1. Open https://bhavya-jpg.github.io/sakshi/verify/ and click **Examine** next to each specimen:
   - `demo-notice-1-v1.pdf` → **Served**, 2 witnesses (A and B)
   - `demo-notice-2-v1.pdf` → **Replaced** (the demo board moved its deadline)
   - `demo-notice-2-v2.pdf` → **Served**
   - `demo-notice-3-v1.pdf` → **Removed** (the URL now returns 404)
2. Untick Witness B: notice 1 drops to 1 witness, and B's record is listed as ignored. Untick both: **No matching record**, "not evidence that the document is fake".
3. Edit any byte of a PDF and drop it in: **No matching record**.
4. Open **Timeline** with `https://bhavya-jpg.github.io/sakshi/board/notice-2.pdf`: seen → changed, with entity keys and blocks.
5. Without the website: `git clone https://github.com/bhavya-jpg/sakshi && cd sakshi && npm i && npx tsx scripts/verify.ts public/samples/demo-notice-2-v1.pdf` (public RPC, no key).
6. Explorer: the transactions listed in `/arkiv/schema.md`.

**9. Pre-existing work:** None. Built 18–19 Oct 2026 from `create-next-app` boilerplate and npm libraries (`@arkiv-network/sdk@0.8.1`, `viem`, `pdf-lib`, Next.js, Tailwind).

**10. Surfaces used:** TypeScript SDK, Docs, Block Explorer. (The Hub faucet was attempted but crashed; see friction.md #1.)

**12. First entity:** 2 to 24 hours (started 21:28 IST, first entity 00:15:29 IST; nearly all of the gap was waiting for funds).

**13. LLMs:** Claude (Claude Code).

**14. One thing to improve first:** Reliable funding and documented quotas: the faucet is the only documented way to get test GLM and it crashed on render while the status page showed 100% uptime; and the per-IP `arkiv_query` budget and per-query cost are not documented.

## On-chain evidence (Tiramisu, chain 7738577)
| What | Transaction |
|---|---|
| Preflight: first entity | `0xb3aaa9a9aa20b04b1617e1337e244899060a9f6f16c6861c481e5e757efb4f04` |
| Preflight: batch create + extension | `0x20db0619dbac00452b4e795bc6bb9efad11d9f9ee6e4b920b95b6a96639d4d5b` |
| Witness A run 1 (3 × seen + run) | `0x7707c7e1c68b65127c5d46b2225be787a19a7faef5af88c1b12fc2f2eec51745` |
| Witness A run 2 (changed + gone + run + extension) | `0x6969dab4b65b72853304c36fe7679007cd5f2c4aa5bdc06ff9e24342232fc519` |
| Fund Witness B (0.01 GLM from A) | `0x8ef2278c768cfdaf7ab20a9394f36fb66cda66115af2be88ad3cc1d4bc9fbe85` |
| Witness B run 1 (seen notice 1 + run) | `0xbab0f4599b2afc706e640e519d9921d6b9259a88421e17f8c447277f160a9d4f` |

## Tests that passed
- `scripts/preflight.ts`: 17/17 checks on Tiramisu (19 Oct 00:15 IST): create, receipt, read-back, creator, payload, typed attributes, flags, `bytes32` equality query, `u64` range + `createdBy` query, negative `createdBy`, batch create + extension, `expiresAt` increase.
- `npm test`: 33 unit tests (verdict logic; pinned demo-PDF hashes; distinct-witness counting, trust toggles, verdict consistency across code paths, single-witness compatibility).
- Live checks on the deployed site: all four specimen verdicts; A+B → 2 witnesses; untrusting B → 1 witness, 1 ignored; no-one trusted → no match; toggles issue no extra queries.

## Limitations (stated plainly)
- Both witness identities are run by the Sakshi team; distinct wallets are not independent organisations.
- No TLS proof: a record shows what a witness committed to, not that it fetched honestly.
- Only the synthetic demo board is witnessed; no real government PDF is in the record.
- Verifying a file needs its exact bytes; re-saved or compressed copies give "No matching record".
- The public RPC meters queries per IP; heavy use from one network can be rate-limited for minutes.
- The landing page reads all `run` entities in the project and filters locally; a flood of more than 2,000 fake runs could hide real ones from that page (verdicts on `/verify/` are unaffected).

## Per-track answers
**Why India.** Recruitment, exam and scholarship candidates receive notices as forwarded PDFs and act on them. Sakshi gives them a bilingual (English and Hindi) verdict on whether that exact file was served by the official URL, without trusting our server and without uploading the file.

**Why Censorship Resistance.** The record lives on Arkiv and is read directly by the browser or by `scripts/verify.ts`; there is no Sakshi backend to take down, and the schema is enough to rebuild the reader.

**Why Security.** Verdicts count only records whose immutable `$creator` the reader trusts; a record that merely claims an official domain is ignored. Records are readonly, so a compromised witness can add claims but cannot rewrite history, and readers can untick it.

**Why Open Source.** MIT-licensed; `/arkiv/schema.md` is a data contract, so anyone can run `scripts/witness.ts` with their own key as another witness, or build their own reader.

## Demo video (≤ 3:00)
| Time | Shot | Say |
|---|---|---|
| 0:00–0:15 | Landing hero | "Candidates act on forwarded notice PDFs. Pages change and vanish. Sakshi checks a file against public witness records on Arkiv." |
| 0:15–0:35 | Demo board (labelled), then the flow diagram | "Witnesses fetch notice URLs, hash the bytes and write readonly records to Arkiv in one batch per run. This board is synthetic: we edited one notice and withdrew another." |
| 0:35–1:20 | /verify/: Examine notice 1, 2-v1, 2-v2, 3 | "Served, by two witness identities. Replaced. Served. Removed. The file never leaves the browser; only its SHA-256 is queried." |
| 1:20–1:40 | Untick B, then A | "Trust comes from the wallet that created each record. Untick B: one witness, B ignored. Untick both: no matching record, which is not evidence of a fake." |
| 1:40–2:05 | Timeline for notice-2 | "Seen, then changed: the old hash struck through, entity keys and blocks." |
| 2:05–2:35 | Terminal: `npx tsx scripts/verify.ts public/samples/demo-notice-2-v1.pdf`, then the explorer tx | "The same answer from the public RPC, without our site. Here is the witness batch on the explorer." |
| 2:35–2:50 | Repo + schema.md | "Open source, MIT, and the schema is the contract: anyone can run another witness." |
