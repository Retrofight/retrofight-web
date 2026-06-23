import Image from "next/image";
import Link from "next/link";
import { DownloadConsentLink } from "@/components/legal/DownloadConsentLink";
import {
  Archive,
  Code,
  Download,
  ExternalLink,
  Gamepad2,
  Monitor,
  Network,
  Package,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import type { Locale, dictionaries } from "@/app/[lang]/dictionaries";

const heroImg = "/lobby-games-selection.png";
const screenshotStrip = [
  {
    src: "/request-match.png",
    alt: "RetroFight match request screen",
    label: "Challenge",
  },
  {
    src: "/game-test-running.png",
    alt: "RetroFight test mode running",
    label: "Runtime",
  },
  {
    src: "/login-screen.png",
    alt: "RetroFight login screen",
    label: "Profile",
  },
];

type HeroProps = {
  lang: Locale;
  dictionary: (typeof dictionaries)[Locale];
};

export default function Hero({ lang, dictionary }: HeroProps) {
  const home = dictionary.home;
  const downloadLinks = [
    {
      href: dictionary.installerUrl,
      label: home.downloadWindowsInstaller,
      meta: "EXE",
      Icon: Download,
      primary: true,
    },
    {
      href: dictionary.portableUrl,
      label: home.downloadWindowsPortable,
      meta: "ZIP",
      Icon: Archive,
      primary: false,
    },
    {
      href: dictionary.linuxAppImageUrl,
      label: home.downloadLinuxAppImage,
      meta: "AppImage",
      Icon: Terminal,
      primary: false,
    },
    {
      href: dictionary.linuxDebUrl,
      label: home.downloadLinuxDeb,
      meta: "DEB",
      Icon: Package,
      primary: false,
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-dark-border bg-dark-obsidian">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(119,230,255,0.16),transparent_30rem),radial-gradient(circle_at_86%_18%,rgba(245,158,11,0.08),transparent_26rem),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-sm border border-brand-purple-500/30 bg-brand-purple-950/60 px-3 py-2">
              <span className="h-2 w-2 bg-brand-purple-500" />
              <span className="font-pixel text-[9px] uppercase tracking-widest text-brand-purple-400">
                {home.badge}
              </span>
            </div>

            <h1 className="font-display text-6xl font-black uppercase italic leading-none tracking-normal text-white sm:text-7xl lg:text-8xl">
              {home.title}
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-relaxed text-zinc-200">
              {home.subtitle}
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
              {home.intro}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2">
                <Monitor className="h-4 w-4 text-brand-purple-400" />
                {home.platforms}
              </span>
              <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2">
                <Network className="h-4 w-4 text-brand-purple-400" />
                FBNeo + GGPO
              </span>
            </div>

            <div id="downloads" className="mt-8 grid gap-3 sm:grid-cols-2">
              {downloadLinks.map(({ href, label, meta, Icon, primary }) => (
                <DownloadConsentLink
                  key={href}
                  href={href}
                  className={`inline-flex min-h-16 items-center justify-between gap-3 rounded-sm px-4 py-3 font-display text-xs font-black uppercase italic transition ${
                    primary
                      ? "bg-brand-purple-500 text-[#071116] shadow-[0_12px_28px_rgba(34,211,238,0.16)] hover:bg-[#67e8f9]"
                      : "border border-white/10 bg-white/[0.04] text-white hover:border-brand-purple-500 hover:bg-brand-purple-500/10"
                  }`}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="shrink-0 rounded-sm border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] not-italic text-current">
                    {meta}
                  </span>
                </DownloadConsentLink>
              ))}
              <Link
                href={`/${lang}/wiki`}
                className="inline-flex min-h-16 items-center justify-center gap-2 rounded-sm border border-white/10 px-4 py-3 font-display text-xs font-bold uppercase italic text-zinc-200 transition hover:border-brand-purple-500 hover:text-white sm:col-span-2"
              >
                <Gamepad2 className="h-5 w-5" />
                {home.howTo}
              </Link>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="grid w-full gap-3">
              <div className="relative overflow-hidden rounded-sm border border-white/10 bg-black shadow-2xl shadow-black/60">
                <div className="retro-scanlines pointer-events-none absolute inset-0 z-10 opacity-35" />
                <div className="relative aspect-[1903/975] w-full">
                  <Image
                    src={heroImg}
                    alt="RetroFight game selection screen"
                    fill
                    priority
                    sizes="(min-width: 1024px) 640px, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 border-t border-white/10 bg-black/70 text-center font-mono text-[10px] uppercase text-zinc-400">
                  <span className="border-r border-white/10 px-2 py-3 text-brand-purple-400">
                    Windows + Linux
                  </span>
                  <span className="border-r border-white/10 px-2 py-3">1v1</span>
                  <span className="px-2 py-3">UDP direct</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {screenshotStrip.map((shot) => (
                  <figure
                    key={shot.src}
                    className="overflow-hidden rounded-sm border border-white/10 bg-dark-card"
                  >
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src={shot.src}
                        alt={shot.alt}
                        fill
                        sizes="(min-width: 1024px) 200px, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="border-t border-white/10 px-2 py-2 text-center font-mono text-[9px] uppercase text-zinc-500">
                      {shot.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="project" className="border-b border-dark-border bg-[#121c24] py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {home.cards.map((card) => (
            <article key={card.title} className="rounded-sm border border-white/10 bg-dark-card p-6">
              <ShieldCheck className="mb-5 h-6 w-6 text-brand-purple-400" />
              <h2 className="font-display text-xl font-extrabold uppercase italic tracking-normal text-white">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-dark-obsidian py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <span className="font-pixel text-[9px] uppercase tracking-widest text-brand-purple-400">
              RetroFight
            </span>
            <h2 className="mt-3 font-display text-4xl font-black uppercase italic tracking-normal text-white">
              {home.projectTitle}
            </h2>
          </div>
          <div className="space-y-4">
            <ul className="space-y-3 text-zinc-300">
              {home.projectNotes.map((note) => (
                <li key={note} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-purple-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <a
              href={dictionary.githubOrg}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-sm border border-white/10 px-4 py-3 text-sm font-semibold uppercase text-zinc-200 transition hover:border-brand-purple-500 hover:text-white"
            >
              <Code className="h-4 w-4" />
              {home.githubCta}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
