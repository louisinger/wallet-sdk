'use client'

import { useState, useTransition } from 'react'
import type { WalletInfo } from '@/lib/wallet-server'
import { refreshWalletAction, sendBitcoinAction } from '@/lib/actions'
import styles from './WalletDashboard.module.css'

interface Props {
  initialData: WalletInfo
}

export function WalletDashboard({ initialData }: Props) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>(initialData)
  const [isPending, startTransition] = useTransition()
  const [sendAddress, setSendAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendResult, setSendResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleRefresh = () => {
    startTransition(async () => {
      const data = await refreshWalletAction()
      setWalletInfo(data)
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendResult(null)
    setIsSending(true)

    try {
      const amount = parseInt(sendAmount, 10)
      const result = await sendBitcoinAction(sendAddress, amount)

      if (result.success) {
        setSendResult({
          type: 'success',
          message: `Transaction sent! TXID: ${result.txid} (${result.type})`,
        })
        setSendAddress('')
        setSendAmount('')
        // Refresh wallet after send
        handleRefresh()
      } else {
        setSendResult({
          type: 'error',
          message: result.error || 'Transaction failed',
        })
      }
    } catch (error) {
      setSendResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSending(false)
    }
  }

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat().format(sats)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className={styles.dashboard}>
      {/* Network Badge */}
      <div className={styles.networkBadge}>
        <span className={styles.networkDot} />
        {walletInfo.network}
        {walletInfo.hasArkSupport && (
          <span className={styles.arkBadge}>+ Ark</span>
        )}
      </div>

      {/* Balance Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Balance</h2>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className={styles.refreshBtn}
          >
            {isPending ? '↻' : '⟳'}
          </button>
        </div>
        <div className={styles.totalBalance}>
          <span className={styles.sats}>{formatSats(walletInfo.balance.total)}</span>
          <span className={styles.unit}>sats</span>
        </div>

        <div className={styles.balanceBreakdown}>
          <div className={styles.balanceItem}>
            <h3>On-chain</h3>
            <div className={styles.balanceDetails}>
              <div>
                <span className={styles.label}>Confirmed:</span>
                <span>{formatSats(walletInfo.balance.onchain.confirmed)} sats</span>
              </div>
              <div>
                <span className={styles.label}>Unconfirmed:</span>
                <span>{formatSats(walletInfo.balance.onchain.unconfirmed)} sats</span>
              </div>
            </div>
          </div>

          {walletInfo.hasArkSupport && (
            <div className={styles.balanceItem}>
              <h3>Off-chain (Ark)</h3>
              <div className={styles.balanceDetails}>
                <div>
                  <span className={styles.label}>Settled:</span>
                  <span>{formatSats(walletInfo.balance.offchain.settled)} sats</span>
                </div>
                <div>
                  <span className={styles.label}>Pending:</span>
                  <span>{formatSats(walletInfo.balance.offchain.pending)} sats</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Address Card */}
      <div className={styles.card}>
        <h2>Receive</h2>
        <div className={styles.addressSection}>
          <div className={styles.addressItem}>
            <span className={styles.addressLabel}>Bitcoin Address</span>
            <div className={styles.addressValue}>
              <code>{walletInfo.address.onchain}</code>
              <button
                onClick={() => copyToClipboard(walletInfo.address.onchain)}
                className={styles.copyBtn}
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          {walletInfo.address.offchain && (
            <div className={styles.addressItem}>
              <span className={styles.addressLabel}>Ark Address</span>
              <div className={styles.addressValue}>
                <code>{walletInfo.address.offchain}</code>
                <button
                  onClick={() => copyToClipboard(walletInfo.address.offchain!)}
                  className={styles.copyBtn}
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
          )}

          <div className={styles.addressItem}>
            <span className={styles.addressLabel}>BIP21 URI</span>
            <div className={styles.addressValue}>
              <code className={styles.bip21}>{walletInfo.address.bip21}</code>
              <button
                onClick={() => copyToClipboard(walletInfo.address.bip21)}
                className={styles.copyBtn}
                title="Copy URI"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send Card */}
      <div className={styles.card}>
        <h2>Send</h2>
        <form onSubmit={handleSend} className={styles.sendForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="address">Recipient Address</label>
            <input
              type="text"
              id="address"
              value={sendAddress}
              onChange={(e) => setSendAddress(e.target.value)}
              placeholder="tb1... or tark1..."
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="amount">Amount (sats)</label>
            <input
              type="number"
              id="amount"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="10000"
              min="546"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className={styles.sendBtn}
          >
            {isSending ? 'Sending...' : 'Send Bitcoin'}
          </button>

          {sendResult && (
            <div
              className={`${styles.result} ${
                sendResult.type === 'success' ? styles.success : styles.error
              }`}
            >
              {sendResult.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
