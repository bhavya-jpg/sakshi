# Video assets and provenance

Final file: `sakshi_demo.mp4`: 1920×1080, 30 fps, H.264 + AAC stereo 48 kHz, 2:45.7, with an English soft-subtitle track (also `sakshi_demo.srt`).

| Asset | Source | Licence / rights |
|---|---|---|
| Product footage (scenes 2–6) | Real-time screen captures of the **live deployment** https://bhavya-jpg.github.io/sakshi/ (Puppeteer screencast, 1280×720, upscaled), recorded 19 Oct 2026 ~02:10 IST. Every verdict, count, hash and timestamp shown is what the live app returned from Arkiv Tiramisu. | Our own work (MIT repo) |
| Explorer footage (scene 8) | Real-time capture of https://tiramisu.explorer.arkiv.network/tx/0xbab0f4599b2afc706e640e519d9921d6b9259a88421e17f8c447277f160a9d4f (Witness B's run) | Public block explorer page, shown for evidence |
| Terminal (scene 7) | The **verbatim** stdout of one real run of `npx tsx scripts/verify.ts public/samples/demo-notice-2-v1.pdf` at 01:59:13 IST (`cli_output.txt`), replayed line by line in a terminal-styled frame. Not edited. | Our own work |
| Motion graphics (scenes 1, 7 frame, 9) | HTML/CSS scenes in `scenes/`, rendered frame-by-frame (`tools/render-frames.mjs`). The hashes and entity keys in scene 1 are the real values of demo notice 2 v1/v2 and Witness A's records. | Our own work |
| Narration | macOS `say`, voice "Rishi" (English, India), rate 168; script in `voiceover_script.txt`. Synthetic voice, generated locally. | Generated on our machine with the OS's built-in TTS |
| Music | An original ambient pad (A minor, F, C, G) **synthesised with ffmpeg's `aevalsrc`** (sine partials, low-pass, echo), ducked under narration with `sidechaincompress`. No samples, no third-party recordings. | Original, generated for this video; no licence needed |
| Fonts | Geist, Geist Mono (SIL OFL 1.1), Newsreader (SIL OFL 1.1), via Google Fonts | SIL Open Font License |

Rendered by `tools/assemble.mjs` (ffmpeg 7.1.1). Capture scripts in `tools/` reference local scratch paths and are included for transparency.
