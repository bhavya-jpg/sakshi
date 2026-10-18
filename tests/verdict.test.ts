import { describe, expect, it } from "vitest"
import type { Observation, Run } from "../src/lib/schema"
import { computeVerdict, timelineKey } from "../src/lib/verdict"

const A = "0x00000000000000000000000000000000000000aa" as const
const X = "0x00000000000000000000000000000000000000ff" as const
const U = `0x${"11".repeat(32)}` as const
const H1 = `0x${"a1".repeat(32)}` as const
const H2 = `0x${"b2".repeat(32)}` as const

let n = 0
const obs = (o: Partial<Observation>): Observation => ({
  key: `0x${(++n).toString(16).padStart(64, "0")}`, creator: A, createdAtBlock: String(n), expiresAtBlock: "999",
  kind: "seen", urlKey: U, domain: "demo.example", fetchedAt: 100, httpStatus: 200, sourceTier: "demo",
  payload: { url: "https://demo.example/n.pdf" }, ...o,
})

describe("computeVerdict", () => {
  it("NOT_SEEN when there are no hits", () => {
    expect(computeVerdict(H1, [], new Map(), new Map(), [A]).overall).toBe("NOT_SEEN")
  })

  it("SERVED, still served as of the latest run", () => {
    const seen = obs({ docSha256: H1, fetchedAt: 100 })
    const runs = new Map<string, Run[]>([[A, [{ key: seen.key, creator: A, runAt: 500, sourcesChecked: 1, changes: 0 }]]])
    const v = computeVerdict(H1, [seen], new Map([[timelineKey(A, U), [seen]]]), runs, [A])
    expect(v.overall).toBe("SERVED")
    expect(v.findings[0].lastConfirmed).toBe(500)
  })

  it("REPLACED when the URL later served another hash", () => {
    const seen = obs({ docSha256: H1, fetchedAt: 100 })
    const changed = obs({ kind: "changed", docSha256: H2, prevSha256: H1, fetchedAt: 300 })
    const tl = new Map([[timelineKey(A, U), [seen, changed]]])
    const v = computeVerdict(H1, [seen], tl, new Map(), [A])
    expect(v.overall).toBe("REPLACED")
    expect(v.findings[0].endedAt).toBe(300)
    expect(v.findings[0].replacedBy).toBe(H2)
    // the new version is SERVED
    expect(computeVerdict(H2, [changed], tl, new Map(), [A]).overall).toBe("SERVED")
  })

  it("REMOVED when the URL went gone", () => {
    const seen = obs({ docSha256: H1, fetchedAt: 100 })
    const gone = obs({ kind: "gone", prevSha256: H1, fetchedAt: 400, httpStatus: 404 })
    const v = computeVerdict(H1, [seen], new Map([[timelineKey(A, U), [seen, gone]]]), new Map(), [A])
    expect(v.overall).toBe("REMOVED")
  })

  it("ignores records from untrusted creators", () => {
    const fake = obs({ creator: X, docSha256: H1, domain: "ssc.gov.in" })
    const v = computeVerdict(H1, [fake], new Map(), new Map(), [A])
    expect(v.overall).toBe("NOT_SEEN")
    expect(v.ignored).toBe(1)
  })
})
