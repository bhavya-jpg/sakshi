import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { selectWitnessRuns } from "../src/lib/arkiv"
import type { Observation, Run } from "../src/lib/schema"
import { verdictFromEvidence, type Evidence } from "../src/lib/service"
import { verdictFromSnapshot } from "../src/lib/snapshot"
import { computeVerdict, timelineKey } from "../src/lib/verdict"

// These tests are pure. Any network call is a bug: fail loudly instead of spending Arkiv quota.
const realFetch = globalThis.fetch
beforeAll(() => { globalThis.fetch = (() => { throw new Error("network disabled in unit tests") }) as typeof fetch })
afterAll(() => { globalThis.fetch = realFetch })

const A = "0x00000000000000000000000000000000000000aa" as const
const B = "0x00000000000000000000000000000000000000bb" as const
const X = "0x00000000000000000000000000000000000000ff" as const
const U1 = `0x${"11".repeat(32)}` as const
const U2 = `0x${"22".repeat(32)}` as const
const H1 = `0x${"a1".repeat(32)}` as const
const H2 = `0x${"b2".repeat(32)}` as const

let n = 0
const obs = (o: Partial<Observation>): Observation => ({
  key: `0x${(++n).toString(16).padStart(64, "0")}`, creator: A, createdAtBlock: String(n), expiresAtBlock: "999",
  kind: "seen", urlKey: U1, domain: "demo.example", fetchedAt: 100, httpStatus: 200, sourceTier: "demo",
  payload: { url: "https://demo.example/n.pdf" }, ...o,
})
const run = (creator: string, runAt: number): Run => ({ key: `0x${(++n).toString(16).padStart(64, "0")}`, creator: creator as `0x${string}`, runAt, sourcesChecked: 1, changes: 0 })

/** Build Evidence the way fetchEvidence would, from a full set of records. */
function evidenceFrom(hash: `0x${string}`, all: Observation[], runs: Run[], candidates: string[]): Evidence {
  const hits = all.filter((o) => o.docSha256 === hash)
  const cand = new Set(candidates.map((c) => c.toLowerCase()))
  const timelines = new Map<string, Observation[]>()
  for (const h of hits) {
    if (!cand.has(h.creator.toLowerCase())) continue
    const k = timelineKey(h.creator, h.urlKey)
    timelines.set(k, all.filter((o) => timelineKey(o.creator, o.urlKey) === k))
  }
  const runMap = new Map<string, Run[]>()
  for (const c of cand) runMap.set(c, runs.filter((r) => r.creator.toLowerCase() === c))
  return { hash, hits, timelines, runs: runMap, candidates: [...cand] }
}

describe("distinct-witness counting", () => {
  it("two witnesses at the same URL count as 2 witnesses, 2 findings", () => {
    const all = [obs({ creator: A, docSha256: H1 }), obs({ creator: B, docSha256: H1, fetchedAt: 110 })]
    const v = verdictFromEvidence(evidenceFrom(H1, all, [], [A, B]), [A, B])
    expect(v.overall).toBe("SERVED")
    expect(v.witnesses).toHaveLength(2)
    expect(v.findings).toHaveLength(2)
  })

  it("repeat records by one witness at one URL are one witness, one finding", () => {
    const all = [obs({ creator: A, docSha256: H1, fetchedAt: 100 }), obs({ creator: A, docSha256: H1, fetchedAt: 200 })]
    const v = verdictFromEvidence(evidenceFrom(H1, all, [], [A]), [A])
    expect(v.witnesses).toEqual([A])
    expect(v.findings).toHaveLength(1)
    expect(v.findings[0].firstSeen).toBe(100)
  })

  it("one witness seeing the same file at two URLs is one witness, two findings", () => {
    const all = [obs({ creator: A, docSha256: H1, urlKey: U1 }), obs({ creator: A, docSha256: H1, urlKey: U2 })]
    const v = verdictFromEvidence(evidenceFrom(H1, all, [], [A]), [A])
    expect(v.witnesses).toHaveLength(1)
    expect(v.findings).toHaveLength(2)
  })

  it("address case does not split a witness", () => {
    const all = [obs({ creator: "0x00000000000000000000000000000000000000AA" as `0x${string}`, docSha256: H1 })]
    const v = verdictFromEvidence(evidenceFrom(H1, all, [], [A]), [A.toUpperCase().replace("0X", "0x")])
    expect(v.witnesses).toEqual([A])
  })
})

