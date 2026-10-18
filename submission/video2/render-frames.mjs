// Deterministic render: seek(t) then screenshot, 30 fps, piped into ffmpeg as an image sequence.
import puppeteer from "puppeteer-core"
import { spawn } from "node:child_process"
const [file, out, secs] = process.argv.slice(2)
const FPS = 30, N = Math.round(Number(secs) * FPS)
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--force-device-scale-factor=1", "--hide-scrollbars"] })
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
await p.goto("file://" + file, { waitUntil: "networkidle0" }); await p.waitForFunction(() => window.__ready === true, { timeout: 20000 })
const ff = spawn("/opt/homebrew/bin/ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", String(FPS), out], { stdio: ["pipe", "inherit", "inherit"] })
for (let i = 0; i < N; i++) {
  await p.evaluate((t) => window.seek(t), i / FPS)
  const buf = await p.screenshot({ type: "png", optimizeForSpeed: true })
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r))
}
ff.stdin.end(); await new Promise((r) => ff.on("close", r)); await b.close()
console.log("rendered", N, "frames →", out)
