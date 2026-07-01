import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Kade AI | Kapruka Shopping Concierge",
  description:
    "Your premium AI shopping concierge for Kapruka.com — browse products, get delivery quotes, and checkout seamlessly in English, Sinhala, or Tanglish.",
  keywords: ["Kapruka", "Sri Lanka", "shopping", "AI", "gifts", "delivery", "MCP"],
  openGraph: {
    title: "Kade AI | Kapruka Shopping Concierge",
    description: "AI-powered shopping on Sri Lanka's largest e-commerce platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#FAFAF8" />
        <meta name="color-scheme" content="light dark" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