describe("trust toggles recompute from fetched evidence", () => {
  const all = [
    obs({ creator: A, docSha256: H1, fetchedAt: 100 }),
    obs({ creator: A, kind: "changed", docSha256: H2, prevSha256: H1, fetchedAt: 300 }),
    obs({ creator: B, docSha256: H1, fetchedAt: 150 }),
    obs({ creator: X, docSha256: H1, fetchedAt: 120 }), // an untrusted wallet
  ]
  const ev = evidenceFrom(H1, all, [run(A, 250), run(B, 400)], [A, B])

  it("both trusted: B still serves it, A saw it replaced", () => {
    const v = verdictFromEvidence(ev, [A, B])
    expect(v.overall).toBe("SERVED")
    expect(v.findings.map((f) => [f.witness, f.status])).toEqual([[B, "SERVED"], [A, "REPLACED"]])
    expect(v.ignored).toBe(1)
  })

  it("untrusting B leaves only A's REPLACED", () => {
    const v = verdictFromEvidence(ev, [A])
    expect(v.overall).toBe("REPLACED")
    expect(v.witnesses).toEqual([A])
    expect(v.ignored).toBe(2)
  })

  it("trusting nobody gives NOT_SEEN with every record ignored", () => {
    const v = verdictFromEvidence(ev, [])
    expect(v.overall).toBe("NOT_SEEN")
    expect(v.ignored).toBe(3)
  })

  it("toggling off and back on returns the identical verdict", () => {
    const before = verdictFromEvidence(ev, [A, B])
    verdictFromEvidence(ev, [A])
    expect(verdictFromEvidence(ev, [B, A])).toEqual(before)
  })

  it("refuses to judge for a witness whose records were not fetched", () => {
    expect(() => verdictFromEvidence(ev, [A, X])).toThrow(/not fetched/)
  })
})

describe("verdict consistency across code paths", () => {
  const all = [
    obs({ creator: A, docSha256: H1, fetchedAt: 100 }),
    obs({ creator: A, kind: "gone", prevSha256: H1, fetchedAt: 300, httpStatus: 404 }),
    obs({ creator: B, docSha256: H1, fetchedAt: 140 }),
  ]
  const runs = [run(A, 200), run(B, 500)]

  for (const trusted of [[A, B], [A], [B], []] as string[][]) {
    it(`evidence path == snapshot path == computeVerdict (trust ${trusted.length ? trusted.map((t) => t.slice(-2)).join("+") : "none"})`, () => {
      const viaEvidence = verdictFromEvidence(evidenceFrom(H1, all, runs, [A, B]), trusted)
      const viaSnapshot = verdictFromSnapshot({ observations: all, runs }, H1, trusted)
      const timelines = new Map<string, Observation[]>()
      for (const o of all) timelines.set(timelineKey(o.creator, o.urlKey), [...(timelines.get(timelineKey(o.creator, o.urlKey)) ?? []), o])
      const direct = computeVerdict(H1, all.filter((o) => o.docSha256 === H1), timelines, new Map([[A, [runs[0]]], [B, [runs[1]]]]), trusted)
      expect(viaEvidence).toEqual(direct)
      expect(viaSnapshot).toEqual(direct)
    })
  }
})

