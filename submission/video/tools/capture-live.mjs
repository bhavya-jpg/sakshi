// Real-time capture of the LIVE deployed app, with scripted actions timed to the narration.
import puppeteer from "puppeteer-core"
const [OUT, only] = process.argv.slice(2)
const SITE = "https://bhavya-jpg.github.io/sakshi"
const EDITED = "/private/tmp/claude-501/-Users-bhavya--Dev-arkiv/f97b0f84-2fa6-4d4e-a87c-bb4d2d4fc57b/scratchpad/forwarded-copy.pdf"
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars"] })
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function scene(name, url, secs, zoom, actions) {
  if (only && !only.split(",").includes(name)) return
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 })
  let q = 0; p.on("request", (r) => r.method() === "POST" && r.postData()?.includes("arkiv_query") && q++)
  p.on("pageerror", (e) => log(name, "PAGE ERROR", e.message))
  await p.goto(url, { waitUntil: "networkidle0", timeout: 60000 })
  if (zoom) await p.evaluate((z) => { document.documentElement.style.zoom = String(z) }, zoom)
  await p.evaluate(() => {
    window.__scrollTo = (y, ms = 900) => new Promise((res) => { const y0 = scrollY, t0 = performance.now(), e = (x) => 1 - Math.pow(1 - x, 3)
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); scrollTo(0, y0 + (y - y0) * e(k)); k < 1 ? requestAnimationFrame(step) : res() }; requestAnimationFrame(step) })
    window.__center = (sel, ms = 900) => { const el = document.querySelector(sel); if (!el) return; const z = parseFloat(document.documentElement.style.zoom || "1")
      const r = el.getBoundingClientRect(); return window.__scrollTo(Math.max(0, scrollY + (r.top + r.height / 2) * z - innerHeight / 2), ms) }
  })
  await sleep(1200)
  const rec = await p.screencast({ path: `${OUT}/${name}.webm`, ffmpegPath: "/opt/homebrew/bin/ffmpeg" })
  const t0 = Date.now(); const at = async (s) => { const w = s * 1000 - (Date.now() - t0); if (w > 0) await sleep(w) }
  await actions(p, at)
  await at(secs + 1.0); await rec.stop(); log(name, `recorded ${secs}s, arkiv_query ${q}`); await p.close()
}
const examine = (p, i) => p.evaluate((i) => [...document.querySelectorAll("aside button")].filter((x) => x.textContent === "Examine")[i].click(), i)
const waitVerdict = (p) => p.waitForFunction(() => document.querySelector("section[aria-live] h2"), { timeout: 30000 })

await scene("s2_home", SITE + "/", 18.7, 0, async (p, at) => {
  await at(3.0); await p.evaluate(() => window.__scrollTo(690, 1600))
  await at(11.5); await p.evaluate(() => window.__scrollTo(1560, 1500))
  await at(15.0); await p.evaluate(() => window.__scrollTo(2600, 1500))
})
await scene("s3_board", SITE + "/board/", 15.7, 0, async (p, at) => {
  await at(5.5); await p.evaluate(() => window.__scrollTo(520, 1500))
})
await scene("s4_verify", SITE + "/verify/", 30.0, 0, async (p, at) => {
  await p.evaluate(() => window.__scrollTo(300, 10))
  for (const [t, i] of [[0.6, 0], [7.0, 1], [11.2, 2], [14.6, 3]]) {
    await at(t); if (t > 1) await p.evaluate(() => window.__scrollTo(300, 700)); await examine(p, i); await waitVerdict(p).catch(() => log("no verdict", i))
    await sleep(250); await p.evaluate(() => window.__center("section[aria-live]", 800))
  }
  await at(18.6); await p.evaluate(() => window.__scrollTo(300, 700))
  const input = await p.$("input[type=file]"); await input.uploadFile(EDITED); await waitVerdict(p).catch(() => log("no verdict edited"))
  await sleep(300); await p.evaluate(() => window.__center("section[aria-live]", 800))
})
await scene("s5_trust", SITE + "/verify/", 27.6, 0, async (p, at) => {
  await p.evaluate(() => window.__scrollTo(300, 10))
  await at(0.5); await examine(p, 0); await waitVerdict(p)
  await at(2.8); await p.evaluate(() => window.__center("section[aria-live]", 1000))
  await at(8.8); await p.evaluate(() => window.__scrollTo(300, 800))
  await at(9.9); await p.evaluate(() => document.querySelectorAll("aside fieldset input[type=checkbox]")[1].click())
  await at(10.8); await p.evaluate(() => window.__center("section[aria-live]", 900))
  await at(15.6); await p.evaluate(() => window.__scrollTo(300, 800))
  await at(16.6); await p.evaluate(() => document.querySelectorAll("aside fieldset input[type=checkbox]")[0].click())
  await at(17.5); await p.evaluate(() => window.__center("section[aria-live]", 900))
})
await scene("s6_timeline", SITE + "/timeline/?u=" + encodeURIComponent(SITE + "/board/notice-2.pdf"), 16.5, 0, async (p, at) => {
  await p.waitForFunction(() => document.querySelectorAll("ol li").length > 0, { timeout: 30000 })
  await at(3.2); await p.evaluate(() => window.__scrollTo(470, 1500))
  await at(8.5); await p.evaluate(() => { const d = document.querySelectorAll("details")[1]; if (d) d.open = true })
  await at(9.5); await p.evaluate(() => window.__scrollTo(640, 1200))
})
await scene("s8_explorer", "https://tiramisu.explorer.arkiv.network/tx/0xbab0f4599b2afc706e640e519d9921d6b9259a88421e17f8c447277f160a9d4f", 13.6, 0, async (p, at) => {
  await at(6.5); await p.evaluate(() => window.__scrollTo(260, 1500))
})
await b.close()
