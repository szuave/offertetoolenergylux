# Energylux — Offerte-tool

Interne offerte-configurator voor de Energylux verkopers. De tool laat de
verkoper de werken op de werf selecteren, controleert dat er niets vergeten is,
en genereert een ondertekenbare PDF in Energylux-huisstijl.

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS v4** (theme-tokens via `@theme`, geen `tailwind.config.js`)
- **Zustand 5** met `persist`-middleware voor localStorage
- **@react-pdf/renderer** voor de PDF-generatie (lazy-loaded)
- **lucide-react** voor iconen
- **Vitest** voor unit tests

## Aan de slag

```bash
npm install
npm run dev      # dev server op http://localhost:5173
npm test         # unit tests
npm run typecheck
npm run build    # productie-build in /dist
npm run preview  # preview van productie-build
```

## Mappenstructuur

```
src/
├── config/company.ts           # Energylux bedrijfsgegevens (gebruikt in PDF)
├── types/quote.ts              # Domain types: Quote, Customer, LineItem, Totals
├── data/pricing.ts             # Prijsdata uit Energylux-prijslijst
├── lib/
│   ├── calculator.ts           # Pure functies: lijntotalen, subtotalen, BTW, korting
│   ├── validation.ts           # Prijs-per-m² classificatie, e-mail/postcode regex
│   ├── checklist.ts            # "Niets vergeten" regels (blokkerend vs waarschuwend)
│   ├── format.ts               # nl-BE formatters (EUR, m², datums)
│   ├── cn.ts                   # className helper (clsx + tailwind-merge)
│   └── __tests__/              # Vitest unit tests (27 testen)
├── store/quote-store.ts        # Zustand store + selectors
├── components/
│   ├── ui/                     # Button, Input, Field, Card, Toggle, RadioCard, …
│   ├── layout/                 # Header, Logo, ErrorBoundary
│   ├── customer/               # Klantgegevens form
│   ├── configurator/           # Always/MultipleChoice/Optional secties
│   ├── summary/                # Live overzicht: subtotalen, BTW, prijs/m²
│   ├── export/                 # Checklist panel + PDF-download
│   └── pdf/OfferDocument.tsx   # @react-pdf/renderer document
├── App.tsx
├── main.tsx
└── index.css                   # Tailwind v4 entrypoint + theme tokens
```

## Hoe de prijslogica werkt

Elke lijn (zie [`src/data/pricing.ts`](src/data/pricing.ts)) heeft een
`filter` met één van drie modes:

| Filter           | Wanneer actief                                                      |
| ---------------- | ------------------------------------------------------------------- |
| `always`         | Wanneer de verkoper een hoeveelheid > 0 invult                      |
| `multipleChoice` | Wanneer dit item gekozen is in zijn groep (één keuze per groep)     |
| `optional`       | Wanneer de bijhorende toggle aanstaat                               |

Dit laat toe om de prijslijst uit te breiden zonder code aan te raken — enkel
`pricing.ts` aanvullen met nieuwe items, groepen of flags.

## Prijsdata aanvullen

Op dit moment bevat de tool enkel de data uit de prijslijst-screenshot van
2026-05-26 (hellend dak — werfinstallatie & afbraak). Om uit te breiden:

1. Voeg items toe aan de relevante `subcategory` in
   [`src/data/pricing.ts`](src/data/pricing.ts).
2. Voor multiple-choice keuzes: voeg item toe aan een bestaande groep
   (`multipleChoiceGroups`) of maak een nieuwe groep aan.
3. Voor optionele werken: voeg item toe aan een bestaande `optionalFlag` of
   maak een nieuwe flag.

Items zonder bekende prijs blijven mogelijk: zet `unitPrice: null` en de tool
toont "prijs op aanvraag" met een waarschuwing in de checklist.

## Bedrijfsgegevens & branding

- Bedrijfsdata: [`src/config/company.ts`](src/config/company.ts)
- Brand colors: `#056d91` (primair) en `#b4cb02` (accent) — gedefinieerd als
  Tailwind theme tokens in [`src/index.css`](src/index.css).
- Logo: gestylede tekst (zoals op energylux.be) — geen externe afbeelding.

## "Niets vergeten" — checklist

[`src/lib/checklist.ts`](src/lib/checklist.ts) bevat alle regels. Een fout
(`error`) blokkeert PDF-export, een waarschuwing (`warning`) laat exporteren
toe maar wijst de verkoper op een aandachtspunt.

Voorbeelden:
- Klantnaam ontbreekt → error
- E-mail ongeldig → error
- Dakoppervlakte 0 → warning
- Verplichte multiple-choice niet gekozen → error
- Item geselecteerd zonder bekende prijs → warning

## Tests

```bash
npm test
```

Test files:
- `calculator.test.ts` — prijsberekening, subtotalen, korting, BTW
- `validation.test.ts` — prijs-per-m² classificatie, e-mail/postcode validatie

## State persistence

De volledige offerte-state wordt opgeslagen in `localStorage` onder
`energylux-offerte-v1`. Bij refresh blijft de huidige offerte bewaard. Een
"Nieuwe offerte" knop reset alles behalve de verkopernaam.

## PDF-output

De PDF wordt client-side gegenereerd via `@react-pdf/renderer`. De PDF-stack
is gecodesplitst zodat hij enkel laadt bij export — initial bundle blijft
~85kB gzipped.

PDF-inhoud:
- Energylux-branded header met offertenummer, datum, geldig-tot
- Klantgegevens (factuur + werfadres indien verschillend)
- Project-meta strip: dakopp., verkoper, referentie, BTW-tarief
- Werken gegroepeerd per subcategorie met tabel + subtotaal
- Totaalblok: subtotaal, korting, BTW, totaal incl.
- Beslissingskorting-vermelding indien actief
- Vrije notities
- Handtekeningvakken (klant + Energylux)
- Footer met bedrijfsgegevens op elke pagina

## Toekomstige uitbreidingen (suggesties)

- CloudSign-integratie voor digitale handtekening (na PDF-export)
- Volledige prijslijst aanvullen (plat dak, isolatie, dakbedekking, …)
- Materiaalkeuze met technische fiches als bijlage
- AI-review-agent zoals Louis voorstelde (na verzamelen van 20–50 referentie-offertes)
- Multi-user backend met klant-CRM
