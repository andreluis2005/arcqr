"use client";

import {
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { parseAbiItem, decodeEventLog } from "viem";
import { ARC_QR_PAYMENTS_ABI, CONTRACT_ADDRESS, ZERO_ADDRESS } from "@/constants/contracts";
import { CreatePaymentFormData, PaymentRequest } from "@/types";
import { parseAmount } from "@/lib/utils";
import { ARC_TESTNET } from "@/constants/chain";

export function useCreatePaymentRequest() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash, chainId: ARC_TESTNET.id });
  const publicClient = usePublicClient({ chainId: ARC_TESTNET.id });

  const create = async (
    formData: CreatePaymentFormData
  ): Promise<`0x${string}` | null> => {
    const tokenAddress = (formData.token || ZERO_ADDRESS) as `0x${string}`;
    const tokenDecimals = tokenAddress === ZERO_ADDRESS ? 6 : 18;
    const amount = parseAmount(formData.amount, tokenDecimals);
    const durationInSeconds = BigInt(formData.durationDays * 86400);

    const txHash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ARC_QR_PAYMENTS_ABI,
      functionName: "createPaymentRequest",
      args: [
        formData.recipient as `0x${string}`,
        tokenAddress,
        amount,
        formData.title,
        formData.description,
        durationInSeconds,
      ],
      chainId: ARC_TESTNET.id,
    });

    // Wait for receipt and extract invoiceId from event log
    if (publicClient) {
      const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      for (const log of txReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ARC_QR_PAYMENTS_ABI,
            data: log.data,
            topics: log.topics,
            eventName: "PaymentRequestCreated",
          });
          return decoded.args.invoiceId as `0x${string}`;
        } catch {
          // not the event we're looking for
        }
      }
    }

    return null;
  };

  return {
    create,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

export function usePaymentRequest(invoiceId: string | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_QR_PAYMENTS_ABI,
    functionName: "getRequest",
    args: invoiceId ? [invoiceId as `0x${string}`] : undefined,
    query: {
      enabled: !!invoiceId && invoiceId !== "0x",
      refetchInterval: 5000,
      retry: false,
    },
    chainId: ARC_TESTNET.id,
  });

  return {
    request: data as PaymentRequest | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function usePayInvoice() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash, chainId: ARC_TESTNET.id });

  const pay = async (invoiceId: `0x${string}`, amount: bigint, isNative: boolean) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ARC_QR_PAYMENTS_ABI,
      functionName: "pay",
      args: [invoiceId],
      value: isNative ? amount : 0n,
      chainId: ARC_TESTNET.id,
    });
  };

  return {
    pay,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    receipt,
  };
}

export function useCancelPaymentRequest() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: ARC_TESTNET.id,
  });

  const cancel = async (invoiceId: `0x${string}`) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ARC_QR_PAYMENTS_ABI,
      functionName: "cancel",
      args: [invoiceId],
      chainId: ARC_TESTNET.id,
    });
  };

  return {
    cancel,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
