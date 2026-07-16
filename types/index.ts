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

export type PaymentStatus = "active" | "paid" | "cancelled" | "expired";

export interface CreatePaymentFormData {
  recipient: string;
  amount: string;
  token: string;
  title: string;
  description: string;
  durationDays: number;
}
