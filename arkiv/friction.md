# Friction report: building Sakshi on Arkiv

Environment: `@arkiv-network/sdk@0.8.1` (pinned exactly), `viem@2.57.7`, Node 24.1.0, Next.js 15.5 (App Router, static export), macOS, Tiramisu testnet (chain 7738577). 18 Oct 2026 (IST).
Format per item: **surface · expected · actual · versions · repro · suggested fix**. Only issues we actually hit or verified are listed. Things that worked are recorded too.

---

## Blocking

### 1. Hub faucet page crashes on load: `Uncaught Error: invalid border=0`
- **Surface:** https://hub.arkiv.network/faucet (the only funding method the docs list, on the docs home, *Installation* and *Networks → Tiramisu* pages)
- **Expected:** the faucet form loads and we can claim test GLM for `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`.
- **Actual:** in Chrome, both normal and Incognito, the page shows "THIS PAGE COULDN'T LOAD" and the console reports `Uncaught Error: invalid border=0`. The server returns HTTP 200, and status.arkiv.network shows "Tiramisu Faucet 100% uptime", so uptime monitoring does not catch it.
- **Root cause (from the faucet's own public JS bundle, chunk `0fi4lasocw480.js`):** a QR-code component calls the QR encoder with `{border:0, ecc, scale:1, version}`, and the bundled encoder rejects any border ≤ 0: `if(!Number.isSafeInteger(u)||u<=0)throw Error(\`invalid border=${u}\`)`. The throw happens during render (inside a `useMemo`), so React unmounts the whole page.
- **Repro:** `curl -s https://hub.arkiv.network/faucet | grep -oE '/_next/static/chunks/[^"]+\.js'`, download the chunks, `grep -oE '.{200}invalid border.{100}' *.js` and `grep -oE '.{80}border:0,ecc.{40}' *.js`.
- **Impact:** we could not get test GLM, so no Sakshi entity could be written from 21:30 IST onward (the build window closes 04:29 IST).
- **Alternatives checked:** the docs (home, Installation, Networks/Tiramisu, Access Keys) document no other funding method. Access keys only raise RPC rate limits. The SDK README's shared example key (`0x3d05…7a5e`, address `0xc360B9FBB59edDB38042745d315661409Ad16cf9`) has balance `0` on Tiramisu (checked 18 Oct, 22:55 IST), and it is a shared public key, so it would be unsuitable as a witness identity anyway.
- **Fix:** pass `border: 1` (or upgrade/downgrade the QR library so the two agree), wrap the QR component in an error boundary so one widget cannot take down the faucet, and add a synthetic "page renders" check to the status page. Document a fallback (Discord or a faucet API) in the docs.

---

## SDK

### 2. README install snippet shows the wrong version range
- **Surface:** npm README of `@arkiv-network/sdk@0.8.1`, line 88
- **Expected:** `"@arkiv-network/sdk": "^0.8.x"`
- **Actual:** `"@arkiv-network/sdk": "^0.6.0"`
- **Repro:** `npm i @arkiv-network/sdk@0.8.1 && grep -n '\^0\.6' node_modules/@arkiv-network/sdk/README.md`
- **Fix:** update the snippet.

### 3. README points to a `sample` directory that is not in the package
- **Surface:** README: "Sample code can also be found in the [`sample`](./sample) directory"
- **Actual:** the installed package contains only `LICENSE.md README.md dist package.json src`.
- **Repro:** `ls node_modules/@arkiv-network/sdk/`
- **Fix:** use an absolute GitHub link.

### 4. `tiramisu` chain object has no `blockExplorers`
- **Surface:** `import { tiramisu } from "@arkiv-network/sdk/chains"`
- **Expected:** `blockExplorers.default.url = "https://tiramisu.explorer.arkiv.network"`, so viem-based tools can link transactions.
- **Actual:** `tiramisu.blockExplorers` is `undefined`; we hard-code the explorer URL in `src/lib/config.ts`.
- **Repro:** `console.log(tiramisu.blockExplorers)`
- **Fix:** add `blockExplorers` to the chain definition.

### 5. What worked: SDK typings and validation (positive)
- Every API we use matched the shipped source: `createEntity` / `executeBatch` / `extendEntity` (each awaits `waitForTransactionReceipt` internally), `getEntity`, `select().where(...).createdBy().limit().fetch()`, `QueryResult.hasNextPage()/next()`, `bytes32`, `u64`, `i32`, `str`, `ExpirationTime.fromDays`, and the `{ readonly, permissionlessExtension }` creation flags.
- Error messages in `attr/values.ts` are very good (for example, `i32(Date.now())` explains that you should use `u64`).
- **Docs gap we hit:** the fact that `createEntity` already waits for the receipt is only visible in the source (`utils/arkivTransactions.ts:184`). A sentence in the docs would save a redundant wait step.

---

## Browser and network

### 6. Browser-side reads: no WASM on the read path, and CORS is open (positive)
- **Concern going in:** the SDK depends on `brotli-wasm`, which often breaks Next.js client bundles.
- **Actual:** in 0.8.1 the only module that imports `brotli-wasm` is `src/utils/compression.ts`, and nothing imports that module, so it never reaches the client bundle (`grep -rl brotli out/_next` → nothing).
- **CORS:** `OPTIONS` to the Tiramisu RPC returns `access-control-allow-origin: *`, allowed methods `POST, OPTIONS`, and allowed headers `Content-Type, Authorization, X-Api-Key`.
- **Verified:** the static export opened in headless Chrome 18 Oct, about 22:57 IST, ran `select().where(project, entity_type, url_key)` directly from the browser and rendered the result, with no server.
- **Result:** Sakshi ships as a static site with no backend; the browser queries Arkiv directly.

### 7. RPC reachability
- `getChainId()` = 7738577, `getBlockNumber()` and `getEntityCount()` worked from Node with the default public `http()` transport (no access key). Query responses expose `Arkiv-Cost` and `Arkiv-Quota-Used-Percent` headers.

---

## Writes (after funding)

### 8. Funding resolved outside the faucet
Shortly before 00:15 IST on 19 Oct, the team received 10 test GLM on `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa` as a direct transfer, not through the faucet (balance `10000000000000000000` wei, checked 00:15 IST). Building started 21:28 IST on 18 Oct, and the first entity landed 00:15:29 IST on 19 Oct (about 2 h 47 min, almost all of it spent waiting for funds).

### 9. Preflight integration test: all 17 checks pass (`scripts/preflight.ts`, 19 Oct 00:15 IST, 16.1 s total)
- `createEntity` with `bytes32`, `u64`, `i32` and `str` attributes, a JSON payload, `fromDays(30)` and `{ readonly, permissionlessExtension }`. The call returned after the receipt, about 7.9 s (tx [`0xb3aa…4f04`](https://tiramisu.explorer.arkiv.network/tx/0xb3aaa9a9aa20b04b1617e1337e244899060a9f6f16c6861c481e5e757efb4f04), block 749680, entity `0xa61a…e0e5`).
- `getEntity`: `creator` equals the wallet, the payload round-trips byte-for-byte, `fetched_at` comes back typed `u64`, flags `{"readonly":true,"permissionlessExtension":true,"raw":3}`.
- `eq("doc_sha256", bytes32(h))` + project + type → exactly 1 row. `eq(url_key) + gte("fetched_at", u64) + createdBy(wallet)` → 1 row. The same query `createdBy(0x…dEaD)` → 0 rows. So `bytes32` equality and `u64` ranges work as documented; no fallback was needed.
- `executeBatch({ creates: [1], extensions: [{ fromDays(31) }] })`: one transaction ([`0x20db…d5b`](https://tiramisu.explorer.arkiv.network/tx/0x20db0619dbac00452b4e795bc6bb9efad11d9f9ee6e4b920b95b6a96639d4d5b)), `expiresAt` went 2045680 → 2088884 (+43,204 blocks ≈ 1 day at 2 s, as expected).
- **Note:** `fromDays(30)` resolved to block 2045680 from block 749680, which is exactly 1,296,000 blocks. Expiry depends on block production staying at 2 s, as the SDK source warns.

### 10. Witness runs: one `executeBatch` per run, all with mixed operations
- Run 1 (board phase 1): 3 creates + 1 run in one tx ([`0x7707…1745`](https://tiramisu.explorer.arkiv.network/tx/0x7707c7e1c68b65127c5d46b2225be787a19a7faef5af88c1b12fc2f2eec51745)).
- Run 2 (board phase 2, about 2 min later): 2 creates (`changed`, `gone`) + 1 run + 1 extension in one tx ([`0x6969…c519`](https://tiramisu.explorer.arkiv.network/tx/0x6969dab4b65b72853304c36fe7679007cd5f2c4aa5bdc06ff9e24342232fc519)).
- **Pitfall we designed around:** an extension reverts if the new expiry is not later than the current one, and one revert fails the whole batch. `witness.ts` therefore only adds an extension when `currentBlock + 30 days` exceeds the entity's `expiresAt`. Here notice 1's `seen` (created at block 749695, expiring 2045695) was extended to 2045749 in run 2 at block 749749: only +54 blocks, because a fixed-length extension re-anchors at the current block. It went through. Gas used: run 1 = 519,168, run 2 = 397,256.

### 11. Per-IP query quota: easy to exhaust, and the SDK just retries into it
- **Surface:** public Tiramisu RPC, `arkiv_query`
- **What we saw (19 Oct, around 00:55 IST):** while running browser QA of our landing page (about 15 page loads in 2 minutes, each issuing several queries), the RPC began answering `arkiv_query` with HTTP 429. The response header read `ratelimit: limit=10000, remaining=0, reset=1079`, so the query budget for our IP was gone for about 18 minutes. Plain calls like `eth_blockNumber` still succeeded under a separate budget (`limit=600 … reset≈20`).
- **Expected:** the quota and the cost of a query are documented, so an app can budget for them. The *Access Keys* page says keys raise limits and carry "a monthly quota measured in cost units", but not what a query costs or what the anonymous limits are.
- **SDK behaviour:** with viem's `http({ retryCount: 5 })`, a 429 with a 1079 s reset is retried with backoff and then fails anyway; the page just waits. Exposing `Retry-After`/`reset` through the SDK error would let apps show "rate-limited, try again in N min".
- **What we changed:** the landing page went from about 18 queries per load to 3 (one shared snapshot; the hero demo computes verdicts from it with the same pure function as `/verify`). We select only the fields we read (`select({ key, creator, createdAt, expiresAt, attributes, payload })`), cache the snapshot for 2 minutes in `sessionStorage`, and pause the block poller in hidden tabs.
- **Repro:** run many `select().where(eq("project", str("sakshi-v1"))).fetch()` calls from one IP in a short burst (we did it with about 15 page loads of an earlier build of our landing page) and read the `ratelimit` response header on the 429. We did not measure the per-query `Arkiv-Cost`, because our budget was already at 0.

### 12. Explorer URL patterns
`https://tiramisu.explorer.arkiv.network/tx/<hash>` and `/address/<addr>` both return 200. These are the patterns we link to from the app.

## Not tested
- Uppercase attribute names on chain (the SDK regex allows `[A-Za-z]`; reported to be rejected on chain). We use lowercase names only and have not tested this.

## The one thing Arkiv should improve first
Make funding reliable: the faucet is the only documented way to get test GLM, and when it fails, the whole platform is unusable for writes. A render-level health check plus a documented fallback would have unblocked this build.