describe("backward compatibility: single witness", () => {
  it("one configured witness gives the same verdict as before (fetch only that witness)", () => {
    const all = [obs({ creator: A, docSha256: H1 }), obs({ creator: A, kind: "changed", docSha256: H2, prevSha256: H1, fetchedAt: 300 })]
    const viaEvidence = verdictFromEvidence(evidenceFrom(H1, all, [], [A]), [A])
    const direct = computeVerdict(H1, [all[0]], new Map([[timelineKey(A, U1), all]]), new Map(), [A])
    expect(viaEvidence).toEqual(direct)
    expect(viaEvidence.overall).toBe("REPLACED")
  })

  it("selectWitnessRuns keeps only configured witnesses, latest first, case-insensitive", () => {
    const rs = [run(A, 100), run(X, 999), run(B, 300), run("0x00000000000000000000000000000000000000AA", 200)]
    expect(selectWitnessRuns(rs, [A]).map((r) => r.runAt)).toEqual([200, 100])
    expect(selectWitnessRuns(rs, [A, B]).map((r) => r.runAt)).toEqual([300, 200, 100])
    expect(selectWitnessRuns(rs, [])).toEqual([])
  })
})

describe("configured witnesses A and B (shape of the real Tiramisu records)", async () => {
  const { WITNESSES } = await import("../src/lib/config")
  const [WA, WB] = WITNESSES.map((w) => w.address)
  const N1 = `0x${"31".repeat(32)}` as const, N2 = `0x${"32".repeat(32)}` as const
  const S1 = `0x${"e1".repeat(32)}` as const, S2v1 = `0x${"e2".repeat(32)}` as const, S2v2 = `0x${"e3".repeat(32)}` as const
  const all = [
    obs({ creator: WA, urlKey: N1, docSha256: S1, fetchedAt: 1000 }),
    obs({ creator: WA, urlKey: N2, docSha256: S2v1, fetchedAt: 1000 }),
    obs({ creator: WA, urlKey: N2, kind: "changed", docSha256: S2v2, prevSha256: S2v1, fetchedAt: 1100 }),
    obs({ creator: WB, urlKey: N1, docSha256: S1, fetchedAt: 5000 }),
  ]
  const runs = [run(WA, 1100), run(WB, 5000)]
  const ev = (h: `0x${string}`) => evidenceFrom(h, all, runs, [WA, WB])

  it("config lists two distinct witness identities", () => {
    expect(WITNESSES).toHaveLength(2)
    expect(new Set(WITNESSES.map((w) => w.address.toLowerCase())).size).toBe(2)
  })
  it("both trusted: sample 1 is SERVED by 2 distinct witnesses", () => {
    const v = verdictFromEvidence(ev(S1), [WA, WB])
    expect(v.overall).toBe("SERVED")
    expect(v.witnesses).toHaveLength(2)
  })
  it("only A trusted: 1 witness, B's record is ignored, not counted", () => {
    const v = verdictFromEvidence(ev(S1), [WA])
    expect(v.witnesses).toEqual([WA.toLowerCase()])
    expect(v.ignored).toBe(1)
  })
  it("only B trusted: still SERVED, by B alone", () => {
    const v = verdictFromEvidence(ev(S1), [WB])
    expect(v.overall).toBe("SERVED")
    expect(v.witnesses).toEqual([WB.toLowerCase()])
  })
  it("a file only A saw (notice 2 v1) is REPLACED with A, and NOT_SEEN when only B is trusted", () => {
    expect(verdictFromEvidence(ev(S2v1), [WA, WB]).overall).toBe("REPLACED")
    expect(verdictFromEvidence(ev(S2v1), [WA, WB]).witnesses).toHaveLength(1)
    expect(verdictFromEvidence(ev(S2v1), [WB]).overall).toBe("NOT_SEEN")
  })
  it("lowercase and checksummed forms of the same addresses are the same identities", () => {
    const v = verdictFromEvidence(ev(S1), [WA.toLowerCase(), WB.toLowerCase()])
    expect(v).toEqual(verdictFromEvidence(ev(S1), [WA, WB]))
  })
  it("a wallet outside the fetched set cannot be trusted silently", () => {
    expect(() => verdictFromEvidence(ev(S1), [WA, X])).toThrow(/not fetched/)
  })
  it("snapshot path agrees with the verify path for A+B", () => {
    expect(verdictFromSnapshot({ observations: all, runs }, S1, [WA, WB])).toEqual(verdictFromEvidence(ev(S1), [WA, WB]))
  })
})
