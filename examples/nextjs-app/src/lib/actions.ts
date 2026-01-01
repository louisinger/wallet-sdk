'use server'

import { sendBitcoin, getWalletInfo } from './wallet-server'

export interface SendResult {
  success: boolean
  txid?: string
  type?: 'onchain' | 'offchain'
  error?: string
}

export async function sendBitcoinAction(
  address: string,
  amount: number,
  feeRate?: number
): Promise<SendResult> {
  try {
    if (!address) {
      return { success: false, error: 'Address is required' }
    }

    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' }
    }

    if (amount < 546) {
      return { success: false, error: 'Amount is below dust limit (546 sats)' }
    }

    const result = await sendBitcoin(address, amount, feeRate)
    return {
      success: true,
      txid: result.txid,
      type: result.type,
    }
  } catch (error) {
    console.error('Send bitcoin error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export async function refreshWalletAction() {
  return getWalletInfo()
}
