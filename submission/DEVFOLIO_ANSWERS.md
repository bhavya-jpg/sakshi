# Devfolio answers: Sakshi

Field names follow the official checklist (`docs/submission-checklist.md` in Arkiv-Network/global-tour-stop-pre-devcon). Character limits are not published; check each field's limit in the form and trim if needed. Every fact below was verified on 19 Oct 2026 (IST).

---

## Standard fields

**Project name**
Sakshi

**Tagline**
Proof of what a notice page actually published: check a forwarded PDF against public witness records on Arkiv.

**Project media**
Upload `submission/video/sakshi_demo.mp4` frames or screenshots of the live app (homepage, a Served result, the timeline).

**Project links**
- Repo: https://github.com/bhavya-jpg/sakshi
- Live app: https://bhavya-jpg.github.io/sakshi/
- Demo video (≤ 3 min): **upload `submission/video/sakshi_demo.mp4` (2:45) to YouTube (Unlisted) or Google Drive (anyone with the link), then paste that link here.** Optionally attach `sakshi_demo.srt` as captions on YouTube.

**The problem it solves** \*
Indian recruitment, exam and scholarship candidates act on notice PDFs forwarded through WhatsApp and Telegram. "Check the official site" fails when a page has been silently edited, a file withdrawn, or a site is down, and the main public web archive (the Wayback Machine) was blocked in India in 2017. Sakshi lets anyone check, without trusting our server and without uploading the file, whether a witness they trust recorded that exact file at a URL, when it was first seen, and whether the URL later changed or stopped serving it. It never calls a document fake: no record means only that no trusted witness recorded it.

