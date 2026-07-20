"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Zap,
  QrCode,
  ArrowRight,
  ShieldAlert,
  Maximize2,
  Minimize2,
  CheckCircle,
  Plus,
  Loader2,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { useCreatePaymentRequest, usePaymentRequest } from "@/hooks/useArcPayments";
import { ZERO_ADDRESS } from "@/constants/contracts";
import { ARC_TESTNET } from "@/constants/chain";
import { generatePayUrl } from "@/lib/utils";

const posSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
      "Amount must be greater than zero"
    ),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(50, "Title is too long"),
});

type POSFormData = z.infer<typeof posSchema>;

export default function POSPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { create, isPending, isConfirming } = useCreatePaymentRequest();

  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Monitora se o recibo foi pago
  const { request } = usePaymentRequest(invoiceId || undefined);
  const isPaid = request?.paid;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<POSFormData>({
    resolver: zodResolver(posSchema),
    defaultValues: {
      title: "Store Sale",
    },
  });

  // Efeito de confetes quando o pagamento for bem-sucedido
  useEffect(() => {
    if (isPaid) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#7c3aed", "#6d28d9", "#10b981", "#3b82f6"],
      });
    }
  }, [isPaid]);

  // Monitora saída de tela cheia por ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const onSubmit = async (data: POSFormData) => {
    if (!address) return;
    setError(null);
    try {
      const id = await create({
        recipient: address,
        amount: data.amount,
        token: ZERO_ADDRESS,
        title: data.title,
        description: "POS Instant Checkout",
        durationDays: 1, // Expira rápido
      });

      if (id) {
        setInvoiceId(id);
        const payUrl = generatePayUrl(id);
        const qr = await QRCode.toDataURL(payUrl, {
          width: 320,
          margin: 1,
          color: { dark: "#0d1117", light: "#ffffff" },
        });
        setQrDataUrl(qr);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Checkout error";
      setError(message.slice(0, 100));
    }
  };

  const handleNextSale = () => {
    setInvoiceId(null);
    setQrDataUrl(null);
    setError(null);
    reset({
      title: "Store Sale",
      amount: "",
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET.id;
  const isLoading = isPending || isConfirming;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: isFullscreen ? "#060a12" : "transparent",
        zIndex: isFullscreen ? 1000 : "auto",
      }}
    >
      {/* Background Orbs */}
      <div
        className="orb orb-purple"
        style={{ width: "500px", height: "500px", top: "-10%" }}
      />
      <div
        className="orb orb-blue"
        style={{ width: "400px", height: "400px", bottom: "-10%", right: "10%" }}
      />

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="btn-secondary"
        style={{
          position: "fixed",
          top: isFullscreen ? "20px" : "84px",
          right: "24px",
          padding: "8px 12px",
          borderRadius: "8px",
          zIndex: 1002,
        }}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      <div style={{ width: "100%", maxWidth: "500px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {/* 1. Wallet não conectada */}
          {!isConnected && (
            <motion.div
              key="no-wallet"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated"
              style={{ padding: "40px 32px", textAlign: "center" }}
            >
              <ShoppingCart size={40} color="#a78bfa" style={{ marginBottom: "20px" }} />
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
                POS Cashier Terminal
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
                Connect your merchant wallet to start receiving instant USDC payments on Arc.
              </p>
              <ConnectButton />
            </motion.div>
          )}

          {/* 2. Rede incorreta */}
          {isConnected && isWrongNetwork && (
            <motion.div
              key="wrong-network"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated"
              style={{ padding: "36px 32px", textAlign: "center" }}
            >
              <ShieldAlert size={40} color="#fbbf24" style={{ marginBottom: "16px" }} />
              <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
                Wrong Network
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
                This terminal works exclusively on Arc Testnet. Please switch networks.
              </p>
              <button className="btn-primary" onClick={() => switchChain({ chainId: ARC_TESTNET.id })}>
                Switch to Arc Testnet
              </button>
            </motion.div>
          )}

          {/* 3. Formulário de Cobrança POS */}
          {isConnected && !isWrongNetwork && !invoiceId && (
            <motion.div
              key="pos-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-elevated"
              style={{ padding: "36px 32px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                <ShoppingCart size={22} color="#a78bfa" />
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>Instant POS Sale</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label className="label">Amount (USDC)</label>
                  <div style={{ position: "relative" }}>
                    <input
                      {...register("amount")}
                      className="input-field"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      min="0"
                      style={{ paddingLeft: "36px", fontSize: "18px", fontWeight: 600 }}
                    />
                    <DollarSign
                      size={18}
                      color="var(--text-muted)"
                      style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                    />
                  </div>
                  {errors.amount && (
                    <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      {errors.amount.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="label">Sale Reference / Product</label>
                  <input
                    {...register("title")}
                    className="input-field"
                    placeholder="E.g.: Store Order #415"
                  />
                  {errors.title && (
                    <span style={{ color: "#f87171", fontSize: "12px", marginTop: "4px", display: "block" }}>
                      {errors.title.message}
                    </span>
                  )}
                </div>

                {error && (
                  <div
                    style={{
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "#f87171",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isLoading} style={{ justifyContent: "center", padding: "14px" }}>
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="spin-slow" />
                      Creating Order...
                    </>
                  ) : (
                    <>
                      Generate POS Invoice
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* 4. QR Code Gigante de Pagamento (Esperando pagamento) */}
          {invoiceId && qrDataUrl && !isPaid && (
            <motion.div
              key="checkout-qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-elevated"
              style={{ padding: "36px 32px", textAlign: "center" }}
            >
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800 }}>Scan to Pay</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  {request?.title}
                </p>
              </div>

              {/* QR Code container */}
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "24px",
                  display: "inline-block",
                  margin: "0 auto 24px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                }}
              >
                <img
                  src={qrDataUrl}
                  alt="POS Checkout QR"
                  style={{ width: "240px", height: "240px", display: "block" }}
                />
              </div>

              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Due
                </div>
                <div className="gradient-text" style={{ fontSize: "32px", fontWeight: 800 }}>
                  {request ? (Number(request.amount) / 10 ** 6).toFixed(2) : "0.00"} USDC
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-secondary)" }}>
                <Loader2 size={16} className="spin-slow" color="#a78bfa" />
                <span style={{ fontSize: "13px" }}>Waiting for payment on Arc Network...</span>
              </div>

              <button
                className="btn-ghost"
                onClick={handleNextSale}
                style={{ marginTop: "24px", width: "100%", justifyContent: "center" }}
              >
                Cancel Sale
              </button>
            </motion.div>
          )}

          {/* 5. Venda Confirmada com Sucesso */}
          {invoiceId && isPaid && (
            <motion.div
              key="sale-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-elevated"
              style={{ padding: "44px 32px", textAlign: "center", border: "1px solid rgba(74, 222, 128, 0.3)" }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(22, 163, 74, 0.1)",
                  border: "1px solid rgba(74, 222, 128, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
                className="success-icon"
              >
                <CheckCircle size={36} color="#4ade80" />
              </div>

              <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#4ade80", marginBottom: "8px" }}>
                Payment Received!
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
                Sale reference: "{request?.title}"
              </p>

              <div
                style={{
                  background: "rgba(22, 163, 74, 0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "32px",
                }}
              >
                <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                  Received Amount
                </div>
                <div style={{ fontSize: "36px", fontWeight: 800, color: "#4ade80" }}>
                  {request ? (Number(request.amount) / 10 ** 6).toFixed(2) : "0.00"} USDC
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleNextSale}
                style={{ width: "100%", justifyContent: "center", padding: "14px" }}
              >
                <Plus size={16} />
                Next Sale
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
