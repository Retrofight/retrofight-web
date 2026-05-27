import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retrofight - Arcade netplay senza port forwarding",
  description:
    "Landing page di Retrofight: matchmaking arcade online, GGPO rollback e NAT traversal per RetroArch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
