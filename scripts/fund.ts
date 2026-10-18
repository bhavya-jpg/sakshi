// Send a small amount of test GLM from Witness A to another witness wallet on Tiramisu.
// Dry run by default: prints sender, recipient, chain, amount and gas estimate, and sends nothing.
// Usage: npx tsx scripts/fund.ts --to 0xRecipient [--amount 0.01] [--send]
import "dotenv/config"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { createPublicClient, createWalletClient, formatEther, http, isAddress, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { explorerTx } from "../src/lib/config"

const args = process.argv.slice(2)
const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }
const to = opt("to")
const amount = opt("amount") ?? "0.01"
const send = args.includes("--send")
const MAX = parseEther("0.1") // refuse anything larger: this is for gas only

if (!to || !isAddress(to, { strict: false })) throw new Error("--to must be a 0x address")
const pk = process.env.WITNESS_A_PRIVATE_KEY as `0x${string}` | undefined
if (!pk) throw new Error("WITNESS_A_PRIVATE_KEY missing from .env")
const from = privateKeyToAccount(pk)
if (from.address.toLowerCase() === to.toLowerCase()) throw new Error("recipient is the sender")
const value = parseEther(amount)
if (value <= 0n || value > MAX) throw new Error(`amount must be > 0 and <= ${formatEther(MAX)} GLM`)

const pub = createPublicClient({ chain: tiramisu, transport: http() })
const chainId = await pub.getChainId()
if (chainId !== 7738577) throw new Error(`refusing: connected to chain ${chainId}, expected Tiramisu 7738577`)
const [balFrom, balTo, gasPrice, gas, nonce] = await Promise.all([
  pub.getBalance({ address: from.address }), pub.getBalance({ address: to as `0x${string}` }),
  pub.getGasPrice(), pub.estimateGas({ account: from, to: to as `0x${string}`, value }), pub.getTransactionCount({ address: from.address }),
])
const fee = gas * gasPrice
console.log(`chain      ${tiramisu.name} (${chainId})`)
console.log(`from       ${from.address}  balance ${formatEther(balFrom)} GLM  nonce ${nonce}`)
console.log(`to         ${to}  balance ${formatEther(balTo)} GLM`)
console.log(`amount     ${formatEther(value)} GLM`)
console.log(`gas        ${gas} × ${gasPrice} wei = ${formatEther(fee)} GLM`)
if (balFrom < value + fee) throw new Error("sender balance too low")
if (!send) { console.log("dry run: nothing sent (add --send to transfer)"); process.exit(0) }

const wallet = createWalletClient({ chain: tiramisu, transport: http(), account: from })
const hash = await wallet.sendTransaction({ to: to as `0x${string}`, value, gas, nonce })
const receipt = await pub.waitForTransactionReceipt({ hash })
console.log(`tx         ${explorerTx(hash)}  status ${receipt.status}  block ${receipt.blockNumber}`)
console.log(`to balance ${formatEther(await pub.getBalance({ address: to as `0x${string}` }))} GLM`)
