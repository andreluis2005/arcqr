"use client";

/**
 * ChatAgent — T-04
 * Botão flutuante (fixed bottom-right) que abre um modal de chat com o agente IA.
 * Integra com a API /api/chat (Gemini). Executa actions retornadas pelo agente.
 * Deve ser importado em app/layout.tsx para aparecer em todas as páginas.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { usePayInvoice, useCancelPaymentRequest } from "@/hooks/useArcPayments";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ActionType =
  | "NONE"
  | "CREATE_INVOICE"
  | "PAY_INVOICE"
  | "CANCEL_INVOICE"
  | "SHOW_INVOICE_DETAILS";

interface AgentAction {
  type: ActionType;
  params?: {
    invoiceId?: string;
    amount?: string;
    recipient?: string;
    title?: string;
    description?: string;
    durationDays?: number;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AgentAction;
  timestamp: Date;
}

// ─── Action Button ─────────────────────────────────────────────────────────────

function ActionButton({
  action,
  onExecute,
}: {
  action: AgentAction;
  onExecute: (action: AgentAction) => void;
}) {
  if (action.type === "NONE" || !action.params) return null;

  const labels: Partial<Record<ActionType, string>> = {
    CREATE_INVOICE: "Create Invoice →",
    PAY_INVOICE: "Pay Invoice →",
    CANCEL_INVOICE: "Cancel Invoice",
    SHOW_INVOICE_DETAILS: "View Details →",
  };

  return (
    <button
      onClick={() => onExecute(action)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        marginTop: "8px",
        padding: "6px 12px",
        background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
        border: "none",
        borderRadius: "8px",
        color: "white",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <ExternalLink size={11} />
      {labels[action.type]}
    </button>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onActionExecute,
}: {
  message: ChatMessage;
  onActionExecute: (action: AgentAction) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        gap: "8px",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          background: isUser
            ? "rgba(124, 58, 237, 0.2)"
            : "rgba(37, 99, 235, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isUser ? "#a78bfa" : "#60a5fa",
          flexShrink: 0,
        }}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "80%" }}>
        <div
          style={{
            padding: "10px 13px",
            borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
            background: isUser
              ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
              : "var(--surface-2)",
            border: isUser ? "none" : "1px solid var(--border)",
            fontSize: "13px",
            lineHeight: 1.55,
            color: isUser ? "white" : "var(--text-primary)",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.content}
        </div>
        {message.action && message.action.type !== "NONE" && (
          <ActionButton action={message.action} onExecute={onActionExecute} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { address } = useAccount();
  const { pay } = usePayInvoice();
  const { cancel } = useCancelPaymentRequest();

  // Mensagem de boas-vindas
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Olá! 👋 Sou o Arc AI Agent. Posso te ajudar a:\n\n• Criar faturas on-chain\n• Consultar status de uma fatura\n• Pagar ou cancelar cobranças\n\nComo posso ajudar?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleActionExecute = useCallback(
    async (action: AgentAction) => {
      if (!action.params) return;

      switch (action.type) {
        case "CREATE_INVOICE": {
          const params = new URLSearchParams();
          if (action.params.recipient)
            params.set("recipient", action.params.recipient);
          if (action.params.amount) params.set("amount", action.params.amount);
          if (action.params.title) params.set("title", action.params.title);
          if (action.params.description)
            params.set("description", action.params.description);
          if (action.params.durationDays)
            params.set("durationDays", String(action.params.durationDays));
          router.push(`/create?${params.toString()}`);
          setIsOpen(false);
          break;
        }
        case "PAY_INVOICE": {
          if (action.params.invoiceId) {
            router.push(`/pay/${action.params.invoiceId}`);
            setIsOpen(false);
          }
          break;
        }
        case "SHOW_INVOICE_DETAILS": {
          if (action.params.invoiceId) {
            router.push(`/pay/${action.params.invoiceId}`);
            setIsOpen(false);
          }
          break;
        }
        case "CANCEL_INVOICE": {
          if (action.params.invoiceId) {
            try {
              await cancel(action.params.invoiceId as `0x${string}`);
            } catch {
              // Erros de transação são tratados pelo usuário na wallet
            }
          }
          break;
        }
      }
    },
    [router, cancel]
  );

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          walletAddress: address,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message || "Desculpe, não consegui processar sua mensagem.",
        action: data.action,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            "Erro de conexão. Verifique se a chave GEMINI_API_KEY está configurada.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{
              position: "fixed",
              bottom: "88px",
              right: "24px",
              width: "360px",
              height: "520px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 1000,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "var(--surface-2)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>
                  Arc AI Agent
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#4ade80",
                    }}
                  />
                  Online · Arc Network
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              className="modal-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onActionExecute={handleActionExecute}
                />
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "rgba(37, 99, 235, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#60a5fa",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={14} />
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px 12px 12px 12px",
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                        style={{
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "var(--text-secondary)",
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "12px 14px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                background: "var(--surface-2)",
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about payments..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  padding: "9px 13px",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--accent)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background:
                    input.trim() && !isLoading
                      ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                      : "var(--surface-3)",
                  border: "none",
                  color: input.trim() && !isLoading ? "white" : "var(--text-muted)",
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {isLoading ? (
                  <Loader2 size={15} style={{ animation: "spin-slow 0.8s linear infinite" }} />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHasUnread(false);
        }}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: isOpen
            ? "var(--surface-2)"
            : "linear-gradient(135deg, #7c3aed, #5b21b6)",
          border: isOpen ? "1px solid var(--border)" : "none",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isOpen
            ? "none"
            : "0 8px 32px rgba(124, 58, 237, 0.4), 0 0 0 1px rgba(124,58,237,0.2)",
          zIndex: 1001,
          transition: "background 0.2s ease",
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} color="var(--text-secondary)" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {hasUnread && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "#4ade80",
              border: "2px solid var(--background)",
            }}
          />
        )}
      </motion.button>
    </>
  );
}
