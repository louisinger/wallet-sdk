import { NextRequest, NextResponse } from 'next/server'
import { sendBitcoin } from '@/lib/wallet-server'

interface SendRequest {
  address: string
  amount: number
  feeRate?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: SendRequest = await request.json()

    if (!body.address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      )
    }

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    if (body.amount < 546) {
      return NextResponse.json(
        { success: false, error: 'Amount is below dust limit (546 sats)' },
        { status: 400 }
      )
    }

    const result = await sendBitcoin(body.address, body.amount, body.feeRate)

    return NextResponse.json({
      success: true,
      data: {
        txid: result.txid,
        type: result.type,
      },
    })
  } catch (error) {
    console.error('Send bitcoin error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bitcoin',
      },
      { status: 500 }
    )
  }
}
