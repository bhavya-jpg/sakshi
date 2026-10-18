# Sakshi: track answers (Devfolio)

Tracks: **Best Indian Use Case** · **Censorship Resistance** · **Security** · **Open Source**

Live app: https://bhavya-jpg.github.io/sakshi/ · Repo: https://github.com/bhavya-jpg/sakshi

---

## 🇮🇳 Best Indian Use Case

### What India-specific problem are we solving?

Millions of Indians apply for central and state government recruitment, entrance exams and scholarships. In practice they get the notices as **PDFs forwarded through WhatsApp groups, Telegram channels and coaching networks**, and they act on them: they pay fees, travel, and plan around deadlines. Three things make this risky:

- Official notice pages are often **silently replaced**: a corrigendum moves a deadline at the same URL, and the old file is gone.
- Notices get **withdrawn, or the site is down** right when a candidate needs to check.
- Forwarded copies are hard to trust, and **the public archive people would use to check has itself been blocked in India**: the Wayback Machine, in 2017 ([The Wire](https://thewire.in/tech/access-internet-archives-wayback-machine-blocked)).

A candidate holding a forwarded PDF has no simple way to answer: *"Is this exactly the file the board published, and is it still current?"*

### Why is our approach especially relevant here?

- **It works on the file people actually have.** Drop the forwarded PDF in and it's hashed on the phone itself. Nothing is uploaded, and no login or app install is needed. It's a web page that works in any phone browser.
- **The answers fit how notices change in India:** *Served*, *Replaced* (a corrigendum or edit), *Removed* (withdrawn) or *No matching record*. They're shown in **English and Hindi** (उपलब्ध · बदला गया · हटाया गया · कोई रिकॉर्ड नहीं).
- **It never calls a genuine document fake.** "No matching record" is explicitly not proof of forgery. That matters when a wrong "fake" label can make a candidate miss a real deadline.
- **No government body has to adopt anything.** Independent witnesses watch the public URLs; the publisher doesn't need to change.
- **It survives blocking and takedowns:** there's no Sakshi server, and the record lives on Arkiv.

> *Status, stated honestly:* the live demo uses a clearly labelled synthetic notice board. Witnessing real government notice URLs is the next step and uses the same witness CLI.

---

## 🛡️ Censorship Resistance

### What information, servers or access are we making harder to suppress?

1. **The record of what a public notice said.** When a page is silently edited or a file withdrawn, the evidence of the earlier version normally disappears with it. Sakshi's witnesses write readonly observations to Arkiv recording *which exact file this URL served, when, and when it changed or vanished*. Deleting or editing the website doesn't remove that record, and we can't edit it either.
2. **Dependence on any single archive or server.** India has blocked the Wayback Machine before, and a single archive is a single point of failure. Sakshi has **no backend at all**:
   - the website is static files, and the browser queries the public Arkiv RPC directly;
   - if our site is blocked or taken down, the **CLI verifies straight from the RPC** without it (`npx tsx scripts/verify.ts file.pdf`);
   - [`/arkiv/schema.md`](../arkiv/schema.md) documents everything needed to rebuild a reader from scratch.
3. **Who gets to be a witness.** No one has to ask us for permission. Anyone can run `scripts/witness.ts` with their own wallet and write observations, and readers choose whom to trust. Because entities are created with `permissionlessExtension`, **anyone can keep an important record alive** by extending its lifetime, not just its creator.
4. **Access to the check itself.** Verification needs no account and no upload. The file never leaves the user's device, so checking a document isn't something that can be logged or gated.

---

## 🔐 Security

### What could go wrong if the system were compromised, and how does Sakshi reduce that risk?

| Threat | What could go wrong | How Sakshi reduces it |
|---|---|---|
| **Fake witness records** | Someone writes records claiming a fake PDF came from an official domain. | Trust comes only from the **immutable on-chain `$creator`**. Results count only witness wallets the reader trusts; untrusted records are shown as *ignored*, and a self-declared `domain` attribute or label is never trusted. |
| **A compromised witness** | A witness key is stolen and used to add false claims. | Records are **readonly**, so the attacker can add claims but **cannot rewrite or delete history**. Readers untick that witness and every verdict is recomputed instantly, with no new queries. Each run is one atomic batch, so partial runs can't land. |
| **A compromised or malicious website or operator** | The site is hacked to show false verdicts, or we try to quietly edit the past. | There is **no backend and no write path in the site**, which holds no keys. Anyone can check the same verdict independently with the CLI against the public RPC, and records on Arkiv can't be edited by us. |
| **Privacy leak** | Uploading a sensitive document to a verification service exposes it. | Files are **hashed on the device** with Web Crypto, and only the SHA-256 is sent in a public query. No personal data is stored on Arkiv, plaintext or hashed. |
| **False certainty** | A user treats "no record" as proof of forgery, or a hash as proof of intent. | The verdicts are deliberately limited: *No matching record* is labelled as **not** evidence of a fake, and *Replaced* proves only that the files differ. The limits are documented in the README. |
| **Key leakage** | Witness keys end up in the code or the browser. | Keys live only in local, gitignored files used by the CLI. The scan before every commit found no keys in Git history, and `fund.ts` defaults to a dry run with chain and amount checks. |

> **Known limits, stated plainly:** there's no TLS proof that a witness fetched honestly, and Sakshi can't detect a compromised source website. Both are shown in the UI and the docs, not hidden.

---

## 🌐 Open Source

### Why should this be open?

A witness archive is only trustworthy if **anyone can check how verdicts are reached, run their own witness, and verify without trusting us**. A closed verifier would just be another authority asking to be believed, which is the problem Sakshi exists to remove. Sakshi is **MIT-licensed**, and the record it reads is public on Arkiv.

### What can others build, verify or improve because of it?

- **Run independent witnesses.** Newsrooms, civil-society groups, coaching institutes or individuals can run `scripts/witness.ts` with their own keys over the URLs they care about. That turns "two identities run by one team" into genuinely independent witnesses.
- **Build their own readers.** [`/arkiv/schema.md`](../arkiv/schema.md) is a complete data contract (entity types, typed attributes, expiration rules and the exact queries), so anyone can build a Telegram bot, a browser extension or a newsroom dashboard on the same records.
- **Verify every claim.** The verdict logic is a small pure function ([`src/lib/verdict.ts`](../src/lib/verdict.ts)) with 33 unit tests. The demo PDFs are deterministic and their hashes are pinned in tests. Every transaction is public on the [Tiramisu explorer](https://tiramisu.explorer.arkiv.network).
- **Improve it:** add TLS proofs (zkTLS or TLSNotary) so witnesses prove what they fetched, add more witnesses, watch real notice URLs, translate into more Indian languages, or extend the schema to other public documents such as tenders and court cause lists.
- **Learn from it.** The [friction report](../arkiv/friction.md) documents exactly what we hit building on Arkiv, with versions and repro steps.
