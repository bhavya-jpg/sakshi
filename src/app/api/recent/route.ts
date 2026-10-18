import { NextResponse } from "next/server"
import { allObservations } from "@/lib/arkiv"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// GET /api/recent  → all Sakshi observations (any creator), newest first
export async function GET() {
  try {
    const rows = await allObservations()
    rows.sort((a, b) => b.fetchedAt - a.fetchedAt)
    return NextResponse.json({ observations: rows })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.split("\n")[0] }, { status: 502 })
  }
}
