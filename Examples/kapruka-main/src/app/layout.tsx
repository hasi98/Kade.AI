import type { Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AGENT } from "@/lib/persona";
import "./globals.css";
import "./animations.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

const PAGE_TITLE = `${AGENT.name} - Kapruka Shopping Concierge`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    "Your AI-powered personal shopping concierge for Kapruka.com. Groceries, electronics, gifts and more — search, check delivery, and checkout, all in one chat.",
  openGraph: {
    title: PAGE_TITLE,
    description: "AI-powered shopping assistant for Kapruka.com — everyday essentials to gifts",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${instrumentSerif.variable} ${caveat.variable}`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
