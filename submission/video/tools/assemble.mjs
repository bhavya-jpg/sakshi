import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
const tl = JSON.parse(readFileSync("timeline.json"))
const S = "/private/tmp/claude-501/-Users-bhavya--Dev-arkiv/f97b0f84-2fa6-4d4e-a87c-bb4d2d4fc57b/scratchpad"
const src = { 1: S + "/clips/s1.mp4", 2: S + "/app2/s2_home.webm", 3: S + "/app2/s3_board.webm", 4: S + "/app2/s4_verify.webm", 5: S + "/app2/s5_trust.webm", 6: S + "/app2/s6_timeline.webm", 7: S + "/clips/s7.mp4", 8: S + "/app2/s8_explorer.webm", 9: S + "/clips/s9.mp4" }
const live = (n) => typeof src[n] === "string" && src[n].endsWith(".webm")
const list = []
for (const sc of tl.scenes) {
  const n = sc.scene, d = sc.duration.toFixed(3), out = `build/seg${n}.mp4`
  const inArgs = live(n) ? ["-ss", "0.3", "-i", src[n]] : ["-i", src[n]]
  const hasLabel = [2, 3, 4, 5, 6, 8].includes(n)
  if (hasLabel) inArgs.push("-loop", "1", "-t", d, "-i", `build/label${n}.png`)
  let v = `[0:v]${live(n) ? "scale=1920:1080:flags=lanczos," : ""}fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=${d},trim=0:${d},setpts=PTS-STARTPTS,format=yuv420p`
  v += `,fade=t=in:st=0:d=0.35:color=0xf6f4f2,fade=t=out:st=${(sc.duration - 0.35).toFixed(3)}:d=0.35:color=0xf6f4f2[base]`
  let graph = v
  if (hasLabel) graph += `;[1:v]format=rgba,fade=t=in:st=0.7:d=0.5:alpha=1,fade=t=out:st=5.2:d=0.6:alpha=1[lab];[base][lab]overlay=0:0:format=auto[outv]`
  else graph = graph.replace("[base]", "[outv]")
  execFileSync("ffmpeg", ["-v", "error", "-y", ...inArgs, "-filter_complex", graph, "-map", "[outv]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", out])
  list.push(`file '${out.replace("build/", "")}'`)
  console.log("segment", n, d)
}
writeFileSync("build/list.txt", list.join("\n") + "\n")
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/list.txt", "-c", "copy", "build/video_only.mp4"])
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", "build/video_only.mp4", "-i", "build/mix.wav", "-i", "sakshi_demo.srt",
  "-map", "0:v", "-map", "1:a", "-map", "2:s", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
  "-t", "165.7", "-movflags", "+faststart", "sakshi_demo.mp4"])
console.log("done")
