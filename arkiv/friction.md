# Friction report — building Sakshi on Arkiv

Environment: `@arkiv-network/sdk@0.8.1`, `viem@2.x`, Node 22, Next.js (App Router), Tiramisu testnet (chain 7738577), 18 Oct 2026.
Format: **surface · expected · actual · versions · repro · suggested fix**. Paths that worked are documented the same way.
Only things we actually hit. Items 1–4 were found by reading the published 0.8.1 npm package before writing code. **Confirm each on your machine and fill the status before submitting.**

---

### 1. SDK README install output shows the wrong major version
- **Surface:** npm README of `@arkiv-network/sdk@0.8.1`
- **Expected:** example `package.json` shows `^0.8.x`
- **Actual:** shows `"@arkiv-network/sdk": "^0.6.0"`
- **Repro:** `npm pack @arkiv-network/sdk@0.8.1 && tar xzf arkiv-network-sdk-0.8.1.tgz && grep -n '\^0.6' package/README.md`
- **Fix:** update the snippet; 0.6 → 0.8 has breaking changes.

### 2. README points to a `sample` directory that is not in the package
- **Surface:** npm README ("Sample code can also be found in the `sample` directory")
- **Expected:** `package/sample/` exists, or an absolute GitHub link
- **Actual:** the tarball has only `dist/`, `src/`, `README.md`, `LICENSE.md`, `package.json`
- **Repro:** unpack as above, `ls package/`
- **Fix:** absolute link to the repo's `sample/` folder.

### 3. Attribute-name validation is looser in the SDK than on Tiramisu
- **Surface:** `src/attr/names.ts` (`/^[A-Za-z][A-Za-z0-9._-]*$/`) vs Tiramisu
- **Expected:** a name the SDK accepts is accepted on chain
- **Actual (reported in Arkiv's troubleshooting skill, verified 2026-10-08):** uppercase names pass the SDK but Tiramisu rejects them (`Ident32InvalidByte`). We used lowercase only.
- **Status:** ☐ confirmed by creating one entity with attribute `TestName`; exact error: ______
- **Fix:** align the SDK regex with the chain so it fails before signing.

### 4. `tiramisu` chain definition has no `blockExplorers`
- **Surface:** `@arkiv-network/sdk/chains` → `src/chains/tiramisu.ts`
- **Expected:** `blockExplorers.default.url = "https://tiramisu.explorer.arkiv.network"`
- **Actual:** only `rpcUrls`; apps must hard-code explorer links
- **Repro:** `import { tiramisu } from "@arkiv-network/sdk/chains"; console.log(tiramisu.blockExplorers)` → `undefined`
- **Fix:** add `blockExplorers` to the chain object.

---

## Preflight results (fill from `scripts/preflight.ts`)

### 5. Time to first entity · faucet
Start __:__ IST → first entity on explorer __:__ IST. Faucet steps, sign-in required? amount received: ______

### 6. `bytes32` attributes with `eq()` (preflight 1)
Expected `eq("doc_sha256", bytes32(h))` + `gte("fetched_at", u64(t))` + `createdBy(A)` → 1 row. Actual: ______. Fallback used? ______

### 7. `executeBatch` with `creates` + `extensions` in one transaction (preflight 2)
Expected one tx, `expiresAt` of X increased. Actual: ______ (tx ______)

### 8. Permissionless extension by a non-owner (preflight 2)
Expected pinner `extendEntity` succeeds on X created with `permissionlessExtension: true`, owner unchanged. Actual: ______

### 9. Extension semantics
`extendEntity` with `fromDays(30)` on a record created with `fromDays(30)` minutes earlier: expected a slightly later `expiresAt`. Actual: ______. Error text if it reverts as "not later": ______

### 10. RPC limits & nonces (preflight 3)
20 sequential queries: ______. Writes from one key in quick succession: ______

### 11. Browser bundle (`brotli-wasm`) + CORS on Vercel (preflight 4)
Expected the SDK public client to work in a Next.js client component on the deployed site. Actual: ______. Fallback `/api/q` used? ______

### 12. Query result shape
No server-side ordering: we sort observations by `fetched_at` on the client. Any surprises with `cursor` / `hasNextPage()`: ______

### Most important thing for Arkiv to improve first
______ (also the answer to Devfolio Q14)
