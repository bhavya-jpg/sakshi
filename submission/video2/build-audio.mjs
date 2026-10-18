// Score + voice mix, all generated locally with ffmpeg. Reads timeline.js (real VO timings).
import { execFileSync } from "node:child_process"
import { readFileSync, mkdirSync } from "node:fs"
const TL = JSON.parse(readFileSync("timeline.js", "utf8").replace(/^window.TL=/, "").replace(/;\s*$/, ""))
const T = TL.total, ff = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a])
mkdirSync("build", { recursive: true })
// 1) voice: trim each Chatterbox line's edge silence, place it at its timeline start, normalise
const lines = TL.shots.flatMap((s) => s.lines)
const vin = lines.flatMap((l) => ["-i", l.file])
const vf = lines.map((l, i) => `[${i}:a]aresample=48000,pan=mono|c0=c0,silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=${Math.round(l.start * 1000)}[v${i}]`).join(";")
  + ";" + lines.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${T},atrim=0:${T},highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150,loudnorm=I=-16:TP=-1.5:LRA=8,aresample=48000,apad=whole_dur=${T},atrim=0:${T}[vo]`
ff([...vin, "-filter_complex", vf, "-map", "[vo]", "-ar", "48000", "-ac", "1", "build/voice.wav"])
// 2) bed: two cross-faded pad layers (Am · F · C · G, 6 s per chord) + low drone
const F1 = "if(eq(K,0),220,if(eq(K,1),174.61,if(eq(K,2),261.63,196)))", F2 = "if(eq(K,0),261.63,if(eq(K,1),220,if(eq(K,2),329.63,246.94)))", F3 = "if(eq(K,0),329.63,if(eq(K,1),261.63,if(eq(K,2),392,293.66)))"
const layer = (off) => `pow(sin(PI*mod(t+${off},6)/6),2)*(sin(2*PI*(${F1})*t)+0.6*sin(2*PI*(${F2})*t)+0.45*sin(2*PI*(${F3})*t)+0.2*sin(4*PI*(${F1})*t))`.replaceAll("K", `mod(floor((t+${off})/6),4)`)
ff(["-f", "lavfi", "-i", `aevalsrc='0.09*(${layer(0)})+0.09*(${layer(3)})+0.05*sin(2*PI*55*t)':s=48000:d=${T}`, "-af", `lowpass=f=1500,aecho=0.8:0.6:200|370:0.33|0.2,afade=t=in:d=2.5,afade=t=out:st=${(T - 4).toFixed(2)}:d=4`, "-ac", "2", "build/bed.wav"])
// 3) hits: a soft low thump + short airy tick at every cut; a rising swell into the last shot
ff(["-f", "lavfi", "-i", "aevalsrc='0.55*sin(2*PI*(62+40*exp(-t*18))*t)*exp(-t*7)+0.12*(random(0)*2-1)*exp(-t*55)':s=48000:d=1.2", "-af", "lowpass=f=4000", "-ac", "2", "build/hit.wav"])
const cuts = TL.shots.slice(1).map((s) => s.start)
const last = TL.shots[TL.shots.length - 1].start
ff(["-f", "lavfi", "-i", `aevalsrc='0.18*pow(t/3,2)*(sin(2*PI*440*t)+0.5*sin(2*PI*660*t))*lt(t,3)':s=48000:d=3`, "-af", "lowpass=f=2500,afade=t=out:st=2.7:d=0.3", "-ac", "2", "build/swell.wav"])
const hin = cuts.flatMap(() => ["-i", "build/hit.wav"])
const hf = cuts.map((c, i) => `[${i}:a]adelay=${Math.round((c - 0.05) * 1000)}|${Math.round((c - 0.05) * 1000)}[h${i}]`).join(";") + `;[${cuts.length}:a]adelay=${Math.round((last - 3) * 1000)}|${Math.round((last - 3) * 1000)}[sw];` + cuts.map((_, i) => `[h${i}]`).join("") + `[sw]amix=inputs=${cuts.length + 1}:normalize=0,apad=whole_dur=${T},atrim=0:${T}[fx]`
ff([...hin, "-i", "build/swell.wav", "-filter_complex", hf, "-map", "[fx]", "-ar", "48000", "build/fx.wav"])
// 4) mix: bed and fx ducked under the voice; limiter
ff(["-i", "build/bed.wav", "-i", "build/fx.wav", "-i", "build/voice.wav", "-filter_complex",
  "[2:a]aformat=channel_layouts=stereo,asplit=2[sc][vo];[0:a][1:a]amix=inputs=2:normalize=0:weights='0.85 0.55'[mus];[mus][sc]sidechaincompress=threshold=0.025:ratio=7:attack=15:release=400[duck];[duck][vo]amix=inputs=2:normalize=0:duration=longest:weights='1 1',alimiter=limit=0.89,apad=whole_dur=" + T + ",atrim=0:" + T + "[mix]",
  "-map", "[mix]", "-ar", "48000", "build/mix.wav"])
console.log("audio ok", T)
