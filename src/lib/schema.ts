// The Sakshi data contract on Arkiv. Mirrored in /arkiv/schema.md.
import { bytes32, i32, str, u64, type AttributeInputs, type Attributes } from "@arkiv-network/sdk"
import { PROJECT, SCHEMA_VERSION } from "./config"

export type Hex32 = `0x${string}`
export type ObservationKind = "seen" | "changed" | "gone"
export type SourceTier = "official" | "demo"

export type ObservationPayload = {
  url: string
  final_url?: string
  title?: string
  content_type?: string
  content_length?: number
  etag?: string
  last_modified?: string
  witness_label?: string
}

export type ObservationInput = {
  kind: ObservationKind
  urlKey: Hex32
  domain: string
  docSha256?: Hex32
  prevSha256?: Hex32
  fetchedAt: number // unix seconds
  httpStatus: number
  sourceTier: SourceTier
}

export function observationAttributes(o: ObservationInput): AttributeInputs {
  const a: Record<string, AttributeInputs[string]> = {
    project: str(PROJECT),
    entity_type: str("observation"),
    schema_version: i32(SCHEMA_VERSION),
    kind: str(o.kind),
    url_key: bytes32(o.urlKey),
    domain: str(o.domain),
    fetched_at: u64(o.fetchedAt),
    http_status: i32(o.httpStatus),
    source_tier: str(o.sourceTier),
  }
  if (o.docSha256) a.doc_sha256 = bytes32(o.docSha256)
  if (o.prevSha256) a.prev_sha256 = bytes32(o.prevSha256)
  return a
}

export type RunInput = { runAt: number; sourcesChecked: number; changes: number }

export function runAttributes(r: RunInput): AttributeInputs {
  return {
    project: str(PROJECT),
    entity_type: str("run"),
    schema_version: i32(SCHEMA_VERSION),
    run_at: u64(r.runAt),
    sources_checked: i32(r.sourcesChecked),
    changes: i32(r.changes),
  }
}

/** Plain JSON-safe view of an observation entity, as the UI and CLI use it. */
export type Observation = {
  key: Hex32
  creator: Hex32
  createdAtBlock: string
  expiresAtBlock: string
  kind: ObservationKind
  urlKey: Hex32
  domain: string
  docSha256?: Hex32
  prevSha256?: Hex32
  fetchedAt: number
  httpStatus: number
  sourceTier: SourceTier
  payload: ObservationPayload
}

export type Run = {
  key: Hex32
  creator: Hex32
  runAt: number
  sourcesChecked: number
  changes: number
}

const v = (attrs: Attributes | undefined, name: string) => attrs?.[name]?.value as unknown

type RawEntity = {
  key?: Hex32
  creator?: Hex32
  createdAt?: bigint
  expiresAt?: bigint
  attributes?: Attributes
  toJson?: () => unknown
}

export function toObservation(e: RawEntity): Observation {
  const a = e.attributes
  let payload: ObservationPayload = { url: "" }
  try {
    payload = (e.toJson?.() as ObservationPayload) ?? payload
  } catch {
    // unreadable payload: keep the attributes, show no URL
  }
  return {
    key: e.key as Hex32,
    creator: e.creator as Hex32,
    createdAtBlock: String(e.createdAt ?? ""),
    expiresAtBlock: String(e.expiresAt ?? ""),
    kind: v(a, "kind") as ObservationKind,
    urlKey: v(a, "url_key") as Hex32,
    domain: v(a, "domain") as string,
    docSha256: v(a, "doc_sha256") as Hex32 | undefined,
    prevSha256: v(a, "prev_sha256") as Hex32 | undefined,
    fetchedAt: Number(v(a, "fetched_at") ?? 0),
    httpStatus: Number(v(a, "http_status") ?? 0),
    sourceTier: (v(a, "source_tier") as SourceTier) ?? "official",
    payload,
  }
}

export function toRun(e: RawEntity): Run {
  const a = e.attributes
  return {
    key: e.key as Hex32,
    creator: e.creator as Hex32,
    runAt: Number(v(a, "run_at") ?? 0),
    sourcesChecked: Number(v(a, "sources_checked") ?? 0),
    changes: Number(v(a, "changes") ?? 0),
  }
}
