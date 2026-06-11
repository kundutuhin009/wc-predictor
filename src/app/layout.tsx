import type { Metadata, Viewport } from "next";
import { Oswald, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Athletic, condensed display face for headings, team names & scores.
const display = Oswald({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});
// Clean body face.
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
// Tabular/mono figures so score columns align.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "World Cup 2026 Predictor",
  description:
    "Predict the exact scoreline of every World Cup 2026 match. One point per exact hit.",
};

export const viewport: Viewport = {
  themeColor: "#0B7A4B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Open flag icon set (no copyrighted assets) for team flags. */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7/css/flag-icons.min.css"
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} min-h-dvh`}
      >
        {children}
      </body>
    </html>
  );
}
