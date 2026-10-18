# Sakshi (साक्षी): independent witness for public notices

Sakshi records on [Arkiv](https://arkiv.network) (Tiramisu testnet) **which exact PDF an official notice URL served, and when**, including when the file changed or the URL disappeared. Anyone can drop a forwarded PDF into the web app to check it. A missing record is never presented as proof that a document is fake.

*Work in progress for Arkiv: Global Tour Stop. Full setup and reproduction steps are below and in `/arkiv/schema.md`.*

## Setup
```bash
npm install
npm run dev                         # web app (read-only, no keys)
npx tsx scripts/verify.ts file.pdf  # verify from the CLI, reading the public RPC directly
```
Witness (writes to Arkiv, needs a funded Tiramisu key in `.env`, see `.env.example`):
```bash
npx tsx scripts/preflight.ts        # integration test: create, read back, query, verify creator + payload
npx tsx scripts/witness.ts          # one witness pass over sources.json
```

## License
MIT
