import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arkade Wallet',
  description: 'Bitcoin wallet with Ark protocol support powered by @arklabs/wallet-sdk',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
