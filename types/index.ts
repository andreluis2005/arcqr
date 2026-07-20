export interface PaymentRequest {
  invoiceId: `0x${string}`;
  creator: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  title: string;
  description: string;
  createdAt: bigint;
  expiresAt: bigint;
  paid: boolean;
  cancelled: boolean;
  payer: `0x${string}`;
}

export interface NanoChannel {
  payer: `0x${string}`;
  receiver: `0x${string}`;
  token: `0x${string}`;
  deposit: bigint;
  withdrawn: bigint;
  ratePerTick: bigint;
  intervalSeconds: bigint;
  lastTickAt: bigint;
  openedAt: bigint;
  closed: boolean;
}

export type PaymentStatus = "active" | "paid" | "cancelled" | "expired";

export interface CreatePaymentFormData {
  recipient: string;
  amount: string;
  token: string;
  title: string;
  description: string;
  durationDays: number;
}

export interface NanoChannelFormData {
  receiver: string;
  token: string;
  ratePerTick: string;
  intervalSeconds: number;
  durationSeconds: number;
}
