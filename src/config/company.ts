/**
 * Energylux bedrijfsgegevens + offerte-content.
 * Bron: energylux.be + voorbeeld-offerte (mei 2024).
 */
export const company = {
  name: 'Energylux',
  legalName: 'Energylux BV',
  tagline: 'Voor een écht energiezuinige woning!',
  vat: 'BE 0743.746.807',
  phone: '0800 24 007',
  mobile: '0479 43 88 36',
  email: 'info@energylux.be',
  website: 'www.energylux.be',
  warrantyYears: 12,
  satisfaction: '93,17',
  addresses: [
    { line1: 'Ikaroslaan 1', line2: '1930 Zaventem' },
    { line1: 'Frankrijklei 5', line2: '2000 Antwerpen' },
  ],
  services: ['Dakwerken', 'Zonnepanelen', 'Gevelwerken', 'Warmtepomp', 'Thuisbatterij'],
  advisor: {
    name: 'Frederik Wittenberg',
    role: 'Renovatie-adviseur',
    email: 'frederik.wittenberg@energylux.be',
    mobile: '0479 43 88 36',
  },
  premieUrl: 'www.mijnverbouwpremie.be',
} as const

export const introParagraphs: string[] = [
  'ENERGYLUX is een bedrijf dat gespecialiseerd is in het bouwen of renoveren en/of isoleren van daken, isoleren van gevels/buitenmuren en Rescert-gecertificeerd installateur van zonnepanelen.',
  'Als lid van Buildwise (voordien het WTCB, het Wetenschappelijk en Technisch Centrum voor het Bouwbedrijf) & van Embuild laten wij ons graag gidsen naar een hoogstaande kwalitatieve uitvoering, door op de voet de laatste ontwikkelingen in de bouwsector te volgen.',
  'Voor de opmaak van uw offerte hebben wij enkel gekozen voor A-materialen. Werken met materialen van hoogstaande kwaliteit maakt dat wij u een wettelijke garantie kunnen bieden van maar liefst 12 jaar.',
  'Voor een combinatie van energiezuinige maatregelen zoals isolatiewerken, zonnepanelen, etc. heeft u vaak ook recht op een subsidie/premie. Voor meer info kan u surfen naar mijnverbouwpremie.be of naar onze website om een premie te simuleren.',
  'Aangaande uw beoogde uitvoeringstermijn kunnen wij, bij een billijke tijd van goedkeuring, hier perfect aan voldoen.',
]

export const testimonials: { quote: string; highlight?: string }[] = [
  { quote: 'We hebben ons dak laten doen door Energylux en zijn echt supertevreden! Dank jullie wel!' },
  {
    quote:
      'Heel vriendelijke en correcte samenwerking. Zowel ons dak als gevel door dit bedrijf laten doen. Wij raden Energylux echt aan iedereen aan.',
  },
  {
    quote:
      'De vriendelijkheid en precisie waarmee deze dakwerkers aan de slag zijn gegaan is ongezien! Topkwaliteit & topservice!',
  },
  {
    quote:
      'Nog nooit gezien in de bouwsector: altijd vriendelijk, niets is teveel en natuurlijk een heel professioneel vakmansdak aan een correcte prijs.',
  },
  {
    quote:
      'Bedankt voor de gevelwerken. Superblij! Kom nog maar eens vlaai eten als jullie in de buurt zijn!',
  },
]

export const agreementPoints: string[] = [
  'Tijdstip van uitvoering van de overeengekomen werken wordt samen met de klant bepaald.',
  'Vergunningen worden steeds door de klant aangevraagd — wij kunnen u daarin ondersteunen indien gewenst.',
  'Verborgen asbest kan tijdens de werken naar boven komen. In dat geval zijn bijkomende acties ter veiligheid exclusief offerte.',
  'Gyprocafwerking velux is, tenzij vermeld in de offerte, niet automatisch opgenomen.',
  'Een bestaande zonneboiler dient door een erkende installateur ontkoppeld en geledigd te worden.',
  'Rookgasafvoer kan op het dak geplaatst worden; de verbinding met de ketel en de keuring gebeuren door een erkende loodgieter.',
  'Na betaling van de slotfactuur ontvangt de klant binnen de 14 dagen de nodige subsidie-attesten.',
]

export type TermArticle = { title: string; body: string }

