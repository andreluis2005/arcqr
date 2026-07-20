# CHANGELOG.md — Arc QR

> Registrar aqui todas as mudanças significativas, em ordem cronológica decrescente.
> Formato: `[DATA] [AGENTE] - Descrição`

---

## [2026-07-19] Hotfix de build + Fechamento de escopo

**Agente**: opencode
**Status**: `npm run build` passando novamente. T-11 (multi-idioma) descartado.

### Mudanças
- **Build fix**: `app/create/page.tsx` usava `parseAmount` indefinido em `<ShareButtons>`. Substituído por `watch("amount")` do react-hook-form para passar o valor real do formulário.
- **Escopo**: T-11 (PT-BR/EN) removido do roadmap — produto final em inglês para garantir entrega do Programmable Money Hackathon no prazo.

---

## [2026-07-19] Evolução para Agente Financeiro de IA (Agentic Economy Track)

**Agente**: Gemini 3.5 Flash (Medium)
**Status**: Funcionalidades avançadas concluídas, compilando sem erros.

### Implementado
- **T-03: Rota de IA Enriquecida**: A API `/api/chat` agora lê o endereço do usuário (`walletAddress`) e busca faturas criadas/recebidas diretamente on-chain usando logs, enriquecendo o contexto de IA do Gemini.
- **T-06: Exportador de PDF**: Criado o componente `ReceiptPDF` em `components/ReceiptPDF.tsx` e integrado à página de recibo, ocultando botões de navegação no PDF impresso.
- **T-07: Notificações em Tempo Real**: Adicionado o hook `usePaymentNotification` que solicita permissão de browser notifications e dispara um alerta visual quando detecta o pagamento on-chain da fatura.
- **T-08: Terminal POS (Point of Sale)**: Criado terminal de caixa instantâneo em `/pos/page.tsx` para lojistas e comerciantes, com suporte a modo quiosque em tela cheia, polling do pagamento em tempo real e fogos de artifício na tela ao receber o dinheiro.
- **T-09: Landing Page Premium**: Redesenho completo de `/app/page.tsx` com narrativa focada na Arc Network L1 da Circle e nos pagamentos para a economia de agentes de IA.
- **T-10: PWA Completo**: Configurado `manifest.json`, `sw.js` com escuta de requisições e cache básico, e integrado registro assíncrono do service worker via script nativo no layout raiz.

---

## [2026-07-19] Baseline — Projeto inicial

**Agente**: Claude Sonnet
**Status**: MVP funcional

### Implementado
- Smart contract `ArcQRPayments.sol` (Solidity 0.8.24) com 13 testes Hardhat
- Landing page com Hero + Features cards (`app/page.tsx`)
- Página de criação de fatura on-chain com QR Code (`app/create/page.tsx`)
- Página de pagamento de fatura via wallet (`app/pay/[invoiceId]/page.tsx`)
- Página de recibo on-chain (`app/receipt/[invoiceId]/page.tsx`)
- Assistente IA básico com Gemini (`app/api/chat/route.ts`)
- Navbar responsiva (`components/layout/Navbar.tsx`)
- Design system dark-mode completo (`app/globals.css`)
- Hooks de blockchain: `useCreatePaymentRequest`, `usePaymentRequest`, `usePayInvoice`, `useCancelPaymentRequest` (`hooks/useArcPayments.ts`)
- Providers: Wagmi + RainbowKit + TanStack Query (`providers/index.tsx`)
- TypeScript types: `PaymentRequest`, `PaymentStatus`, `CreatePaymentFormData` (`types/index.ts`)
- Utilitários: `formatAmount`, `parseAmount`, `formatDate`, `getPaymentStatus`, etc. (`lib/utils.ts`)

### Arquitetura de documentação para múltiplas LLMs
- AGENTS.md: contexto completo do projeto para qualquer LLM continuar o trabalho
- TASKS.md: lista detalhada de tasks com critérios de aceite
- CHANGELOG.md: este arquivo

---

<!-- Adicione novas entradas ACIMA desta linha -->
