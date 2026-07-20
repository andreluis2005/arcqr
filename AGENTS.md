<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — Arc QR: Guia de Contexto para IA

> **LEIA ESTE ARQUIVO ANTES DE QUALQUER COISA.**
> Este documento existe para que qualquer LLM (Claude, Gemini, GLM, Kimi, MiniMax, etc.) possa
> continuar o trabalho no projeto sem perder contexto. Siga todas as convenções aqui descritas.
> Após completar uma task, atualize `TASKS.md` e `CHANGELOG.md`.

---

## 1. O QUE É ESTE PROJETO

**Arc QR** é um dApp de pagamentos construído para o **Programmable Money Hackathon** da Encode Club
+ Circle (julho 2026, 7 semanas, online). Track alvo: **Agentic Economy**.

**Stack**: Next.js 16 (App Router) + Tailwind v4 + Framer Motion + Wagmi v3 + RainbowKit + Viem v2 + Gemini API (`gemini-1.5-flash`, free tier)

**Blockchain**: Arc Network Testnet (EVM-compatible L1 da Circle)
- Chain ID: `5042002` | RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://explorer.testnet.arc.network`
- Gas token: USDC nativo (6 decimais)

**Contrato**: `ArcQRPayments.sol` — endereço em `NEXT_PUBLIC_CONTRACT_ADDRESS`
- Funções: `createPaymentRequest`, `pay`, `cancel`, `getRequest`
- Eventos: `PaymentRequestCreated`, `PaymentCompleted`, `PaymentCancelled`

**Deploy**: Vercel free tier. `npm run build` deve sempre passar sem erros.

---

## 2. ESTRUTURA DE ARQUIVOS

```
arc/
├── AGENTS.md              ← ESTE ARQUIVO (contexto para LLMs)
├── TASKS.md               ← Lista de tasks e status (atualizar sempre)
├── CHANGELOG.md           ← Histórico de mudanças (atualizar sempre)
├── app/
│   ├── layout.tsx         ← Root layout (Providers + Navbar)
│   ├── page.tsx           ← Landing page
│   ├── globals.css        ← Design system (CSS vars + utilitários)
│   ├── create/page.tsx    ← Criar fatura on-chain
│   ├── pay/[invoiceId]/   ← Pagar fatura
│   ├── receipt/[invoiceId]/← Recibo on-chain
│   ├── dashboard/         ← [NOVO] Dashboard por wallet
│   ├── pos/               ← [NOVO] Modo comerciante
│   └── api/chat/route.ts  ← API do assistente IA (Gemini)
├── components/
│   ├── layout/Navbar.tsx
│   ├── ChatAgent.tsx      ← [NOVO] Chat flutuante com agente IA
│   ├── ShareButtons.tsx   ← [NOVO] Botões de compartilhamento
│   └── ReceiptPDF.tsx     ← [NOVO] Export de recibo como PDF
├── constants/
│   ├── chain.ts           ← Arc Testnet para Wagmi
│   └── contracts.ts       ← ABI + endereço + tokens
├── hooks/
│   ├── useArcPayments.ts  ← Hooks existentes de blockchain
│   ├── useWalletInvoices.ts ← [NOVO] Busca faturas por wallet (eventos)
│   └── usePaymentNotification.ts ← [NOVO] Notif. quando fatura é paga
├── lib/
│   └── utils.ts           ← Utilitários puros
├── providers/index.tsx    ← Wagmi + QueryClient + RainbowKit
└── types/index.ts         ← PaymentRequest, PaymentStatus, etc.
```

---

## 3. CONVENÇÕES OBRIGATÓRIAS

### CSS / Estilo
- **NÃO use classes Tailwind inline no JSX** — use `style={{...}}` com CSS vars de `globals.css`
- CSS vars: `var(--surface)`, `var(--surface-2)`, `var(--border)`, `var(--text-primary)`, `var(--text-secondary)`
- Classes utilitárias (definidas em globals.css): `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input-field`, `.label`, `.badge`, `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-pending`, `.gradient-text`, `.gradient-text-white`, `.orb`, `.orb-purple`, `.orb-blue`, `.float-animation`

### Paleta de Cores
- Primária: `#7c3aed` / `#5b21b6` / `#a78bfa`
- Background: `#060a12` / Surface: `#0d1117`
- Sucesso: `#4ade80` | Erro: `#f87171` | Aviso: `#fbbf24`

### Animações (sempre usar framer-motion)
- Entrada: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- Hover card: `whileHover={{ y: -4 }}`
- Botão: `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}`

### Blockchain
- **NUNCA use ethers.js** — somente `viem` e `wagmi`
- `ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"` → token nativo (USDC, 6 decimais)
- `parseAmount(str, decimals)` → BigInt | `formatAmount(bigint, decimals)` → string
- Leituras: `usePublicClient({ chainId: ARC_TESTNET.id })`
- Escritas: `useWriteContract()`

### Componentes
- Adicionar `"use client"` em qualquer arquivo com hooks React/Wagmi/Framer Motion
- Server Components (sem "use client") podem ter `export const metadata = {...}` para SEO

### API de IA
- Endpoint: `POST /api/chat` | Modelo: `gemini-1.5-flash`
- Resposta JSON: `{ message: string, action: { type: string, params: object } }`
- Action types: `NONE | CREATE_INVOICE | PAY_INVOICE | CANCEL_INVOICE | SHOW_INVOICE_DETAILS`

---

## 4. STATUS ATUAL

### ✅ Implementado
- Smart contract (`contracts/contracts/ArcQRPayments.sol`) — 13 testes passando
- Landing page (`app/page.tsx`)
- Criar fatura + QR Code (`app/create/page.tsx`)
- Pagar fatura (`app/pay/[invoiceId]/page.tsx`)
- Recibo on-chain (`app/receipt/[invoiceId]/page.tsx`)
- Assistente IA básico (`app/api/chat/route.ts`)
- Navbar (`components/layout/Navbar.tsx`)
- Design system dark-mode (`app/globals.css`)
- Hooks de blockchain (`hooks/useArcPayments.ts`)

### 🔲 Pendente — ver `TASKS.md`
T-01: Dashboard por wallet | T-02: Hook de faturas por wallet | T-03: Chat agent melhorado
T-04: Componente ChatAgent | T-05: ShareButtons | T-06: PDF export
T-07: Notificações | T-08: Modo POS | T-09: Landing redesign | T-10: PWA | T-11: i18n

---

## 5. REGRAS ABSOLUTAS

1. Nunca quebre o build (`npm run build` deve sempre passar)
2. Nunca adicione dependências pagas (tudo no free tier)
3. Nunca use `ethers.js`
4. Nunca use classes Tailwind inline
5. Sempre `"use client"` em arquivos com hooks
6. Sempre atualizar `TASKS.md` e `CHANGELOG.md` após cada task
7. Sempre manter este arquivo atualizado se a estrutura mudar

---

## 6. VARIÁVEIS DE AMBIENTE

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_EXPLORER_URL=https://explorer.testnet.arc.network
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
GEMINI_API_KEY=...
```

---

## 7. PARA O PRÓXIMO AGENTE IA

1. Leia este arquivo completo
2. Leia `TASKS.md` para ver o estado atual
3. Leia `CHANGELOG.md` para ver o que foi feito recentemente
4. Implemente tasks na ordem de prioridade
5. Após cada task: marque em TASKS.md + registre em CHANGELOG.md

