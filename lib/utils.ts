import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PaymentRequest, PaymentStatus } from "@/types";
import { ZERO_ADDRESS } from "@/constants/contracts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, chars = 6): string {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function getPaymentStatus(request: PaymentRequest): PaymentStatus {
  if (request.paid) return "paid";
  if (request.cancelled) return "cancelled";
  if (BigInt(Date.now()) / 1000n > request.expiresAt) return "expired";
  return "active";
}

export function formatAmount(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
}

export function parseAmount(amount: string, decimals: number = 6): bigint {
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTimeRemaining(expiresAt: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = expiresAt - now;
  if (diff <= 0n) return "Expired";

  const days = diff / 86400n;
  const hours = (diff % 86400n) / 3600n;
  const minutes = (diff % 3600n) / 60n;

  if (days > 0n) return `${days}d ${hours}h remaining`;
  if (hours > 0n) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function isNativeToken(tokenAddress: string): boolean {
  return tokenAddress === ZERO_ADDRESS;
}

export function getExplorerUrl(
  hash: string,
  type: "tx" | "address" = "tx"
): string {
  const base =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.testnet.arc.network";
  return `${base}/${type}/${hash}`;
}

export function generatePayUrl(invoiceId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://arcqr.vercel.app");
  return `${base}/pay/${invoiceId}`;
}
