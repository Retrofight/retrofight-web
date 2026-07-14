import Hero from "./Hero";
import type { Dictionary } from "@/app/dictionary";

type LandingPageProps = {
  dictionary: Dictionary;
};

// Header and footer are provided globally by the root layout (SiteChrome).
export default function LandingPage({ dictionary }: LandingPageProps) {
  return (
    <div className="relative overflow-x-hidden bg-dark-obsidian text-gray-100">
      <div className="retro-scanlines pointer-events-none fixed inset-0 z-40 opacity-[0.14] mix-blend-overlay" />
      <main>
        <Hero dictionary={dictionary} />
      </main>
    </div>
  );
}
