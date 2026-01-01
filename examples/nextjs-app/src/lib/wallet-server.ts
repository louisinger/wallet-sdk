import 'server-only'
// Import directly from SDK source for workspace linking
import { Wallet } from '@arklabs/wallet-sdk/src/core/wallet'
import { InMemoryKey } from '@arklabs/wallet-sdk/src/core/identity'
import { ESPLORA_URL } from '@arklabs/wallet-sdk/src/providers/esplora'
import type { WalletConfig } from '@arklabs/wallet-sdk/src/types/wallet'

// Server-side wallet instance (singleton pattern for demo)
let walletInstance: Wallet | null = null

export interface WalletInfo {
  address: {
    onchain: string
    offchain?: string
    bip21: string
  }
  balance: {
    total: number
    onchain: {
      confirmed: number
      unconfirmed: number
      total: number
    }
    offchain: {
      settled: number
      pending: number
      swept: number
      total: number
    }
  }
  network: string
  hasArkSupport: boolean
}

function getWalletConfig(): WalletConfig {
  // In production, use environment variables for sensitive data
  const privateKey = process.env.WALLET_PRIVATE_KEY
  const network = (process.env.WALLET_NETWORK || 'testnet') as WalletConfig['network']
  const esploraUrl = process.env.ESPLORA_URL || ESPLORA_URL[network]
  const arkServerUrl = process.env.ARK_SERVER_URL
  const arkServerPublicKey = process.env.ARK_SERVER_PUBLIC_KEY

  // For demo purposes, generate a random key if none provided
  // WARNING: In production, always use persistent keys!
  let identity: ReturnType<typeof InMemoryKey.fromHex>
  if (privateKey) {
    identity = InMemoryKey.fromHex(privateKey)
  } else {
    // Generate a demo private key (32 bytes = 64 hex chars)
    const demoKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    identity = InMemoryKey.fromHex(demoKey)
  }

  const config: WalletConfig = {
    network,
    identity,
    esploraUrl,
  }

  // Add Ark configuration if available
  if (arkServerUrl && arkServerPublicKey) {
    config.arkServerUrl = arkServerUrl
    config.arkServerPublicKey = arkServerPublicKey
  }

  return config
}

export function getWallet(): Wallet {
  if (!walletInstance) {
    const config = getWalletConfig()
    walletInstance = new Wallet(config)
  }
  return walletInstance
}

export async function getWalletInfo(): Promise<WalletInfo> {
  const wallet = getWallet()
  const address = wallet.getAddress()
  
  let balance
  try {
    balance = await wallet.getBalance()
  } catch (error) {
    console.error('Failed to fetch balance:', error)
    // Return zero balance on error
    balance = {
      total: 0,
      onchain: { confirmed: 0, unconfirmed: 0, total: 0 },
      offchain: { settled: 0, pending: 0, swept: 0, total: 0 },
    }
  }

  const network = process.env.WALLET_NETWORK || 'testnet'

  return {
    address: {
      onchain: address.onchain,
      offchain: address.offchain,
      bip21: address.bip21,
    },
    balance: {
      total: balance.total,
      onchain: balance.onchain,
      offchain: balance.offchain,
    },
    network,
    hasArkSupport: !!address.offchain,
  }
}

export async function sendBitcoin(
  address: string,
  amount: number,
  feeRate?: number
): Promise<{ txid: string; type: 'onchain' | 'offchain' }> {
  const wallet = getWallet()
  
  // Determine if this should be an offchain transaction
  const walletAddress = wallet.getAddress()
  const isOffchain = !!walletAddress.offchain && address.startsWith('tark')
  
  let txid: string
  if (isOffchain) {
    txid = await wallet.sendOffchain({ address, amount, feeRate })
  } else {
    txid = await wallet.sendOnchain({ address, amount, feeRate })
  }

  return {
    txid,
    type: isOffchain ? 'offchain' : 'onchain',
  }
}

export async function getCoins() {
  const wallet = getWallet()
  return wallet.getCoins()
}

export async function getVirtualCoins() {
  const wallet = getWallet()
  return wallet.getVirtualCoins()
}
