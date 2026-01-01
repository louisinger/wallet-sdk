# Arkade Next.js App

A Next.js server application demonstrating the `@arklabs/wallet-sdk` for building Bitcoin wallets with Ark protocol support.

## Features

- 🔐 **Server-side wallet operations** - Private keys never leave the server
- ⚡ **Server Components** - Fast initial page loads with React Server Components
- 🎯 **Server Actions** - Type-safe mutations with React Server Actions
- 💱 **On-chain & Off-chain** - Support for both Bitcoin and Ark transactions
- 🎨 **Modern UI** - Clean, responsive dashboard interface

## Getting Started

### Prerequisites

- Node.js 23.3.0+
- pnpm 9.15.0+

### Installation

1. Install dependencies from the workspace root:

```bash
cd /path/to/workspace
pnpm install
```

2. Navigate to the example app:

```bash
cd examples/nextjs-app
```

3. Create environment file:

```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
# Your wallet private key (64 hex characters)
WALLET_PRIVATE_KEY=your_private_key_here

# Network (bitcoin, testnet, signet, mutinynet, regtest)
WALLET_NETWORK=testnet

# Optional: Ark server for off-chain support
ARK_SERVER_URL=https://your-ark-server.com
ARK_SERVER_PUBLIC_KEY=your_ark_public_key
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the wallet dashboard.

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── wallet/
│   │       ├── address/    # GET wallet addresses
│   │       ├── balance/    # GET wallet balance
│   │       └── send/       # POST send bitcoin
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.module.css
│   └── page.tsx            # Main page (Server Component)
├── components/
│   └── WalletDashboard.tsx # Client component for interactivity
└── lib/
    ├── actions.ts          # Server Actions
    └── wallet-server.ts    # Server-side wallet utilities
```

## API Routes

### GET `/api/wallet/address`

Returns wallet addresses (on-chain and off-chain if Ark is configured).

### GET `/api/wallet/balance`

Returns detailed balance breakdown for on-chain and off-chain funds.

### POST `/api/wallet/send`

Send bitcoin to an address.

**Request body:**

```json
{
  "address": "tb1q...",
  "amount": 10000,
  "feeRate": 1
}
```

## Security Considerations

⚠️ **Important**: This example is for demonstration purposes. In production:

- Store private keys securely (HSM, Vault, etc.)
- Use proper authentication and authorization
- Implement rate limiting and input validation
- Use HTTPS in production
- Never commit private keys or sensitive data

## License

MIT
