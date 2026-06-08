/**
 * Daryl 4 juni: items die ALTIJD zichtbaar moeten zijn als de bijhorende
 * top-categorie in scope is — ongeacht welke filters de verkoper aanvinkt.
 *
 * Citaat: "Filter optie Hellend dak ZONDER ANDERE OPTIES DIENT ONDERSTAANDE
 *          ER SOWIESO TE ZIJN!"
 */

/**
 * Stelling-items die ook bij plat dak verschijnen wanneer hellend dak
 * NIET in scope is (Daryl: "STELLING DUS OOK ALTIJD WANT ALS ER GEEN
 * HELLEND DAK DAN MOETEN WE WEL DE OPTIE KRIJGEN").
 */
export const STELLING_ITEM_IDS: readonly string[] = [
  'stelling-valbeveiliging-voorgevel',
  'stelling-valbeveiliging-achtergevel',
  'stelling-valbeveiliging-zijkant-links',
  'stelling-valbeveiliging-zijkant-rechts',
]

/** Item-IDs die altijd zichtbaar zijn binnen één scope (= categorie-id). */
export const ALWAYS_VISIBLE_ITEMS: Readonly<Record<string, ReadonlySet<string>>> = {
  'hellend-dak': new Set([
    // Werfinstallatie / Afbraak
    ...STELLING_ITEM_IDS,
    'afvoeren-werfpuin',
    'afvoeren-werfpuin-toxisch-afval',
    // Ambachtelijk Timmerwerk
    'panlatten-op-panafstand-hechten-op-het-onderdak',
    'esthetische-afwerking-hellende-dakrand-zijkant-m',
    // Dakdichtingswerken
    'onderdak',
    'nokpan',
    'gevelpan',
    'noordbomen',
  ]),
  // Daryl 4 juni: stelling-items moeten ook bij plat dak verschijnen
  // (afgehandeld via cross-category render in ConfiguratorPanel).
  'plat-dak': new Set([...STELLING_ITEM_IDS]),
}

/** MultipleChoice group-IDs die altijd zichtbaar zijn binnen één scope. */
export const ALWAYS_VISIBLE_GROUPS: Readonly<Record<string, ReadonlySet<string>>> = {
  'hellend-dak': new Set([
    'verwijderen-dakbekleding', // dakpannen/asbestleien/asbestonderdak/sandwich/singles
    'loodafwerking', // lood muur of buren
  ]),
}

export function isItemAlwaysVisible(itemId: string, categoryId: string): boolean {
  return ALWAYS_VISIBLE_ITEMS[categoryId]?.has(itemId) ?? false
}

export function isGroupAlwaysVisible(groupId: string, categoryId: string): boolean {
  return ALWAYS_VISIBLE_GROUPS[categoryId]?.has(groupId) ?? false
}
