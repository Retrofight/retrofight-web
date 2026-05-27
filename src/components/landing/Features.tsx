import { Network, Cpu, Gamepad, Layers, ArrowRight } from 'lucide-react';

export default function Features() {
  const feats = [
    {
      icon: <Cpu className="h-6 w-6 text-brand-purple-400" />,
      tag: "NETCODE",
      title: "GGPO Rollback Integrato",
      description: "Dimentica il lag distruttivo dei vecchi emulatori. Salvando lo stato di gioco e predicendo gli input, Retrofight corregge i frame discrepanti in tempo reale. I tuoi tasti rispondono istantaneamente.",
      bullets: ["Predizione di frame adattiva", "Recupero fluido sotto i 150ms", "Latenza di input fissa a 1 frame"],
      glowColor: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
      borderColor: "hover:border-brand-purple-500/30",
    },
    {
      icon: <Network className="h-6 w-6 text-brand-cyan-400" />,
      tag: "CONNETTIVITÀ",
      title: "Hole Punching NAT Traversal",
      description: "Non preoccuparti più di aprire porte UDP o configurare il DHCP del router. Il nostro server di bouncing stabilisce una connessione P2P (Peer-to-Peer) diretta aggirando anche i NAT più restrittivi.",
      bullets: ["Zero configurazioni router", "Connessione diretta peer-to-peer", "Compatibile con reti mobili 4G/5G"],
      glowColor: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
      borderColor: "hover:border-brand-cyan-500/30",
    },
    {
      icon: <Gamepad className="h-6 w-6 text-brand-pink-500" />,
      tag: "HARDWARE",
      title: "Ottimizzato per Cabinati & Fightstick",
      description: "Nato per il gioco arcade vero. L'interfaccia risponde perfettamente a encoder USB Zero-Delay, schede I-PAC, joystick fisici e tastiere, garantendo un'esperienza fluida anche su sistemi dedicati.",
      bullets: ["Mapping automatico dei tasti", "Nessun bisogno di mouse o tastiera", "Kiosk Mode per auto-avvio al boot"],
      glowColor: "group-hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]",
      borderColor: "hover:border-brand-pink-500/30",
    },
    {
      icon: <Layers className="h-6 w-6 text-indigo-400" />,
      tag: "ARCHITETTURA",
      title: "Electron + RetroArch Cores",
      description: "Un'interfaccia HTML5 fluida e bellissima alimentata da Electron che gestisce i core libretro di RetroArch nel backend. Avvia i giochi con parametri di rete ottimizzati senza sporcare il browser.",
      bullets: ["Grafica fluida a 60fps", "Supporto overlay originali", "Gestione automatica salvataggi e BIOS"],
      glowColor: "group-hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
      borderColor: "hover:border-indigo-500/30",
    },
  ];

  return (
    <section id="features" className="py-24 bg-dark-obsidian/75 relative border-t border-dark-border">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-brand-pink-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col items-center">
          <span className="font-pixel text-[8px] text-brand-purple-400 tracking-widest uppercase mb-3">
            ARCHITETTURA DI GIOCO AD ALTE PRESTAZIONI
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tighter uppercase italic">
            Perché scegliere Retrofight?
          </h2>
          <div className="h-0.5 w-16 bg-brand-purple-600 my-6"></div>
          <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-xl">
            La connessione tra retrogaming ed esport richiede soluzioni moderne. Retrofight è stato progettato da zero per soddisfare le esigenze dei giocatori di picchiaduro competitivi.
          </p>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feats.map((feat, index) => (
            <div
              key={index}
              className="group bg-[#0c0c0e] border border-white/10 rounded-xs p-8 hover:border-brand-purple-600/60 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="bg-white/5 p-3 rounded-xs border border-white/10 group-hover:bg-brand-purple-600/10 transition-colors duration-300">
                    {feat.icon}
                  </div>
                  <span className="font-pixel text-[8px] tracking-widest bg-brand-purple-900/30 px-3 py-1.5 rounded-sm border border-brand-purple-600/30 text-brand-purple-400">
                    {feat.tag}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-display font-black italic uppercase text-lg sm:text-xl text-white mb-2 tracking-wide group-hover:text-brand-purple-400 transition-colors">
                  {feat.title}
                </h3>
                
                <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                  {feat.description}
                </p>
              </div>

              {/* Bullets List */}
              <ul className="space-y-2 border-t border-white/10 pt-4 text-[11px] font-mono text-zinc-300">
                {feat.bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-center space-x-2.5">
                    <span className="h-1.5 w-1.5 bg-brand-purple-600 rounded-none"></span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparative Highlight */}
        <div className="mt-12 bg-white/2 border border-white/10 rounded-xs p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col space-y-2.5 text-left max-w-2xl">
            <span className="font-pixel text-[8px] text-brand-purple-400 tracking-wider">DELAY NETCODE vs GGPO ROLLBACK</span>
            <h4 className="font-display font-black italic uppercase text-xl sm:text-2xl text-white tracking-tight">Stanco di premere un tasto e vederlo registrato in ritardo?</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              I vecchi sistemi fermano letteralmente il gioco per aspettare i pacchetti dell'altro giocatore (delay netcode). Con il rollback, le collisioni e gli input vengono elaborati all'istante, nascondendo la latenza per darti un feeling identico al gioco offline su cabinato.
            </p>
          </div>
          <a
            href="#simulator"
            className="flex items-center space-x-2.5 bg-brand-purple-600 hover:bg-brand-purple-500 text-white font-display font-black uppercase tracking-tighter italic rounded-sm px-6 py-3.5 transition duration-150 shrink-0 select-none text-xs"
          >
            <span>Verifica la differenza</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

      </div>
    </section>
  );
}
