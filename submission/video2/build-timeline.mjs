// Builds timeline.js (shot starts, durations, per-line timings) from the real VO durations when present.
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
const shots = JSON.parse(readFileSync("script.json"))
const dur = (f) => existsSync(f) ? parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString()) : null
// visual holds per shot: lead before speech, tail after (seconds)
const LEAD = { 1: 1.6, 2: 0.6, 3: 0.7, 4: 0.9, 5: 1.4, 6: 1.0, 7: 0.9, 8: 0.5, 9: 0.9, 10: 1.2, 11: 0.9 }
const TAIL = { 1: 1.2, 2: 2.0, 3: 1.6, 4: 3.2, 5: 2.6, 6: 2.4, 7: 4.6, 8: 2.4, 9: 2.4, 10: 3.6, 11: 3.4 }
const GAP = 0.45
let t = 0, est = false; const out = []
for (const s of shots) {
  const start = t; let c = t + LEAD[s.shot]; const lines = []
  s.lines.forEach((text, i) => {
    let d = dur(`vo/s${String(s.shot).padStart(2, "0")}_${i}.wav`); if (d == null) { d = text.length / 15; est = true }
    lines.push({ start: +c.toFixed(3), end: +(c + d).toFixed(3), text, file: `vo/s${String(s.shot).padStart(2, "0")}_${i}.wav` }); c += d + (i < s.lines.length - 1 ? GAP : 0)
  })
  // the trust shot needs time for both toggles after line 2 starts
  const end = c + TAIL[s.shot]; out.push({ shot: s.shot, name: s.name, start: +start.toFixed(3), dur: +(end - start).toFixed(3), lines }); t = end
}
writeFileSync("timeline.js", "window.TL=" + JSON.stringify({ total: +t.toFixed(3), estimated: est, shots: out }) + ";\n")
console.log(`total ${t.toFixed(1)}s${est ? " (some lines estimated)" : ""}`); for (const s of out) console.log(s.shot, s.name, s.start.toFixed(1), s.dur.toFixed(1))
