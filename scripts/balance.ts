import { createPublicClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { http } from "viem"
const c = createPublicClient({ chain: tiramisu, transport: http() })
console.log("chainId", await c.getChainId(), "block", await c.getBlockNumber(), "entityCount", await c.getEntityCount())
console.log("balance A", await c.getBalance({ address: process.argv[2] as `0x${string}` }))
