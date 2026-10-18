// SHA-256 helpers that work in both the browser (WebCrypto) and Node 18+ (globalThis.crypto).

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<`0x${string}`> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource)
  return `0x${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")}`
}

/** Lowercase scheme and host, drop the #fragment, keep path and query exactly. */
export function normalizeUrl(input: string): string {
  const u = new URL(input.trim())
  u.hash = ""
  return `${u.protocol.toLowerCase()}//${u.host.toLowerCase()}${u.pathname}${u.search}`
}

export async function urlKey(url: string): Promise<`0x${string}`> {
  return sha256Hex(new TextEncoder().encode(normalizeUrl(url)))
}
