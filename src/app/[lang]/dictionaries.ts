export const locales = ["en", "it"] as const;

export type Locale = (typeof locales)[number];

export function hasLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

const shared = {
  githubOrg: "https://github.com/Retrofight",
  installerUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.3.8-beta.2/RetroFight-win-x64.exe",
  portableUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.3.8-beta.2/RetroFight-win-x64.zip",
};

export const dictionaries = {
  en: {
    ...shared,
    nav: {
      project: "Project",
      downloads: "Downloads",
      wiki: "How to play",
      github: "GitHub",
      language: "Language",
    },
    footer: {
      copyright:
        "RetroFight Project. Game files and trademarks belong to their respective owners.",
      backToTop: "Back to top",
    },
    home: {
      badge: "Beta test version",
      title: "RetroFight",
      subtitle:
        "A Windows arcade fighting game matchmaking client focused on direct, low-latency 1v1 play.",
      intro:
        "RetroFight combines a desktop client, online lobbies, match challenges, and a custom RetroFight FBNeo runtime built for competitive arcade sessions.",
      windowsOnly: "Currently available for Windows only.",
      downloadExe: "Download installer",
      downloadZip: "Download portable zip",
      howTo: "Read how to play",
      cards: [
        {
          title: "Beta for testing",
          text: "The current release is a beta focused on stable direct online play, clear connection feedback, and a clean Windows release experience.",
        },
        {
          title: "Custom FBNeo runtime",
          text: "RetroFight uses a custom FBNeo emulator that includes a GGPO integration for direct arcade netplay sessions.",
        },
        {
          title: "1v1 arcade flow",
          text: "Choose a game, enter its lobby, challenge another player, and let RetroFight handle signaling before the runtime starts.",
        },
        {
          title: "Bring your own game files",
          text: "RetroFight does not include, distribute, sell, or provide ROMs. Use only files you legally own and are authorized to use.",
        },
      ],
      projectTitle: "Project notes",
      projectNotes: [
        "Author: Stefano, RetroFight project.",
        "The project is present on GitHub under the RetroFight organization.",
        "The architecture is open source. The Electron client, the heart of the project, is not open source.",
        "Some mature-platform features are outside the first beta, including accounts, rankings, spectator mode, advanced chat, and relay fallback for networks where direct play is not possible.",
      ],
      githubCta: "Open RetroFight on GitHub",
    },
    wiki: {
      title: "How to Play RetroFight Beta",
      subtitle: "Basic RetroFight beta flow for Windows users.",
      back: "Back to home",
      sections: [
        {
          title: "Before You Start",
          items: [
            "A Windows PC.",
            "A RetroFight beta release build.",
            "Network access to the RetroFight server.",
            "Permission for RetroFight and RetroFight FBNeo through Windows Firewall.",
            "Game files that you legally own and are authorized to use.",
          ],
          note: "RetroFight does not include, distribute, or download game ROMs.",
        },
        {
          title: "Install Or Launch",
          items: [
            "Run RetroFight-win-x64.exe to install RetroFight.",
            "Extract RetroFight-win-x64.zip and launch the portable build.",
            "If RetroFight FBNeo does not start because d3dx9_43.dll is missing, install the Microsoft DirectX End-User Runtime legacy package and restart RetroFight.",
          ],
        },
        {
          title: "Add Your Game Files",
          paragraphs: [
            "Open RetroFight and use Window > Open ROMs Folder to open the local ROM folder.",
            "Place the required game ZIP files in that folder. RetroFight will not let you enter a game lobby when the required local game file is missing.",
          ],
        },
        {
          title: "Start A Match",
          ordered: [
            "Launch RetroFight.",
            "Select a game from the catalog.",
            "Enter the game lobby.",
            "Choose an available player and send a challenge.",
            "The challenged player can accept or reject the match.",
            "When accepted, RetroFight starts signaling and UDP direct connection checks.",
            "When the connection succeeds, RetroFight launches the RetroFight FBNeo runtime.",
            "Play the match.",
            "When the runtime closes, RetroFight returns to the lobby.",
          ],
          note: "Ranked play is disabled by default during the beta release.",
        },
        {
          title: "Connection Status",
          items: [
            "Signaling: players are exchanging match setup information.",
            "UDP direct: RetroFight is checking whether direct UDP play is possible.",
            "Connected: the direct path is ready and the runtime can start.",
            "Direct failed: UDP direct play did not succeed.",
          ],
          note: "If direct UDP fails, this beta cannot automatically recover through a relay.",
        },
        {
          title: "Troubleshooting",
          groups: [
            {
              title: "Server unavailable",
              items: [
                "Check your internet or LAN connection.",
                "Restart RetroFight.",
                "Try again after confirming the server is online.",
              ],
            },
            {
              title: "Game file missing",
              items: [
                "Open Window > Open ROMs Folder.",
                "Place the required game ZIP in the folder.",
                "Return to the catalog and select the game again.",
              ],
            },
            {
              title: "Runtime does not start",
              items: [
                "Install the Microsoft DirectX End-User Runtime legacy package if d3dx9_43.dll is missing.",
                "Check whether antivirus software blocked the runtime.",
                "Reinstall or re-extract the RetroFight release build.",
              ],
            },
            {
              title: "UDP direct failed",
              items: [
                "Allow RetroFight and RetroFight FBNeo through Windows Firewall.",
                "Avoid VPNs, hotspots, hotel networks, school networks, office networks, or restrictive routers during beta testing.",
                "Try again from a home network.",
                "If the network blocks UDP direct traffic, this beta does not provide a relay fallback.",
              ],
            },
            {
              title: "Challenge flow gets stuck after rejecting",
              items: [
                "Reject the next challenge and try again.",
                "Note the player names, approximate time, and click sequence before reporting the issue.",
              ],
            },
          ],
        },
        {
          title: "Where To Find Local Data",
          paragraphs: [
            "RetroFight stores per-instance data under %APPDATA%\\RetroFight-instances\\.",
            "The ROM folder is available from the app menu through Window > Open ROMs Folder.",
          ],
        },
      ],
    },
  },
  it: {
    ...shared,
    nav: {
      project: "Progetto",
      downloads: "Download",
      wiki: "Come giocare",
      github: "GitHub",
      language: "Lingua",
    },
    footer: {
      copyright:
        "RetroFight Project. I file di gioco e i marchi appartengono ai rispettivi proprietari.",
      backToTop: "Torna su",
    },
    home: {
      badge: "Versione beta per test",
      title: "RetroFight",
      subtitle:
        "Un client Windows per matchmaking arcade fighting game 1v1, pensato per partite dirette a bassa latenza.",
      intro:
        "RetroFight combina client desktop, lobby online, sfide tra giocatori e un runtime RetroFight FBNeo custom costruito per sessioni arcade competitive.",
      windowsOnly: "Al momento disponibile solo per Windows.",
      downloadExe: "Scarica installer",
      downloadZip: "Scarica zip portable",
      howTo: "Leggi come giocare",
      cards: [
        {
          title: "Beta per test",
          text: "La release attuale e' una beta orientata a gioco online diretto stabile, feedback di connessione chiaro e distribuzione Windows pulita.",
        },
        {
          title: "Runtime FBNeo custom",
          text: "RetroFight usa un emulatore FBNeo custom che include un'integrazione GGPO per sessioni arcade netplay dirette.",
        },
        {
          title: "Flusso arcade 1v1",
          text: "Scegli un gioco, entra nella lobby dedicata, sfida un altro player e lascia a RetroFight la fase di signaling prima dell'avvio runtime.",
        },
        {
          title: "File di gioco non inclusi",
          text: "RetroFight non include, distribuisce, vende o fornisce ROM. Usa solo file che possiedi legalmente e che sei autorizzato a usare.",
        },
      ],
      projectTitle: "Note di progetto",
      projectNotes: [
        "Autore: Stefano, progetto RetroFight.",
        "Il progetto e' presente su GitHub nell'organizzazione RetroFight.",
        "L'architettura e' open source. Il client Electron, il cuore del progetto, non e' open source.",
        "Alcune funzionalita' da piattaforma matura sono fuori dalla prima beta: account, ranking, spectator mode, chat avanzata e fallback relay per reti dove il direct non e' possibile.",
      ],
      githubCta: "Apri RetroFight su GitHub",
    },
    wiki: {
      title: "Come giocare a RetroFight Beta",
      subtitle: "Flusso base della beta RetroFight per utenti Windows.",
      back: "Torna alla home",
      sections: [
        {
          title: "Prima di iniziare",
          items: [
            "Un PC Windows.",
            "Una build release beta di RetroFight.",
            "Accesso di rete al server RetroFight.",
            "Permesso per RetroFight e RetroFight FBNeo nel firewall di Windows.",
            "File di gioco che possiedi legalmente e che sei autorizzato a usare.",
          ],
          note: "RetroFight non include, distribuisce o scarica ROM.",
        },
        {
          title: "Installa o avvia",
          items: [
            "Esegui RetroFight-win-x64.exe per installare RetroFight.",
            "Estrai RetroFight-win-x64.zip e avvia la build portable.",
            "Se RetroFight FBNeo non parte perche' manca d3dx9_43.dll, installa il pacchetto legacy Microsoft DirectX End-User Runtime e riavvia RetroFight.",
          ],
        },
        {
          title: "Aggiungi i file di gioco",
          paragraphs: [
            "Apri RetroFight e usa Window > Open ROMs Folder per aprire la cartella ROM locale.",
            "Inserisci in quella cartella i file ZIP richiesti. RetroFight non permette l'ingresso nella lobby di un gioco quando manca il file locale richiesto.",
          ],
        },
        {
          title: "Avvia un match",
          ordered: [
            "Avvia RetroFight.",
            "Seleziona un gioco dal catalogo.",
            "Entra nella lobby del gioco.",
            "Scegli un player disponibile e invia una sfida.",
            "Il player sfidato puo' accettare o rifiutare il match.",
            "Quando la sfida viene accettata, RetroFight avvia signaling e controlli di connessione UDP direct.",
            "Quando la connessione riesce, RetroFight avvia il runtime RetroFight FBNeo.",
            "Gioca il match.",
            "Quando il runtime si chiude, RetroFight torna alla lobby.",
          ],
          note: "Il ranked play e' disabilitato di default durante la release beta.",
        },
        {
          title: "Stato connessione",
          items: [
            "Signaling: i player stanno scambiando le informazioni di setup del match.",
            "UDP direct: RetroFight sta verificando se il gioco UDP diretto e' possibile.",
            "Connected: il percorso diretto e' pronto e il runtime puo' partire.",
            "Direct failed: il gioco UDP diretto non e' riuscito.",
          ],
          note: "Se UDP direct fallisce, questa beta non puo' recuperare automaticamente tramite relay.",
        },
        {
          title: "Risoluzione problemi",
          groups: [
            {
              title: "Server non disponibile",
              items: [
                "Controlla la connessione internet o LAN.",
                "Riavvia RetroFight.",
                "Riprova dopo aver confermato che il server e' online.",
              ],
            },
            {
              title: "File di gioco mancante",
              items: [
                "Apri Window > Open ROMs Folder.",
                "Inserisci nella cartella lo ZIP richiesto.",
                "Torna al catalogo e seleziona di nuovo il gioco.",
              ],
            },
            {
              title: "Il runtime non parte",
              items: [
                "Installa il pacchetto legacy Microsoft DirectX End-User Runtime se manca d3dx9_43.dll.",
                "Controlla se l'antivirus ha bloccato il runtime.",
                "Reinstalla o riestrai la build release di RetroFight.",
              ],
            },
            {
              title: "UDP direct fallito",
              items: [
                "Consenti RetroFight e RetroFight FBNeo nel firewall di Windows.",
                "Evita VPN, hotspot, reti hotel, reti scolastiche, reti aziendali o router restrittivi durante il test beta.",
                "Riprova da una rete domestica.",
                "Se la rete blocca il traffico UDP direct, questa beta non fornisce un fallback relay.",
              ],
            },
            {
              title: "Il flusso sfida resta bloccato dopo un rifiuto",
              items: [
                "Rifiuta la sfida successiva e riprova.",
                "Annota nomi player, orario indicativo e sequenza click prima di segnalare il problema.",
              ],
            },
          ],
        },
        {
          title: "Dove trovare i dati locali",
          paragraphs: [
            "RetroFight salva i dati per istanza in %APPDATA%\\RetroFight-instances\\.",
            "La cartella ROM e' disponibile dal menu dell'app tramite Window > Open ROMs Folder.",
          ],
        },
      ],
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
