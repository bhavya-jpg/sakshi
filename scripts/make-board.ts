// Generates the synthetic DEMO board PDFs (deterministic bytes, fixed dates, no real people).
// Usage: npx tsx scripts/make-board.ts
//   public/board-files/v1/*.pdf  → the board as first published
//   public/board-files/v2/*.pdf  → after the demo change (notice-2 deadline edited, notice-3 removed)
//   public/samples/*.pdf   → copies judges can download and verify
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const FIXED = new Date("2026-10-18T00:00:00Z")

type Notice = { id: string; title: string; lines: string[] }

async function makePdf(n: Notice): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(n.title)
  doc.setAuthor("Sakshi DEMO board (synthetic)")
  doc.setProducer("sakshi make-board")
  doc.setCreator("sakshi make-board")
  doc.setCreationDate(FIXED)
  doc.setModificationDate(FIXED)
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: rgb(0.85, 0.2, 0.15) })
  page.drawText("DEMO SOURCE - SYNTHETIC NOTICE - NOT A REAL GOVERNMENT DOCUMENT", { x: 40, y: 812, size: 11, font: bold, color: rgb(1, 1, 1) })
  page.drawText("Sakshi Demo Recruitment Board (fictional)", { x: 40, y: 750, size: 16, font: bold })
  page.drawText(n.title, { x: 40, y: 715, size: 13, font: bold })
  let y = 680
  for (const line of n.lines) {
    page.drawText(line, { x: 40, y, size: 11, font })
    y -= 20
  }
  page.drawText(`Notice ID: ${n.id}`, { x: 40, y: 60, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
  return doc.save({ useObjectStreams: false })
}

const common = ["Organisation: Demo Staff Selection Board (fictional)", "Mode of application: online only, via the demo portal.", ""]

const v1: Notice[] = [
  { id: "DEMO/2026/001", title: "Notice 1: Junior Assistant Recruitment 2026", lines: [...common,
    "Posts: 120 (synthetic)", "Application opens: 20 October 2026", "Last date to apply: 15 November 2026", "Application fee: Rs 100"] },
  { id: "DEMO/2026/002", title: "Notice 2: Field Surveyor Examination 2026", lines: [...common,
    "Posts: 45 (synthetic)", "Application opens: 20 October 2026", "Last date to apply: 30 November 2026", "Application fee: Rs 200"] },
  { id: "DEMO/2026/003", title: "Notice 3: Scholarship Entrance Test 2026", lines: [...common,
    "Seats: 300 (synthetic)", "Registration opens: 21 October 2026", "Last date to register: 10 December 2026", "Fee: none"] },
]

// v2: notice-2's deadline is silently moved earlier; notice-3 is removed from the board.
const v2: Notice[] = [
  v1[0],
  { ...v1[1], lines: v1[1].lines.map((l) => (l.startsWith("Last date") ? "Last date to apply: 05 November 2026" : l)) },
]

rmSync("public/board-files", { recursive: true, force: true })
for (const dir of ["public/board-files/v1", "public/board-files/v2", "public/samples"]) mkdirSync(dir, { recursive: true })

for (const [i, n] of v1.entries()) {
  const bytes = await makePdf(n)
  writeFileSync(`public/board-files/v1/notice-${i + 1}.pdf`, bytes)
  writeFileSync(`public/samples/demo-notice-${i + 1}-v1.pdf`, bytes)
}
for (const [i, n] of v2.entries()) {
  const bytes = await makePdf(n)
  writeFileSync(`public/board-files/v2/notice-${i + 1}.pdf`, bytes)
  if (i === 1) writeFileSync(`public/samples/demo-notice-2-v2.pdf`, bytes)
}
console.log("board written: public/board-files/v1 (3 notices), public/board-files/v2 (2 notices), public/samples")
