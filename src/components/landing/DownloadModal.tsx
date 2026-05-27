"use client";

import {
  ArrowRight,
  Check,
  Cpu,
  Monitor,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";

type DownloadStep = "options" | "success";

type DownloadModalProps = {
  downloadStep: DownloadStep;
  selectedOS: string | null;
  onClose: () => void;
  onDownloadOS: (os: string) => void;
};

const downloadOptions = [
  {
    os: "Windows",
    title: "Compilazione Windows (x64)",
    filename: "retrofight-win-x64-v1.0.2.zip",
    size: "82MB",
    Icon: Monitor,
    colorClass: "bg-brand-purple-950 text-brand-purple-400",
    borderClass: "hover:border-brand-purple-500/50",
  },
  {
    os: "Linux",
    title: "Compilazione Linux (AppImage)",
    filename: "retrofight-linux-x86_64-v1.0.2.AppImage",
    size: "94MB",
    Icon: Terminal,
    colorClass: "bg-brand-cyan-950 text-brand-cyan-400",
    borderClass: "hover:border-brand-cyan-500/50",
  },
  {
    os: "Raspberry Pi",
    title: "Image OS per Raspberry Pi 4/5",
    filename: "retrofight-rpi-v1.0.2.img.gz",
    size: "240MB",
    Icon: Cpu,
    colorClass: "bg-brand-pink-950 text-brand-pink-400",
    borderClass: "hover:border-brand-pink-500/50",
  },
];

const setupSteps = [
  "Estrai i file dell'applicazione sul disco del tuo PC o scrivi l'immagine OS sulla micro-SD da inserire nel Raspberry del cabinet.",
  "Trascina le tue ROMs e i file BIOS nella cartella roms/.",
  "Collega i tuoi fightstick USB o avvia la plancia cabinato j-pac. Verranno identificati istantaneamente su Retrofight.",
  "Avvia retrofight.exe, unisciti a una lobby esistente e sperimenta sfide online stabili a 1 frame di latenza!",
];

export default function DownloadModal({
  downloadStep,
  selectedOS,
  onClose,
  onDownloadOS,
}: DownloadModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-dark-border bg-dark-card p-6 shadow-2xl md:p-8">
        <div className="retro-scanlines pointer-events-none absolute inset-0 opacity-30" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
          aria-label="Chiudi download"
        >
          <X className="h-5 w-5" />
        </button>

        {downloadStep === "options" ? (
          <div className="space-y-6 text-left">
            <div>
              <span className="mb-1 block font-pixel text-[8px] tracking-widest text-brand-cyan-400 uppercase">
                Download software
              </span>
              <h3 className="font-display text-2xl font-extrabold text-white">
                Ottieni Retrofight v1.0.2
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Scegli la compilazione adatta per il tuo sistema desktop o il
                tuo cabinato arcade dedicato.
              </p>
            </div>

            <div className="space-y-3.5">
              {downloadOptions.map(({ os, title, filename, size, Icon, colorClass, borderClass }) => (
                <button
                  key={os}
                  onClick={() => onDownloadOS(os)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-xl border border-dark-border bg-slate-950/60 p-4 text-left transition duration-150 hover:bg-slate-950 ${borderClass}`}
                >
                  <span className="flex items-center space-x-4">
                    <span className={`rounded-lg p-2 transition-transform group-hover:scale-105 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display text-sm font-bold text-white">
                        {title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-gray-500">
                        {filename} - {size}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand-cyan-400 transition-transform group-hover:translate-x-1.5">
                    <span>Scarica</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-start space-x-3 rounded-xl border border-brand-purple-900/40 bg-brand-purple-950/20 p-3.5 text-xs leading-relaxed text-gray-400">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan-400" />
              <p>
                Prima di iniziare, assicurati di possedere le ROM legali
                archiviate in formato <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-[10px] text-white">.zip</code>{" "}
                dei tuoi picchiaduro o giochi arcade preferiti.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-3.5 border-b border-dark-border/40 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950">
                <Check className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-display text-lg font-extrabold text-white">
                  Download iniziato!
                </h4>
                <p className="text-xs text-gray-400">
                  Pacchetto Retrofight per{" "}
                  <strong className="text-white">{selectedOS}</strong> in
                  streaming...
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-pixel text-[8px] tracking-widest text-brand-pink-500 uppercase">
                Prossimi passi per il combattimento
              </h4>
              <div className="space-y-3.5 text-xs text-gray-300">
                {setupSteps.map((step, index) => (
                  <div key={step} className="flex items-start space-x-3.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dark-border bg-slate-950 font-mono font-bold text-brand-purple-400">
                      {index + 1}
                    </div>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="-mx-6 -mb-6 flex items-center justify-between rounded-b-2xl border-t border-dark-border/40 bg-slate-950/30 p-6 md:-mx-8 md:-mb-8 md:p-8">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gray-500 underline decoration-brand-purple-500 hover:text-white"
              >
                Leggi wiki su GitHub
              </a>
              <button
                onClick={onClose}
                className="rounded-lg bg-brand-cyan-600 px-5 py-2.5 font-display text-xs font-bold text-slate-950 hover:bg-brand-cyan-500"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
