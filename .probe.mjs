const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] })
for (;;) {
  // cheapest possible arkiv_query probe is not documented; use the SDK once with no retries
  const { createPublicClient } = await import("@arkiv-network/sdk")
  const { tiramisu } = await import("@arkiv-network/sdk/chains")
  const { eq } = await import("@arkiv-network/sdk/query")
  const { str } = await import("@arkiv-network/sdk")
  const { http } = await import("viem")
  const c = createPublicClient({ chain: tiramisu, transport: http(undefined, { retryCount: 0 }) })
  try {
    const r = await c.select({ key: true }).where(eq("project", str("sakshi-v1"))).limit(1).fetch()
    console.log(new Date().toISOString(), "QUERY OK", r.entities.length); break
  } catch (e) { console.log(new Date().toISOString(), "blocked:", String(e.message).split("\n")[0].slice(0, 80)) }
  await new Promise((s) => setTimeout(s, 90000))
}
