import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { sha256Hex } from "../src/lib/hash"
import { SAMPLES } from "../src/lib/samples"

describe("deterministic demo PDFs", () => {
  for (const s of SAMPLES) {
    it(`${s.file} has its pinned SHA-256`, async () => {
      expect(await sha256Hex(readFileSync(`public/samples/${s.file}`))).toBe(s.sha256)
    })
  }
  it("board files match the samples", async () => {
    const h = async (p: string) => sha256Hex(readFileSync(p))
    expect(await h("public/board-files/v1/notice-1.pdf")).toBe(SAMPLES[0].sha256)
    expect(await h("public/board-files/v1/notice-2.pdf")).toBe(SAMPLES[1].sha256)
    expect(await h("public/board-files/v2/notice-2.pdf")).toBe(SAMPLES[2].sha256)
    expect(await h("public/board-files/v1/notice-3.pdf")).toBe(SAMPLES[3].sha256)
  })
})
