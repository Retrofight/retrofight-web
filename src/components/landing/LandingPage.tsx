import Footer from "./Footer";
import Hero from "./Hero";
import Navbar from "./Navbar";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";

type LandingPageProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
};

export default function LandingPage({ lang, dictionary }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark-obsidian text-gray-100">
      <div className="retro-scanlines pointer-events-none fixed inset-0 z-40 opacity-[0.14] mix-blend-overlay" />
      <Navbar lang={lang} dictionary={dictionary} />

      <main>
        <Hero lang={lang} dictionary={dictionary} />
      </main>

      <Footer lang={lang} dictionary={dictionary} />
    </div>
  );
}
