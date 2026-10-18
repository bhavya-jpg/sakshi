// Public configuration. Nothing in this file is secret.

export const PROJECT = "sakshi-v1"
export const SCHEMA_VERSION = 1

export const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network"
export const EXPLORER = "https://tiramisu.explorer.arkiv.network"

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`
export const explorerAddress = (address: string) => `${EXPLORER}/address/${address}`

export type Witness = { address: `0x${string}`; label: string }

// Witness wallets whose records the reader trusts by default.
// Filled with real addresses once they have written to Tiramisu.
export const WITNESSES: Witness[] = [
  { address: "0xCB16Ca347dc560FdCA8891FB66077BD18a4e3bFa", label: "Sakshi witness A" },
  // A second witness identity (separate key and wallet), operated by the same team as A.
  { address: "0x077436BD0DF0A9050e8f6be74ee9dEF58A8E7AdA", label: "Sakshi witness B" },
]
