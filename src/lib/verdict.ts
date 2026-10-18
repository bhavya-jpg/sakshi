// Pure verdict logic. No network. Used by the web API and the CLI so both give the same answer.
import type { Hex32, Observation, Run } from "./schema"

export type Status = "SERVED" | "REPLACED" | "REMOVED"
export type Overall = Status | "NOT_SEEN"

export type Finding = {
  status: Status
  witness: Hex32
  url: string
  urlKey: Hex32
  domain: string
  sourceTier: Observation["sourceTier"]
  firstSeen: number // fetched_at of the earliest observation of this hash at this URL
  lastConfirmed: number // latest moment this witness confirmed the hash was still served
  endedAt?: number // when it was replaced / removed
  replacedBy?: Hex32
  evidence: Observation[] // this witness's timeline for this URL
}

export type Verdict = {
  hash: Hex32
  overall: Overall
  findings: Finding[]
  witnesses: Hex32[] // distinct trusted witnesses with findings
  ignored: number // observations of this hash from wallets the reader does not trust
}

const lc = (s: string) => s.toLowerCase() as Hex32

/**
 * @param hits observations whose doc_sha256 equals `hash` (any creator)
 * @param timelines `${creator}|${urlKey}` → that witness's full timeline for the URL (sorted by fetched_at)
 * @param runs creator → that witness's runs (any order)
 * @param trusted witness addresses the reader trusts
 */
export function computeVerdict(
  hash: Hex32,
  hits: Observation[],
  timelines: Map<string, Observation[]>,
  runs: Map<string, Run[]>,
  trusted: string[],
): Verdict {
  const trust = new Set(trusted.map(lc))
  const h = lc(hash)
  const trustedHits = hits.filter((o) => trust.has(lc(o.creator)))
  const groups = new Map<string, Observation[]>()
  for (const o of trustedHits) {
    const k = timelineKey(o.creator, o.urlKey)
    groups.set(k, [...(groups.get(k) ?? []), o])
  }

  const findings: Finding[] = []
  for (const [k, groupHits] of groups) {
    const timeline = [...(timelines.get(k) ?? groupHits)].sort(byTime)
    const first = [...groupHits].sort(byTime)[0]
    // the first record after the hash was seen that says the URL now serves something else / nothing
    const end = timeline.find(
      (o) => o.fetchedAt >= first.fetchedAt && (o.kind === "gone" || (o.docSha256 && lc(o.docSha256) !== h)),
    )
    // the last observation with this hash before it ended
    const sameBeforeEnd = timeline.filter(
      (o) => o.docSha256 && lc(o.docSha256) === h && (!end || o.fetchedAt <= end.fetchedAt),
    )
    const lastObs = sameBeforeEnd.at(-1) ?? first
    let lastConfirmed = lastObs.fetchedAt
    let status: Status = "SERVED"
    if (end) {
      status = end.kind === "gone" ? "REMOVED" : "REPLACED"
      // runs between the last same-hash observation and the end also confirmed it
      for (const r of runs.get(lc(first.creator)) ?? []) {
        if (r.runAt > lastConfirmed && r.runAt < end.fetchedAt) lastConfirmed = r.runAt
      }
    } else {
      for (const r of runs.get(lc(first.creator)) ?? []) if (r.runAt > lastConfirmed) lastConfirmed = r.runAt
    }
    findings.push({
      status,
      witness: lc(first.creator),
      url: first.payload.url,
      urlKey: first.urlKey,
      domain: first.domain,
      sourceTier: first.sourceTier,
      firstSeen: first.fetchedAt,
      lastConfirmed,
      endedAt: end?.fetchedAt,
      replacedBy: end?.kind === "changed" ? end.docSha256 : undefined,
      evidence: timeline,
    })
  }

  const rank: Record<Status, number> = { SERVED: 0, REPLACED: 1, REMOVED: 2 }
  findings.sort((a, b) => rank[a.status] - rank[b.status] || b.lastConfirmed - a.lastConfirmed)
  return {
    hash: h,
    overall: findings[0]?.status ?? "NOT_SEEN",
    findings,
    witnesses: [...new Set(findings.map((f) => f.witness))],
    ignored: hits.length - trustedHits.length,
  }
}

export const timelineKey = (creator: string, urlKey: string) => `${creator.toLowerCase()}|${urlKey.toLowerCase()}`

const byTime = (a: Observation, b: Observation) =>
  a.fetchedAt - b.fetchedAt || Number(a.createdAtBlock) - Number(b.createdAtBlock)

export const VERDICT_TEXT: Record<Overall, { en: string; hi: string; note: string }> = {
  SERVED: { en: "Served", hi: "उपलब्ध", note: "A witness you trust saw this exact file at the URL below, and has not seen it change." },
  REPLACED: { en: "Replaced", hi: "बदला गया", note: "This exact file was served at the URL below, and the URL later started serving a different file." },
  REMOVED: { en: "Removed", hi: "हटाया गया", note: "This exact file was served at the URL below, and the URL later disappeared." },
  NOT_SEEN: {
    en: "No matching record",
    hi: "कोई रिकॉर्ड नहीं",
    note: "No witness you trust has recorded this exact file. This does NOT mean the file is fake. It may never have been witnessed, or it may differ by a single byte (re-saved, compressed, edited). Check the official website.",
  },
}
