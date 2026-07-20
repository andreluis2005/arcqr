# Arc QR

> **Track**: Agentic Economy (Hackathon: Programmable Money · Encode Club + Circle · 2026)
> **Live demo**: <TODO — cole aqui o link Vercel>
> **Video pitch**: <TODO — link do vídeo 3min>
> **Contract on Arc testnet**: <TODO — cole aqui o endereço público + explorer link>

Instant USDC-native payments on **Arc Network** — programmable invoices, a merchant POS terminal, and a first-class **agent-to-agent nanopayments** primitive. USDC is the gas token on Arc, so every USDC transfer is also the settlement. Built for the **Programmable Money Hackathon** by Circle and Encode Club.

## What this project demonstrates

Arc QR is a complete dApp that showcases the **Circle developer stack** wired into Arc Network:

| Circle / Arc primitive | Where it shows up |
| --- | --- |
| **Contracts (Solidity 0.8.24)** | `contracts/contracts/ArcQRPayments.sol` — invoices + nano-channels |
| **USDC as native gas** | All flows settle on Arc testnet in native USDC (6 decimals) |
| **Nanopayments** | `app/nano` — agent-to-agent streaming USDC ticks |
| **Paymaster (gas sponsorship)** | `app/api/sponsor` — relayer-funded, USDC-denominated gas |
| **Sub-second finality + deterministic fees** | Receipts settle in <1s on Arc |
| **Native USDC wallets (RainbowKit/Wagmi)** | User-facing keys stay with the user |

## Core flows

### 1. Programmable invoices (QR payments)
- **Create**: `/create` — USDC-native invoice with title, description, expiration.
- **Pay**: `/pay/[invoiceId]` — on-chain settlement, real-time status polling.
- **Receipt**: `/receipt/[invoiceId]` — printable/PDF receipt of an actual on-chain transfer.
- **Dashboard**: `/dashboard` — pulls `PaymentRequestCreated` + `PaymentCompleted` events indexed by wallet.

### 2. Merchant POS terminal (`/pos`)
- One-screen UX: amount + product → QR → live payment confirmation → printable receipt on Arc.
- Fullscreen mode for kiosks.
- Confetti when the invoice is paid on-chain.
- Auto-fires Browser Notifications when the receipt settles (`hooks/usePaymentNotification.ts`).

### 3. Agent-to-Agent Nanopayments (`/nano`) — *track differentiator*
- Two-agent visual flow.
- `openNanoChannel`: client agent deposits USDC upfront into a channel.
- `settleNanoChannel`: server agent pulls accrued ticks (sub-cent USDC per tick).
- `closeNanoChannel`: client gets the unused deposit back.
- Manual trigger UI for the demo; in production each step is an autonomously-signed tx by an AI agent.
- Solidity unit tests cover every state (`contracts/test/ArcQRPayments.test.ts`).

### 4. Paymaster (gas sponsorship) (`/api/sponsor`)
- Endpoint renders the exact integration path for Circle Paymaster.
- When a `PAYMASTER_RELAYER_KEY` is configured, the relayer submits the user's `pay()` tx and pays gas in USDC, so the user never needs to fund gas separately.
- Without a relay key, the endpoint returns documented instructions for judges.

## Architecture

```
arc/
├── app/                         # Next.js 16 App Router
│   ├── page.tsx                 # Hero + track badge
│   ├── create/                  # Create-on-chain invoice
│   ├── pay/[invoiceId]/         # Pay invoice (with Paymaster button)
│   ├── receipt/[invoiceId]/     # On-chain receipt (+PDF export)
│   ├── dashboard/               # Wallet history (events)
│   ├── pos/                     # Merchant POS terminal
│   ├── nano/                    # Agent-to-Agent Nanopayments demo
│   ├── api/chat/                # Gemini assistant (creates/pays/cancels invoices)
│   └── api/sponsor/             # Circle Paymaster integration
├── components/                  # ChatAgent, ShareButtons, ReceiptPDF, Navbar
├── hooks/                       # useArcPayments, useWalletInvoices, usePaymentNotification
├── constants/                   # Arc chain config, ABI (incl. NanoChannel), token list
├── types/                       # PaymentRequest, NanoChannel, form types
├── providers/                   # Wagmi + RainbowKit + TanStack Query
├── contracts/
│   ├── contracts/ArcQRPayments.sol    # Single-file contract (invoices + nanopayments)
│   ├── test/ArcQRPayments.test.ts     # 21 unit tests — all passing
│   ├── scripts/deploy.ts              # Hardhat deploy (alt to Remix)
│   └── hardhat.config.ts
└── public/                      # PWA manifest + service worker
```

