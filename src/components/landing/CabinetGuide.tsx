import { useState } from 'react';
import type { CabinetSetupStep } from './types';
import { Shield, Cpu, Code2, Check, Copy, Settings, Monitor } from 'lucide-react';

export default function CabinetGuide() {
  const steps: CabinetSetupStep[] = [
    {
      id: 1,
      title: "Cablaggio e Input mapping",
      subtitle: "Configurare l'encoder USB",
      description: "Retrofight rileva nativamente gli encoder USB Zero-Delay e le schede tastiera Xinmotek, I-PAC o J-PAC. Prima di avviare il software, collega la plancia comandi. I tasti verranno mappati virtualmente come controller PC XInput standard.",
      code: `// Profilo di rilevamento automatico encoder USB
{
  "device_name": "Generic USB Zero-Delay Encoder",
  "dinput_vendor_id": "0x16c0",
  "dinput_product_id": "0x05e1",
  "map_buttons": {
    "A": 1, "B": 2, "X": 0, "Y": 3,
    "L": 4, "R": 5, "SELECT": 8, "START": 9
  }
}`,
      fileTarget: "config/input_profiles.json"
    },
    {
      id: 2,
      title: "Kiosk Mode per Cabinati",
      subtitle: "Auto-avvio all'accensione",
      description: "Se stai assemblando un cabinato custom con PC Windows, puoi configurare Retrofight come 'Shell' di Windows al posto di explorer.exe, garantendo che all'accensione del mobile parta solo il frontend di gioco a pieno schermo senza mouse o cursore.",
      code: `# Windows PowerShell - Modifica registro per Kiosk Shell
Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Name "Shell" -Value "C:\\Retrofight\\retrofight.exe --kiosk --cabinet"

# Per ripristinare explorer.exe standard:
# Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Name "Shell" -Value "explorer.exe"`,
      fileTarget: "Esegui in PowerShell come Amministratore"
    },
    {
      id: 3,
      title: "Configurazione Autostart Linux",
      subtitle: "Integrazione X11/Xinitrc",
      description: "Su distribuzione Linux leggera (es. Debian/Ubuntu Minimal), puoi avviare Retrofight senza un Desktop Environment pesante per ridurre ulteriormente l'input delay e ottimizzare i frame rate.",
      code: `# Modifica il file ~/.xinitrc del tuo cabinato
# Avvia il server audio a bassa latenza Pipewire/Jack
pipewire &

# Avvia Retrofight bypassando window manager pesanti
exec /opt/retrofight/retrofight --fullscreen --cabinet --disable-gpu-vsync`,
      fileTarget: "~/.xinitrc"
    },
    {
      id: 4,
      title: "Diagnostic NAT Traversal",
      subtitle: "Test di connettività di rete",
      description: "I cabinati posizionati in sale giochi o fiere possono trovarsi dietro router aziendali con restrizioni simmetriche. Esegui il tool di verifica integrato per testare la latenza del network e l'efficacia dell'hole punching.",
      code: `./retrofight --diagnose-nat --stun-server=stun.l.google.com:19302

=== DIAGNOSTIC REPORT ===
[OK] Local IP bound: 192.168.1.115
[OK] Public IP resolved via STUN: 82.50.14.99
[INFO] NAT Type: Restricted Cone (Direct Peer-to-Peer is High Probability)
[OK] Ping to Retrofight relay nodes: 18ms
=========================`,
      fileTarget: "Terminale Bash / Command Prompt"
    }
  ];

  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const currentStepData = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <section id="cabinet-guide" className="py-24 bg-dark-card/30 border-t border-dark-border relative">
      <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-brand-purple-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-center">
          <div className="col-span-1 lg:col-span-7 text-left">
            <span className="font-pixel text-[8px] text-brand-purple-400 tracking-widest uppercase mb-3 block">
              HARDWARE E INTEGRAZIONE AMBIENTE
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter uppercase italic leading-none">
              Progettato per Cabinati Arcade
            </h2>
            <p className="text-zinc-400 mt-4 text-xs sm:text-sm leading-relaxed">
              Non solo PC desktop. Retrofight riduce al minimo l'overhead del sistema operativo ed è studiato per girare autonomamente all'interno di cabinati arcade (bartop) dedicati. Offre strumenti a basso livello per gestire schede encoder, avvii isolati (kiosk mode) e configurazioni automatiche dei tasti.
            </p>
          </div>

          {/* Quick specs sidebar badge row */}
          <div className="col-span-1 lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-[#0c0c0e]/60 p-4 rounded-sm border border-white/10 flex items-center space-x-3 text-left">
              <Shield className="h-5 w-5 text-brand-purple-400 shrink-0" />
              <div>
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Input Diretto</h5>
                <p className="text-[10px] text-zinc-500">Nessun driver extra necessario</p>
              </div>
            </div>

            <div className="bg-[#0c0c0e]/60 p-4 rounded-sm border border-white/10 flex items-center space-x-3 text-left">
              <Cpu className="h-5 w-5 text-brand-purple-400 shrink-0" />
              <div>
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Ultra low RAM</h5>
                <p className="text-[10px] text-zinc-500">Ottimo anche su CPU low-tier</p>
              </div>
            </div>

            <div className="bg-[#0c0c0e]/60 p-4 rounded-sm border border-white/10 flex items-center space-x-3 text-left">
              <Monitor className="h-5 w-5 text-brand-purple-400 shrink-0" />
              <div>
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Kiosk Auto</h5>
                <p className="text-[10px] text-zinc-500">Elimina l'interfaccia OS</p>
              </div>
            </div>

            <div className="bg-[#0c0c0e]/60 p-4 rounded-sm border border-white/10 flex items-center space-x-3 text-left">
              <Settings className="h-5 w-5 text-brand-purple-400 shrink-0" />
              <div>
                <h5 className="font-bold text-xs text-white uppercase tracking-wider">Mapping</h5>
                <p className="text-[10px] text-zinc-500">Configurazione unificata</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic setup code blocks grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Steps side nav column */}
          <div className="col-span-1 md:col-span-4 flex flex-col space-y-3 text-left">
            <span className="font-pixel text-[8px] text-zinc-600 uppercase tracking-widest pl-2 mb-2">PUNTI DI GUIDA</span>
            
            {steps.map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveStep(st.id)}
                className={`w-full p-4 rounded-sm text-left border transition-all duration-150 cursor-pointer ${
                  activeStep === st.id 
                    ? 'bg-brand-purple-600/10 border-brand-purple-600 text-white shadow-md' 
                    : 'bg-[#0c0c0e]/50 border-white/10 text-zinc-400 hover:text-white hover:bg-[#0c0c0e]'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`h-6 w-6 rounded-none flex items-center justify-center text-xs font-mono shrink-0 font-bold ${
                    activeStep === st.id ? 'bg-brand-purple-600 text-white' : 'bg-black text-zinc-500'
                  }`}>
                    {st.id}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm leading-tight text-white uppercase">{st.title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-1">{st.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ACTIVE STEP CODE BLOCK WORKSPACE PANEL */}
          <div className="col-span-1 md:col-span-8 bg-[#0c0c0e] border border-white/10 rounded-sm p-6 md:p-8 flex flex-col justify-between text-left shadow-xl">
            
            <div className="space-y-4">
              
              {/* Block header titles */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <span className="font-pixel text-[7px] text-brand-purple-400 tracking-widest uppercase mb-1 block">PASSAGGIO SELEZIONATO {currentStepData.id}</span>
                  <h3 className="font-display font-black uppercase text-xl text-white tracking-wide">{currentStepData.title}</h3>
                </div>
                {currentStepData.fileTarget && (
                  <div className="flex items-center space-x-1.5 p-1 px-2 text-[9px] bg-black border border-white/10 text-zinc-400 rounded-sm font-mono">
                    <Code2 className="h-3 w-3 text-brand-purple-400" />
                    <span>{currentStepData.fileTarget}</span>
                  </div>
                )}
              </div>

              {/* Step Description */}
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                {currentStepData.description}
              </p>

              {/* Code Panel */}
              {currentStepData.code && (
                <div className="relative mt-4">
                  
                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyCode(currentStepData.code || '')}
                    className="absolute top-3 right-3 p-2 bg-black/90 hover:bg-black text-zinc-400 hover:text-white rounded-none border border-white/10 transition cursor-pointer"
                    title="Copia codice"
                  >
                    {copiedText === currentStepData.code ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>

                  <pre className="p-5 bg-black rounded-none font-mono text-xs text-brand-purple-400 overflow-x-auto leading-relaxed border border-white/10 shadow-inner max-h-[250px] scrollbar-thin">
                    <code>{currentStepData.code}</code>
                  </pre>
                </div>
              )}

            </div>

            {/* Micro warning banner at the bottom */}
            <div className="pt-6 border-t border-white/10 mt-6 flex items-center space-x-3 text-[11px] text-zinc-500">
              <Shield className="h-4.5 w-4.5 text-brand-purple-400 shrink-0" />
              <span>Qualsiasi modifica di configurazione del cabinato non richiede modifiche fisiche all’hardware. Retrofight lavora interamente via software.</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