export const termArticles: TermArticle[] = [
  {
    title: '1. Geldigheidsduur van de offertes',
    body: 'Tenzij anders bepaald zijn onze offertes slechts geldig tijdens een periode van 21 kalenderdagen. Wij zijn enkel gehouden door onze offertes indien de aanvaarding door de cliënt ons binnen deze termijn bereikt. Wijzigingen aangebracht aan onze offertes zijn slechts geldig indien zij door ons schriftelijk werden aanvaard.',
  },
  {
    title: '2. Betaling',
    body: 'De prijs van de aanneming wordt gefactureerd in schijven: geen voorschot na ondertekening, eerste schijf (40%) na mededeling planningsdatum dakwerken, tweede schijf (40%) na de dakisolatie of plaatsing onderdak, derde schijf na oplevering. Facturen worden betaald binnen 15 dagen na verzending. Bij laattijdige betaling geldt van rechtswege een verwijlintrest van 10% per jaar en een forfaitaire schadevergoeding van 10% (minimum € 250).',
  },
  {
    title: '3. Prijsherziening',
    body: 'Elke wijziging van de lonen, sociale lasten, materiaalprijzen of transport leidt tot een prijsherziening volgens de formule p = P × (0,40 × s + 0,40 × i + 0,20), waarbij de parameters bepaald worden conform de gegevens van het Paritair Comité voor het Bouwbedrijf en de Commissie van de Prijslijst der Bouwmaterialen.',
  },
  {
    title: '4. Veiligheidscoördinatie',
    body: 'Behoudens andersluidende vermelding zijn de veiligheidsmaatregelen die de veiligheidscoördinator oplegt en die niet bekend zijn op het moment van de offerte, niet begrepen in de offerteprijs.',
  },
  {
    title: '5. Beëindiging na betaling voorschot',
    body: 'Wij hebben het recht om binnen zes weken na betaling van het voorschot een (nieuwe) controle van de werf uit te voeren en de overeenkomst binnen vier weken na die controle eenzijdig te beëindigen, zonder vergoeding. Het betaalde voorschot wordt binnen 10 dagen teruggestort.',
  },
  {
    title: '6. Werkdagen en uitvoeringstermijn',
    body: 'Uitvoeringstermijnen worden in werkdagen vastgelegd. Zaterdagen, zon- en feestdagen, vakantiedagen en dagen met weersomstandigheden die het werk minstens vier uur onmogelijk maken, tellen niet mee. Een startdatum kan in samenspraak met de klant verlaat of vervroegd worden.',
  },
  {
    title: '7. Verbreking',
    body: 'Indien de opdrachtgever geheel of gedeeltelijk afziet van de werken, is deze conform art. 1794 BW gehouden ons schadeloos te stellen, forfaitair begroot op 20% van de niet uitgevoerde werken, onverminderd ons recht om hogere werkelijke schade aan te tonen.',
  },
  {
    title: '8. Uitvoering',
    body: 'De gebruikte materialen zijn zoals beschreven in de offerte of gelijkwaardig. Wij verbinden ons niet aan een merk of type tenzij dit uitdrukkelijk vermeld staat. Esthetische afwijkingen van subjectieve aard kunnen de oplevering niet weigeren. Energylux werkt samen met geselecteerde bouwpartners onder haar supervisie.',
  },
  {
    title: '9. Oplevering',
    body: 'Na beëindiging gaat de opdrachtgever over tot oplevering via ondertekening van een opleveringsdocument. Kleine onvolkomenheden (< 10% van de aannemingssom) kunnen de oplevering niet weigeren. Bij nalatigheid om deel te nemen geldt de oplevering als verkregen na 15 dagen. De opleveringsdatum bepaalt het vertrekpunt van de tienjarige aansprakelijkheid.',
  },
  {
    title: '10. Lichte verborgen gebreken',
    body: 'Gedurende twee jaar na voorlopige oplevering is de aannemer aansprakelijk voor lichte verborgen gebreken. Het gebrek moet binnen 2 maanden na ontdekking worden aangeklaagd; elke rechtsvordering is ontvankelijk binnen één jaar na kennisname.',
  },
  {
    title: '11. Onvoorziene omstandigheden',
    body: 'Bij onvoorziene omstandigheden tijdens controle of uitvoering hebben wij het recht de voorwaarden (inclusief prijs en uitvoeringstermijn) te herzien. De opdrachtgever wordt hiervan in kennis gesteld.',
  },
  {
    title: '12. Overdracht van risico’s',
    body: 'De overdracht van risico’s (art. 1788-1789 BW) vindt plaats naarmate de uitvoering van de werken of de levering van de materialen vordert.',
  },
  {
    title: '13. Eigendomsvoorbehoud',
    body: 'Geleverde materialen blijven onze eigendom tot volledige betaling, ook na incorporatie. De aannemer mag de materialen losmaken en terugnemen tot alle schulden voldaan zijn.',
  },
  {
    title: '14. Geschillen',
    body: 'Bij geschil zijn enkel de rechtbanken van de zetel van de aannemer bevoegd. Technische geschillen kunnen voorgelegd worden aan de Verzoeningscommissie Bouw (Hoogstraat 139, 1000 Brussel — www.bouwverzoening.be).',
  },
]

export const brandColors = {
  primary: '#056d91',
  primaryDark: '#044d68',
  primaryLight: '#2a8db3',
  accent: '#b4cb02',
  accentDark: '#7a8a01',
  teal: '#6bb6ab',
  tealLight: '#9ed2cb',
  magenta: '#d6336c',
  ink: '#1f3540',
  inkSoft: '#4a6573',
  inkMuted: '#8094a0',
  rule: '#dde6ea',
  rowAlt: '#e8f2f7',
  headerText: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f4f7f9',
  check: '#7ab51d',
} as const
