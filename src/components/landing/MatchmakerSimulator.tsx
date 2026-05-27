import type { FormEvent } from 'react';
import { useState } from 'react';
import type { Lobby } from './types';
import { Plus, Wifi, Globe, Cpu, Gamepad2, User, RefreshCw, Layers } from 'lucide-react';

export default function MatchmakerSimulator() {
  const initialLobbies: Lobby[] = [
    {
      id: 'lobby_1',
      game: "Street Fighter III: 3rd Strike",
      host: "SuperAkuma_95",
      ping: 28,
      players: 1,
      maxPlayers: 2,
      status: 'open',
      region: "EU West",
      controller: "Arcade Stick",
      rollbackFrames: 1,
    },
    {
      id: 'lobby_2',
      game: "The King of Fighters '98",
      host: "KOF_Legend_IT",
      ping: 42,
      players: 1,
      maxPlayers: 2,
      status: 'open',
      region: "EU South",
      controller: "Cabinet",
      rollbackFrames: 2,
    },
    {
      id: 'lobby_3',
      game: "Marvel vs. Capcom 2",
      host: "RollbackGod",
      ping: 84,
      players: 1,
      maxPlayers: 2,
      status: 'open',
      region: "US East",
      controller: "Gamepad",
      rollbackFrames: 3,
    },
    {
      id: 'lobby_4',
      game: "Garou: Mark of the Wolves",
      host: "TerryBogard",
      ping: 115,
      players: 1,
      maxPlayers: 2,
      status: 'open',
      region: "SA East",
      controller: "Cabinet",
      rollbackFrames: 4,
    },
  ];

  const [lobbies, setLobbies] = useState<Lobby[]>(initialLobbies);
  const [activeTab, setActiveTab] = useState<'lobbies' | 'myRoms' | 'options'>('lobbies');
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const [connectionStep, setConnectionStep] = useState<number>(0);
  const [showAddLobbyModal, setShowAddLobbyModal] = useState<boolean>(false);

  // New lobby form state
  const [newGame, setNewGame] = useState("JoJo's Bizarre Adventure");
  const [newHost, setNewHost] = useState("PixelWarrior");
  const [newRegion, setNewRegion] = useState("EU Central");
  const [newController, setNewController] = useState<'Arcade Stick' | 'Cabinet' | 'Gamepad' | 'Keyboard'>('Arcade Stick');

  // Available games to choose
  const mockGamesList = [
    "JoJo's Bizarre Adventure",
    "Street Fighter II' Turbo",
    "Capcom vs. SNK 2",
    "Tekken 3",
    "Samurai Shodown V Special",
    "Windjammers",
  ];

  const handleJoinLobby = (lobby: Lobby) => {
    setSelectedLobby(lobby);
    setConnectionStep(1);

    // Simulate STUN/TURN Hole Punching steps
    setTimeout(() => {
      setConnectionStep(2); // STUN response OK, starting hole punching
      setTimeout(() => {
        setConnectionStep(3); // Hole punching succeeded, direct P2P established
        setTimeout(() => {
          setConnectionStep(4); // Lobbied up & GGPO active
        }, 1200);
      }, 1000);
    }, 800);
  };

  const handleCloseLobbyModal = () => {
    setSelectedLobby(null);
    setConnectionStep(0);
  };

  const handleCreateLobby = (e: FormEvent) => {
    e.preventDefault();
    const lobby: Lobby = {
      id: `lobby_${Date.now()}`,
      game: newGame,
      host: newHost || "GamerAnonimo",
      ping: Math.floor(Math.random() * 40) + 15,
      players: 1,
      maxPlayers: 2,
      status: 'open',
      region: newRegion,
      controller: newController,
      rollbackFrames: 1,
    };
    setLobbies([lobby, ...lobbies]);
    setShowAddLobbyModal(false);
  };

  const handleResetLobbies = () => {
    setLobbies(initialLobbies);
  };

  return (
    <section id="matchmaking" className="py-24 bg-dark-obsidian/90 relative border-t border-dark-border">
      
      {/* Background decorations */}
      <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-brand-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <span className="font-pixel text-[8px] text-brand-purple-400 tracking-widest uppercase mb-3">
            Matchmaking Multi-Regione Integrato
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tighter uppercase italic">
            Stanza Matchmaking Retrofight
          </h2>
          <div className="h-0.5 w-16 bg-brand-purple-600 my-6"></div>
          <p className="text-zinc-400 text-sm sm:text-base font-normal max-w-xl">
            Osserva l'interfaccia client integrata. Puoi esplorare le lobby create da altri utenti, avviare una simulazione di connessione NAT traversal p2p con GGPO, o creare la tua stanza privata.
          </p>
        </div>

        {/* ELECTRON APP WINDOW CONTAINER */}
        <div className="bg-[#0c0c0e] border border-white/10 rounded-sm overflow-hidden shadow-2xl flex flex-col max-w-5xl mx-auto h-[550px]">
          
          {/* MOCK OS TITLEBAR */}
          <div className="bg-black px-4 py-3 border-b border-white/10 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-none bg-brand-purple-600 inline-block pointer-events-none animate-pulse"></span>
              <span className="h-2.5 w-2.5 rounded-none bg-zinc-800 inline-block pointer-events-none"></span>
              <span className="h-2.5 w-2.5 rounded-none bg-zinc-900 inline-block pointer-events-none"></span>
              <span className="text-[10px] font-mono text-zinc-500 ml-4">Retrofight v1.0.2 - Electron Console</span>
            </div>
            <div className="bg-[#0c0c0e] px-3 py-1 rounded-none border border-white/15 flex items-center space-x-2">
              <span className="h-1.5 w-1.5 rounded-none bg-brand-purple-400 animate-pulse"></span>
              <span className="font-mono text-[9px] text-brand-purple-400 uppercase tracking-widest">NET: CONNESSO</span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            
            {/* ELECTRON MOCK SIDEBAR */}
            <div className="w-48 bg-black/40 p-4 border-r border-white/10 flex flex-col justify-between h-full">
              
              <div className="space-y-6 text-left">
                <div>
                  <span className="text-[9px] font-pixel text-zinc-600 block mb-3 uppercase tracking-widest">NAVIGAZIONE</span>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab('lobbies')}
                      className={`w-full py-2 px-3 rounded-none text-xs font-semibold flex items-center space-x-2 transition ${
                        activeTab === 'lobbies' ? 'bg-brand-purple-600/10 text-white border-l-2 border-brand-purple-600' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 text-brand-purple-400" />
                      <span>Lobby Attive</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('myRoms')}
                      className={`w-full py-2 px-3 rounded-none text-xs font-semibold flex items-center space-x-2 transition ${
                        activeTab === 'myRoms' ? 'bg-brand-purple-600/10 text-white border-l-2 border-brand-purple-600' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Gamepad2 className="h-3.5 w-3.5 text-brand-purple-400" />
                      <span>Le mie ROMs</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('options')}
                      className={`w-full py-2 px-3 rounded-none text-xs font-semibold flex items-center space-x-2 transition ${
                        activeTab === 'options' ? 'bg-brand-purple-600/10 text-white border-l-2 border-brand-purple-600' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Cpu className="h-3.5 w-3.5 text-brand-purple-400" />
                      <span>Config. Core</span>
                    </button>
                  </div>
                </div>

                {/* Profile Widget */}
                <div className="border-t border-white/10 pt-4 text-left">
                  <span className="text-[9px] font-pixel text-zinc-600 block mb-3 uppercase tracking-widest">GIOCATORE</span>
                  <div className="bg-white/2 rounded-none p-2.5 flex items-center space-x-2 border border-white/10">
                    <User className="h-4 w-4 text-brand-purple-400" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">PlayerOne_SF</p>
                      <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Cabinato USB #1</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset to standard */}
              <button
                onClick={handleResetLobbies}
                className="text-[10px] font-mono text-zinc-500 hover:text-white flex items-center space-x-2 cursor-pointer pt-4 border-t border-white/10 text-left"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Formatta Lobby</span>
              </button>

            </div>

            {/* MAIN DATA VIEW */}
            <div className="flex-1 bg-black/10 p-6 flex flex-col h-full overflow-y-auto">
              
              {/* TAB 1: LOBBIES SCREEN (DEFAULT) */}
              {activeTab === 'lobbies' && (
                <div className="flex flex-col h-full">
                  
                  {/* Action Bar */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-left">
                      <h3 className="font-display font-black text-sm text-white uppercase tracking-wider italic">Stanze Attive</h3>
                      <p className="text-xs text-zinc-400">Seleziona una lobby per avviare la negoziazione NAT traversal.</p>
                    </div>

                    <button
                      id="create-lobby-btn"
                      onClick={() => setShowAddLobbyModal(true)}
                      className="px-4 py-2 bg-brand-purple-600 hover:bg-brand-purple-500 rounded-sm text-xs font-semibold flex items-center space-x-1.5 cursor-pointer text-white"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crea Stanza</span>
                    </button>
                  </div>

                  {/* Lobbies List */}
                  <div className="space-y-3 flex-1">
                    {lobbies.length === 0 ? (
                      <div className="h-40 border-2 border-dashed border-white/10 rounded-none flex flex-col items-center justify-center text-zinc-500 text-xs">
                        <span>Nessuna stanza disponibile in coda.</span>
                        <button onClick={handleResetLobbies} className="text-brand-purple-400 mt-2 hover:underline">Ripristina elenco standard</button>
                      </div>
                    ) : (
                      lobbies.map((lobby) => (
                        <div
                          key={lobby.id}
                          className="bg-black/40 border border-white/10 rounded-none p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-purple-600/40 transition duration-150"
                        >
                          <div className="flex items-start space-x-3.5 text-left">
                            <div className="bg-zinc-950 p-2 rounded-none border border-white/10 text-brand-purple-400">
                              <Gamepad2 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-display font-bold text-sm text-white">{lobby.game}</h4>
                                <span className="bg-brand-purple-900/30 border border-brand-purple-600/30 text-brand-purple-400 px-1.5 py-0.5 rounded-none text-[8px] font-pixel">
                                  {lobby.rollbackFrames}f Delay
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center space-x-1.5">
                                <span className="text-brand-purple-400">Host:</span>
                                <span>{lobby.host}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-brand-purple-400">{lobby.controller}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-brand-purple-400 flex items-center space-x-0.5">
                                  <Globe className="h-3 w-3" />
                                  <span>{lobby.region}</span>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                            {/* Ping indication */}
                            <div className="flex items-center space-x-1.5">
                              <Wifi className="h-4 w-4 text-brand-purple-400" />
                              <span className="font-mono text-xs text-brand-purple-400 font-semibold">{lobby.ping}ms</span>
                            </div>

                            {/* Join Action */}
                            <button
                              id={`join-lobby-${lobby.id}`}
                              onClick={() => handleJoinLobby(lobby)}
                              className="px-5 py-2 bg-brand-purple-600 hover:bg-brand-purple-500 text-white rounded-sm font-display font-bold uppercase text-[10px] tracking-wider italic flex items-center active:scale-95 transition-all duration-150 cursor-pointer"
                            >
                              Sfidalo (Join)
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* TAB 2: MY ROMS */}
              {activeTab === 'myRoms' && (
                <div className="text-left space-y-4">
                  <div>
                    <h3 className="font-display font-black text-sm text-white uppercase tracking-wider italic">Le mie ROMs & Core</h3>
                    <p className="text-xs text-zinc-400">Caricate direttamente salvandole nella cartella di installazione Electron di RetroArch.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#0c0c0e] border border-white/10 rounded-sm flex items-center justify-between">
                      <span className="text-xs text-white font-medium">sfiii3an.zip (Street Fighter III 3rd Strike)</span>
                      <span className="text-[10px] font-mono text-brand-purple-400">FBNeo Core</span>
                    </div>
                    <div className="p-3 bg-[#0c0c0e] border border-white/10 rounded-sm flex items-center justify-between">
                      <span className="text-xs text-white font-medium">kof98.zip (The King of Fighters '98)</span>
                      <span className="text-[10px] font-mono text-brand-purple-400">FBNeo Core</span>
                    </div>
                    <div className="p-3 bg-[#0c0c0e] border border-white/10 rounded-sm flex items-center justify-between">
                      <span className="text-xs text-white font-medium">mvsc2.zip (Marvel vs Capcom 2)</span>
                      <span className="text-[10px] font-mono text-brand-purple-400">Flycast Core</span>
                    </div>
                    <div className="p-3 bg-[#0c0c0e] border border-white/10 rounded-sm flex items-center justify-between text-zinc-500 border-dashed justify-center cursor-pointer hover:border-brand-purple-600/50">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="text-xs">Sfoggia nuova ROM</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EMULATOR CONFIG */}
              {activeTab === 'options' && (
                <div className="text-left space-y-4 font-mono text-xs text-zinc-400">
                  <h3 className="font-display font-black text-sm text-white uppercase tracking-wider italic font-sans">Impostazioni Iniziali</h3>
                  <div className="bg-black p-4 rounded-none border border-white/10 space-y-2.5">
                    <div># PARAMETRI RETE ESTERNA</div>
                    <div>GGPO_PORT_OUTGOING = 7000</div>
                    <div>STUN_SERVER = stun.l.google.com:19302</div>
                    <div>GGPO_HOLE_PUNCH_FALLBACK_TIMEOUT = 1500</div>
                    <div className="pt-2"># PROPRIETÀ GRAPHICS & CABINET</div>
                    <div>UI_KIOSK_MODE = false # Set true on Arcade Cabinets</div>
                    <div>INPUT_DRIVER = WASAPI_DIRECTINPUT</div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* CONNECTION SIMULATION MODAL POPUP */}
        {selectedLobby && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            
            <div className="bg-[#0c0c0e] border border-brand-purple-600/50 rounded-none p-8 max-w-md w-full text-center relative shadow-2xl">
              
              {/* Scanline CRT overlay */}
              <div className="absolute inset-0 retro-scanlines pointer-events-none opacity-40"></div>

              {/* Loader visual icon */}
              <div className="mx-auto h-12 w-12 bg-black border border-brand-purple-600/35 rounded-none flex items-center justify-center mb-6">
                <RefreshCw className="h-6 w-6 text-brand-purple-400 animate-spin" />
              </div>

              <span className="font-pixel text-[8px] text-brand-purple-400 tracking-wider">PROCEDURA DI SFIDA</span>
              <h4 className="font-display font-black uppercase italic text-xl text-white mt-1.5 mb-2">Traversata NAT Traversal</h4>
              <p className="text-xs text-zinc-400 mb-6">Sto connettendomi con l'host privato <strong className="text-white">{selectedLobby.host}</strong></p>

              {/* Timeline Steps */}
              <div className="space-y-4 text-left border-y border-white/10 py-6 my-6 text-xs max-w-xs mx-auto">
                <div className="flex items-center space-x-3">
                  <span className={`h-4 w-4 rounded-none flex items-center justify-center text-[10px] font-bold ${connectionStep >= 1 ? 'bg-brand-purple-600 text-white' : 'bg-white/5 border border-white/10 text-zinc-500'}`}>1</span>
                  <span className={`${connectionStep >= 1 ? 'text-white font-medium' : 'text-zinc-500'}`}>Inizializzazione STUN Server</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`h-4 w-4 rounded-none flex items-center justify-center text-[10px] font-bold ${connectionStep >= 2 ? 'bg-brand-purple-500 text-white' : 'bg-white/5 border border-white/10 text-zinc-500'}`}>2</span>
                  <span className={`${connectionStep >= 2 ? 'text-white font-medium' : 'text-zinc-500'}`}>Hole punching NAT p2p</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`h-4 w-4 rounded-none flex items-center justify-center text-[10px] font-bold ${connectionStep >= 3 ? 'bg-brand-purple-400 text-black' : 'bg-white/5 border border-white/10 text-zinc-500'}`}>3</span>
                  <span className={`${connectionStep >= 3 ? 'text-white font-medium' : 'text-zinc-500'}`}>Negoziamento GGPO Netcode</span>
                </div>
              </div>

              {/* Dynamic steps logs text feedback */}
              <div className="bg-black/80 p-3 rounded-none font-mono text-[10px] text-left text-zinc-500 mb-6 border border-white/10">
                {connectionStep === 1 && <span className="text-brand-purple-400 animate-pulse">&gt; QUERY ADDR STUN: stun.l.google.com... SUCCESS</span>}
                {connectionStep === 2 && <span className="text-brand-purple-400 animate-pulse">&gt; ATTEMPT_PUNCH: sending UDP packets to {selectedLobby.host}... IP_MAPPED</span>}
                {connectionStep === 3 && <span className="text-brand-purple-400 animate-pulse">&gt; SYNC_GGPO: frame state validation handshake... SYNC OK</span>}
                {connectionStep === 4 && <span className="text-white font-bold">&gt; SESSION_READY: core launched in rollback mode. PLAY!</span>}
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseLobbyModal}
                  className="px-4 py-2 border border-white/10 rounded-sm text-xs text-zinc-400 hover:text-white"
                >
                  Annulla
                </button>
                {connectionStep === 4 && (
                  <button
                    onClick={() => {
                      handleCloseLobbyModal();
                    }}
                    className="px-5 py-2 bg-brand-purple-600 hover:bg-brand-purple-500 text-white font-display font-bold uppercase text-xs tracking-wider italic rounded-sm cursor-pointer"
                  >
                    Avvia picchiaduro
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* CREATE LOBBY MODAL */}
        {showAddLobbyModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0c0c0e] border border-white/10 rounded-sm p-6 md:p-8 max-w-md w-full relative">
              <h4 className="font-display font-black uppercase italic text-lg text-white mb-2">Crea Nuova Stanza Match</h4>
              <p className="text-xs text-zinc-400 mb-6">Compila i parametri della stanza. Sarai registrato sulla rete Retrofight.</p>
              
              <form onSubmit={handleCreateLobby} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 font-display">Videogioco Retrogaming</label>
                  <select
                    value={newGame}
                    onChange={(e) => setNewGame(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                  >
                    {mockGamesList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 font-display">Il tuo nickname in gioco</label>
                  <input
                    type="text"
                    required
                    value={newHost}
                    onChange={(e) => setNewHost(e.target.value)}
                    placeholder="Esq. PlayerPro"
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 font-display">Regione Server</label>
                    <select
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                    >
                      <option value="EU Central">EU Central</option>
                      <option value="EU South">EU South</option>
                      <option value="US West">US West</option>
                      <option value="US East">US East</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 font-display">Dispositivo Input</label>
                    <select
                      value={newController}
                      onChange={(e) => setNewController(e.target.value as Lobby['controller'])}
                      className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white"
                    >
                      <option value="Arcade Stick">Arcade Stick</option>
                      <option value="Cabinet">Cabinato Arcade</option>
                      <option value="Gamepad">Gamepad USB</option>
                      <option value="Keyboard">Tastiera</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddLobbyModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-xs text-zinc-400 hover:text-white"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-purple-600 hover:bg-brand-purple-500 text-white rounded-sm font-display font-bold uppercase text-xs tracking-wider italic cursor-pointer"
                  >
                    Pubblica Stanza
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