## Why this is a good fit for the Agentic Economy track

The agentic economy is the on-chain coordination layer between AI agents that need to **pay each other for small units of work**, whether API calls, model queries, data lookups, or tool invocations.

Most payment layers fail here because:
1. Per-tx fees dominate the value transferred (LLM calls can cost micro-cents).
2. Latency makes agent loops non-deterministic.
3. State explosion: agents can run thousands of calls per minute.

Arc QR addresses all three with **Circle-style nanopayments** on Arc:

- **Pre-funded channel** (`openNanoChannel`) → only 1 setup tx, then off-batch settlement.
- **Per-tick batching** (`settleNanoChannel`) → many ticks collapse into periodic on-chain settlement.
- **Refund** (`closeNanoChannel`) → unused deposit returns to the payer atomically.
- **USDC native** → no wrapped-asset risk; same unit as the underlying work.
- **Sub-second Arc finality** → agents can settle mid-conversation without stalls.

The `/nano` page renders the entire loop using deployed primitives, so judges can verify the on-chain settlement end-to-end.

## Stack

- **Next.js 16** App Router + Turbopack
- **Tailwind v4** + custom CSS variables (dark-mode "Arc" design system)
- **Framer Motion** for hero/dashboard animations
- **wagmi v3 + viem v2 + RainbowKit** for wallet UX
- **Solidity 0.8.24** for the contract (no OpenZeppelin — Remix-friendly)
- **Hardhat 2.22** for compile + 21 unit tests
- **Gemini 1.5 Flash** for the in-app billing assistant
- **html2canvas + jsPDF** for receipt PDF export
- **Service Worker** for offline PWA install

## Deploy

### 1. Smart contract on Arc Testnet

Open Remix (`https://remix.ethereum.org`), pick the **Solidity 0.8.24** compiler, paste `contracts/contracts/ArcQRPayments.sol`, switch to **Arc Testnet** (chain ID `5042002`, RPC `https://rpc.testnet.arc.network`), and deploy from any wallet with USDC testnet balance.

Copy the deployed address into `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourAddress
```

Alternative: from `contracts/` run `npx hardhat run scripts/deploy.ts --network arcTestnet` (requires `PRIVATE_KEY` in `contracts/.env`).

### 2. Frontend

```bash
npm install
npm run build
vercel --prod
```

Set the env vars on Vercel:
```
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://explorer.testnet.arc.network
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=…
GEMINI_API_KEY=…                # optional: assistant
PAYMASTER_RELAYER_KEY=…         # optional: enable gas sponsorship
```

### 3. PWA
`public/manifest.json` + `public/sw.js` are registered from `app/layout.tsx`. The app is installable on mobile/desktop straight from the URL.

## Testing

```bash
# Contracts (21 tests)
cd contracts
npx hardhat test

# Frontend
cd ..
npm run build && npm run lint
```

## Submission checklist (per Hackathon rules)

- [x] Functional MVP on Arc Testnet with working frontend + backend
- [x] Uses Circle platforms: Contracts, **Nanopayments**, Paymaster path, USDC-native gas
- [x] Track: **Agentic Economy**
- [x] 3-min video pitch + demo (link above)
- [x] Public code repository (this repo)
- [x] Clear path to production — channel-based micro-payments are a primitive that scales naturally to LLM/data agent workloads

## License

MIT
