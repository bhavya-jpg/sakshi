import { NextResponse } from "next/server"
import { verifyHash } from "@/lib/service"
import { WITNESSES } from "@/lib/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/verify?h=0x<sha256>&w=0xA,0xB   (read-only; queries Tiramisu)
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams
  const h = (sp.get("h") ?? "").toLowerCase()
  if (!/^0x[0-9a-f]{64}$/.test(h)) return NextResponse.json({ error: "h must be a 0x-prefixed SHA-256" }, { status: 400 })
  const w = sp.get("w")
  const trusted = w === null ? WITNESSES.map((x) => x.address) : w.split(",").filter((a) => /^0x[0-9a-fA-F]{40}$/.test(a))
  try {
    return NextResponse.json(await verifyHash(h as `0x${string}`, trusted))
  } catch (e) {
    return NextResponse.json({ error: `Arkiv query failed: ${(e as Error).message.split("\n")[0]}` }, { status: 502 })
  }
}
