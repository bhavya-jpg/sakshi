# Sakshi — Devfolio submission pack

Fill every `____` with real values. Never claim something that isn't deployed and working.

## Gate checklist (all ✅ before 03:50 IST; hard close 04:29 IST)
- [ ] Live URL opens in incognito on phone + desktop, no login
- [ ] Public repo, `LICENSE` = MIT, README with setup + reproduce steps + wallet table
- [ ] `/arkiv/schema.md` with real addresses + example entity keys + tx links
- [ ] `/arkiv/friction.md` filled from real preflight/build results; nothing invented
- [ ] Witness A, Witness B, Pinner addresses on the form (Q6)
- [ ] All entities expire after 23 Oct (min 30 days); check one on the explorer
- [ ] No witnessed page contains personal names
- [ ] `git log -p | grep -iE "private_key|0x[0-9a-f]{64}"` shows no secrets
- [ ] Video ≤ 3:00, link works logged-out
- [ ] Tracks: Best Indian Use Case, Censorship Resistance, Security, Open Source
- [ ] Indian nationality declared · Pre-existing work: "None" · both declarations ticked
- [ ] Final commit before 04:29 IST; no force-push after; Vercel stays up until 23 Oct

## Standard fields
- **Name:** Sakshi
- **Tagline:** An independent witness of what official notice pages actually served, recorded on Arkiv so anyone can check a forwarded PDF, even after the page changes, disappears or is blocked.
- **The problem it solves:** Indian job and exam candidates act on notice PDFs forwarded through WhatsApp and Telegram, and fraudsters run lookalike portals: police shut down a clone of the HSSC CET 2025 registration site that had taken fees from candidates (Tribune, June 2025), and the Labour Ministry warned in Sept 2025 about fake sites taking job applications in its name. The advice is "check the official site", but official pages change and vanish, and even the government's own fact-check arm once called a genuine IB recruitment ad fake (Alt News, Dec 2020). The public record of what a site said can itself be blocked: India blocked the Wayback Machine in Aug 2017. Sakshi gives candidates a check that needs nobody's permission: was this exact file served by the official URL, when, and is it still?
- **Challenges I ran into:** ____ (2–3 real items from friction.md)

## Organizer questions

**1. Live app URL:** https://____.vercel.app

**2. Indian nationality:** Yes.

**3. Why Arkiv?**
Sakshi's value is a record of "URL U served file H at time T" that nobody can quietly rewrite and that outlives the website it describes.
- **Postgres or our own API:** the operator (us) could backdate, edit or delete observations, and the record disappears if we do. Readers would have to trust us.
- **Signed JSON in a repo:** the closest alternative, but a witness can backdate its own signature. On Arkiv the block timestamp bounds when the witness committed, and there's no server to take down.
- **Wayback Machine:** one operator, honours takedowns, and was blocked in India in 2017.
- **IPFS:** stores files but gives no queryable index of "every witness that saw this hash" or "this URL's history by witnesses I trust".

What we rely on from Arkiv:
1. The immutable `$creator`, so a reader trusts specific witnesses and can't be fooled by a record that merely claims a domain.
2. Typed attribute queries any browser or CLI can run against the public RPC.
3. Entity Expiration plus Lifetime Extension, so records stay alive while a witness keeps re-confirming them, fade when they stop, and can be pinned by anyone.
4. Readonly creation, so a witness can't revise what it said it saw.

Deliberately off Arkiv: the PDFs themselves, any page with personal names, all keys.

