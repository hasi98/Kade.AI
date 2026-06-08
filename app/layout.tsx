import type { Metadata } from "next";
import "./globals.css";

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
      </head>
      <body>{children}</body>
    </html>
  );
}
