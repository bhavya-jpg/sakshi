# Submission audit: Sakshi

Checked 19 Oct 2026, 02:20–02:35 IST against the canonical rules (Arkiv-Network/global-tour-stop-pre-devcon, frozen 13 Oct, commit 4f912d1) and https://arkiv.devfolio.co/overview. **Deadline: 18 Oct 2026 23:59 BST = 22:59 UTC = 19 Oct 04:29 IST.** Late submissions are not accepted; the repo commit SHA at the deadline is what gets judged.

| Requirement | Required evidence | Status | Where | Remaining action | Human? |
|---|---|---|---|---|---|
| Public GitHub repo | Repo visible logged-out | **PASS** | https://github.com/bhavya-jpg/sakshi (`gh`: PUBLIC) | none | no |
| MIT licence | LICENSE file, MIT | **PASS** | `LICENSE` (GitHub detects "MIT License") | none | no |
| Setup instructions in README | README with setup + reproduce | **PASS** | `README.md` (setup, verify, witness, fund, demo reproduction) | none | no |
| Working public deployment on Tiramisu, no access request | Live URL 200, reads Tiramisu | **PASS** | https://bhavya-jpg.github.io/sakshi/ (all 6 routes 200; latest Pages run `f05722c` success; live reads verified at 01:45 IST) | keep it up until 23 Oct | no |
| Reproducible: steps + exact queries | Steps and queries | **PASS** | `/arkiv/schema.md` (Q1–Q3), `DEVFOLIO_ANSWERS.md` Q8 | none | no |
| `/arkiv/schema.md` | Entity types, attributes, expiration, queries | **PASS** | https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/schema.md (200) | none | no |
| `/arkiv/friction.md` | Per surface: expected vs actual, versions, repro | **PASS** | https://github.com/bhavya-jpg/sakshi/blob/main/arkiv/friction.md (200) | none | no |
| On-chain evidence: creator wallets | Addresses + roles | **PASS** | A `0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa`, B `0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA` (schema.md, DEVFOLIO_ANSWERS Q6) | paste into form | yes |
| Full transaction references | 64-hex hashes | **PASS** | 6 full hashes in `docs/SUBMISSION.md` and `DEVFOLIO_ANSWERS.md` | none | no |
| Demo video ≤ 3:00 | MP4 under 180 s | **PASS (file)** | primary `submission/video2/sakshi_explainer.mp4`: 121.9 s, 1920×1080, H.264/AAC, decoded end to end, no black frames; fallback `submission/video/sakshi_demo.mp4`: 165.7 s | upload to YouTube/Drive and link it | **yes** |
| Video link accessible to judges | Public/unlisted URL | **NEEDS ACTION** | not uploaded | upload, set Unlisted / anyone-with-link, test logged-out | **yes** |
| ≥1 track selected | Track(s) on Devfolio | **NEEDS ACTION** | recommendation in `DEVFOLIO_ANSWERS.md` | select tracks in form | **yes** |
| Indian-nationality condition (Best Indian Use Case) | Declared at registration and submission | **NEEDS ACTION** | answer "Yes" in Q2 if true | confirm and declare | **yes** |
| All required form questions (1–17) | Answers | **PASS (drafted)** | `submission/DEVFOLIO_ANSWERS.md` | paste into form; Q15 is the submitter's choice | **yes** |
| The problem it solves / Challenges | Text | **PASS (drafted)** | `DEVFOLIO_ANSWERS.md` | paste | yes |
| Original work 9–18 Oct; pre-existing disclosed | Declaration + "None" | **PASS (drafted)** | Q9 "None"; all commits dated 18 Oct UTC | tick declaration Q16 | **yes** |
| Repo public under MIT + links accessible | Declaration | **PASS (verified)** | Q17 | tick | **yes** |
| No private keys / secrets / personal data on Arkiv or in Git | Scan | **PASS** | `.env`/`.env.witness-b` untracked; key prefixes absent from the last 50 commits; only synthetic notices on chain | never commit `.env*` | no |
| No stray temp/probe scripts tracked | `git ls-files` | **PASS** | `.probe.mjs` removed in `f2e3223` | none | no |
| Tests and build | 33 unit tests, tsc, build | **PASS** | `npm test` 33/33, `tsc` clean, static build OK (re-run 02:3x) | none | no |
| Entities live through judging (23 Oct) | Expiry | **PASS** | `fromDays(30)` on all entities (expire about 17 Nov) | none | no |
| Final Devfolio submission | Submitted state | **NEEDS ACTION** | not submitted | submit before 04:29 IST | **yes** |
| Submission confirmation | Devfolio confirmation | **NEEDS ACTION** | n/a | check the project page shows "Submitted" | **yes** |
| No history rewrite after deadline | Git | **PASS** | no force-pushes used | don't push after 04:29 | yes |
