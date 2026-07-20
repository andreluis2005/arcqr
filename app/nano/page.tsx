"use client";

/**
 * /nano — Agent-to-Agent Nanopayments Demo
 *
 * Shows two AI agent "roles" in a side-by-side panel:
 *  - AGENT A (Client) opens a nano-channel depositing USDC.
 *  - AGENT B (Server) settles ticks every interval, simulating an API/data stream.
 *
 * In production, Agent A and Agent B are scripts that call the contract automatically.
 * For demo we let a human(s) trigger the actions from one wallet using the steps.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Bot,
  Cpu,
  Zap,
  ArrowRight,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Loader2,
  Activity,
  DollarSign,
  Server,
  Sparkles,
} from "lucide-react";
import {
  useOpenNanoChannel,
  useSettleNanoChannel,
  useCloseNanoChannel,
  useNanoChannel,
} from "@/hooks/useArcPayments";
import { ZERO_ADDRESS } from "@/constants/contracts";
import { ARC_TESTNET } from "@/constants/chain";
import { formatAmount } from "@/lib/utils";

type Step = "idle" | "opened" | "running" | "settled" | "closed";

const TICK_SECONDS = 10; // demo tick (10s)

export default function NanoPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { open, isPending: openPending, isConfirming: openConfirming } =
    useOpenNanoChannel();
  const { settle, isPending: settlePending } = useSettleNanoChannel();
  const { close, isPending: closePending } = useCloseNanoChannel();

  const [channelId, setChannelId] = useState<`0x${string}` | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tickCount, setTickCount] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const { channel } = useNanoChannel(channelId ?? undefined);

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET.id;
  const busy = openPending || openConfirming || settlePending || closePending;

  // Auto-settle loop while running
  useEffect(() => {
    if (!isAutoRunning || !channelId || step !== "running") return;
    const id = setInterval(async () => {
      try {
        await settle(channelId);
        setTickCount((c) => c + 1);
      } catch (err) {
        console.error("settle error", err);
        setIsAutoRunning(false);
      }
    }, TICK_SECONDS * 1000);
    return () => clearInterval(id);
  }, [isAutoRunning, channelId, step, settle]);

  const handleOpen = async () => {
    if (!address) return;
    setError(null);
    setTickCount(0);
    try {
      const id = await open({
        receiver: address, // self-demo: payer == channel receiver in this single-wallet UI
        token: ZERO_ADDRESS,
        ratePerTick: "0.0001",
        intervalSeconds: TICK_SECONDS,
        durationSeconds: TICK_SECONDS * 12, // 12 ticks
      });
      if (id) {
        setChannelId(id);
        setStep("opened");
      } else {
        setError("Channel opened but ID not found in event log");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Open failed";
      setError(msg.slice(0, 160));
    }
  };

  const handleStart = () => {
    if (!channelId) return;
    setStep("running");
    setIsAutoRunning(true);
  };

  const handleStop = async () => {
    setIsAutoRunning(false);
    setStep("settled");
  };

  const handleSettleOnce = async () => {
    if (!channelId) return;
    try {
      await settle(channelId);
      setTickCount((c) => c + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Settle failed";
      setError(msg.slice(0, 160));
    }
  };

  const handleClose = async () => {
    if (!channelId) return;
    setIsAutoRunning(false);
    try {
      await close(channelId);
      setStep("closed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Close failed";
      setError(msg.slice(0, 160));
    }
  };

  const handleReset = () => {
    setChannelId(null);
    setStep("idle");
    setTickCount(0);
    setIsAutoRunning(false);
    setError(null);
  };

  const totalSpent = channel ? channel.withdrawn : 0n;
  const remaining = channel ? channel.deposit - channel.withdrawn : 0n;
  const isClosed = channel?.closed ?? false;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        padding: "60px 24px 80px",
        overflow: "hidden",
      }}
    >
      <div className="orb orb-purple" style={{ width: "500px", height: "500px", top: "-10%", left: "-10%" }} />
      <div className="orb orb-blue" style={{ width: "400px", height: "400px", bottom: "-10%", right: "-10%" }} />

      <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              background: "rgba(124, 58, 237, 0.08)",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "20px",
              color: "#a78bfa",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={14} />
            Agentic Economy · Circle Nanopayments on Arc
          </div>
          <h1 style={{ fontSize: "44px", fontWeight: 800, marginBottom: "16px", lineHeight: 1.1 }}>
            Agent-to-Agent <span className="gradient-text">Nanopayments</span>
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "17px",
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Open a payment channel, stream USDC ticks between AI agents, and close the channel
            with refund — all on Arc. Inspired by Circle Nanopayments primitives, settled entirely
            on-chain in USDC.
          </p>
        </motion.div>

        {/* Wallet gate */}
        {!isConnected && (
          <div className="card-elevated" style={{ padding: "40px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
            <Bot size={36} color="#a78bfa" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
              Connect wallet to start
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Demo uses one wallet to play both agent roles.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ConnectButton />
            </div>
          </div>
        )}

        {isConnected && isWrongNetwork && (
          <div className="card-elevated" style={{ padding: "40px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
            <ShieldAlert size={36} color="#fbbf24" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>
              Wrong network
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Switch to Arc Testnet.
            </p>
            <button className="btn-primary" onClick={() => switchChain({ chainId: ARC_TESTNET.id })}>
              Switch to Arc Testnet
            </button>
          </div>
        )}

        {isConnected && !isWrongNetwork && (
          <>
            {/* Two agent panels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <AgentCard
                name="Agent · Client"
                role="AI Customer"
                icon={<Bot size={24} />}
                accent="#a78bfa"
                action={`Pays 0.0001 USDC every ${TICK_SECONDS}s`}
                badge={step !== "idle" ? "Active" : "Idle"}
                badgeColor={step !== "idle" ? "#a78bfa" : "var(--text-muted)"}
              />
              <AgentCard
                name="Agent · Server"
                role="AI API Provider"
                icon={<Server size={24} />}
                accent="#4ade80"
                action={`Settles tick on every interval`}
                badge={isAutoRunning ? "Listening" : channelId ? "Ready" : "Idle"}
                badgeColor={isAutoRunning ? "#4ade80" : channelId ? "#a78bfa" : "var(--text-muted)"}
              />
            </div>

            {/* Channel stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated"
              style={{ padding: "28px", marginBottom: "24px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Activity size={20} color="#a78bfa" />
                <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Channel Status</h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "16px",
                }}
              >
                <StatBlock label="Channel ID" value={channelId ? `${channelId.slice(0, 8)}…${channelId.slice(-6)}` : "—"} />
                <StatBlock label="Deposit" value={channel ? `${formatAmount(channel.deposit, 6)} USDC` : "—"} />
                <StatBlock label="Accrued" value={channel ? `${formatAmount(totalSpent, 6)} USDC` : "0 USDC"} highlight />
                <StatBlock label="Remaining" value={channel ? `${formatAmount(remaining, 6)} USDC` : "—"} />
                <StatBlock label="Ticks settled" value={String(tickCount)} />
                <StatBlock label="State" value={isClosed ? "Closed" : step === "running" ? "Streaming" : step === "opened" ? "Open" : step === "settled" ? "Settled" : "Idle"} />
              </div>
            </motion.div>

            {/* Action bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated"
              style={{ padding: "28px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Cpu size={20} color="#a78bfa" />
                <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Agentic Workflow</h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <ActionRow
                  step={1}
                  active={step === "idle"}
                  done={step !== "idle"}
                  icon={<DollarSign size={16} />}
                  title="Open nano-channel"
                  desc={`Agent Client opens channel depositing ${TICK_SECONDS * 12} × 0.0001 = 0.0012 USDC.`}
                  buttonLabel={busy ? "Working…" : "Open Channel"}
                  buttonIcon={busy ? <Loader2 size={14} className="spin-slow" /> : <Zap size={14} />}
                  onClick={handleOpen}
                  disabled={step !== "idle" || busy}
                />

                <ActionRow
                  step={2}
                  active={step === "opened"}
                  done={step === "running" || step === "settled" || step === "closed"}
                  icon={<Play size={16} />}
                  title="Stream ticks (auto-settle)"
                  desc={`Agent Server auto-settles a tick every ${TICK_SECONDS}s. Stop whenever you want.`}
                  buttonLabel={isAutoRunning ? "Pause" : "Start auto-stream"}
                  buttonIcon={
                    isAutoRunning ? <Pause size={14} /> :
                    busy ? <Loader2 size={14} className="spin-slow" /> : <Play size={14} />
                  }
                  onClick={isAutoRunning ? handleStop : handleStart}
                  disabled={step === "idle" || step === "closed"}
                />

                <ActionRow
                  step={3}
                  active={step === "running" || step === "settled"}
                  done={step === "closed"}
                  icon={<ArrowRight size={16} />}
                  title="Manual settle"
                  desc="Settle a single tick on-demand (e.g. per API request)."
                  buttonLabel="Settle now"
                  buttonIcon={busy ? <Loader2 size={14} className="spin-slow" /> : <Zap size={14} />}
                  onClick={handleSettleOnce}
                  disabled={!channelId || isClosed || busy}
                />

                <ActionRow
                  step={4}
                  active={step !== "idle"}
                  done={step === "closed"}
                  icon={<CheckCircle size={16} />}
                  title="Close & refund"
                  desc="Pull any remaining USDC back to the payer."
                  buttonLabel={closePending ? "Closing…" : "Close Channel"}
                  buttonIcon={closePending ? <Loader2 size={14} className="spin-slow" /> : <CheckCircle size={14} />}
                  onClick={handleClose}
                  disabled={!channelId || isClosed || busy}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", flexWrap: "wrap", gap: "12px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "520px" }}>
                  In production, each step above is called by an autonomous agent signing a tx.
                  Here we let you trigger them manually while keeping the same on-chain primitives
                  used by AI agent flows.
                </p>
                <button className="btn-secondary" onClick={handleReset}>
                  <RotateCcw size={14} />
                  Reset demo
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      marginTop: "16px",
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "1px solid rgba(220, 38, 38, 0.3)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "#f87171",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Explainer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated"
              style={{ padding: "24px", marginTop: "24px" }}
            >
              <h4 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "12px" }}>
                Why Nanopayments for AI agents?
              </h4>
              <ul style={{ color: "var(--text-secondary)", fontSize: "14px", paddingLeft: "20px", lineHeight: 1.7 }}>
                <li>Pay-per-second or pay-per-API-call without per-tx gas overhead.</li>
                <li>Pre-funded channel settles in batches — perfect for high-frequency agentic workloads.</li>
                <li>Refund of unused deposit when the agent session ends.</li>
                <li>Sub-second Arc settlement + USDC as native gas = cheap micro-transfers.</li>
              </ul>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function AgentCard({
  name,
  role,
  icon,
  accent,
  action,
  badge,
  badgeColor,
}: {
  name: string;
  role: string;
  icon: React.ReactNode;
  accent: string;
  action: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="card-elevated" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: `${accent}22`,
              border: `1px solid ${accent}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{name}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{role}</div>
          </div>
        </div>
        <span className="badge" style={{ background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}55` }}>
          {badge}
        </span>
      </div>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{action}</p>
    </div>
  );
}

function StatBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          color: "var(--text-secondary)",
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: highlight ? "20px" : "16px",
          fontWeight: 700,
          color: highlight ? "#4ade80" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ActionRow({
  step,
  active,
  done,
  icon,
  title,
  desc,
  buttonLabel,
  buttonIcon,
  onClick,
  disabled,
}: {
  step: number;
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  buttonLabel: string;
  buttonIcon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px",
        background: active ? "rgba(124, 58, 237, 0.06)" : "transparent",
        border: `1px solid ${active ? "rgba(124, 58, 237, 0.3)" : "var(--border)"}`,
        borderRadius: "12px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: done ? "rgba(74, 222, 128, 0.15)" : "var(--surface-2)",
          border: `1px solid ${done ? "rgba(74, 222, 128, 0.4)" : "var(--border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: done ? "#4ade80" : "var(--text-secondary)",
          fontWeight: 700,
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        {done && step !== 4 ? <CheckCircle size={16} /> : done && step === 4 ? <CheckCircle size={16} color="#4ade80" /> : step}
      </div>
      <div style={{ flex: 1, minWidth: "220px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>
          {icon}
          {title}
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{desc}</div>
      </div>
      <button className="btn-primary" onClick={onClick} disabled={disabled} style={{ minWidth: "140px", justifyContent: "center" }}>
        {buttonIcon}
        {buttonLabel}
      </button>
    </div>
  );
}
