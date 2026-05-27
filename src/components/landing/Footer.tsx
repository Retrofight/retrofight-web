import { Gamepad2, Code, MessageSquare, Share2, Video, ArrowUp } from 'lucide-react';

interface FooterProps {
  onDownloadClick: () => void;
}

export default function Footer({ onDownloadClick }: FooterProps) {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-black border-t border-white/10 py-16 text-left relative overflow-hidden">
      
      {/* Background neon elements */}
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-brand-purple-900/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Call to Action pre-footer banner */}
        <div className="bg-[#0c0c0e] border border-white/10 rounded-sm p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-left">
            <span className="font-pixel text-[8px] text-brand-purple-400 tracking-wider">RETROFIGHT DESKTOP APP</span>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase italic tracking-tighter">Pronto a sconfiggere il delay lag?</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Scarica l'applicazione desktop, collega la tua plancia arcade o il tuo fighstick e comincia a sfidare i tuoi amici come in sala giochi. Disponibile gratis su Windows e Linux.
            </p>
          </div>
          
          <button
            onClick={onDownloadClick}
            className="px-8 py-4 bg-brand-purple-600 hover:bg-brand-purple-500 text-white font-display font-black uppercase text-sm tracking-widest italic rounded-sm transition duration-150 shrink-0 cursor-pointer"
          >
            Scarica Gratis v1.0.2
          </button>
        </div>

        {/* Corporate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/10 pb-12 mb-12">
          
          {/* Logo & Pitch */}
          <div className="col-span-1 md:col-span-5 flex flex-col space-y-4">
            <a href="#" className="flex items-center space-x-3 group w-fit">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/5 opacity-70 blur-xs transition duration-300"></div>
                <div className="relative bg-black p-1.5 rounded-none border border-white/15 flex items-center justify-center">
                  <Gamepad2 className="h-5 w-5 text-brand-purple-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-lg tracking-wider text-white">
                  RETROFIGHT
                </span>
                <span className="font-pixel text-[7px] tracking-[0.2em] text-brand-purple-400 leading-none">
                  GGPO INTERFACE
                </span>
              </div>
            </a>
            
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Sviluppato da appassionati di picchiaduro e retrocomputer hardware. Retrofight è un ecosistema open-source volto a connettere cabinati arcade e fightstick remoti attraverso connessioni sicure a latenza ridotta.
            </p>

            {/* Social Rows */}
            <div className="flex space-x-4 pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 bg-black border border-white/10 rounded-none text-zinc-400 hover:text-white hover:border-brand-purple-600 transition duration-150">
                <Code className="h-4 w-4" />
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" className="p-2 bg-black border border-white/10 rounded-none text-zinc-400 hover:text-white hover:border-brand-purple-600 transition duration-150">
                <MessageSquare className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 bg-black border border-white/10 rounded-none text-zinc-400 hover:text-white hover:border-brand-purple-600 transition duration-150">
                <Share2 className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 bg-black border border-white/10 rounded-none text-zinc-400 hover:text-white hover:border-brand-purple-600 transition duration-150">
                <Video className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-3 flex flex-col space-y-4">
            <h4 className="font-display font-bold text-white text-xs tracking-widest uppercase">Navigazione</h4>
            <div className="flex flex-col space-y-2.5 text-xs text-zinc-400">
              <a href="#features" className="hover:text-white transition-colors">Caratteristiche</a>
              <a href="#simulator" className="hover:text-white transition-colors">Simulatore Rollback</a>
              <a href="#matchmaking" className="hover:text-white transition-colors">Stanze di Matchmaking</a>
              <a href="#cabinet-guide" className="hover:text-white transition-colors">Guida Installazione Cabinati</a>
              <a href="#faq" className="hover:text-white transition-colors">Domande FAQ</a>
            </div>
          </div>

          {/* Technical Info */}
          <div className="col-span-1 md:col-span-4 flex flex-col space-y-4">
            <h4 className="font-display font-bold text-white text-xs tracking-widest uppercase">Specifiche Prodotto</h4>
            <div className="flex flex-col space-y-2 text-xs text-zinc-400 font-mono">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span>Versione Stabile:</span>
                <span className="text-white font-semibold">1.0.2 Stable</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span>Core RetroArch:</span>
                <span className="text-brand-purple-400">FBNeo, Flycast, Snes9x</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span>Licenza Principale:</span>
                <span className="text-white">MIT Open Source</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status Server STUN:</span>
                <span className="text-brand-purple-400 flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-none bg-brand-purple-400 animate-pulse"></span>
                  <span>ONLINE</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Lower row */}
        <div className="flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-6">
          <p>© {new Date().getFullYear()} Retrofight Project. Rilasciato con licenza MIT. Tutti i marchi commerciali, i videogiochi e i file di emulazione visualizzati appartengono ai rispettivi proprietari e sono usati qui a mero scopo illustrativo.</p>
          
          <button
            onClick={handleScrollToTop}
            className="flex items-center space-x-2 border border-white/10 hover:border-brand-purple-600 p-2.5 px-4 rounded-none bg-black hover:text-white transition cursor-pointer"
          >
            <span>Torna su</span>
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

      </div>
    </footer>
  );
}
