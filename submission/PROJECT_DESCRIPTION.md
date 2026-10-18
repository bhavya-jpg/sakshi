# Sakshi (साक्षी): project description

**One line.** Proof of what a notice page actually published: check a forwarded PDF against public witness records on Arkiv.

**Short (≈60 words).** Sakshi is an independent witness archive for public recruitment and examination notices. Witnesses fetch notice PDFs, hash them, and write readonly observations to Arkiv Tiramisu: seen, changed or gone. Anyone can hash a forwarded PDF in their browser and see which trusted witness recorded that exact file, where and when. No upload, no server, and a missing record is never called fake.

**Full.**
Candidates in India act on recruitment and exam notices forwarded as PDFs. Official pages change, files are withdrawn, and sites go down, so "check the official site" often can't settle what was actually published.

Sakshi has three parts:
1. **Witnesses** (`scripts/witness.ts`, run with any wallet): fetch each notice URL, compute its SHA-256, compare it with their own last record, and write one atomic `executeBatch` per run to Arkiv: new `seen`, `changed` or `gone` observations, a `run` summary, and Lifetime Extensions for files seen again. All entities are `readonly` and expire after 30 days unless re-confirmed or extended.
2. **The public record on Arkiv**: typed attributes (`bytes32` hashes and URL keys, `u64` times) make every observation queryable by anyone; the immutable `$creator` says which witness wrote it.
3. **Readers**: a static web app (GitHub Pages, no backend) and a CLI (`scripts/verify.ts`) that hash a file locally, query Arkiv directly, and return Served, Replaced, Removed or No matching record, counting only the witness wallets the reader trusts.

The live demo uses a clearly labelled synthetic notice board: one notice was edited (deadline moved) and one withdrawn (HTTP 404), and the records on Tiramisu show exactly that. Two witness identities (A and B, separate wallets, same operator) have written real observations; notice 1 is seen by both.

What it does not claim: it doesn't prove a witness fetched honestly (no TLS proof), that the source site wasn't compromised, or that a changed file was tampered with; and the absence of a record is not evidence of a fake.
