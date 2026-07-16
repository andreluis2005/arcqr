"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  CheckCircle2,
  ExternalLink,
  Clock,
  User,
  AlertTriangle,
  XCircle,
  Copy,
  Share2,
} from "lucide-react";
import { usePaymentRequest, usePayInvoice } from "@/hooks/useArcPayments";
import { ARC_TESTNET } from "@/constants/chain";
import { ZERO_ADDRESS } from "@/constants/contracts";
import {
  formatAddress,
  formatAmount,
  getPaymentStatus,
  formatDate,
  getTimeRemaining,
  getExplorerUrl,
} from "@/lib/utils";

export default function PayPage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { request, isLoading, error: readError } = usePaymentRequest(invoiceId);
  const { pay, isPending, isConfirming, isSuccess, hash } = usePayInvoice();
  const [payError, setPayError] = useState<string | null>(null);
  const [copyHashSuccess, setCopyHashSuccess] = useState(false);

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET.id;
  const isProcessing = isPending || isConfirming;

  const status = request ? getPaymentStatus(request) : null;
  const isNative = request?.token === ZERO_ADDRESS;

  const handlePay = async () => {
    if (!request || !invoiceId) return;
    setPayError(null);
    try {
      await pay(invoiceId as `0x${string}`, request.amount, isNative);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      if (message.includes("User rejected")) {
        setPayError("Transaction cancelled by user.");
      } else if (message.includes("insufficient funds")) {
        setPayError("Insufficient balance for the payment.");
      } else {
        setPayError(message.slice(0, 120));
      }
    }
  };

  const copyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopyHashSuccess(true);
    setTimeout(() => setCopyHashSuccess(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: `Arc QR — ${request?.title || "Payment Request"}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ maxWidth: "480px", margin: "80px auto", padding: "0 24px" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "32px",
          }}
        >
          <div className="skeleton" style={{ height: "20px", width: "60%", marginBottom: "16px" }} />
          <div className="skeleton" style={{ height: "48px", width: "100%", marginBottom: "12px" }} />
          <div className="skeleton" style={{ height: "16px", width: "80%", marginBottom: "8px" }} />
          <div className="skeleton" style={{ height: "16px", width: "70%", marginBottom: "24px" }} />
          <div className="skeleton" style={{ height: "48px", width: "100%" }} />
        </div>
      </div>
    );
  }

  // Not found / error
  if (readError || !request) {
    return (
      <div
        style={{
          maxWidth: "480px",
          margin: "80px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <XCircle size={48} color="#f87171" style={{ marginBottom: "16px" }} />
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Payment request not found
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Check the link and try again, or connect to Arc Testnet.
        </p>
      </div>
    );
  }

  const amountFormatted = formatAmount(request.amount, isNative ? 6 : 18);

  // Payment success
  if (isSuccess && hash) {
    return (
      <div style={{ maxWidth: "480px", margin: "60px auto", padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          style={{
            background: "var(--surface)",
            border: "1px solid rgba(74, 222, 128, 0.2)",
            borderRadius: "20px",
            padding: "36px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(22, 163, 74, 0.15)",
          }}
        >
          {/* Success animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(22, 163, 74, 0.1)",
              border: "2px solid rgba(74, 222, 128, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <CheckCircle2 size={40} color="#4ade80" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}
          >
            Payment confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}
          >
            Your transaction was confirmed on the Arc Network.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Amount */}
            <div
              style={{
                background: "rgba(22, 163, 74, 0.05)",
                border: "1px solid rgba(74, 222, 128, 0.15)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>
                PAID
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#4ade80",
                  letterSpacing: "-0.02em",
                }}
              >
                {amountFormatted} USDC
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                to {formatAddress(request.recipient)}
              </div>
            </div>

            {/* TX Hash */}
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Transaction Hash
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "12px", flex: 1, wordBreak: "break-all" }}>
                  {hash}
                </span>
                <button
                  onClick={copyHash}
                  className="btn-ghost"
                  style={{ padding: "4px", flexShrink: 0 }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <a
                href={getExplorerUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
                style={{ justifyContent: "center", textDecoration: "none", fontSize: "13px" }}
              >
                <ExternalLink size={14} />
                View on Explorer
              </a>
              <a
                href={`/receipt/${invoiceId}`}
                className="btn-primary"
                style={{ justifyContent: "center", textDecoration: "none", fontSize: "13px" }}
              >
                View Receipt
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "60px auto", padding: "0 24px" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Status badge + share */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          {status === "active" && <span className="badge badge-neutral">Awaiting Payment</span>}
          {status === "paid" && <span className="badge badge-success">Paid</span>}
          {status === "cancelled" && <span className="badge badge-danger">Cancelled</span>}
          {status === "expired" && <span className="badge badge-warning">Expired</span>}
          <button onClick={shareLink} className="btn-ghost" style={{ padding: "6px 10px" }}>
            <Share2 size={14} />
          </button>
        </div>

        {/* Title & Description */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "6px",
          }}
        >
          {request.title}
        </h1>
        {request.description && (
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
            {request.description}
          </p>
        )}

        {/* Amount */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>
            REQUESTED AMOUNT
          </div>
          <div
            className="gradient-text"
            style={{ fontSize: "36px", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {amountFormatted} <span style={{ fontSize: "20px" }}>USDC</span>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "var(--surface-2)",
              borderRadius: "10px",
            }}
          >
            <User size={14} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                Recipient
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "13px" }}>
                {formatAddress(request.recipient, 8)}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              background: "var(--surface-2)",
              borderRadius: "10px",
            }}
          >
            <Clock size={14} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                Expires
              </div>
              <div style={{ fontSize: "13px" }}>
                {status === "active"
                  ? getTimeRemaining(request.expiresAt)
                  : formatDate(request.expiresAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Already paid */}
        {status === "paid" && (
          <div
            style={{
              background: "rgba(22, 163, 74, 0.08)",
              border: "1px solid rgba(74, 222, 128, 0.2)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <CheckCircle2 size={18} color="#4ade80" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#4ade80" }}>
                Already paid
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Paid by {formatAddress(request.payer)}
              </div>
            </div>
            <a
              href={`/receipt/${invoiceId}`}
              className="btn-secondary"
              style={{ marginLeft: "auto", fontSize: "13px", padding: "6px 12px", textDecoration: "none" }}
            >
              View Receipt
            </a>
          </div>
        )}

        {/* Cancelled */}
        {status === "cancelled" && (
          <div
            style={{
              background: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <XCircle size={18} color="#f87171" />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#f87171" }}>
              This request was cancelled by its creator.
            </div>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div
            style={{
              background: "var(--warning-bg)",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertTriangle size={18} color="#fbbf24" />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#fbbf24" }}>
              This payment request has expired.
            </div>
          </div>
        )}

        {/* Active — pay */}
        {status === "active" && (
          <>
            {!isConnected && (
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
                  Connect your wallet to pay.
                </p>
                <ConnectButton />
              </div>
            )}

            {isConnected && isWrongNetwork && (
              <div
                style={{
                  background: "var(--warning-bg)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <AlertTriangle size={16} color="#fbbf24" />
                <div style={{ flex: 1, fontSize: "14px" }}>You are on the wrong network.</div>
                <button
                  className="btn-primary"
                  style={{ padding: "8px 14px", fontSize: "13px" }}
                  onClick={() => switchChain({ chainId: ARC_TESTNET.id })}
                >
                  Switch to Arc
                </button>
              </div>
            )}

            {isConnected && !isWrongNetwork && (
              <>
                {/* Pay error */}
                <AnimatePresence>
                  {payError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: "rgba(220, 38, 38, 0.08)",
                        border: "1px solid rgba(220, 38, 38, 0.3)",
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "12px",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <AlertTriangle size={14} color="#f87171" />
                      <span style={{ color: "#f87171", fontSize: "13px" }}>{payError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="btn-primary"
                  onClick={handlePay}
                  disabled={isProcessing}
                  style={{ width: "100%", justifyContent: "center", padding: "15px 24px", fontSize: "15px" }}
                >
                  {isProcessing ? (
                    <>
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin-slow 0.8s linear infinite",
                          display: "inline-block",
                        }}
                      />
                      {isPending ? "Confirm in wallet..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      Pay {amountFormatted} USDC
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
