import type { Metadata } from "next";
import "./globals.css";
import { dictionary } from "./dictionary";
import { createClient } from "@/lib/supabase/server";
import { SiteChrome } from "@/components/site/SiteChrome";

export const metadata: Metadata = {
  title: "RetroFight - Arcade netplay for Windows and Linux",
  description:
    "RetroFight is an arcade fighting game matchmaking client for Windows and Linux with a custom FBNeo runtime and GGPO integration.",
  icons: {
    icon: "/retrofight.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteChrome dictionary={dictionary} isAuthenticated={isAuthenticated}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
