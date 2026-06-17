import Footer from "./Footer";
import Hero from "./Hero";
import Navbar from "./Navbar";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";
import { createClient } from "@/lib/supabase/server";

type LandingPageProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
};

export default async function LandingPage({ lang, dictionary }: LandingPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark-obsidian text-gray-100">
      <div className="retro-scanlines pointer-events-none fixed inset-0 z-40 opacity-[0.14] mix-blend-overlay" />
      <Navbar
        lang={lang}
        dictionary={dictionary}
        isAuthenticated={isAuthenticated}
      />

      <main>
        <Hero lang={lang} dictionary={dictionary} />
      </main>

      <Footer lang={lang} dictionary={dictionary} />
    </div>
  );
}
