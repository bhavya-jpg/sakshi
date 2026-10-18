import puppeteer from "puppeteer-core"
const [file, out] = process.argv.slice(2)
const L = {
  2: ["02", "The live app", "bhavya-jpg.github.io/sakshi"],
  3: ["03", "Demo board", "synthetic notices · phase 2"],
  4: ["04", "Verify", "four specimens + an edited copy"],
  5: ["05", "Trust", "witness A + witness B · same operator"],
  6: ["06", "Timeline", "notice 2 · seen → changed"],
  8: ["08", "Arkiv explorer", "witness B's transaction · Tiramisu"],
}
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true })
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 })
await p.goto("file://" + file, { waitUntil: "networkidle0" }); await p.waitForFunction(() => window.__ready)
for (const [k, v] of Object.entries(L)) { await p.evaluate((v) => window.set(...v), v); await p.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 400)); await p.screenshot({ path: `${out}/label${k}.png`, omitBackground: true }) }
await b.close(); console.log("labels ok")
