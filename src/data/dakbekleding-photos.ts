/**
 * Mapping van dakbekleding-variant-ID → foto-URL (uit /public/dakbekleding/).
 *
 * Foto's komen uit het Word-document "foto's dakpannen leien sandwichpanelen.docx"
 * van Yasid. Niet elke variant in de catalogus heeft een foto (Stormpan 993,
 * Monier Postel 20, Edilians HP10, Terreal CFPV, Cupa Pizarra, Samaca, …)
 * — die varianten tonen een placeholder tot we extra beelden krijgen.
 */
export const VARIANT_PHOTOS: Readonly<Record<string, string>> = {
  // Koramic — Stormpan Pottelberg 44
  'koramic-dakpan-stormpan-pottelberg-44-natuurrood': '/dakbekleding/koramic-stormpan-44-natuurrood.png',
  'koramic-dakpan-stormpan-pottelberg-44-rustiek': '/dakbekleding/koramic-stormpan-44-rustiek.jpg',
  'koramic-dakpan-stormpan-pottelberg-44-zwart-geglazuurd': '/dakbekleding/koramic-stormpan-44-zwart-geglazuurd.jpg',
  'koramic-dakpan-stormpan-pottelberg-44-leikleur-mat-geglazuur': '/dakbekleding/koramic-stormpan-44-leikleur-mat-geglazuur.jpg',
  'koramic-dakpan-stormpan-pottelberg-44-antraciet': '/dakbekleding/koramic-stormpan-44-antraciet.jpg',
  'koramic-dakpan-stormpan-pottelberg-44-oud-latem-rood': '/dakbekleding/koramic-stormpan-44-oud-latem-rood.jpeg',
  'koramic-dakpan-stormpan-pottelberg-44-blauw-gesmoord': '/dakbekleding/koramic-stormpan-44-blauw-gesmoord.jpeg',
  'koramic-dakpan-stormpan-pottelberg-44-oud-latem-blauw-gesmoo': '/dakbekleding/koramic-stormpan-44-oud-latem-blauw-gesmoo.jpeg',

  // Koramic — Actua 10 LT
  'koramic-dakpan-koramic-actua-10-lt-antraciet-mat-703': '/dakbekleding/actua-10-lt-antraciet-mat.jpeg',
  'koramic-dakpan-koramic-actua-10-lt-titaanzwart': '/dakbekleding/actua-10-lt-titaanzwart.jpeg',
  'koramic-dakpan-koramic-actua-10-lt-titaangrijs': '/dakbekleding/actua-10-lt-titaangrijs.jpg',

  // Koramic — Datura
  'koramic-dakpan-datura-natuurrood-652': '/dakbekleding/datura-natuurrood.png',
  'koramic-dakpan-datura-rustiek-872': '/dakbekleding/datura-rustiek.jpg',
  'koramic-dakpan-datura-antraciet-mat-703': '/dakbekleding/datura-antraciet-mat.png',
  'koramic-dakpan-datura-mat-zwart-geglazuurd-744': '/dakbekleding/datura-mat-zwart-geglazuurd.png',

  // Koramic — Stormpan Pottelberg 993 (toegevoegd na docx-update)
  'koramic-dakpan-stormpan-pottelberg-993-natuurrood': '/dakbekleding/koramic-stormpan-993-natuurrood.jpg',
  'koramic-dakpan-stormpan-pottelberg-993-rustiek': '/dakbekleding/koramic-stormpan-993-rustiek.jpg',
  'koramic-dakpan-stormpan-pottelberg-993-antraciet': '/dakbekleding/koramic-stormpan-993-antraciet.png',

  // Koramic — Vario 18
  'koramic-dakpan-vario-18-mat-zwart-741': '/dakbekleding/vario-18-mat-zwart.jpeg',
  'koramic-dakpan-vario-18-natuurrood': '/dakbekleding/vario-18-natuurrood.jpg',

  // Koramic — Oud Latem 451
  'koramic-dakpan-oud-latem-451-rood-600': '/dakbekleding/oud-latem-451-rood-600.png',
  'koramic-dakpan-oud-latem-451-blauw-gesmoord-714': '/dakbekleding/oud-latem-451-blauw-gesmoord-714.png',
  'koramic-dakpan-oud-latem-451-rustiek-872': '/dakbekleding/oud-latem-451-rustiek-872.png',
  'koramic-dakpan-oud-latem-451-vieilli-rood-878': '/dakbekleding/oud-latem-451-vieilli-rood-878.png',

  // Leien
  'lei-cedral-tecta-smooth-rechthoekig-40x24-cm-donkergrijs': '/dakbekleding/cedral-tecta-smooth.jpeg',
  'lei-cedral-tecta-texture-rechthoekig-60x32-cm-donkergrijs': '/dakbekleding/cedral-tecta-texture.jpg',

  // Sandwichpanelen
  'sandwich-joris-ide-10-cm-pir-antraciet': '/dakbekleding/ji-roof-1000.jpeg',
  'sandwich-joris-ide-permapan-10cm-pir-rood': '/dakbekleding/joris-ide-permapan.png',
  'sandwich-ecopanelen-antraciet': '/dakbekleding/ecopanelen.jpg',
}

export function getVariantPhoto(variantId: string): string | null {
  return VARIANT_PHOTOS[variantId] ?? null
}
