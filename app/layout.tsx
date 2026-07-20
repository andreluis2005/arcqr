import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";
import { Navbar } from "@/components/layout/Navbar";
import ChatAgent from "@/components/ChatAgent";

export const metadata: Metadata = {
  title: "Arc QR — Create blockchain payment requests in seconds",
  description:
    "Arc QR lets you create, share and pay blockchain payment requests instantly on the Arc Network. Generate QR codes for USDC payments in seconds.",
  keywords: ["Arc Network", "payments", "blockchain", "USDC", "QR code", "Web3", "Circle"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arc QR",
  },
  openGraph: {
    title: "Arc QR — Blockchain Payment Requests",
    description: "Create blockchain payment requests in seconds on Arc Network.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="noise-overlay" />
          <Navbar />
          <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
          {/* ChatAgent: agente de IA flutuante disponível em todas as páginas */}
          <ChatAgent />
        </Providers>
        {/* Registro do Service Worker do PWA no browser */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('SW registered with scope: ', reg.scope);
                  }).catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

