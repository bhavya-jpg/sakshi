# Sakshi (साक्षी): an independent witness for public notices

Recruitment and exam candidates in India act on notice PDFs forwarded through WhatsApp and Telegram. Official pages change, remove files, or become unreachable. Sakshi **witnesses** fetch notice PDFs from their URLs and record on [Arkiv](https://arkiv.network), the Web3 database, *"at time T, URL U served a file with SHA-256 H"*, plus when that URL later **changed** or went **gone**.

Anyone can drop a PDF into the web app and see whether a witness they trust recorded that exact file, where, and when. **A missing record is never presented as proof that a document is fake.**

- **Live app:** https://bhavya-jpg.github.io/sakshi/ (a static site; your browser queries the public Tiramisu RPC directly, with no Sakshi server)
- **Schema:** [`/arkiv/schema.md`](arkiv/schema.md) · **Friction report:** [`/arkiv/friction.md`](arkiv/friction.md)
- **Network:** Tiramisu testnet (chain id 7738577) · SDK `@arkiv-network/sdk@0.8.1`

> **Status (19 Oct 2026, 01:45 IST):** live on Tiramisu with **two witness identities**: A (`0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`, two runs against the demo board) and B (`0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA`, one run, notice 1). They are separate keys and wallets operated by the same team, not independent organisations. The live site returns Served / Replaced / Removed / No matching record for the sample files, and notice 1 shows **2 witnesses** until you untick one. Transactions and entity keys are in [`/arkiv/schema.md`](arkiv/schema.md#on-chain-evidence-tiramisu). The board currently serves **phase 2**.

## What is where
| Path | What |
|---|---|
| `src/lib/schema.ts` | attribute builders and decoders (the data contract) |
| `src/lib/arkiv.ts` | read-only public client and queries Q1 to Q3 |
| `src/lib/verdict.ts` | pure verdict logic (SERVED / REPLACED / REMOVED / no matching record), unit-tested in `tests/` |
| `src/app/*` | web app: verify page, URL timeline, demo board, how it works |
| `scripts/preflight.ts` | Arkiv integration test: create, confirm, read back, query, check creator and payload, batch with extension |
| `scripts/witness.ts` | witness CLI: one atomic `executeBatch` per run |
| `scripts/verify.ts` | read-only verifier that needs no website and no key |
| `scripts/make-board.ts` | generates the synthetic DEMO board PDFs (deterministic bytes) |

## Setup
Requires Node 22+.
```bash
git clone https://github.com/bhavya-jpg/sakshi && cd sakshi
npm install
npm test                 # verdict unit tests
npm run dev              # web app at http://localhost:3000 (read-only, no keys)
```

### Verify a PDF without the website
```bash
npx tsx scripts/verify.ts public/samples/demo-notice-2-v1.pdf
npx tsx scripts/verify.ts some.pdf --trust 0xWitnessA,0xWitnessB
```

### Run a witness (writes to Arkiv)
```bash
cp .env.example .env     # put a funded Tiramisu key in WITNESS_A_PRIVATE_KEY (never commit .env)
npx tsx scripts/preflight.ts                 # integration test
npx tsx scripts/witness.ts --dry-run         # fetch + diff, print the batch, write nothing
npx tsx scripts/witness.ts                   # one witness pass over sources.json
npx tsx scripts/fund.ts --to 0xNewWitness    # dry run: sender, recipient, chain, amount, gas
npx tsx scripts/fund.ts --to 0xNewWitness --amount 0.01 --send
```
A second witness keeps its key in its own gitignored file and is selected with `--key-env`:
```bash
(set -a; . ./.env.witness-b; set +a; npx tsx scripts/witness.ts --key-env WITNESS_B_PRIVATE_KEY --label "Sakshi witness B")
```
Keys are only ever read by the CLI on your machine. The web app has no write path.

## Reproduce the demo (mock board)
The demo board at `/board/` serves **synthetic, clearly labelled** notices at stable URLs (`/board/notice-1.pdf` … `notice-3.pdf`). The build-time variable `NEXT_PUBLIC_BOARD_PHASE` selects what those URLs serve:
- **Phase 1:** notices 1 to 3 as first published (`public/board-files/v1/`)
- **Phase 2:** notice 2's last date silently moved from 30 Nov to 05 Nov, and notice 3 removed, so it returns 404 (`public/board-files/v2/`)

Steps:
1. Deploy with phase 1 and run `npx tsx scripts/witness.ts` → three `seen` observations and one `run`, in one transaction.
2. Set the repo variable `BOARD_PHASE=2` (`gh variable set BOARD_PHASE --body 2`), redeploy, and run the witness again → `changed` for notice 2, `gone` for notice 3, an extension for notice 1, and one `run`.
3. On `/verify/`, click **Examine** next to each specimen (or drop the file from `public/samples/`):
   - `demo-notice-1-v1.pdf` → **Served**
   - `demo-notice-2-v1.pdf` → **Replaced**
   - `demo-notice-2-v2.pdf` → **Served**
   - `demo-notice-3-v1.pdf` → **Removed**
   - any edited PDF → **No matching record**

## License
MIT. See [LICENSE](LICENSE).
