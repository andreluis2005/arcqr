"use client";

/**
 * useWalletInvoices — T-02
 * Busca todas as faturas criadas/recebidas por uma wallet via eventos on-chain.
 * Usa viem getLogs com evento PaymentRequestCreated (creator e recipient são indexed).
 * Após encontrar os invoiceIds, chama getRequest para cada um (dados completos e atualizados).
 */

import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem } from "viem";
import { ARC_QR_PAYMENTS_ABI, CONTRACT_ADDRESS } from "@/constants/contracts";
import { PaymentRequest } from "@/types";
import { ARC_TESTNET } from "@/constants/chain";

// ABI do evento PaymentRequestCreated para uso no getLogs
const PAYMENT_REQUEST_CREATED_EVENT = parseAbiItem(
  "event PaymentRequestCreated(bytes32 indexed invoiceId, address indexed creator, address indexed recipient, address token, uint256 amount, string title, uint256 expiresAt)"
);

interface UseWalletInvoicesReturn {
  createdInvoices: PaymentRequest[];
  receivedInvoices: PaymentRequest[];
  allInvoices: PaymentRequest[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useWalletInvoices(
  address: `0x${string}` | undefined
): UseWalletInvoicesReturn {
  const publicClient = usePublicClient({ chainId: ARC_TESTNET.id });

  const [createdInvoices, setCreatedInvoices] = useState<PaymentRequest[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      // Busca faturas onde o usuário é CRIADOR (creator é topic 1, indexed)
      const createdLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: PAYMENT_REQUEST_CREATED_EVENT,
        fromBlock: 0n,
        toBlock: "latest",
        args: { creator: address },
      });

      // Busca faturas onde o usuário é DESTINATÁRIO (recipient é topic 2, indexed)
      const receivedLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        event: PAYMENT_REQUEST_CREATED_EVENT,
        fromBlock: 0n,
        toBlock: "latest",
        args: { recipient: address },
      });

      // Extrai invoiceIds dos logs
      const createdIds = createdLogs
        .map((log) => log.args.invoiceId)
        .filter((id): id is `0x${string}` => !!id);

      const receivedIds = receivedLogs
        .map((log) => log.args.invoiceId)
        // Exclui faturas onde o recipient é também creator (auto-fatura)
        .filter((id): id is `0x${string}` => !!id && !createdIds.includes(id));

      // Busca dados completos e atualizados de cada fatura via getRequest
      const fetchRequest = async (invoiceId: `0x${string}`): Promise<PaymentRequest | null> => {
        try {
          const data = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: ARC_QR_PAYMENTS_ABI,
            functionName: "getRequest",
            args: [invoiceId],
          });
          return data as PaymentRequest;
        } catch {
          return null;
        }
      };

      const [created, received] = await Promise.all([
        Promise.all(createdIds.map(fetchRequest)),
        Promise.all(receivedIds.map(fetchRequest)),
      ]);

      setCreatedInvoices(created.filter((r): r is PaymentRequest => r !== null));
      setReceivedInvoices(received.filter((r): r is PaymentRequest => r !== null));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao buscar faturas"));
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const allInvoices = [...createdInvoices, ...receivedInvoices];

  return {
    createdInvoices,
    receivedInvoices,
    allInvoices,
    isLoading,
    error,
    refetch: fetchInvoices,
  };
}
