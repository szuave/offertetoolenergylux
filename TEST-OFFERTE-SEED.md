# Test-offerte invullen

Open http://localhost:5173, druk **F12**, ga naar tabblad **Console**,
plak onderstaand blok en druk Enter. De pagina laadt opnieuw met een
volledig ingevulde offerte van Jan Janssens.

```js
localStorage.setItem('energylux-offerte-v1', JSON.stringify({
  state: {
    meta: {
      number: 'OFF-20260527-DEMO',
      issueDate: '2026-05-27',
      validUntilDate: '2026-06-26',
      salesperson: 'Tom Peeters',
      projectReference: 'JANSSENS-HD-2026',
      roofAreaM2: 120,
    },
    customer: {
      firstName: 'Jan',
      lastName: 'Janssens',
      email: 'jan.janssens@example.be',
      phone: '0470 12 34 56',
      street: 'Kerkstraat 12',
      postalCode: '3000',
      city: 'Leuven',
      projectAddress: 'Hoge Wei 45, 3001 Heverlee',
    },
    quantities: {
      'stelling-voorgevel': 1,
      'stelling-achtergevel': 1,
      'stelling-zijkant-links': 28,
      'stelling-zijkant-rechts': 28,
      'afvoeren-werfafval-toxisch': 1,
      'verwijderen-asbest': 120,
      'verwijderen-oversteken': 18,
      'verwijderen-nokbalk': 12,
      'verwijderen-houtconstructie': 8,
    },
    groupSelections: {
      'afvoeren-afval': 'afvoeren-werfafval-toxisch',
      'verwijderen-dakbekleding': 'verwijderen-asbest',
    },
    flags: { oversteken: true, houtconstructie: true, sidings: false },
    discount: { enabled: true, percentage: 5, conditionDays: 7 },
    vatRate: 0.06,
    notes: 'Werf bereikbaar via achterzijde, parking op straat. Carport aanwezig — stelling moet eromheen. Asbestattest aanwezig.',
  },
  version: 1,
}));
location.reload();
```

## Verwachte uitkomst

Onderdeel | Berekening | Bedrag
---|---|---
Stelling voorgevel | 1 × €1 | €1,00
Stelling achtergevel | 1 × €1 | €1,00
Stelling zijkant links | 28 × €1 | €28,00
Stelling zijkant rechts | 28 × €1 | €28,00
Werfafval + toxisch | 1 × €649 | €649,00
Verwijderen asbest | 120 × €45 | €5.400,00
Oversteken | 18 × €21 | €378,00
Nokbalk | 12 × €130 | €1.560,00
Houtconstructie | 8 × €130 | €1.040,00

**Subtotaal**: €9.085,00
**Korting 5%**: −€454,25
**Totaal excl. BTW**: €8.630,75
**BTW 6%**: €517,85
**Totaal incl. BTW**: **€9.148,60**

**Prijs per m²** (op 120 m²): ~€76 → **rood** (onder marktwaarde, want afbraak-alleen — dat is correct).

## Resetten

```js
localStorage.removeItem('energylux-offerte-v1');
location.reload();
```
