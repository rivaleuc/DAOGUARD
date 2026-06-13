import { createClient, createAccount } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import type { Address } from 'genlayer-js/types'

export const CONTRACT = '0x04C2242963bCE3686BF050E27AE7Fded463302a1' as Address

// Burner account (testnet only) funded with GEN for write transactions.
const PK = (import.meta.env.VITE_BURNER_PK ?? '') as `0x${string}`
const account = PK ? createAccount(PK) : undefined

export const client = createClient({
  chain: testnetBradbury,
  account,
})

// Real read of a contract view method
export async function read(functionName: string, args: any[] = []) {
  return client.readContract({
    address: CONTRACT,
    functionName,
    args,
  })
}

// Real write — submits a transaction and waits for the receipt
export async function write(functionName: string, args: any[] = []) {
  const txHash = await client.writeContract({
    address: CONTRACT,
    functionName,
    args,
    value: 0n,
  })
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: 'FINALIZED',
    retries: 40,
    interval: 5000,
  })
  return { txHash, receipt }
}
