"use client";

/**
 * Dashboard — T-01
 * Mostra todas as faturas criadas e recebidas pela wallet conectada.
 * Usa useWalletInvoices (T-02) para buscar dados via eventos on-chain.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import {
  LayoutDashboard,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  CreditCard,
} from "lucide-react";
import { useWalletInvoices } from "@/hooks/useWalletInvoices";
import { PaymentRequest, PaymentStatus } from "@/types";
import {
  getPaymentStatus,
  formatAmount,
  formatAddress,
  formatDate,
  getTimeRemaining,
} from "@/lib/utils";

type FilterType = "all" | PaymentStatus;

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; badge: string; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    badge: "badge badge-success",
    icon: <Clock size={12} />,
  },
  paid: {
    label: "Paid",
    badge: "badge badge-success",
    icon: <CheckCircle size={12} />,
  },
  cancelled: {
    label: "Cancelled",
    badge: "badge badge-danger",
    icon: <XCircle size={12} />,
  },
  expired: {
    label: "Expired",
    badge: "badge badge-neutral",
    icon: <AlertCircle size={12} />,
  },
};

function InvoiceCard({
  invoice,
  type,
  index,
}: {
  invoice: PaymentRequest;
  type: "created" | "received";
  index: number;
}) {
  const status = getPaymentStatus(invoice);
  const statusConfig = STATUS_CONFIG[status];
  const amount = formatAmount(invoice.amount, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(124, 58, 237, 0.35)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 20px rgba(124, 58, 237, 0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--border)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background:
                  type === "created"
                    ? "rgba(124, 58, 237, 0.15)"
                    : "rgba(37, 99, 235, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: type === "created" ? "#a78bfa" : "#60a5fa",
                flexShrink: 0,
              }}
            >
              {type === "created" ? (
                <CreditCard size={16} />
              ) : (
                <Receipt size={16} />
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "-0.01em",
                  marginBottom: "2px",
                }}
              >
                {invoice.title || "Untitled Invoice"}
              </div>
              <div
                style={{ color: "var(--text-secondary)", fontSize: "12px" }}
              >
                {type === "created" ? "→ " : "← "}
                {formatAddress(
                  type === "created"
                    ? invoice.recipient
                    : invoice.creator
                )}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={statusConfig.badge}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "10px",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "2px",
              }}
            >
              Amount
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
              className="gradient-text"
            >
              {amount} USDC
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "2px",
              }}
            >
              {status === "active" ? "Expires" : "Created"}
            </div>
            <div
              style={{ color: "var(--text-secondary)", fontSize: "12px" }}
            >
              {status === "active"
                ? getTimeRemaining(invoice.expiresAt)
                : formatDate(invoice.createdAt)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          {status === "active" && type === "received" && (
            <Link
              href={`/pay/${invoice.invoiceId}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 12px",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                borderRadius: "8px",
                color: "white",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <CreditCard size={13} />
              Pay Now
            </Link>
          )}
          {status === "paid" && (
            <Link
              href={`/receipt/${invoice.invoiceId}`}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <Receipt size={13} />
              View Receipt
            </Link>
          )}
          <Link
            href={`/pay/${invoice.invoiceId}`}
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <ExternalLink size={13} />
            Open
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            className="skeleton"
            style={{ width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0 }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="skeleton" style={{ height: "14px", borderRadius: "4px", width: "60%" }} />
            <div className="skeleton" style={{ height: "12px", borderRadius: "4px", width: "40%" }} />
          </div>
          <div className="skeleton" style={{ height: "22px", width: "60px", borderRadius: "9999px" }} />
        </div>
        <div
          className="skeleton"
          style={{ height: "60px", borderRadius: "10px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="skeleton" style={{ flex: 1, height: "34px", borderRadius: "8px" }} />
          <div className="skeleton" style={{ width: "80px", height: "34px", borderRadius: "8px" }} />
        </div>
      </div>
    </motion.div>
  );
}

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { createdInvoices, receivedInvoices, isLoading, error, refetch } =
    useWalletInvoices(address);

  const [filter, setFilter] = useState<FilterType>("all");
  const [tab, setTab] = useState<"created" | "received" | "all">("all");

  const getFiltered = (invoices: PaymentRequest[]) => {
    if (filter === "all") return invoices;
    return invoices.filter((inv) => getPaymentStatus(inv) === filter);
  };

  const displayInvoices =
    tab === "all"
      ? getFiltered([...createdInvoices, ...receivedInvoices])
      : tab === "created"
      ? getFiltered(createdInvoices)
      : getFiltered(receivedInvoices);

  const totalActive = [...createdInvoices, ...receivedInvoices].filter(
    (inv) => getPaymentStatus(inv) === "active"
  ).length;
  const totalPaid = [...createdInvoices, ...receivedInvoices].filter(
    (inv) => getPaymentStatus(inv) === "paid"
  ).length;

  if (!isConnected) {
    return (
      <div
        style={{
          maxWidth: "500px",
          margin: "100px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "#a78bfa",
            }}
          >
            <LayoutDashboard size={28} />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "10px",
            }}
          >
            Connect your wallet
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "15px",
              marginBottom: "28px",
            }}
          >
            Connect your wallet to view your invoice history.
          </p>
          <ConnectButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 24px 100px",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.25)",
              borderRadius: "9999px",
              padding: "4px 12px",
              marginBottom: "12px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a78bfa",
            }}
          >
            <LayoutDashboard size={11} />
            My Invoices
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {formatAddress(address!)} ·{" "}
            {createdInvoices.length + receivedInvoices.length} invoice
            {createdInvoices.length + receivedInvoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-secondary"
            onClick={refetch}
            disabled={isLoading}
            style={{ padding: "10px 16px", fontSize: "13px" }}
          >
            <RefreshCw size={14} className={isLoading ? "spin-slow" : ""} />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
          <Link href="/create">
            <button className="btn-primary" style={{ padding: "10px 18px", fontSize: "13px" }}>
              <Plus size={14} />
              New Invoice
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginBottom: "32px",
        }}
      >
        {[
          {
            label: "Total Invoices",
            value: createdInvoices.length + receivedInvoices.length,
            color: "#a78bfa",
          },
          { label: "Created", value: createdInvoices.length, color: "#a78bfa" },
          { label: "Received", value: receivedInvoices.length, color: "#60a5fa" },
          { label: "Active", value: totalActive, color: "#4ade80" },
          { label: "Paid", value: totalPaid, color: "#4ade80" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: stat.color,
                letterSpacing: "-0.02em",
              }}
            >
              {isLoading ? "—" : stat.value}
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{ marginBottom: "20px" }}
      >
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "12px",
            width: "fit-content",
          }}
        >
          {(
            [
              { label: "All", value: "all" },
              { label: `Sent (${createdInvoices.length})`, value: "created" },
              { label: `Received (${receivedInvoices.length})`, value: "received" },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                background:
                  tab === t.value
                    ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                    : "transparent",
                color: tab === t.value ? "white" : "var(--text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros de status */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "5px 12px",
                borderRadius: "9999px",
                border:
                  filter === f.value
                    ? "1px solid rgba(124, 58, 237, 0.5)"
                    : "1px solid var(--border)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background:
                  filter === f.value
                    ? "rgba(124, 58, 237, 0.1)"
                    : "transparent",
                color:
                  filter === f.value ? "#a78bfa" : "var(--text-secondary)",
                transition: "all 0.15s ease",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "20px",
            color: "#f87171",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
            <AlertCircle size={16} />
            Failed to load invoices. Check your connection.
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : displayInvoices.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            padding: "80px 24px",
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--text-muted)",
            }}
          >
            <Receipt size={24} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            No invoices found
          </p>
          <p style={{ fontSize: "14px", marginBottom: "24px" }}>
            {filter !== "all"
              ? `No ${filter} invoices in this view.`
              : "You haven't created or received any invoices yet."}
          </p>
          {filter !== "all" ? (
            <button
              className="btn-secondary"
              onClick={() => setFilter("all")}
              style={{ fontSize: "13px" }}
            >
              Show all invoices
            </button>
          ) : (
            <Link href="/create">
              <button className="btn-primary" style={{ fontSize: "13px" }}>
                <Plus size={14} />
                Create your first invoice
              </button>
            </Link>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${filter}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {displayInvoices.map((invoice, i) => (
              <InvoiceCard
                key={invoice.invoiceId}
                invoice={invoice}
                type={
                  createdInvoices.find((c) => c.invoiceId === invoice.invoiceId)
                    ? "created"
                    : "received"
                }
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
