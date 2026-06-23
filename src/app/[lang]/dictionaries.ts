export const locales = ["en", "it"] as const;

export type Locale = (typeof locales)[number];

export function hasLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

const shared = {
  githubOrg: "https://github.com/Retrofight",
  releaseUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/tag/v0.6.5-beta.0",
  installerUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.5-beta.0/RetroFight-Windows-Setup-0.6.5-beta.0-x64.exe",
  portableUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.5-beta.0/RetroFight-Windows-0.6.5-beta.0-x64.zip",
  linuxAppImageUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.5-beta.0/RetroFight-Linux-0.6.5-beta.0-x86_64.AppImage",
  linuxDebUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.5-beta.0/RetroFight-Linux-0.6.5-beta.0-amd64.deb",
};

export const dictionaries = {
  en: {
    ...shared,
    nav: {
      project: "Project",
      downloads: "Downloads",
      wiki: "How to play",
      github: "GitHub",
      auth: "Sign in / Register",
      profile: "Profile",
      userMenu: "User menu",
      signOut: "Sign out",
      language: "Language",
    },
    footer: {
      copyright:
        "RetroFight Project. Game files and trademarks belong to their respective owners.",
      backToTop: "Back to top",
    },
    auth: {
      eyebrow: "RetroFight profile",
      title: "Sign in or create your player profile",
      subtitle:
        "Player profiles are the base for future public pages, match history, and ranking features.",
      signIn: "Sign in",
      signUp: "Register",
      email: "Email",
      password: "Password",
      displayName: "Player name",
      displayNameHint: "Optional",
      back: "Back to home",
      invalid: "Check your email and password, then try again.",
      signupFailed:
        "Registration did not complete. Try another email or password.",
      callbackFailed:
        "The confirmation link is incomplete. Request a new registration email.",
      linkExpired:
        "The confirmation link is invalid or expired. Register again or request a new email.",
      verifierMissing:
        "Email confirmed, but this browser could not complete automatic sign-in. Sign in with your email and password.",
      checkEmail: "Check your inbox to confirm the profile before signing in.",
      signedOut: "You have been signed out.",
      passwordReset: "Password updated. Sign in with the new password.",
      forgotPassword: "Forgot password?",
    },
    forgotPassword: {
      eyebrow: "Profile recovery",
      title: "Recover your password",
      subtitle:
        "Enter your email and we will send a secure link to choose a new password.",
      email: "Email",
      submit: "Send recovery email",
      back: "Back to sign in",
      missingEmail: "Enter your email address.",
      requestFailed: "The recovery email could not be sent. Try again later.",
      resetSent:
        "If a profile exists for this email, you will receive a recovery link.",
    },
    resetPassword: {
      eyebrow: "Password recovery",
      title: "Choose a new password",
      subtitle:
        "Use at least 8 characters. Additional security rules are enforced automatically.",
      password: "New password",
      confirmPassword: "Confirm new password",
      submit: "Update password",
      missing: "Complete every password field.",
      mismatch: "The new password and confirmation do not match.",
      weak: "Use at least 8 characters for the new password.",
      policy: "The new password does not match the configured security policy.",
      back: "Back to sign in",
    },
    profile: {
      title: "Profile",
      subtitle: "Your RetroFight profile is active.",
      email: "Email",
      player: "Player name",
      home: "Back to home",
      signOut: "Sign out",
      readOnly: "Locked",
      identityTitle: "Identity",
      passwordTitle: "Change password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      passwordHint:
        "Use at least 8 characters. Additional security rules are enforced automatically.",
      updatePassword: "Update password",
      passwordMessages: {
        missing: "Complete every password field.",
        mismatch: "The new password and confirmation do not match.",
        weak: "Use at least 8 characters for the new password.",
        current_invalid: "The current password is not correct.",
        policy: "The new password does not match the configured security policy.",
        updated: "Password updated.",
      },
    },
    home: {
      badge: "Beta test version",
      title: "RetroFight",
      subtitle:
        "A desktop arcade fighting game matchmaking client focused on direct, low-latency 1v1 play.",
      intro:
        "RetroFight combines a desktop client for Windows and Linux, online lobbies, match challenges, and a custom RetroFight FBNeo runtime built for competitive arcade sessions.",
      platforms: "Beta builds for Windows and Linux.",
      downloadWindowsInstaller: "Windows installer",
      downloadWindowsPortable: "Windows portable zip",
      downloadLinuxAppImage: "Linux AppImage",
      downloadLinuxDeb: "Linux deb",
      howTo: "Read how to play",
      cards: [
        {
          title: "Beta for testing",
          text: "The current release is a beta focused on stable direct online play, clear connection feedback, and clean Windows and Linux packages.",
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
      subtitle: "Basic RetroFight beta flow for Windows and Linux users.",
      back: "Back to home",
      sections: [
        {
          title: "Before You Start",
          items: [
            "A Windows or Linux PC.",
            "A RetroFight beta release build.",
            "Network access to the RetroFight server.",
            "Permission for RetroFight and RetroFight FBNeo through your firewall.",
            "Game files that you legally own and are authorized to use.",
          ],
          note: "RetroFight does not include, distribute, or download game ROMs.",
        },
        {
          title: "Install Or Launch",
          items: [
            "On Windows, run the setup EXE or extract the portable ZIP.",
            "On Linux, use the AppImage or install the deb package. The beta package includes the Wine runtime used to launch RetroFight FBNeo.",
            "If your OS blocks the first launch, allow the downloaded beta package and try again.",
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
                "On Windows, allow RetroFight and RetroFight FBNeo through your antivirus or firewall if they were blocked.",
                "On Linux, make the AppImage executable or reinstall the deb package.",
                "Check whether antivirus software blocked the runtime.",
                "Reinstall or re-extract the RetroFight release build.",
              ],
            },
            {
              title: "UDP direct failed",
              items: [
                "Allow RetroFight and RetroFight FBNeo through your firewall.",
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
      auth: "Accedi / Registrati",
      profile: "Profilo",
      userMenu: "Menu utente",
      signOut: "Esci",
      language: "Lingua",
    },
    footer: {
      copyright:
        "RetroFight Project. I file di gioco e i marchi appartengono ai rispettivi proprietari.",
      backToTop: "Torna su",
    },
    auth: {
      eyebrow: "Profilo RetroFight",
      title: "Accedi o crea il tuo profilo player",
      subtitle:
        "I profili player sono la base per pagine pubbliche, storico match e ranking futuri.",
      signIn: "Accedi",
      signUp: "Registrati",
      email: "Email",
      password: "Password",
      displayName: "Nome player",
      displayNameHint: "Opzionale",
      back: "Torna alla home",
      invalid: "Controlla email e password, poi riprova.",
      signupFailed:
        "La registrazione non e' riuscita. Prova un'altra email o password.",
      callbackFailed:
        "Il link di conferma e' incompleto. Richiedi una nuova email di registrazione.",
      linkExpired:
        "Il link di conferma non e' valido o e' scaduto. Registrati di nuovo o richiedi una nuova email.",
      verifierMissing:
        "Email confermata, ma questo browser non ha completato l'accesso automatico. Accedi con email e password.",
      checkEmail: "Controlla la mail e conferma il profilo prima di accedere.",
      signedOut: "Logout effettuato.",
      passwordReset: "Password aggiornata. Accedi con la nuova password.",
      forgotPassword: "Password dimenticata?",
    },
    forgotPassword: {
      eyebrow: "Recupero profilo",
      title: "Recupera la password",
      subtitle:
        "Inserisci la tua email e invieremo un link sicuro per scegliere una nuova password.",
      email: "Email",
      submit: "Invia email di recupero",
      back: "Torna all'accesso",
      missingEmail: "Inserisci il tuo indirizzo email.",
      requestFailed: "Non e' stato possibile inviare l'email di recupero. Riprova piu' tardi.",
      resetSent:
        "Se esiste un profilo per questa email, riceverai un link di recupero.",
    },
    resetPassword: {
      eyebrow: "Recupero password",
      title: "Scegli una nuova password",
      subtitle:
        "Usa almeno 8 caratteri. Le regole di sicurezza aggiuntive sono applicate automaticamente.",
      password: "Nuova password",
      confirmPassword: "Conferma nuova password",
      submit: "Aggiorna password",
      missing: "Completa tutti i campi password.",
      mismatch: "La nuova password e la conferma non coincidono.",
      weak: "Usa almeno 8 caratteri per la nuova password.",
      policy: "La nuova password non rispetta la policy di sicurezza configurata.",
      back: "Torna all'accesso",
    },
    profile: {
      title: "Profilo",
      subtitle: "Il tuo profilo RetroFight e' attivo.",
      email: "Email",
      player: "Nome player",
      home: "Torna alla home",
      signOut: "Esci",
      readOnly: "Bloccato",
      identityTitle: "Identita'",
      passwordTitle: "Modifica password",
      currentPassword: "Password attuale",
      newPassword: "Nuova password",
      confirmPassword: "Conferma nuova password",
      passwordHint:
        "Usa almeno 8 caratteri. Le regole di sicurezza aggiuntive sono applicate automaticamente.",
      updatePassword: "Aggiorna password",
      passwordMessages: {
        missing: "Completa tutti i campi password.",
        mismatch: "La nuova password e la conferma non coincidono.",
        weak: "Usa almeno 8 caratteri per la nuova password.",
        current_invalid: "La password attuale non e' corretta.",
        policy:
          "La nuova password non rispetta la policy di sicurezza configurata.",
        updated: "Password aggiornata.",
      },
    },
    home: {
      badge: "Versione beta per test",
      title: "RetroFight",
      subtitle:
        "Un client desktop per matchmaking arcade fighting game 1v1, pensato per partite dirette a bassa latenza.",
      intro:
        "RetroFight combina client desktop per Windows e Linux, lobby online, sfide tra giocatori e un runtime RetroFight FBNeo custom costruito per sessioni arcade competitive.",
      platforms: "Build beta per Windows e Linux.",
      downloadWindowsInstaller: "Installer Windows",
      downloadWindowsPortable: "Zip portable Windows",
      downloadLinuxAppImage: "AppImage Linux",
      downloadLinuxDeb: "Deb Linux",
      howTo: "Leggi come giocare",
      cards: [
        {
          title: "Beta per test",
          text: "La release attuale e' una beta orientata a gioco online diretto stabile, feedback di connessione chiaro e pacchetti Windows e Linux puliti.",
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
      subtitle: "Flusso base della beta RetroFight per utenti Windows e Linux.",
      back: "Torna alla home",
      sections: [
        {
          title: "Prima di iniziare",
          items: [
            "Un PC Windows o Linux.",
            "Una build release beta di RetroFight.",
            "Accesso di rete al server RetroFight.",
            "Permesso per RetroFight e RetroFight FBNeo nel firewall del sistema.",
            "File di gioco che possiedi legalmente e che sei autorizzato a usare.",
          ],
          note: "RetroFight non include, distribuisce o scarica ROM.",
        },
        {
          title: "Installa o avvia",
          items: [
            "Su Windows, esegui il setup EXE oppure estrai lo ZIP portable.",
            "Su Linux, usa l'AppImage oppure installa il pacchetto deb. Il pacchetto beta include il runtime Wine usato per avviare RetroFight FBNeo.",
            "Se il sistema blocca il primo avvio, consenti il pacchetto beta scaricato e riprova.",
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
                "Su Windows, consenti RetroFight e RetroFight FBNeo se antivirus o firewall li hanno bloccati.",
                "Su Linux, rendi eseguibile l'AppImage oppure reinstalla il pacchetto deb.",
                "Controlla se l'antivirus ha bloccato il runtime.",
                "Reinstalla o riestrai la build release di RetroFight.",
              ],
            },
            {
              title: "UDP direct fallito",
              items: [
                "Consenti RetroFight e RetroFight FBNeo nel firewall del sistema.",
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
