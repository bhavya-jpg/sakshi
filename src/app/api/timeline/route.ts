import { NextResponse } from "next/server"
import { urlTimeline } from "@/lib/service"
import { normalizeUrl, urlKey } from "@/lib/hash"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/timeline?u=<url>   or   ?k=0x<url_key>
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  try {
    let k = sp.get("k")?.toLowerCase()
    let url: string | undefined
    if (!k) {
      url = normalizeUrl(sp.get("u") ?? "")
      k = await urlKey(url)
    }
    if (!/^0x[0-9a-f]{64}$/.test(k)) return NextResponse.json({ error: "bad url key" }, { status: 400 })
    return NextResponse.json({ url, ...(await urlTimeline(k as `0x${string}`)) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.split("\n")[0] }, { status: 400 })
  }
}
