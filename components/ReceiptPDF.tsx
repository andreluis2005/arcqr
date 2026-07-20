"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ReceiptPDFProps {
  elementId: string;
  invoiceId: string;
}

export default function ReceiptPDF({ elementId, invoiceId }: ReceiptPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error("Element not found");
      }

      // Carrega os módulos dinamicamente no cliente para evitar erros de SSR no build
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Ocultar os botões de ação e outras partes marcadas para serem ignoradas no PDF
      const ignoreElements = element.querySelectorAll("[data-pdf-ignore]");
      ignoreElements.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // Renderizar o elemento HTML em um Canvas com boa escala/qualidade
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#0d1117", // var(--surface) background
        useCORS: true,
        logging: false,
      });

      // Restaurar a visibilidade dos elementos originais
      ignoreElements.forEach((el) => {
        // Restaura para display flex ou block conforme original
        (el as HTMLElement).style.display = "";
      });

      const imgData = canvas.toDataURL("image/png");

      // Dimensões proporcionais
      const width = canvas.width / 2;
      const height = canvas.height / 2;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`arcqr-receipt-${invoiceId.slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="btn-secondary"
      style={{ flex: 1, justifyContent: "center", fontSize: "13px" }}
    >
      {isGenerating ? (
        <>
          <Loader2 size={13} style={{ animation: "spin-slow 0.8s linear infinite" }} />
          Generating...
        </>
      ) : (
        <>
          <Download size={13} />
          Receipt PDF
        </>
      )}
    </button>
  );
}
