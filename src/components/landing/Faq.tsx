import { useState } from 'react';
import type { FaqItem } from './types';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Faq() {
  const faqs: FaqItem[] = [
    {
      id: "faq_1",
      category: "Connettività",
      question: "Cos'è l'Hole Punching NAT Traversal e perché risolve il multiplayer retro?",
      answer: "Tradizionalmente, per giocare p2p con vecchi emulatori (come MAME o Kaillera) bisognava accedere alla pagina del modem di casa e mappare manualmente le porte UDP, operazione impossibile per chi usa reti mobili o connessioni condominiali. L'Hole Punching sfrutta server STUN per far sì che i due computer negozino autonomamente e 'bucano' la barriera protettiva dei router contemporaneamente. Questo stabilisce una connessione diretta a zero lag tra i due giocatori senza toccare nessuna impostazione del modem."
    },
    {
      id: "faq_2",
      category: "Hardware",
      question: "Ho bisogno di un hardware potente per far girare Retrofight nel cabinato arcade?",
      answer: "No, affatto! Retrofight è stato progettato con l'efficienza in mente. Anche se sviluppato su Electron, l'interfaccia HTML5 si disattiva visivamente e va in background non appena il core RetroArch viene lanciato in modalità immersiva. Di conseguenza, tutti i cicli della CPU e della scheda video vengono interamente allocati per l'emulatore. Gira alla perfezione anche su vecchi PC d'ufficio rigenerati, mini-PC economici o processori della vecchia serie Intel Atom e Celeron inseriti all'interno dei mobili da sala giochi."
    },
    {
      id: "faq_3",
      category: "Software & Core",
      question: "Quali core di RetroArch e retro-console/arcade sono supportati?",
      answer: "Siamo compatibili con quasi tutta la suite Libretro fornita da RetroArch. I core preconfigurati e ottimizzati per il netcode p2p sono FinalBurn Neo (per tutti i classici arcade 2D NeoGeo, CPS1, CPS2, CPS3), Flycast (per i capolavori Sega NAOMI, Atomiswave e Dreamcast), Snes9x (Super Nintendo) e Genesis Plus GX (Mega Drive). Stiamo espandendo continuamente il supporto ai core 3D ad alte prestazioni."
    },
    {
      id: "faq_4",
      category: "Software & Core",
      question: "Come viene configurato il GGPO e qual è l'impatto sul lag dei tasti (input-delay)?",
      answer: "Il GGPO (Good Great Games Online) gestisce gli scambi su rete in modo speculativo. Invece di ritardare l'animazione d'attesa (Delay-based), legge all'istante l'input dei tasti fisici sul tuo fightstick o cabinato (Input Delay impostato manualmente a 1 o 2 frame per sicurezza). Se scopre una divergenza di posizionamento dell'avversario dovuta al ping di rete, esegue un rollback di stato istantaneo e ricalcola matematicamente le posizioni esatte in un singolo microfrazione di secondo, mantenendo intaccato il feeling dei frame-data del gioco."
    },
    {
      id: "faq_5",
      category: "Licenza",
      question: "Retrofight include le ROMs o i file di gioco?",
      answer: "No. Ai sensi delle normative sulla tutela del copyright, Retrofight non include file ROMs, immagini ISO o BIOS commerciali di terze parti. Il software fornisce l'interfaccia Electron di matchmaking e la libreria di comunicazione GGPO. Gli utenti e gli amministratori del cabinato devono caricare autonomamente la propria collezione di ROM legali nella cartella preposta dell'applicazione."
    }
  ];

  const categories: Array<FaqItem['category']> = ["Connettività", "Hardware", "Software & Core", "Licenza"];
  const [selectedCategory, setSelectedCategory] = useState<FaqItem['category'] | 'All'>('All');
  const [expandedFaq, setExpandedFaq] = useState<string | null>("faq_1");

  const filteredFaqs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === selectedCategory);

  const toggleFaq = (id: string) => {
    if (expandedFaq === id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(id);
    }
  };

  return (
    <section id="faq" className="py-24 bg-black/60 border-t border-white/10 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="font-pixel text-[8px] text-brand-purple-400 tracking-widest uppercase mb-3 block">
            DUBBI O CURIOSITÀ TECNICHE
          </span>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-white tracking-tighter uppercase italic leading-none">
            Domande Frequenti (FAQ)
          </h2>
          <div className="h-0.5 w-16 bg-brand-purple-600 my-6"></div>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-lg">
            Hai dubbi specifici su Retrofight? Approfondisci i dettagli legati a reti, hardware, rollback ed emulatori arcade.
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-none text-xs font-semibold border transition duration-150 cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-brand-purple-600/10 border-brand-purple-600 text-white'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            Tutti
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-none text-xs font-semibold border transition duration-150 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-brand-purple-600/10 border-brand-purple-600 text-white'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-4 text-left">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedFaq === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-[#0c0c0e] border border-white/10 rounded-sm overflow-hidden hover:border-brand-purple-600/40 transition duration-150"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-sm sm:text-base text-white focus:outline-hidden hover:bg-white/2 cursor-pointer"
                >
                  <span className="flex items-start space-x-3 pr-4">
                    <HelpCircle className="h-5 w-5 text-brand-purple-400 shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </span>
                  
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-brand-purple-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-500 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-white/10 bg-black/40">
                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed pl-8">
                      {faq.answer}
                    </p>
                    <div className="mt-3 flex justify-end pl-8">
                      <span className="text-[8px] font-pixel text-zinc-500 border border-white/10 px-2 py-0.5 rounded-none bg-black uppercase tracking-widest">{faq.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
