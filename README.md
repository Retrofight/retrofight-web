# RetroFight Web

Landing page ufficiale di RetroFight, realizzata con Next.js, React, TypeScript e Tailwind CSS.

Il progetto presenta l'identita' del prodotto, racconta il valore del netplay arcade moderno e include sezioni interattive per simulare rollback netcode, matchmaking e flussi di download.

## Stack

- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint 9
- Lucide React per le icone

## Requisiti

- Node.js 18 o superiore
- npm

## Installazione

```powershell
npm install
```

## Sviluppo

```powershell
npm run dev
```

Il server di sviluppo usa la porta `3001`:

```txt
http://localhost:3001
```

## Script disponibili

```powershell
npm run dev
```

Avvia Next.js in modalita sviluppo sulla porta `3001`.

```powershell
npm run build
```

Genera la build di produzione.

```powershell
npm run start
```

Avvia la build di produzione generata da Next.js.

```powershell
npm run lint
```

Esegue ESLint sul progetto.

## Struttura

```txt
retrofight-web/
+-- public/
|   +-- landing/
|       +-- retrofight-hero.png
+-- src/
|   +-- app/
|   |   +-- globals.css
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   +-- components/
|       +-- landing/
|           +-- LandingPage.tsx
|           +-- Navbar.tsx
|           +-- Hero.tsx
|           +-- Features.tsx
|           +-- RollbackSimulator.tsx
|           +-- MatchmakerSimulator.tsx
|           +-- CabinetGuide.tsx
|           +-- Faq.tsx
|           +-- DownloadModal.tsx
|           +-- Footer.tsx
|           +-- types.ts
+-- eslint.config.mjs
+-- next.config.ts
+-- package.json
+-- tsconfig.json
```

## Sezioni della landing

- `Navbar`: navigazione principale e call to action download.
- `Hero`: headline, CTA, visual arcade e messaggi chiave.
- `Features`: card sui benefici tecnici e di prodotto.
- `RollbackSimulator`: simulatore interattivo tra delay netcode e rollback.
- `MatchmakerSimulator`: mock UI di lobby, creazione stanza e connessione.
- `CabinetGuide`: guida visuale per setup cabinet e configurazioni dedicate.
- `Faq`: risposte alle domande principali.
- `DownloadModal`: flusso modale per selezione piattaforma e stato download simulato.
- `Footer`: chiusura pagina e link di navigazione.

## Note di prodotto

La landing contiene contenuti dimostrativi e interattivi. Le opzioni di download, i nomi dei pacchetti, le lobby simulate, i valori di latenza e alcuni esempi di configurazione sono dati mock pensati per presentare l'esperienza utente prevista.

Prima di una pubblicazione pubblica stabile, verificare che:

- versioni e nomi pacchetto nel download siano allineati alla release reale;
- testi tecnici e claim di prodotto riflettano funzionalita effettivamente rilasciate;
- asset grafici finali siano ottimizzati;
- link esterni e CTA puntino alle destinazioni definitive;
- FAQ e guida cabinet non promettano feature non ancora disponibili.

## Convenzioni

- I componenti della landing vivono in `src/components/landing/`.
- I tipi condivisi della landing stanno in `src/components/landing/types.ts`.
- Gli asset statici specifici della landing stanno in `public/landing/`.
- La home page `src/app/page.tsx` renderizza `LandingPage`.
- Il layout globale e i metadata principali sono in `src/app/layout.tsx`.

## Verifica rapida

Prima di aprire una pull request:

```powershell
npm run lint
npm run build
```
