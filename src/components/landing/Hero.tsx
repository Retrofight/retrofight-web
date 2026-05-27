import Image from 'next/image';
import { Download, Play, Terminal, Cpu, Network, ShieldCheck } from 'lucide-react';

const heroImg = "/landing/retrofight-hero.png";

interface HeroProps {
  onDownloadClick: () => void;
}

export default function Hero({ onDownloadClick }: HeroProps) {
  return (
    <div className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-dark-obsidian">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-brand-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Horizontal glowing cyber lines */}
      <div className="absolute top-[30%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-purple-500/10 to-transparent"></div>
      <div className="absolute top-[70%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan-500/10 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Column 1: Copywriting */}
          <div className="col-span-1 lg:col-span-7 flex flex-col space-y-6 text-left">
            
            {/* Pulsing Game-Start Badge */}
            <div className="inline-flex items-center space-x-2 bg-brand-purple-950/40 border border-brand-purple-500/30 px-3.5 py-1.5 rounded-full w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-pink-500"></span>
              </span>
              <span className="font-pixel text-[9px] text-brand-purple-400 tracking-wider">
                VERSION 1.0.2 • PRESS START TO FIGHT
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-display font-black italic uppercase tracking-tighter text-5xl sm:text-6xl lg:text-7xl leading-[0.95] text-white">
              Sconfiggi il lag nei{' '}
              <span className="text-brand-purple-600">
                Retrogames
              </span>
              .<br />Sfide online a <span className="text-white bg-brand-purple-600 px-3 py-1 inline-block transform -rotate-1">latenza zero</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-400 text-base md:text-lg font-normal leading-relaxed max-w-2xl">
              <strong className="text-white font-bold">Retrofight</strong> è l'interfaccia Electron intelligente progettata per Cabinati Arcade, Fightstick e Desktop. Sfrutta i core <strong className="text-white">RetroArch</strong> integrandoli direttamente con il netcode <strong className="text-brand-purple-500">GGPO</strong> e <strong className="text-brand-purple-400">Hole Punching NAT Traversal</strong>.
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-2xl -mt-2">
              Basta configurazioni router estenuanti o lag ingiocabile: avvia il matchmaking immediato con i tuoi amici e gioca a picchiaduro e classici arcade con l'esperienza fluida del multiplayer locale.
            </p>

            {/* Calls to Action */}
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                id="hero-download-btn"
                onClick={onDownloadClick}
                className="px-8 py-4 bg-brand-purple-600 hover:bg-brand-purple-500 text-white font-display font-black uppercase tracking-tighter italic rounded-sm shadow-lg transform active:scale-95 transition-all duration-150 cursor-pointer flex items-center space-x-3"
              >
                <Download className="h-5 w-5" />
                <span>Scarica Retrofight</span>
              </button>

              <a
                href="#simulator"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-brand-purple-500 font-display font-bold uppercase tracking-tighter italic rounded-sm transition-all duration-150 flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Prova il Simulatore</span>
              </a>
            </div>

            {/* Key Technical Flags */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-xs text-gray-400 border-t border-dark-border max-w-xl">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4.5 w-4.5 text-brand-cyan-400 shrink-0" />
                <span>GGPO Rollback</span>
              </div>
              <div className="flex items-center space-x-2">
                <Network className="h-4.5 w-4.5 text-brand-pink-500 shrink-0" />
                <span>P2P Nat traversal</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4.5 w-4.5 text-brand-purple-500 shrink-0" />
                <span>Cabinet Ready</span>
              </div>
            </div>

          </div>

          {/* Column 2: Visual Fightstick Mockup with Retro scanline CRT effect */}
          <div className="col-span-1 lg:col-span-5 relative flex justify-center">
            
            {/* Background ambient light */}
            <div className="absolute -inset-2 bg-gradient-to-r from-brand-purple-600 to-brand-cyan-500 rounded-2xl opacity-30 blur-xl"></div>
            
            {/* CRT Monitor Container Wrapper */}
            <div className="relative border-4 border-slate-700/80 rounded-2xl overflow-hidden bg-black max-w-[480px] w-full shadow-2xl shadow-brand-purple-950/50">
              
              {/* Scanlines layer */}
              <div className="absolute inset-0 retro-scanlines pointer-events-none z-10 opacity-70"></div>
              
              {/* Fake Arcade bezel frame */}
              <div className="absolute inset-0 border-[12px] border-slate-900 pointer-events-none z-10"></div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-brand-pink-600 text-white font-pixel text-[8px] tracking-widest uppercase rounded-b z-20 shadow-md">
                ARCADE FIGHTSTICK ACTIVE
              </div>

              {/* Generated image */}
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={heroImg}
                  alt="Retrofight Arcade Controller"
                  fill
                  priority
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="pointer-events-none object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              
              {/* Cyber HUD Terminal statistics inside CRT display */}
              <div className="bg-slate-950/90 p-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono select-none">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-3 w-3 text-brand-cyan-400 animate-pulse" />
                  <span className="text-brand-cyan-400">ggpo_interface.dll</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <span>FPS: <strong className="text-green-400">59.97</strong></span>
                  <span className="text-brand-purple-400">ROLLBACK: 0f</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></span>
                </div>
              </div>

            </div>

            {/* Glowing neon ring behind controller */}
            <div className="absolute -bottom-6 w-4/5 h-2 bg-brand-purple-500 rounded-full blur-md opacity-50"></div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
