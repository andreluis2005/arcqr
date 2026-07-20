"use client";

import { useEffect, useRef } from "react";

/**
 * usePaymentNotification — T-07
 * Monitora o status de pagamento de uma fatura e dispara uma notificação do browser quando é paga.
 * A atualização do status é puxada automaticamente pelo polling de 5 segundos do hook usePaymentRequest.
 */
export function usePaymentNotification(
  paid: boolean | undefined,
  title: string | undefined
) {
  const hasNotified = useRef(false);

  useEffect(() => {
    // Solicita permissão para notificações do navegador se ainda não foi configurado
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    // Dispara a notificação apenas se o status mudar para pago, se houver título,
    // e se ainda não notificamos nesta sessão de visualização.
    if (paid && title && !hasNotified.current) {
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification("Payment Confirmed! 🎉", {
              body: `The invoice "${title}" has been successfully paid on Arc Network.`,
              icon: "/favicon.ico",
            });
            hasNotified.current = true;
          } catch (err) {
            console.error("Failed to show browser notification:", err);
          }
        }
      }
    }
  }, [paid, title]);
}
