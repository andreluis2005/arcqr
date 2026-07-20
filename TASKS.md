# TASKS.md — Arc QR

> Atualizar este arquivo após completar cada task.
> Status: `[ ]` = pendente | `[/]` = em progresso | `[x]` = concluído

---

## Prioridade Alta (Concluídas)

- [x] **T-01** — Dashboard de Faturas por Wallet — `app/dashboard/page.tsx`
- [x] **T-02** — Hook `useWalletInvoices` — `hooks/useWalletInvoices.ts`
- [x] **T-03** — Agente IA Melhorado — `app/api/chat/route.ts`
- [x] **T-04** — Componente `ChatAgent` (Flutuante) — `components/ChatAgent.tsx`

---

## Prioridade Média (Concluídas)

- [x] **T-05** — `ShareButtons` — `components/ShareButtons.tsx`
- [x] **T-06** — Export Recibo PDF — `components/ReceiptPDF.tsx`
- [x] **T-07** — Notificação quando Fatura é Paga — `hooks/usePaymentNotification.ts`
- [x] **T-08** — Modo POS (Comerciante) — `app/pos/page.tsx`

---

## Prioridade Baixa

- [x] **T-09** — Landing Page Premium (Redesign)
- [x] **T-10** — PWA (`manifest.json`, `sw.js`, registro no layout)
- [x] **T-11** — ~~Multi-idioma~~ **Descartado** (escopo mantido apenas em inglês para entrega do hackathon)
- [ ] **T-12** — Deploy Final + Vídeo Demo

---

## Histórico de Conclusões

| Task | Data | Agente | Notas |
|------|------|--------|-------|
| T-02 | 2026-07-19 | Claude Sonnet | Criação do hook `useWalletInvoices.ts` usando `getLogs`. |
| T-01 | 2026-07-19 | Claude Sonnet | Dashboard de faturas criado com busca de histórico on-chain. |
| T-04 | 2026-07-19 | Claude Sonnet | ChatAgent flutuante integrado no layout. |
| T-05 | 2026-07-19 | Claude Sonnet | Botões de compartilhamento social criados. |
| T-03 | 2026-07-19 | Gemini 3.5 Flash | Rota de chat melhorada buscando dados do usuário on-chain. |
| T-06 | 2026-07-19 | Gemini 3.5 Flash | Componente de exportação PDF criado e integrado no recibo. |
| T-07 | 2026-07-19 | Gemini 3.5 Flash | Hook de notificações locais e disparador ao liquidar fatura. |
| T-08 | 2026-07-19 | Gemini 3.5 Flash | Terminal de checkout POS do comerciante com modo tela cheia. |
| T-09 | 2026-07-19 | Gemini 3.5 Flash | Landing page redesenhada com narrativa pitch do hackathon. |
| T-10 | 2026-07-19 | Gemini 3.5 Flash | PWA integrado com service worker e manifest instalável. |
| T-11 | 2026-07-19 | opencode | Descartado — scope final mantido em inglês. |
| Build fix | 2026-07-19 | opencode | Corrigido `parseAmount` indefinido em `app/create/page.tsx` (substituído por `watch("amount")`). |
