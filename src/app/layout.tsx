import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display face with personality for headings & scores.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
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
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} min-h-dvh`}
      >
        {children}
      </body>
    </html>
  );
}
