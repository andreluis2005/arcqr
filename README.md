# Arc QR — Blockchain Payment Requests on Arc Network

> **Create blockchain payment requests in seconds.**  
> Built for hackathons, builders and the Arc Network ecosystem by Circle.

![Arc QR](https://img.shields.io/badge/Arc%20Network-Testnet-7c3aed?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)

---

## 🎯 Project Overview

**Arc QR** is a production-ready MVP that allows anyone to create, share, and pay blockchain payment requests on the **Arc Network** (a Circle-built EVM-compatible L1 blockchain with native USDC gas).

Users can:
- Create a payment request on-chain with a title, description, amount (USDC), recipient and expiration
- Generate a **shareable link** and **QR Code** instantly
- Pay any open invoice directly from the browser using any Web3 wallet
- View a full **on-chain receipt** with all transaction details

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧾 **On-chain Invoices** | All payment requests are stored on the `ArcQRPayments` smart contract |
| 📲 **QR Code Generation** | Instant QR code for any invoice, downloadable as PNG |
| 💸 **One-Click Payment** | Pay any open invoice from your browser wallet |
| 🔒 **Secure Cancellation** | Only the creator can cancel an unpaid invoice |
| ⏱️ **Expiration Control** | Invoices automatically expire after a configured duration |
| ✅ **Animated Success Screen** | Premium success animation after payment confirmation |
| 🧾 **Receipt Page** | Full on-chain receipt with all payment details |
| 🌐 **Arc Testnet** | Configured exclusively for Circle's Arc Testnet (Chain ID: 5042002) |
| 📱 **Mobile-First** | Fully responsive design |
| 🌑 **Dark Mode** | Premium dark-mode-only UI inspired by Stripe |

---

## 🏗️ Architecture

```
arc-qr/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with providers & navbar
│   ├── page.tsx                # Home page with hero
│   ├── globals.css             # Global CSS design system
│   ├── create/                 # Create payment request page
│   │   └── page.tsx
│   ├── pay/[invoiceId]/        # Pay invoice page (dynamic)
│   │   └── page.tsx
│   └── receipt/[invoiceId]/   # Receipt page (dynamic)
│       └── page.tsx
├── components/
│   └── layout/
│       └── Navbar.tsx          # Top navigation bar
├── constants/
│   ├── chain.ts                # Arc Testnet chain definition (Wagmi)
│   └── contracts.ts            # ABI + contract address + tokens
├── contracts/                  # Hardhat smart contract suite
│   ├── contracts/
│   │   ├── ArcQRPayments.sol   # Main payment contract
│   │   └── mocks/MockERC20.sol # ERC20 mock for testing
│   ├── test/
│   │   └── ArcQRPayments.test.ts
│   ├── scripts/
│   │   └── deploy.ts
│   └── hardhat.config.ts
├── hooks/
│   └── useArcPayments.ts       # Blockchain interaction hooks
├── lib/
│   └── utils.ts                # Utility functions
├── providers/
│   └── index.tsx               # Wagmi + RainbowKit + TanStack Query
└── types/
    └── index.ts                # TypeScript types
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A Web3 wallet (MetaMask, Rainbow)
- Arc Testnet added to your wallet ([Chain ID: 5042002](https://rpc.testnet.arc.network))

### 1. Clone and Install

```bash
git clone https://github.com/your-org/arc-qr.git
cd arc-qr
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract_address>
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://explorer.testnet.arc.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your_walletconnect_id>
```

> Get a free WalletConnect Project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com)

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📦 How to Deploy the Smart Contract

### Prerequisites
- Node.js 18+
- Arc Testnet USDC for gas in your deployer wallet

### 1. Setup

```bash
cd contracts
npm install
```

### 2. Configure

Create a `.env` in `/contracts`:

```env
PRIVATE_KEY=your_deployer_private_key_without_0x_prefix
```

### 3. Deploy to Arc Testnet

```bash
npx hardhat run scripts/deploy.ts --network arcTestnet
```

Copy the deployed contract address from the output and set it as `NEXT_PUBLIC_CONTRACT_ADDRESS` in your frontend `.env.local`.

### 4. Run Tests

```bash
npx hardhat test
```

All 13 tests should pass, covering:
- Payment request creation
- Native token payment
- ERC20 token payment
- Double payment prevention
- Expiration enforcement
- Creator-only cancellation

---

## ☁️ How to Deploy on Vercel

1. Push your project to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repository
4. Set environment variables in the Vercel dashboard:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://explorer.testnet.arc.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

5. Deploy — Vercel will automatically build and deploy.

---

## 🗺️ Future Roadmap

| Feature | Priority |
|---|---|
| 📋 Wallet Invoice History | High |
| 🔍 Invoice Search by ID | High |
| 🌙 Light/Dark Theme Toggle | Medium |
| 🪙 Multi-Token Support (ERC20) | Medium |
| 📄 Export Receipt as PDF | Medium |
| 🐦 Share on X (Twitter) | Low |
| 📊 Dashboard with Analytics | Low |
| 🔔 Push Notifications on Payment | Low |
| 🌍 Multi-language Support | Low |

---

## 🔗 Arc Network

Arc is a public EVM-compatible Layer-1 blockchain built by Circle.

| Detail | Value |
|---|---|
| **Network Name** | Arc Testnet |
| **Chain ID** | 5042002 |
| **RPC URL** | https://rpc.testnet.arc.network |
| **Explorer** | https://explorer.testnet.arc.network |
| **Gas Token** | USDC (native) |

---

## 📄 License

MIT

---

Built with ❤️ for the **Arc Hackathon** by the Arc QR team.
