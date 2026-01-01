import { NextResponse } from 'next/server'
import { getWallet } from '@/lib/wallet-server'

export async function GET() {
  try {
    const wallet = getWallet()
    const address = wallet.getAddress()

    return NextResponse.json({
      success: true,
      data: {
        onchain: address.onchain,
        offchain: address.offchain,
        bip21: address.bip21,
      },
    })
  } catch (error) {
    console.error('Get address error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get address',
      },
      { status: 500 }
    )
  }
}