**4. How do you use Arkiv?** (link each to code)
- **Attributes vs payload:** everything we match or range over is a typed attribute (`doc_sha256`, `url_key` as bytes32; `fetched_at` as u64; `kind`, `domain`, `source_tier` as strings). The full URL and HTTP metadata live in the payload because URLs exceed the 128-byte string limit. → `src/lib/schema.ts`
- **Queries:** compound `eq` on hash + project + type; `createdBy(witness)` for a URL's timeline; `gte(fetched_at)` for recent changes (stretch). → `src/lib/queries.ts`
- **`$creator`:** the reader picks trusted witnesses and the verdict only counts their records. Toggling a witness off changes the verdict on screen. → `src/lib/verdict.ts`
- **Entity Expiration + Lifetime Extension:** 30-day observations; each run that re-confirms the same file extends the current record (a lease renewed by activity), so stale claims expire on their own. → `scripts/witness.ts`
- **Creation flags:** `readonly` (a witness can't edit history) and `permissionlessExtension` (a third party can pin a record before a dispute). → `scripts/pin.ts`
- **Batch writes:** one witness run = one `executeBatch` (new observations + the run summary + extensions), so a run lands whole or not at all.
- **(if built) WebSocket events:** `watchEntityEvents` on a WebSocket transport with no `fromBlock` drives a live feed.

**5. Friction report:** https://github.com/____/sakshi/blob/main/arkiv/friction.md

**6. Wallet addresses**
- Witness A: 0x____ (creates observations and run summaries)
- Witness B: 0x____ (second witness; same operator, separate key and run, disclosed)
- Pinner: 0x____ (extends records it doesn't own)

**7. Schema:** https://github.com/____/sakshi/blob/main/arkiv/schema.md

**8. How judges can reproduce**
1. Open the live app → "Try it" → download `samples/<official>.pdf`, `samples/notice-2-v1.pdf`, `samples/notice-3.pdf`.
2. Drop each into Verify → **SERVED** (official URL, first seen, still served as of the last run, 2 witnesses) · **REPLACED** (demo board changed it) · **REMOVED** (demo board deleted it).
3. Change any byte of a PDF and drop it in → **NOT SEEN** (shown as "not proof of forgery").
4. Untick Witness B → the witness count drops; untick both → NOT SEEN. Trust comes from `$creator`.
5. Open a result → "View on explorer" → the witness's `executeBatch` transaction.
6. Without our site: `git clone … && npm i && npx tsx scripts/verify.ts public/samples/<file>.pdf` (public RPC only, no key).
Exact queries: `/arkiv/schema.md` → Q1–Q3.

**9. Pre-existing work:** None. Built on 18 Oct 2026 from `create-next-app` boilerplate and npm libraries (`@arkiv-network/sdk`, `viem`, `pdf-lib`, Next.js, Tailwind).

**10. Surfaces used:** TypeScript SDK, Docs, Hub, Faucet, Block Explorer ____ (+ WebSocket events if built)

**12. First entity:** ____ (from friction.md item 5)

**13. LLMs:** Claude (claude.ai + Claude Code)

**14. One thing to improve first:** ____

## Per-track answers

**Why India.** Users are candidates for central and state recruitment, entrance exams and scholarships, who get notices through WhatsApp groups, coaching channels and Telegram, and the journalists and lawyers who handle disputes about them. It works for them today: real official notice PDFs are already witnessed in the demo, and a candidate on a phone gets a Hindi/English verdict on whether the exact file they received was served by the official URL. No department has to adopt anything.

**Why Censorship Resistance.** Who is harmed: candidates whose official notice is silently edited, removed, or unreachable on deadline day, and anyone who needs to prove what a page said after it is gone. In India, the main public archive (the Wayback Machine) was blocked in 2017. Sakshi's records are read straight from the public Tiramisu RPC by the browser or by `scripts/verify.ts`, with no Sakshi backend, and the schema is enough to rebuild the reader.

**Why Security.** The verdict only counts observations whose on-chain `$creator` is a witness the reader trusts. A record that merely claims `domain=ssc.gov.in` from an unknown wallet is ignored. Records are readonly, so a compromised witness can add false claims but can't rewrite the history it already committed, and readers can drop that witness.

**Why Open Source.** `/arkiv/schema.md` is a data contract: anyone can run `scripts/witness.ts` with their own key to add an independent witness, or build their own reader, without asking us. MIT-licensed.

## Video script (≤ 2:50)
| Time | Shot | Voice-over |
|---|---|---|
| 0:00–0:20 | Forwarded "official notice" PDF in a chat | "Candidates act on PDFs like this. The advice is 'check the official site'. But official pages change, vanish, and archives get blocked; India blocked the Wayback Machine in 2017." |
| 0:20–0:45 | Witness run in terminal → explorer tx | "Sakshi witnesses fetch notice PDFs from official URLs and record on Arkiv, the Web3 database, exactly which file each URL served and when, all in one batch transaction per run." |
| 0:45–1:10 | Drop the real PDF → SERVED | "This file was served by the official URL, first seen at this block, still served as of the last run, seen by two witnesses." |
| 1:10–1:40 | Demo board (labelled) → notice-2-v1 → REPLACED; notice-3 → REMOVED | "On our labelled demo board we changed a deadline and deleted a notice. The old file is still provably what was served, and when it stopped." |
| 1:40–2:00 | Edited PDF → NOT SEEN | "Change one byte and no witness has seen it. We don't call it fake, we tell you what we can prove." |
| 2:00–2:20 | Untick witnesses → count changes | "You choose which witnesses to trust. Trust comes from the wallet that created each record, which no one can fake." |
| 2:20–2:40 | `pin.ts`, then terminal `verify.ts` | "Anyone can pin a record before a dispute. And if this site goes down, verification still works straight from the public network." |
| 2:40–2:50 | URL + repo | "Sakshi. A witness that can't be taken down." |

## Sources for the claims above
- Tribune, fake HSSC website (Jun 2025): https://www.tribuneindia.com/news/haryana/fake-hssc-website-busted-6-held/amp/
- Morung Express, Labour Ministry warning (Sep 2025): https://morungexpress.com/govt-warns-against-fake-websites-posting-jobs-receiving-applications
- Alt News, PIB / IB recruitment (Dec 2020): https://www.altnews.in/govt-fact-checks-its-own-fact-checking-arm-pib-on-false-news-about-ib-recruitment/
- The Wire, Wayback Machine blocked in India (Aug 2017): https://thewire.in/tech/access-internet-archives-wayback-machine-blocked
