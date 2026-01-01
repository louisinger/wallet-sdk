import { WalletDashboard } from '@/components/WalletDashboard'
import { getWalletInfo } from '@/lib/wallet-server'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const walletInfo = await getWalletInfo()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.bitcoin}>₿</span> Arkade Wallet
        </h1>
        <p className={styles.subtitle}>
          Powered by <code>@arklabs/wallet-sdk</code>
        </p>
      </header>

      <WalletDashboard initialData={walletInfo} />

      <footer className={styles.footer}>
        <p>
          Built with Next.js Server Components and{' '}
          <a
            href="https://github.com/ark-network/ark"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ark Protocol
          </a>
        </p>
      </footer>
    </main>
  )
}
