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

## Not yet tested (blocked on item 1)
- Creating an entity; `bytes32` equality and `u64` range queries returning a matching row; `executeBatch` with `creates` + `extensions` in one transaction; Lifetime Extension semantics; time to first entity.
- Uppercase attribute names on chain (the SDK regex allows `[A-Za-z]`; reported to be rejected on chain). We use lowercase names only and have not tested this.

## The one thing Arkiv should improve first
Make funding reliable: the faucet is the only documented way to get test GLM, and when it fails, the whole platform is unusable for writes. A render-level health check plus a documented fallback would have unblocked this build.
