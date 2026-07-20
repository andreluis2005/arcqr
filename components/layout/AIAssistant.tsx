"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  Wallet,
  AlertCircle
} from "lucide-react";
import {
  useCreatePaymentRequest,
  usePayInvoice,
  useCancelPaymentRequest
} from "@/hooks/useArcPayments";
import { parseAmount, formatAddress } from "@/lib/utils";
import { ZERO_ADDRESS } from "@/constants/contracts";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  action?: {
    type: "CREATE_INVOICE" | "PAY_INVOICE" | "CANCEL_INVOICE" | "SHOW_INVOICE_DETAILS" | "NONE";
    params: {
      invoiceId?: string;
      amount?: string;
      recipient?: string;
      title?: string;
      description?: string;
      durationDays?: number;
    };
  };
  txHash?: string;
  txSuccess?: boolean;
  txError?: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Olá! Sou o **Arc AI Assistant**. Posso ajudar você a gerenciar pagamentos na Arc Network. \n\nTente algo como:\n- *\"Crie uma fatura de 10 USDC para [endereço] com o título 'Almoço'\"*\n- *\"Consulte a fatura 0x[hash]\"*\n- *\"Quero pagar a fatura 0x[hash]\"*",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useAccount();

  // Elementos do chat para auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hooks de transação blockchain
  const createPayment = useCreatePaymentRequest();
  const payInvoice = usePayInvoice();
  const cancelPayment = useCancelPaymentRequest();

  // Estados de controle locais para transação ativa no chat
  const [activeTxIndex, setActiveTxIndex] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Adiciona a mensagem do usuário ao histórico local
    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Faz o POST para a nossa rota de API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: data.message || "Não consegui processar a resposta.",
          action: data.action,
        },
      ]);
    } catch (err) {
      console.error("Erro na chamada do assistente:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Ocorreu um erro de conexão com o assistente de IA. Verifique as configurações.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manipulador para criação de fatura solicitada pelo chat
  const handleExecuteCreate = async (index: number, params: any) => {
    if (!isConnected) {
      alert("Conecte sua carteira primeiro.");
      return;
    }
    setActiveTxIndex(index);
    try {
      const invoiceId = await createPayment.create({
        recipient: params.recipient || address || "",
        amount: params.amount || "0",
        token: ZERO_ADDRESS,
        title: params.title || "Cobrança via Chat",
        description: params.description || "Criada via Arc AI Assistant",
        durationDays: Number(params.durationDays) || 7,
      });

      if (invoiceId) {
        setMessages((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            txSuccess: true,
            txHash: invoiceId, // Usamos o invoiceId gerado
          };
          return next;
        });
      } else {
        throw new Error("Transação cancelada ou falhou.");
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          txSuccess: false,
          txError: err.message || "Erro desconhecido",
        };
        return next;
      });
    } finally {
      setActiveTxIndex(null);
    }
  };

  // Manipulador para pagamento de fatura
  const handleExecutePay = async (index: number, params: any) => {
    if (!isConnected) {
      alert("Conecte sua carteira primeiro.");
      return;
    }
    if (!params.invoiceId) return;
    
    setActiveTxIndex(index);
    try {
      // Como o pagamento no chat requer saber o valor, a IA deve ter consultado on-chain.
      // Se a IA não trouxer o amount, tentamos converter um valor padrão ou levantar erro.
      // A API route anexa o valor obtido on-chain como string nos params.
      const amountDecimals = 6; // USDC na Arc é 6 decimais
      const rawAmount = parseAmount(params.amount || "0", amountDecimals);

      const tx = await payInvoice.pay(params.invoiceId as `0x${string}`, rawAmount, true);
      
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          txSuccess: true,
          txHash: tx || "Confirmado",
        };
        return next;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          txSuccess: false,
          txError: err.message || "Erro ao pagar a fatura",
        };
        return next;
      });
    } finally {
      setActiveTxIndex(null);
    }
  };

  // Manipulador para cancelar fatura
  const handleExecuteCancel = async (index: number, params: any) => {
    if (!isConnected) {
      alert("Conecte sua carteira primeiro.");
      return;
    }
    if (!params.invoiceId) return;

    setActiveTxIndex(index);
    try {
      const tx = await cancelPayment.cancel(params.invoiceId as `0x${string}`);
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          txSuccess: true,
          txHash: tx || "Cancelado",
        };
        return next;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          txSuccess: false,
          txError: err.message || "Erro ao cancelar a fatura",
        };
        return next;
      });
    } finally {
      setActiveTxIndex(null);
    }
  };

  return (
    <>
      {/* Botão de ativação do assistente */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 focus:outline-none"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
            boxShadow: "0 8px 30px rgba(124, 58, 237, 0.3)"
          }}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
      </div>

      {/* Caixa de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[420px] flex-col rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl text-white overflow-hidden"
            style={{
              borderColor: "rgba(255, 255, 255, 0.08)",
              background: "rgba(10, 10, 12, 0.95)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm tracking-wide">Arc AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-zinc-400">Arc L1 Testnet</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lista de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/10 text-purple-400">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 max-w-[80%]">
                    {/* Balão de mensagem */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white rounded-tr-none self-end"
                          : "bg-white/5 text-zinc-200 rounded-tl-none"
                      }`}
                      style={{
                        backgroundColor: msg.role === "user" ? "var(--primary)" : "rgba(255, 255, 255, 0.05)"
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Card de Ação Especial */}
                    {msg.action && msg.action.type !== "NONE" && (
                      <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                          <Bot size={14} />
                          <span>Ação Disponível</span>
                        </div>

                        {msg.action.type === "CREATE_INVOICE" && (
                          <div className="space-y-3 text-xs">
                            <p className="text-zinc-300 font-medium">Confirmar dados da nova fatura:</p>
                            <div className="space-y-1 bg-white/5 p-2.5 rounded-lg text-zinc-400">
                              <div><strong>Título:</strong> {msg.action.params.title || "Sem título"}</div>
                              <div><strong>Valor:</strong> {msg.action.params.amount} USDC</div>
                              <div><strong>Destinatário:</strong> {formatAddress(msg.action.params.recipient || "")}</div>
                              <div><strong>Expiração:</strong> {msg.action.params.durationDays || 7} dias</div>
                            </div>
                            
                            {!msg.txSuccess && !msg.txError && (
                              <button
                                onClick={() => handleExecuteCreate(index, msg.action?.params)}
                                disabled={activeTxIndex !== null}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 py-2 font-medium text-white transition-colors"
                              >
                                {activeTxIndex === index ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={14} />
                                )}
                                Criar Fatura na Blockchain
                              </button>
                            )}
                          </div>
                        )}

                        {msg.action.type === "PAY_INVOICE" && (
                          <div className="space-y-3 text-xs">
                            <p className="text-zinc-300 font-medium">Pagar Fatura On-chain:</p>
                            <div className="space-y-1 bg-white/5 p-2.5 rounded-lg text-zinc-400">
                              <div><strong>ID Fatura:</strong> {formatAddress(msg.action.params.invoiceId || "")}</div>
                              <div><strong>Valor a Pagar:</strong> {msg.action.params.amount} USDC</div>
                            </div>

                            {!isConnected && (
                              <div className="text-amber-400 flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                Conecte sua carteira para pagar.
                              </div>
                            )}

                            {isConnected && !msg.txSuccess && !msg.txError && (
                              <button
                                onClick={() => handleExecutePay(index, msg.action?.params)}
                                disabled={activeTxIndex !== null}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-500 py-2 font-medium text-white transition-colors"
                              >
                                {activeTxIndex === index ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Wallet size={14} />
                                )}
                                Assinar e Pagar ({msg.action.params.amount} USDC)
                              </button>
                            )}
                          </div>
                        )}

                        {msg.action.type === "CANCEL_INVOICE" && (
                          <div className="space-y-3 text-xs">
                            <p className="text-zinc-300 font-medium">Cancelar Fatura:</p>
                            <div className="space-y-1 bg-white/5 p-2.5 rounded-lg text-zinc-400">
                              <div><strong>ID Fatura:</strong> {formatAddress(msg.action.params.invoiceId || "")}</div>
                            </div>
                            
                            {!msg.txSuccess && !msg.txError && (
                              <button
                                onClick={() => handleExecuteCancel(index, msg.action?.params)}
                                disabled={activeTxIndex !== null}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 py-2 font-medium text-white transition-colors"
                              >
                                {activeTxIndex === index ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <X size={14} />
                                )}
                                Cancelar Fatura
                              </button>
                            )}
                          </div>
                        )}

                        {msg.action.type === "SHOW_INVOICE_DETAILS" && (
                          <div className="space-y-3 text-xs">
                            <p className="text-zinc-300 font-medium">Detalhes da Fatura Consultada:</p>
                            <div className="space-y-1 bg-white/5 p-2.5 rounded-lg text-zinc-400">
                              <div><strong>Título:</strong> {msg.action.params.title}</div>
                              {msg.action.params.description && (
                                <div><strong>Descrição:</strong> {msg.action.params.description}</div>
                              )}
                              <div><strong>Valor:</strong> {msg.action.params.amount} USDC</div>
                              <div><strong>ID Fatura:</strong> {formatAddress(msg.action.params.invoiceId || "")}</div>
                            </div>
                            <a
                              href={`/pay/${msg.action.params.invoiceId}`}
                              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 py-2 font-medium text-white transition-colors text-center text-xs"
                            >
                              Abrir Tela de Pagamento
                              <ArrowRight size={12} />
                            </a>
                          </div>
                        )}

                        {/* Status de Sucesso da Transação no Chat */}
                        {msg.txSuccess && (
                          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle size={14} />
                              Transação Confirmada!
                            </div>
                            {msg.action?.type === "CREATE_INVOICE" && msg.txHash && (
                              <div className="space-y-1.5 mt-1.5">
                                <div className="text-zinc-400">Fatura criada na Arc Network. ID da Fatura:</div>
                                <div className="font-mono text-[10px] break-all p-1 bg-black/30 rounded">{msg.txHash}</div>
                                <div className="flex gap-2 mt-1">
                                  <a
                                    href={`/pay/${msg.txHash}`}
                                    className="flex items-center gap-1 rounded bg-green-500 text-black px-2 py-1 font-semibold text-[10px]"
                                  >
                                    Ir para Pagamento
                                    <ExternalLink size={8} />
                                  </a>
                                </div>
                              </div>
                            )}
                            {msg.action?.type === "PAY_INVOICE" && (
                              <div className="text-zinc-400 mt-1">
                                O pagamento foi efetuado e liquidado com sucesso.
                              </div>
                            )}
                            {msg.action?.type === "CANCEL_INVOICE" && (
                              <div className="text-zinc-400 mt-1">
                                A fatura foi cancelada on-chain e não aceita mais pagamentos.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Status de Erro da Transação */}
                        {msg.txError && (
                          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg text-xs">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <AlertCircle size={14} />
                              Falha na Transação
                            </div>
                            <div className="text-zinc-400 mt-1 break-words">{msg.txError}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600/10 text-purple-400">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white/5 px-4 py-2.5 text-sm text-zinc-400 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Pensando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="border-t border-white/5 bg-white/2 p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte ao Arc AI..."
                className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm text-white placeholder-zinc-500 border border-white/5 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                style={{ backgroundColor: input.trim() ? "var(--primary)" : "" }}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
