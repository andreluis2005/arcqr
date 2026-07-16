"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap } from "lucide-react";

export function Navbar() {
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
            + New Request
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
