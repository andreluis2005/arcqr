"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, LayoutDashboard, Plus, ShoppingCart, Cpu } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const isPOS = pathname === "/pos";
  const isNano = pathname === "/nano";
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: "64px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8, 11, 16, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(124, 58, 237, 0.4)",
            }}
          >
            <Zap size={16} color="white" fill="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "17px",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Arc<span style={{ color: "#a78bfa" }}>QR</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/dashboard"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius)",
              background: isDashboard
                ? "rgba(124, 58, 237, 0.12)"
                : "transparent",
              border: isDashboard
                ? "1px solid rgba(124, 58, 237, 0.3)"
                : "1px solid transparent",
              color: isDashboard ? "#a78bfa" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
          <Link
            href="/nano"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius)",
              background: isNano
                ? "rgba(124, 58, 237, 0.12)"
                : "transparent",
              border: isNano
                ? "1px solid rgba(124, 58, 237, 0.3)"
                : "1px solid transparent",
              color: isNano ? "#a78bfa" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <Cpu size={14} />
            Agents
          </Link>
          <Link
            href="/pos"
            style={{
              padding: "8px 14px",
              borderRadius: "var(--radius)",
              background: isPOS
                ? "rgba(124, 58, 237, 0.12)"
                : "transparent",
              border: isPOS
                ? "1px solid rgba(124, 58, 237, 0.3)"
                : "1px solid transparent",
              color: isPOS ? "#a78bfa" : "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <ShoppingCart size={14} />
            POS Terminal
          </Link>
          <Link
            href="/create"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius)",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              color: "white",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
            }}
          >
            <Plus size={14} />
            New Invoice
          </Link>
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="avatar"
          />
        </nav>
      </div>
    </header>
  );
}
