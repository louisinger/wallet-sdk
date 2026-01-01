import { NextResponse } from 'next/server'
import { getWallet } from '@/lib/wallet-server'

export async function GET() {
  try {
    const wallet = getWallet()
    const balance = await wallet.getBalance()

    return NextResponse.json({
      success: true,
      data: balance,
    })
  } catch (error) {
    console.error('Get balance error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance',
      },
      { status: 500 }
    )
  }
}
