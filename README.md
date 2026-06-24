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
- Supabase Auth per login e registrazione email/password

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

## Variabili ambiente Supabase

Creare un file `.env.local` locale con:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Su Vercel configurare le stesse variabili in `Project Settings > Environment Variables`:

- `NEXT_PUBLIC_SUPABASE_URL`: Project URL Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase, usata solo lato server per rimuovere definitivamente l'account utente tramite Admin API.
- `NEXT_PUBLIC_SITE_URL`: dominio pubblico del sito in produzione, ad esempio `https://retrofight.example`.

Per preview deploy, Vercel espone anche `VERCEL_URL`; il codice la usa come fallback per costruire il redirect auth, ma il dominio production va comunque inserito in `NEXT_PUBLIC_SITE_URL`.

## Configurazione Supabase Auth

Nel dashboard Supabase:

1. Aprire `Authentication > Providers` e lasciare abilitato `Email`.
2. Aprire `Authentication > URL Configuration`.
3. Impostare `Site URL` al dominio production del sito.
4. Aggiungere in `Redirect URLs`:
   - `http://localhost:3001/**`
   - `https://<dominio-production>/**`
   - `https://*-<team-or-account-slug>.vercel.app/**` se si usano preview deploy Vercel.

Il flusso implementato usa `/auth/callback` per completare la conferma email e poi porta l'utente su `/profile`.
Il recupero password parte da `/forgot-password`, passa da `/auth/callback` e termina su `/reset-password`.

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
|   |   +-- auth/
|   |   |   +-- callback/
|   |   +-- account/
|   |   +-- forgot-password/
|   |   +-- legal/
|   |   +-- login/
|   |   +-- profile/
|   |   +-- reset-password/
|   |   +-- wiki/
|   +-- components/
|   |   +-- auth/
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
- `AuthPanel`: form login/registrazione con Supabase Auth.
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

## Documenti legali

I documenti legali pubblici di RetroFight sono mantenuti nel repository [retrofight-legal](https://github.com/Retrofight/retrofight-legal) e sono parte essenziale del progetto:

- [Legal Notice](https://github.com/Retrofight/retrofight-legal/blob/main/LEGAL_NOTICE.md)
- [Terms of Use](https://github.com/Retrofight/retrofight-legal/blob/main/TERMS_OF_USE.md)
- [First Run Disclaimer](https://github.com/Retrofight/retrofight-legal/blob/main/FIRST_RUN_DISCLAIMER.md)
- [Download Disclaimer](https://github.com/Retrofight/retrofight-legal/blob/main/DOWNLOAD_DISCLAIMER.md)
- [Third-Party Content Notice](https://github.com/Retrofight/retrofight-legal/blob/main/THIRD_PARTY_CONTENT.md)
- [Copyright Policy](https://github.com/Retrofight/retrofight-legal/blob/main/COPYRIGHT_POLICY.md)
- [Legal FAQ](https://github.com/Retrofight/retrofight-legal/blob/main/FAQ_LEGAL.md)

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
