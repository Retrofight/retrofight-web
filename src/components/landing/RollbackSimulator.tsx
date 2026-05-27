import { useEffect, useRef, useState } from 'react';
import { Wifi, Zap, AlertTriangle, Activity } from 'lucide-react';

export default function RollbackSimulator() {
  const [ping, setPing] = useState<number>(120);
  const [isPunching, setIsPunching] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(true);
  
  // Interactive stats
  const delayFrames = Math.max(1, Math.round(ping / 16.67)); // 1 frame per 16.6ms
  const rollbackFramesNeeded = Math.max(0, Math.round((ping - 30) / 16.67)); // GGPO absorbs most with 2-3f local delay

  // Animations timers
  const [delayVisualState, setDelayVisualState] = useState<'idle' | 'waiting' | 'hit'>('idle');
  const [rollbackVisualState, setRollbackVisualState] = useState<'idle' | 'executing' | 'hit'>('idle');

  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger single punch action
  const triggerPunch = () => {
    if (isPunching) return;
    setIsPunching(true);
    setIsDemoRunning(false); // Stop auto demo when user interacts

    // 1) GGPO Rollback behaves instantly (0 extra input delay, predicts first frames)
    setRollbackVisualState('executing');
    setTimeout(() => {
      setRollbackVisualState('hit');
      setTimeout(() => setRollbackVisualState('idle'), 150);
    }, 60); // fast execute

    // 2) Delay based netcode waits for full half-trip ping time to render input
    setDelayVisualState('waiting');
    const delayMs = ping; // simulates total round-trip frame delay/handshake wait
    setTimeout(() => {
      setDelayVisualState('hit');
      setTimeout(() => {
        setDelayVisualState('idle');
        setIsPunching(false);
      }, 150);
    }, delayMs);
  };

  // Automated Game Input loop to demo difference
  useEffect(() => {
    if (isDemoRunning) {
      demoIntervalRef.current = setInterval(() => {
        // Trigger simulated inputs
        setRollbackVisualState('executing');
        setTimeout(() => {
          setRollbackVisualState('hit');
          setTimeout(() => setRollbackVisualState('idle'), 130);
        }, 50);

        setDelayVisualState('waiting');
        setTimeout(() => {
          setDelayVisualState('hit');
          setTimeout(() => setDelayVisualState('idle'), 130);
        }, ping);

      }, 1800);
    } else {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    }

    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [isDemoRunning, ping]);

  // Handle speed categorization
  const getPingQuality = (p: number) => {
    if (p < 50) return { label: 'Eccellente', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' };
    if (p < 150) return { label: 'Media (Giocabile in Rollback)', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' };
    return { label: 'Pessima (Ingiocabile su emulatori standard)', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' };
  };

  const quality = getPingQuality(ping);

  return (
    <section id="simulator" className="py-24 bg-dark-card/30 relative border-t border-dark-border">
      {/* Visual background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0730_1px,transparent_1px),linear-gradient(to_bottom,#0c0730_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <span className="font-pixel text-[8px] text-brand-purple-400 tracking-widest uppercase mb-3">
            VERIFICA TECNICA SUL CAMPO
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tighter uppercase italic">
            Simulatore di Netcode Interattivo
          </h2>
          <div className="h-0.5 w-16 bg-brand-purple-600 my-6"></div>
          <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-xl">
            Sperimenta direttamente la differenza tra l'emulazione standard via Internet e l'algoritmo di mitigazione del lag predittivo di Retrofight. Regola il ping e premi il pulsante per scatenare un attacco.
          </p>
        </div>

        {/* Interactive console panel */}
        <div className="bg-[#0c0c0e] border border-white/10 rounded-sm overflow-hidden shadow-2xl">
          
          {/* Header Panel Controls */}
          <div className="p-6 bg-black border-b border-white/10 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex flex-col space-y-1.5 text-left">
              <span className="text-brand-purple-400 font-pixel uppercase tracking-widest text-[8px]">PARAMETRI DI RETE</span>
              <div className="flex items-center space-x-2 text-white">
                <Wifi className="h-4 w-4 text-brand-purple-400" />
                <span className="font-display font-bold uppercase tracking-wide text-xs">Simulazione Latenza (PING)</span>
              </div>
            </div>

            {/* Slider area */}
            <div className="flex-1 min-w-[260px] max-w-md flex items-center space-x-4">
              <span className="text-xs font-mono text-zinc-500">15ms</span>
              <input
                id="ping-slider"
                type="range"
                min="15"
                max="280"
                value={ping}
                onChange={(e) => setPing(Number(e.target.value))}
                className="w-full accent-brand-purple-600 bg-zinc-800 h-1 cursor-pointer appearance-none"
              />
              <span className="text-xs font-mono text-zinc-500">280ms</span>
            </div>

            {/* Metric bubble */}
            <div className="px-4 py-2 rounded-sm border border-brand-purple-600/30 bg-brand-purple-950/20 flex items-center space-x-3 shrink-0">
              <span className="font-mono font-bold text-lg text-white">{ping}ms</span>
              <div className="h-4 w-px bg-white/10"></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${quality.color}`}>{quality.label}</span>
            </div>
          </div>

          {/* Side by side screen views */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black/40">
            
            {/* SCREEN A: DELAY NETCODE */}
            <div className="p-8 flex flex-col h-[340px] justify-between relative overflow-hidden">
              
              {/* Overlay CRT scanlines */}
              <div className="absolute inset-0 retro-scanlines pointer-events-none opacity-40"></div>
              
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-pixel text-brand-purple-400">EMULATORE STANDARD</span>
                  <h4 className="font-display font-black uppercase tracking-tight text-white italic">Delay-Based Netcode</h4>
                </div>
                <div className="p-1.5 bg-brand-purple-950/50 border border-white/10 text-white font-mono text-[10px] rounded-sm">
                  Latenza: +{delayFrames}f
                </div>
              </div>

              {/* Character simulator visually */}
              <div className="flex justify-center items-center py-8 relative">
                
                {/* Visual player A - Attacking */}
                <div className="flex items-center space-x-12 relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono text-zinc-500 mb-1">GIOCATORE 1</span>
                    <div className="h-16 w-16 bg-zinc-900 rounded-none border border-white/10 flex items-center justify-center font-bold text-white relative">
                      {delayVisualState === 'waiting' && (
                        <div className="absolute inset-0 bg-brand-purple-900/80 rounded-none flex items-center justify-center border border-brand-purple-600/55">
                          <span className="font-pixel text-[8px] text-white">WAIT...</span>
                        </div>
                      )}
                      🥊
                    </div>
                  </div>

                  {/* Connecting Line indicating lag propagation */}
                  <div className="w-16 h-px bg-white/10 relative">
                    {delayVisualState === 'waiting' && (
                      <div className="absolute left-0 top-0 h-full bg-brand-purple-600 animate-[ping_1.5s_infinite] w-full"></div>
                    )}
                  </div>

                  {/* Target dummy box */}
                  <div className={`h-16 w-16 rounded-none flex items-center justify-center transition-all duration-100 ${
                    delayVisualState === 'hit' 
                      ? 'bg-brand-purple-600 border border-white scale-95 rotate-6 translate-x-3' 
                      : 'bg-[#0f0f11] border border-white/10 text-gray-400'
                  }`}>
                    💥
                  </div>
                </div>

                {/* Delay overlay text during animation */}
                {delayVisualState === 'waiting' && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 rounded-none border border-brand-purple-600/30">
                    <AlertTriangle className="h-6 w-6 text-brand-purple-400 animate-bounce mb-2" />
                    <span className="font-pixel text-[8px] text-brand-purple-400 tracking-wider">ATTESA HANDSHAKE NET...</span>
                    <span className="font-mono text-[10px] text-zinc-500 mt-1">L'immagine si blocca per {ping}ms</span>
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="z-10 py-2 border-t border-white/10 text-left">
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`h-2 w-2 rounded-none ${delayVisualState === 'hit' ? 'bg-brand-purple-600 animate-ping' : 'bg-zinc-600'}`}></span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {delayVisualState === 'idle' && "Pronto. Premi il pulsante sotto."}
                    {delayVisualState === 'waiting' && `Ritardo applicato: circa ${ping}ms prima di colpire.`}
                    {delayVisualState === 'hit' && "Colpo registrato dopo ritardo."}
                  </span>
                </div>
              </div>

            </div>

            {/* SCREEN B: GGPO ROLLBACK */}
            <div className="p-8 flex flex-col h-[340px] justify-between relative overflow-hidden">
              
              {/* Overlay CRT scanlines */}
              <div className="absolute inset-0 retro-scanlines pointer-events-none opacity-40"></div>
              <div className="absolute -inset-10 bg-brand-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-pixel text-brand-purple-400">SISTEMA RETROFIGHT</span>
                  <h4 className="font-display font-black uppercase tracking-tight text-white italic">GGPO Rollback Netcode</h4>
                </div>
                <div className="p-1.5 bg-brand-purple-950/50 border border-brand-purple-600/30 text-brand-purple-400 font-mono text-[10px] rounded-sm">
                  Delay fisso: 1f (Rollback: ~{rollbackFramesNeeded}f)
                </div>
              </div>

              {/* Character simulator visually */}
              <div className="flex justify-center items-center py-8 relative">
                
                {/* Visual player B - Attacking instantly */}
                <div className="flex items-center space-x-12 relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono text-zinc-500 mb-1">GIOCATORE 1</span>
                    <div className={`h-16 w-16 bg-brand-purple-950 rounded-none border border-brand-purple-500/50 flex items-center justify-center font-bold text-white transition-all duration-75 ${
                      rollbackVisualState === 'executing' ? 'scale-110 -translate-y-1 bg-brand-purple-600 border-white' : ''
                    }`}>
                      🥋
                    </div>
                  </div>

                  {/* Connecting Line indicating lag mitigation */}
                  <div className="w-16 h-px bg-brand-purple-500/15 relative">
                    {rollbackVisualState === 'executing' && (
                      <div className="absolute left-0 top-0 h-full bg-brand-purple-400 animate-[ping_0.5s_infinite] w-full"></div>
                    )}
                  </div>

                  {/* Target dummy box */}
                  <div className={`h-16 w-16 rounded-none flex items-center justify-center transition-all duration-75 ${
                    rollbackVisualState === 'hit' 
                      ? 'bg-brand-purple-500 border border-white scale-95 rotate-6 translate-x-3' 
                      : 'bg-zinc-950 border border-white/10 text-zinc-500'
                  }`}>
                    💥
                  </div>
                </div>

                {/* Absolute overlay proving GGPO response */}
                {rollbackVisualState === 'executing' && (
                  <div className="absolute top-0 right-4 bg-brand-purple-600 text-white font-pixel text-[6px] tracking-wide px-2 py-1 rounded-none shadow animate-bounce">
                    REAZIONE INSTANTANEA!
                  </div>
                )}
              </div>

              {/* Status bar */}
              <div className="z-10 py-2 border-t border-white/10 text-left">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="h-2 w-2 bg-brand-purple-500 animate-pulse rounded-none"></span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {rollbackVisualState === 'idle' && "Pronto. Pressione tasti recepita al frame 0!"}
                    {rollbackVisualState === 'executing' && "Attacco lanciato senza ritardi fisici."}
                    {rollbackVisualState === 'hit' && `Rollback di ${rollbackFramesNeeded}f eseguito correggendo i dati in background.`}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Controller and simulation runner footer */}
          <div className="p-6 bg-black border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-col text-left space-y-1 text-xs text-zinc-400 max-w-xl">
              <span className="text-white font-bold uppercase tracking-wider text-[11px]">Tasti fisici o cabinato</span>
              <p>Cliccando il pulsante a destra simulerai l'invio del comando <code className="text-brand-purple-400 font-mono bg-white/5 px-1.5 py-0.5 rounded-sm">PUNCH</code> a entrambi i giocatori con il rispettivo netcode configurato.</p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Reset Auto Demo */}
              <button
                onClick={() => setIsDemoRunning(!isDemoRunning)}
                className={`p-3 rounded-sm border text-[10px] font-mono uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  isDemoRunning 
                    ? 'bg-brand-purple-600/20 border-brand-purple-600/50 text-brand-purple-400' 
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
                title={isDemoRunning ? "Arresta loop di prova automatico" : "Attiva loop di prova automatico"}
              >
                <Activity className="h-4 w-4" />
                <span>{isDemoRunning ? "Auto" : "Off"}</span>
              </button>

              {/* Primary action trigger button */}
              <button
                id="simulator-strike-btn"
                onClick={triggerPunch}
                disabled={isPunching}
                className="px-6 py-3 bg-brand-purple-600 hover:bg-brand-purple-500 disabled:opacity-50 text-white font-display font-black uppercase tracking-tighter italic rounded-sm transition-all duration-150 cursor-pointer flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>PREMI TASTO (PUNCH)</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
