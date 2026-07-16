"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Shield, Clock, QrCode } from "lucide-react";

const features = [
  {
    icon: <Zap size={20} />,
    title: "Instant",
    description: "Create a blockchain payment request in seconds, with no red tape.",
  },
  {
    icon: <QrCode size={20} />,
    title: "QR Code",
    description: "Share via QR Code or direct link. Pay from any wallet.",
  },
  {
    icon: <Shield size={20} />,
    title: "100% On-chain",
    description: "Every request is stored and settled directly on the Arc smart contract.",
  },
  {
    icon: <Clock size={20} />,
    title: "Expiration Control",
    description: "Set an expiry date. Expired requests are automatically blocked.",
  },
];

export default function HomePage() {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div
        className="orb orb-purple"
        style={{
          width: "600px",
          height: "600px",
          top: "-200px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <div
        className="orb orb-blue"
        style={{
          width: "400px",
          height: "400px",
          bottom: "100px",
          left: "10%",
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(124, 58, 237, 0.1)",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "9999px",
              padding: "6px 16px",
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
            Built on Arc Network · Circle
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            <span className="gradient-text-white">Blockchain payments</span>
            <br />
            <span className="gradient-text">in seconds.</span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "clamp(16px, 2vw, 20px)",
              lineHeight: 1.7,
              maxWidth: "580px",
              margin: "0 auto 48px",
            }}
          >
            Create USDC payment requests on the Arc Network, generate QR codes
            and share them with anyone in the world. No intermediaries.
          </p>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/create"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  color: "white",
                  textDecoration: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  boxShadow: "0 4px 24px rgba(124, 58, 237, 0.4)",
                  transition: "box-shadow 0.2s ease",
                }}
              >
                Create Request
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ marginTop: "72px" }}
        >
          <div
            className="float-animation"
            style={{
              maxWidth: "420px",
              margin: "0 auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
            }}
          >
            {/* Mock Invoice Card */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={18} color="white" fill="white" />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>Design Service</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>arc:0x1a2b...9f3e</div>
              </div>
              <span
                className="badge badge-success"
                style={{ marginLeft: "auto" }}
              >
                Active
              </span>
            </div>
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>
                TOTAL DUE
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                }}
                className="gradient-text"
              >
                500 USDC
              </div>
            </div>
            {/* Mock QR */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: "3px",
                padding: "16px",
                background: "white",
                borderRadius: "10px",
                margin: "0 auto",
                maxWidth: "140px",
              }}
            >
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    background:
                      ((i * 29 + 13) % 3 === 0 || (i * 7) % 5 === 0) ? "#111" : "white",
                    borderRadius: "1px",
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "60px 24px 120px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            Simple for creators.
            <br />
            <span className="gradient-text">Simple for payers.</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>
            Web3 infrastructure without the complexity.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
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
                    background: "rgba(124, 58, 237, 0.15)",
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
                    fontSize: "14px",
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
    </div>
  );
}
