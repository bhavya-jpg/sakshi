import { readFileSync, writeFileSync } from "node:fs"
const TL = JSON.parse(readFileSync("timeline.js", "utf8").replace(/^window.TL=/, "").replace(/;\s*$/, ""))
const ts = (x) => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}` }
const wrap = (s) => { if (s.length <= 52) return s; const w = s.split(" "); let a = "", b = ""; for (const x of w) { if (!b && (a + " " + x).trim().length <= Math.ceil(s.length / 2) + 6) a = (a + " " + x).trim(); else b = (b + " " + x).trim() } return a + "\n" + b }
const cues = TL.shots.flatMap((s) => s.lines)
writeFileSync("sakshi_explainer.srt", cues.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end + 0.15)}\n${wrap(c.text)}\n`).join("\n"))
writeFileSync("voiceover_script.txt", "Sakshi explainer: narration (exact text in the final video)\nVoice: Chatterbox TTS (Resemble AI, MIT licence), default voice, exaggeration 0.45, cfg 0.45, seed 7; output carries Resemble's Perth watermark.\n\n" + TL.shots.map((s) => `[${String(s.shot).padStart(2, "0")} ${s.name}]\n` + s.lines.map((l) => l.text).join("\n") + "\n").join("\n"))
console.log("srt", cues.length, "cues")
