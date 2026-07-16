"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  User,
  Clock,
  ExternalLink,
  Copy,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useState, useEffect } from "react";
import { usePaymentRequest } from "@/hooks/useArcPayments";
import { ZERO_ADDRESS } from "@/constants/contracts";
import {
  formatAddress,
  formatAmount,
  getPaymentStatus,
  formatDate,
  getExplorerUrl,
  generatePayUrl,
} from "@/lib/utils";

export default function ReceiptPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const { request, isLoading } = usePaymentRequest(invoiceId);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isNative = request?.token === ZERO_ADDRESS;
  const status = request ? getPaymentStatus(request) : null;

  useEffect(() => {
    if (invoiceId) {
      const url = generatePayUrl(invoiceId);
      QRCode.toDataURL(url, {
        width: 160,
        margin: 1,
        color: { dark: "#0d1117", light: "#ffffff" },
      }).then(setQrDataUrl);
    }
  }, [invoiceId]);

  const copyInvoiceId = () => {
    navigator.clipboard.writeText(invoiceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: "520px", margin: "80px auto", padding: "0 24px" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "32px",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "20px", marginBottom: "12px", width: i % 2 === 0 ? "80%" : "60%" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ maxWidth: "480px", margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Receipt not found
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Check the link and try again.
        </p>
        <Link href="/" className="btn-secondary" style={{ marginTop: "24px", display: "inline-flex", textDecoration: "none" }}>
          Go back home
        </Link>
      </div>
    );
  }

  const amountFormatted = formatAmount(request.amount, isNative ? 6 : 18);

  return (
    <div style={{ maxWidth: "520px", margin: "60px auto", padding: "0 24px" }}>
      {/* Back */}
      <Link
        href={`/pay/${invoiceId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-secondary)",
          textDecoration: "none",
          fontSize: "14px",
          marginBottom: "24px",
          transition: "color 0.15s",
        }}
      >
        <ArrowLeft size={14} />
        Back to payment
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "var(--surface)",
          border: `1px solid ${status === "paid" ? "rgba(74, 222, 128, 0.2)" : "var(--border)"}`,
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: status === "paid" ? "0 0 40px rgba(22, 163, 74, 0.1)" : "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Arc QR Receipt
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 800 }}>{request.title}</h1>
          </div>
          {status === "paid" && (
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(74, 222, 128, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={22} color="#4ade80" />
            </div>
          )}
        </div>

        {/* Amount */}
        <div
          style={{
            padding: "28px",
            borderBottom: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "6px" }}>
            VALOR
          </div>
          <div
            className={status === "paid" ? "" : "gradient-text"}
            style={{
              fontSize: "40px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: status === "paid" ? "#4ade80" : undefined,
            }}
          >
            {amountFormatted} <span style={{ fontSize: "22px" }}>USDC</span>
          </div>
          {status && (
            <span
              className={`badge ${
                status === "paid"
                  ? "badge-success"
                  : status === "cancelled"
                  ? "badge-danger"
                  : status === "expired"
                  ? "badge-warning"
                  : "badge-neutral"
              }`}
              style={{ marginTop: "12px" }}
            >
              {status === "paid"
                ? "Paid"
                : status === "cancelled"
                ? "Cancelled"
                : status === "expired"
                ? "Expired"
                : "Pending"}
            </span>
          )}
        </div>

        {/* Details */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <ReceiptRow
              icon={<User size={14} />}
              label="Recipient"
              value={formatAddress(request.recipient, 10)}
              mono
            />
            {status === "paid" && request.payer !== "0x0000000000000000000000000000000000000000" && (
              <ReceiptRow
                icon={<User size={14} />}
                label="Payer"
                value={formatAddress(request.payer, 10)}
                mono
              />
            )}
            <ReceiptRow
              icon={<User size={14} />}
              label="Creator"
              value={formatAddress(request.creator, 10)}
              mono
            />
            <ReceiptRow
              icon={<Clock size={14} />}
              label="Created at"
              value={formatDate(request.createdAt)}
            />
            <ReceiptRow
              icon={<Clock size={14} />}
              label="Expires at"
              value={formatDate(request.expiresAt)}
            />
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Description
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {request.description}
            </p>
          </div>
        )}

        {/* Invoice ID + QR */}
        <div
          style={{
            padding: "24px 28px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              Invoice ID
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                wordBreak: "break-all",
                color: "var(--text-secondary)",
              }}
            >
              {invoiceId}
            </div>
            <button
              onClick={copyInvoiceId}
              className="btn-ghost"
              style={{ marginTop: "8px", padding: "4px 8px", fontSize: "12px" }}
            >
              <Copy size={12} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {qrDataUrl && (
            <div
              style={{
                background: "white",
                borderRadius: "8px",
                padding: "8px",
                flexShrink: 0,
              }}
            >
              <img src={qrDataUrl} alt="QR Code" style={{ width: "80px", height: "80px" }} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: "20px 28px",
            display: "flex",
            gap: "10px",
          }}
        >
          <a
            href={getExplorerUrl(invoiceId, "address")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ flex: 1, justifyContent: "center", textDecoration: "none", fontSize: "13px" }}
          >
            <ExternalLink size={13} />
            Explorer
          </a>
          <a
            href={`/pay/${invoiceId}`}
            className="btn-secondary"
            style={{ flex: 1, justifyContent: "center", textDecoration: "none", fontSize: "13px" }}
          >
            <QrCode size={13} />
            Pay
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function ReceiptRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
          {label}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontFamily: mono ? "monospace" : "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
