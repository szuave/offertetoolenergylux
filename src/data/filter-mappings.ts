/**
 * Mapping van subcategorieën en specifieke items naar een filteroptie-flag.
 *
 * In de prijslijst-Excel kreeg elk item een "Filteroptie"-kolom. Items van type
 * `always` worden hierdoor alsnog conditioneel: als de bijhorende filter uit
 * staat, verschijnt het item niet — in geen enkele rubriek.
 *
 * Conform Yasid's mail (4): "als er geen filteroptie is aangeduid rond
 * dakgoten moeten we ook geen enkel vraag krijgen bij werfinstallatie of
 * eender welke rubriek".
 */

/** Hele subcategorie verbergen als deze flag uit staat. */
export const SUBCATEGORY_FLAG: Readonly<Record<string, string>> = {
  'isolatiewerken-sarking': 'sarking',
  'isolatiewerken-binnenkant': 'isolatie-warme-dakzijde',
}

/**
 * Specifieke `always`-items die in werkelijkheid onder een filter vallen
 * (de Excel-kolom "Filteroptie" zegt iets anders dan wat de parser eruit
 * haalt — typisch losse items binnen een algemene subcategorie).
 */
export const ITEM_FLAG_OVERRIDE: Readonly<Record<string, string>> = {
  // Gyproc-werken rond zolder vallen onder hun eigen filter, niet onder
  // "isolatie binnenkant" als geheel.
  'gyprocwerken-schildersklaar': 'gyproc-zolder',
  'levering-isolatiematerialen-zolderluik': 'gyproc-zolder',
}

export function subcategoryFlag(subcategoryId: string): string | null {
  return SUBCATEGORY_FLAG[subcategoryId] ?? null
}

export function itemFlagOverride(itemId: string): string | null {
  return ITEM_FLAG_OVERRIDE[itemId] ?? null
}
