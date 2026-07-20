"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  QrCode,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileCheck,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: <Zap size={22} />,
    title: "Instant Settlement",
    description: "Create blockchain payment requests in seconds with sub-second finality on Arc Network.",
  },
  {
    icon: <QrCode size={22} />,
    title: "QR Code Checkout",
    description: "Share via dynamically generated QR codes or direct links. Pay from any Web3 wallet.",
  },
  {
    icon: <Shield size={22} />,
    title: "100% On-chain Logs",
    description: "Every invoice, payment transaction, and cancellation is permanently settled on-chain.",
  },
  {
    icon: <Clock size={22} />,
    title: "Expiration Logic",
    description: "Set customizeable expiration times. Expired invoices are securely locked automatically.",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect Wallet",
    description: "Connect your Web3 browser wallet configured to the Arc Testnet.",
  },
  {
    num: "02",
    title: "Create Invoice",
    description: "Input payment parameters (amount, recipient, title) using our AI agent or simple forms.",
  },
  {
    num: "03",
    title: "Share & Receive",
    description: "Send the generated payment request. When they pay, funds settle in your wallet instantly.",
  },
];

export default function HomePage() {
  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Background glowing orbs */}
      <div
        className="orb orb-purple"
        style={{
          width: "700px",
          height: "700px",
          top: "-250px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.8,
        }}
      />
      <div
        className="orb orb-blue"
        style={{
          width: "500px",
          height: "500px",
          top: "400px",
          left: "-100px",
          opacity: 0.5,
        }}
      />
      <div
        className="orb orb-purple"
        style={{
          width: "600px",
          height: "600px",
          bottom: "-200px",
          right: "-100px",
          opacity: 0.6,
        }}
      />

      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 24px 80px",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Faucet/Network Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.25)",
              borderRadius: "9999px",
              padding: "6px 18px",
              marginBottom: "32px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#a78bfa",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#a78bfa",
                boxShadow: "0 0 8px #a78bfa",
              }}
            />
            Circle economic engine · Arc Network L1 · Programmable Money Hackathon 2026
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(42px, 7vw, 76px)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              marginBottom: "24px",
            }}
          >
            <span className="gradient-text-white">Seamless USDC payments</span>
            <br />
            <span className="gradient-text">for the Agentic Economy.</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "clamp(16px, 2.2vw, 20px)",
              lineHeight: 1.65,
              maxWidth: "680px",
              margin: "0 auto 48px",
            }}
          >
            Generate shareable Web3 payment links and instant QR codes. Powered by a local AI agent
            for effortless billing and gasless native-USDC experience on Arc.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "64px",
            }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/create"
                className="btn-primary"
                style={{
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 8px 30px rgba(124, 58, 237, 0.3)",
                }}
              >
                Create Request
                <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/pos"
                className="btn-secondary"
                style={{
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ShoppingCart size={18} />
                POS Terminal
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/nano"
                className="btn-secondary"
                style={{
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid rgba(74, 222, 128, 0.4)",
                  color: "#4ade80",
                }}
              >
                <Sparkles size={18} />
                Agent-to-Agent
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Live Preview Dashboard Cards Mock */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            maxWidth: "860px",
            margin: "40px auto 0",
          }}
        >
          {/* Card Left: Merchant Checkout Mock */}
          <div
            className="float-animation"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "left",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(124,58,237,0.15)",
                  color: "#a78bfa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShoppingCart size={16} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>POS checkout</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Terminal Active</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: "auto", fontSize: "10px" }}>
                Waiting
              </span>
            </div>
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "10px",
                padding: "12px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px" }}>
                TOTAL AMOUNT
              </div>
              <div className="gradient-text" style={{ fontSize: "28px", fontWeight: 800 }}>
                150.00 USDC
              </div>
            </div>
            {/* Simulation of a small QR */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "4px",
                padding: "12px",
                background: "white",
                borderRadius: "8px",
                width: "100px",
                margin: "0 auto",
              }}
            >
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    background: (i + 7) % 3 === 0 ? "#0d1117" : "white",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card Right: AI Agent Chat Simulation */}
          <div
            className="float-animation"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "left",
              boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
              animationDelay: "1.5s",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(37,99,235,0.15)",
                  color: "#60a5fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare size={16} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>Arc AI Agent</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Co-pilot active</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: "auto", fontSize: "10px" }}>
                AI Ready
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  padding: "8px 12px",
                  borderRadius: "4px 10px 10px 10px",
                  fontSize: "12px",
                }}
              >
                "Cobre 50 USDC da carteira do cliente João para Desenvolvimento Web."
              </div>
              <div
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  padding: "8px 12px",
                  borderRadius: "10px 4px 10px 10px",
                  fontSize: "12px",
                  color: "white",
                  alignSelf: "flex-end",
                  width: "85%",
                }}
              >
                "Gerando fatura de 50.00 USDC para João. Clique no botão abaixo para confirmar na rede."
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Why Arc Network Section */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1100px",
          margin: "80px auto",
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Why build payments on <span className="gradient-text">Arc Network?</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            The financial infrastructure built by Circle.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <Sparkles size={24} color="#a78bfa" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>USDC Native Gas</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
              No need to buy raw blockchain tokens for gas. Arc uses USDC natively for gas, allowing clean
              single-currency interactions.
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <FileCheck size={24} color="#60a5fa" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Sub-second Settlement</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
              Forget waiting minutes for confirmations. Arc settles payments instantly with near-instant block confirmation.
            </p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <TrendingUp size={24} color="#34d399" style={{ marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>Agent-Native Architecture</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
              The Agentic Economy requires machine-to-machine micropayments. Our smart contract is optimized for autonomous agents billing.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works (Steps) */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1000px",
          margin: "120px auto 80px",
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800 }}>How it works</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            Get started in three simple steps.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px" }}>
          {steps.map((s, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <div
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  color: "rgba(124, 58, 237, 0.15)",
                  lineHeight: 1,
                  fontFamily: "monospace",
                }}
              >
                {s.num}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, marginTop: "-12px", marginBottom: "8px" }}>
                {s.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.6 }}>
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Detail Grid */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1200px",
          margin: "120px auto 140px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {features.map((feature, i) => (
            <motion.div key={i} whileHover={{ y: -4 }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "28px",
                  height: "100%",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124, 58, 237, 0.4)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 24px rgba(124, 58, 237, 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(124, 58, 237, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a78bfa",
                    marginBottom: "16px",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    marginBottom: "8px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "800px",
          margin: "0 auto 120px",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(13,17,23,0.8), rgba(22,27,34,0.8))",
            border: "1px solid var(--border)",
            borderRadius: "24px",
            padding: "56px 40px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          <h2 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "16px" }}>
            Ready to accept Web3 payments?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginBottom: "32px", maxWidth: "480px", margin: "0 auto 32px" }}>
            Launch the POS cashier terminal or connect with our AI agent to start billing in USDC.
          </p>
          <Link
            href="/create"
            className="btn-primary"
            style={{
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Launch app
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
