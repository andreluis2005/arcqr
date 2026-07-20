"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Copy, Download, Plus, ExternalLink, QrCode, CheckCircle, AlertTriangle } from "lucide-react";
import QRCode from "qrcode";
import { useCreatePaymentRequest } from "@/hooks/useArcPayments";
import { TOKENS, ZERO_ADDRESS } from "@/constants/contracts";
import { ARC_TESTNET } from "@/constants/chain";
import { formatAmount, generatePayUrl } from "@/lib/utils";
import ShareButtons from "@/components/ShareButtons";
import { CreatePaymentFormData } from "@/types";

const schema = z.object({
  recipient: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address (must start with 0x)"),
  amount: z
    .string()
    .min(1, "Please enter an amount")
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      "Amount must be greater than zero"
    ),
  token: z.string(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long"),
  durationDays: z
    .number()
    .min(1, "Minimum 1 day")
    .max(365, "Maximum 365 days"),
});

type FormData = z.infer<typeof schema>;

export default function CreatePage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { create, isPending, isConfirming } = useCreatePaymentRequest();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: ZERO_ADDRESS,
      durationDays: 7,
      description: "",
    },
  });

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET.id;
  const isLoading = isPending || isConfirming;

  const watchedAmount = watch("amount");

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      const id = await create(data as CreatePaymentFormData);
      if (id) {
        setInvoiceId(id);
        const payUrl = generatePayUrl(id);
        const qr = await QRCode.toDataURL(payUrl, {
          width: 300,
          margin: 2,
          color: { dark: "#0d1117", light: "#ffffff" },
        });
        setQrDataUrl(qr);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction rejected or failed";
      if (message.includes("User rejected")) {
        setError("Transaction cancelled by user.");
      } else if (message.includes("insufficient funds")) {
        setError("Insufficient balance to cover the gas fee.");
      } else {
        setError(message.slice(0, 120));
      }
    }
  };

  const copyLink = () => {
    if (!invoiceId) return;
    navigator.clipboard.writeText(generatePayUrl(invoiceId));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl || !invoiceId) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `arcqr-${invoiceId.slice(0, 10)}.png`;
    a.click();
  };

  const handleCreateAnother = () => {
    setInvoiceId(null);
    setQrDataUrl(null);
    setError(null);
    reset();
  };

  if (invoiceId && qrDataUrl) {
    return (
      <div
        style={{
          maxWidth: "520px",
          margin: "60px auto",
          padding: "0 24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          {/* Success header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "rgba(22, 163, 74, 0.1)",
                border: "1px solid rgba(74, 222, 128, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle size={28} color="#4ade80" />
            </motion.div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "6px",
              }}
            >
              Payment created!
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Share the link or QR code to receive your payment.
            </p>
          </div>

          {/* QR Code */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <img
              src={qrDataUrl}
              alt="Payment QR Code"
              style={{ width: "200px", height: "200px", borderRadius: "8px" }}
            />
          </div>

          {/* Invoice ID */}
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "16px",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Invoice ID
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "var(--text-primary)",
                wordBreak: "break-all",
              }}
            >
              {invoiceId}
            </div>
          </div>

          {/* Pay URL */}
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Payment Link
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#a78bfa", wordBreak: "break-all" }}>
              {generatePayUrl(invoiceId)}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <button className="btn-secondary" onClick={copyLink} style={{ justifyContent: "center" }}>
              <Copy size={15} />
              {copySuccess ? "Copied!" : "Copy Link"}
            </button>
            <button className="btn-secondary" onClick={downloadQR} style={{ justifyContent: "center" }}>
              <Download size={15} />
              Download QR
            </button>
          </div>

          {/* Share buttons: WhatsApp / Telegram / X / Email */}
          <ShareButtons
            invoiceId={invoiceId}
            title="Payment request"
            amount={watchedAmount || ""}
          />

          <a
            href={`/pay/${invoiceId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "10px",
              color: "#a78bfa",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "12px",
              marginBottom: "16px",
              background: "rgba(124, 58, 237, 0.05)",
              transition: "all 0.2s ease",
            }}
          >
            <ExternalLink size={15} />
            Open Payment Page
          </a>

          <button
            className="btn-ghost"
            onClick={handleCreateAnother}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Plus size={15} />
            Create Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "560px",
        margin: "60px auto",
        padding: "0 24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "9999px",
              padding: "4px 12px",
              marginBottom: "16px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a78bfa",
            }}
          >
            <QrCode size={12} />
            New Request
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Create Payment Request
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Fill in the details below to generate an on-chain payment link and QR code.
          </p>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div
            style={{
              background: "rgba(124, 58, 237, 0.05)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              Connect your wallet to create on-chain payment requests.
            </p>
            <ConnectButton />
          </div>
        )}

        {/* Wrong network */}
        {isWrongNetwork && (
          <div
            style={{
              background: "rgba(217, 119, 6, 0.08)",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <AlertTriangle size={18} color="#fbbf24" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#fbbf24" }}>Wrong network</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                You need to be on Arc Testnet.
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "13px" }}
              onClick={() => switchChain({ chainId: ARC_TESTNET.id })}
            >
              Switch Network
            </button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Recipient */}
          <div>
            <label className="label">Recipient Address</label>
            <input
              {...register("recipient")}
              className="input-field"
              placeholder="0x..."
              disabled={!isConnected || isWrongNetwork}
            />
            {errors.recipient && (
              <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.recipient.message}
              </span>
            )}
          </div>

          {/* Amount + Token */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px" }}>
            <div>
              <label className="label">Amount</label>
              <input
                {...register("amount")}
                className="input-field"
                placeholder="100.00"
                type="number"
                step="0.000001"
                min="0"
                disabled={!isConnected || isWrongNetwork}
              />
              {errors.amount && (
                <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  {errors.amount.message}
                </span>
              )}
            </div>
            <div>
              <label className="label">Token</label>
              <select
                {...register("token")}
                className="input-field"
                disabled={!isConnected || isWrongNetwork}
              >
                {TOKENS.map((t) => (
                  <option key={t.symbol} value={t.address}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="label">Request Title</label>
            <input
              {...register("title")}
              className="input-field"
              placeholder="E.g.: Website Development"
              disabled={!isConnected || isWrongNetwork}
            />
            {errors.title && (
              <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
                {errors.title.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              {...register("description")}
              className="input-field"
              placeholder="Service or product details..."
              rows={3}
              disabled={!isConnected || isWrongNetwork}
              style={{ resize: "vertical", minHeight: "80px" }}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="label">
              Expiry Period
            </label>
            <select
              {...register("durationDays", { valueAsNumber: true })}
              className="input-field"
              disabled={!isConnected || isWrongNetwork}
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  background: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.3)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <AlertTriangle size={16} color="#f87171" />
                <span style={{ color: "#f87171", fontSize: "13px" }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={!isConnected || isWrongNetwork || isLoading}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px 24px",
              fontSize: "15px",
            }}
          >
            {isLoading ? (
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
                {isPending ? "Waiting for confirmation..." : "Processing transaction..."}
              </>
            ) : (
              <>
                Generate Request
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