**Challenges I ran into** \*
1. The Arkiv Hub faucet page crashed on load (`Uncaught Error: invalid border=0` from a QR component), so we could not get test GLM for almost three hours. Funds were sent to us directly in the end. Root cause and repro are in friction.md #1.
2. Browser QA exhausted our per-IP `arkiv_query` budget (`limit=10000, remaining=0, reset=1079`). We cut the landing page from about 18 queries to 2, select only the fields we read, cache for 2 minutes, and recompute trust toggles locally without re-querying (friction.md #11).
3. Lifetime Extension reverts if the new expiry isn't later, which would fail a whole batch, so the witness only extends when it is.

**Tracks**: see the track section below.

---

## Organizer questions

**1. Live app URL** \*
https://bhavya-jpg.github.io/sakshi/

**2. Does any team member hold Indian nationality?** \*
Yes.

**3. Why Arkiv?** \*
Sakshi's product is a record of "wallet W saw URL U serve file H at time T" that we, the operators, cannot quietly edit, that outlives the website it describes, and that anyone can query without us.
- **Postgres or our own API:** we could backdate, edit or delete observations, and readers would have to trust our server. Sakshi has no server: the site is static files and the browser queries the Tiramisu RPC directly.
- **IPFS:** stores files but gives no queryable index of "every witness that saw this hash" or "this URL's history".
- **A subgraph:** needs contracts and indexing infrastructure for what are plain typed records.
- **What only Arkiv gives us here:** the immutable `$creator` as the trust anchor; typed attribute queries (`bytes32` hash equality, `u64` times) from any browser or CLI; `readonly` creation so a witness can't revise history; Entity Expiration with Lifetime Extension so re-confirmed records stay alive; `executeBatch` so a witness run lands whole or not at all.

Kept off Arkiv: the PDFs themselves, all personal data, all keys.

**4. How do you use Arkiv?** \*
- **Typed attributes vs payload:** `doc_sha256`, `url_key`, `prev_sha256` as `bytes32`; `fetched_at`, `run_at` as `u64`; `kind`, `domain`, `source_tier` as `str`. The URL and HTTP metadata live in the payload (URLs exceed the 128-byte `str` limit). https://github.com/bhavya-jpg/sakshi/blob/main/src/lib/schema.ts
- **Queries:** `eq(project) + eq(entity_type) + eq("doc_sha256", bytes32(h))` to verify a file; `eq(url_key)` (+ `createdBy`) for a URL's timeline; runs filtered to configured witnesses; field projection with `select({...})`. https://github.com/bhavya-jpg/sakshi/blob/main/src/lib/arkiv.ts
- **`$creator` as the trust anchor:** verdicts count distinct creator addresses the reader trusts; others are shown as ignored. https://github.com/bhavya-jpg/sakshi/blob/main/src/lib/verdict.ts and https://github.com/bhavya-jpg/sakshi/blob/main/src/lib/service.ts
- **Creation flags:** every entity is `readonly` and `permissionlessExtension`. https://github.com/bhavya-jpg/sakshi/blob/main/scripts/witness.ts
- **Batch writes + Lifetime Extension:** one `executeBatch` per witness run (new observations + run summary + extensions of re-confirmed records). Run 2 extended notice 1's record in the same transaction. https://github.com/bhavya-jpg/sakshi/blob/main/scripts/witness.ts
- **Browser reads, no backend:** the static site uses the SDK public client directly. https://github.com/bhavya-jpg/sakshi/blob/main/src/components/Verify.tsx

**5. Friction report: link to `/arkiv/friction.md`** \*
https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/friction.md

**6. Wallet addresses that create your Arkiv entities** \*
- `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`: Witness A. Creates `observation` and `run` entities; ran the preflight test; funded Witness B.
- `0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA`: Witness B. Creates `observation` and `run` entities (one run so far, notice 1).
- A and B are distinct witness identities (separate keys and wallets) operated by the same team. They are not independent organisations.

**7. Link to `/arkiv/schema.md`** \*
https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/schema.md

**8. How can judges reproduce your Arkiv usage?** \*
1. Open https://bhavya-jpg.github.io/sakshi/verify/ and click **Examine** on each specimen: `demo-notice-1-v1.pdf` → Served (2 witnesses); `demo-notice-2-v1.pdf` → Replaced; `demo-notice-2-v2.pdf` → Served; `demo-notice-3-v1.pdf` → Removed.
2. Untick Witness B: notice 1 drops to 1 witness and B's record is listed as ignored. Untick both: No matching record ("not evidence that the document is fake").
3. Change any byte of a PDF and drop it in: No matching record.
4. Timeline: https://bhavya-jpg.github.io/sakshi/timeline/?u=https%3A%2F%2Fbhavya-jpg.github.io%2Fsakshi%2Fboard%2Fnotice-2.pdf shows seen → changed, with entity keys and blocks.
5. Without our site: `git clone https://github.com/bhavya-jpg/sakshi && cd sakshi && npm i && npx tsx scripts/verify.ts public/samples/demo-notice-2-v1.pdf` (public RPC, no key).
6. The exact queries are in `/arkiv/schema.md` (Q1–Q3); the transactions are listed there and below.

**9. Pre-existing work you reused** \*
None. Built 18–19 Oct 2026 from `create-next-app` boilerplate and npm libraries (`@arkiv-network/sdk@0.8.1`, `viem`, `pdf-lib`, Next.js, Tailwind).

**10. Arkiv surfaces you used** \*
TypeScript SDK, Docs, Block Explorer. (The Hub faucet was attempted but crashed; we did not select "Faucet" as a working surface. Tick "Hub"/"Faucet" only if the form means "attempted".)

**11. If you selected Other, name it**
Not applicable.

**12. How long after you started did you write your first Arkiv entity?** \*
2 to 24 hours (started 21:28 IST; first entity 00:15:29 IST; almost all of the gap was waiting for test funds).

**13. Which LLMs did you use?** \*
Claude (via Claude Code).

**14. What is the one thing Arkiv should improve first?** \*
Reliable funding and documented quotas. The faucet is the only documented way to get test GLM; it crashed on render while the status page showed 100% uptime. And the per-IP `arkiv_query` budget and per-query cost (we observed `Arkiv-Cost: 100`) are not documented, so apps can't budget for them.

**15. Open to a 20-minute feedback call with the Arkiv team?** \*
**Submitter's choice.** (Suggested: Yes.)

**16. This is our team's work, built between 9 and 18 October. Any pre-existing or third-party work is disclosed.** \*
Tick after reading. All commits are dated 18 Oct 2026 UTC (before 22:59 UTC); third-party work = npm libraries and fonts listed above.

**17. Our repo is public under the MIT licence, and every link is accessible to judges.** \*
Tick. Verified: repo PUBLIC, LICENSE = MIT, all links above return HTTP 200.

**18. I plan to attend Devcon 8 in Mumbai** (optional)
Submitter's choice.

---

## Tracks (exact labels from the rules)

| Track | Recommend | Why it fits | Eligibility |
|---|---|---|---|
| **Best Indian Use Case** | Yes | Built for Indian recruitment, exam and scholarship candidates who receive notices as forwarded PDFs; bilingual (English and Hindi) verdicts. | Requires ≥1 team member of Indian nationality; KYC with that person. |
| **Censorship Resistance** | Yes | No backend to take down; records are read straight from the public RPC by the browser or the CLI; the schema is enough to rebuild the reader. | Open |
| **Security** | Yes | Trust only in the immutable `$creator`; records that merely claim an official domain are ignored; readonly records can't be rewritten. | Open |
| **Open Source** | Yes | MIT; `/arkiv/schema.md` is a data contract, so anyone can run another witness or reader. | Open |
| Privacy | No | Not a privacy product: all records are public; we only avoid storing personal data. | n/a |

One prize per team; entering several tracks is allowed.

**Why India.** Candidates for central and state recruitment, entrance exams and scholarships act on notices forwarded as PDFs. Sakshi gives a bilingual verdict on whether that exact file was served by the official URL, without trusting our server and without uploading the file.

**Why Censorship Resistance.** Who is harmed: candidates whose official notice is silently edited, removed, or unreachable, and anyone who must later prove what a page said. India blocked the Wayback Machine in 2017; a single archive is a single point of failure. Sakshi has no backend: the record lives on Arkiv and is read directly by the browser or `scripts/verify.ts`.

**Why Security.** Verdicts count only records whose immutable `$creator` the reader trusts; a record that claims an official domain from an unknown wallet is ignored, and the UI shows it as ignored. Records are readonly, so a compromised witness can add claims but cannot rewrite history, and readers can untick it.

**Why Open Source.** MIT-licensed. `/arkiv/schema.md` is the contract; `scripts/witness.ts` runs with anyone's key; `scripts/verify.ts` verifies without our site.

---

## On-chain evidence (Tiramisu, chain 7738577)
| What | Transaction |
|---|---|
| Preflight: first entity | `0xb3aaa9a9aa20b04b1617e1337e244899060a9f6f16c6861c481e5e757efb4f04` |
| Preflight: batch create + extension | `0x20db0619dbac00452b4e795bc6bb9efad11d9f9ee6e4b920b95b6a96639d4d5b` |
| Witness A run 1 (3 × seen + run) | `0x7707c7e1c68b65127c5d46b2225be787a19a7faef5af88c1b12fc2f2eec51745` |
| Witness A run 2 (changed + gone + run + extension) | `0x6969dab4b65b72853304c36fe7679007cd5f2c4aa5bdc06ff9e24342232fc519` |
| Fund Witness B (0.01 GLM from A) | `0x8ef2278c768cfdaf7ab20a9394f36fb66cda66115af2be88ad3cc1d4bc9fbe85` |
| Witness B run 1 (seen notice 1 + run) | `0xbab0f4599b2afc706e640e519d9921d6b9259a88421e17f8c447277f160a9d4f` |

Explorer: `https://tiramisu.explorer.arkiv.network/tx/<hash>`

## Known limitations
- Both witness identities are run by the Sakshi team; distinct wallets are not independent organisations. Witness B has recorded notice 1 only.
- No TLS proof: a record shows what a witness committed to, not that it fetched honestly; it says nothing about whether the source site was compromised.
- A changed hash proves the files differ, not tampering or which version is authentic.
- Only the synthetic, labelled demo board is witnessed; no real government PDF is in the record.
- Verification needs the exact bytes; re-saved or compressed copies give "No matching record".
- The public RPC meters queries per IP; heavy use from one network can be rate-limited for minutes.
