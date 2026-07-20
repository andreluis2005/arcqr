"use client";

/**
 * ShareButtons — T-05
 * Botões de compartilhamento do link de pagamento.
 * Props: invoiceId, title, amount (string em USDC)
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, MessageCircle, Send, Mail, Share2 } from "lucide-react";
import { generatePayUrl } from "@/lib/utils";

interface ShareButtonsProps {
  invoiceId: string;
  title: string;
  amount: string;
}

export default function ShareButtons({
  invoiceId,
  title,
  amount,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const payUrl = generatePayUrl(invoiceId);
  const text = encodeURIComponent(
    `💸 Pague minha fatura "${title}" de ${amount} USDC na Arc Network:\n${payUrl}`
  );
  const encodedUrl = encodeURIComponent(payUrl);

  const buttons = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: <MessageCircle size={14} />,
      color: "#25D366",
      href: `https://wa.me/?text=${text}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: <Send size={14} />,
      color: "#0088cc",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
        `💸 "${title}" — ${amount} USDC`
      )}`,
    },
    {
      id: "twitter",
      label: "X / Twitter",
      icon: <Share2 size={14} />,
      color: "#1DA1F2",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `💸 Pague minha fatura de ${amount} USDC na @Arc_Network! #ArcNetwork #USDC`
      )}&url=${encodedUrl}`,
    },
    {
      id: "email",
      label: "Email",
      icon: <Mail size={14} />,
      color: "#a78bfa",
      href: `mailto:?subject=${encodeURIComponent(
        `Fatura de pagamento: ${title}`
      )}&body=${encodeURIComponent(
        `Olá,\n\nVocê tem uma fatura de pagamento de ${amount} USDC (${title}) na Arc Network.\n\nClique no link para pagar: ${payUrl}\n\nPowered by Arc QR`
      )}`,
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(payUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Copy link */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={copyLink}
        className="btn-secondary"
        style={{ width: "100%", justifyContent: "center", padding: "11px 16px" }}
      >
        {copied ? (
          <>
            <Check size={14} color="#4ade80" />
            <span style={{ color: "#4ade80" }}>Link copiado!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            Copiar link de pagamento
          </>
        )}
      </motion.button>

      {/* Platform buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {buttons.map((btn) => (
          <motion.a
            key={btn.id}
            href={btn.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              padding: "9px 12px",
              background: `${btn.color}18`,
              border: `1px solid ${btn.color}40`,
              borderRadius: "10px",
              color: btn.color,
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              transition: "all 0.15s ease",
            }}
          >
            {btn.icon}
            {btn.label}
          </motion.a>
        ))}
      </div>
    </div>
  );
}
