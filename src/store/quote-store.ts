import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { pricingConfig } from '@/data/pricing'
import { addDaysIso, toIsoDate } from '@/lib/format'
import type {
  Customer,
  DiscountConfig,
  QuoteMeta,
  QuoteState,
} from '@/types/quote'

const STORAGE_KEY = 'energylux-offerte-v1'
const COUNTER_KEY = 'energylux-offerte-counter'
const QUOTE_VALIDITY_DAYS = 30
const DEFAULT_VAT_RATE = 0.06
const DEFAULT_DISCOUNT_PERCENTAGE = 5
const DEFAULT_DISCOUNT_DAYS = 7

/**
 * Genereert een nieuw offertenummer in formaat `EN-YYYY-MM-DD-NN` waarbij NN
 * de hoeveelste offerte van die dag is. De teller resetten zichzelf bij een
 * nieuwe kalenderdag en worden persistent bewaard in localStorage.
 */
export function generateQuoteNumber(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const isoDate = `${y}-${m}-${d}`

  let next = 1
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(COUNTER_KEY) : null
    if (raw) {
      const stored = JSON.parse(raw) as { date: string; count: number }
      if (stored.date === isoDate && Number.isFinite(stored.count)) {
        next = stored.count + 1
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COUNTER_KEY, JSON.stringify({ date: isoDate, count: next }))
    }
  } catch {
    // localStorage geblokkeerd → fallback op 01
  }

  return `EN-${isoDate}-${String(next).padStart(2, '0')}`
}

function defaultCustomer(): Customer {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    postalCode: '',
    city: '',
    projectAddress: '',
  }
}

/**
 * Maakt een lege meta-block. Het `number`-veld is bewust leeg: dat wordt pas
 * gegenereerd zodra de UI dit aanvraagt (zie `ensureNumber`) zodat een page
 * reload geen extra teller-increment veroorzaakt.
 */
function defaultMeta(): QuoteMeta {
  const today = new Date()
  const isoToday = toIsoDate(today)
  return {
    number: '',
    issueDate: isoToday,
    validUntilDate: addDaysIso(isoToday, QUOTE_VALIDITY_DAYS),
    salesperson: '',
    projectReference: '',
    roofAreaM2: 0,
  }
}

function defaultDiscount(): DiscountConfig {
  return {
    enabled: false,
    percentage: DEFAULT_DISCOUNT_PERCENTAGE,
    conditionDays: DEFAULT_DISCOUNT_DAYS,
  }
}

function emptyQuote(): QuoteState {
  return {
    meta: defaultMeta(),
    customer: defaultCustomer(),
    quantities: {},
    groupSelections: {},
    flags: {},
    discount: defaultDiscount(),
    vatRate: DEFAULT_VAT_RATE,
    notes: '',
  }
}

type QuoteActions = {
  setCustomerField: <K extends keyof Customer>(field: K, value: Customer[K]) => void
  setMetaField: <K extends keyof QuoteMeta>(field: K, value: QuoteMeta[K]) => void
  setQuantity: (itemId: string, quantity: number) => void
  selectMultipleChoice: (groupId: string, itemId: string | null) => void
  toggleFlag: (flagId: string, value: boolean) => void
  setDiscount: (partial: Partial<DiscountConfig>) => void
  setVatRate: (rate: number) => void
  setNotes: (value: string) => void
  resetQuote: () => void
  newQuote: () => void
  ensureNumber: () => void
}

export type QuoteStore = QuoteState & QuoteActions

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set) => ({
      ...emptyQuote(),

      setCustomerField: (field, value) =>
        set((state) => ({ customer: { ...state.customer, [field]: value } })),

      setMetaField: (field, value) =>
        set((state) => ({ meta: { ...state.meta, [field]: value } })),

      setQuantity: (itemId, quantity) =>
        set((state) => {
          const next = { ...state.quantities }
          if (quantity <= 0) {
            delete next[itemId]
          } else {
            next[itemId] = quantity
          }
          return { quantities: next }
        }),

      selectMultipleChoice: (groupId, itemId) =>
        set((state) => {
          const nextSelections = { ...state.groupSelections, [groupId]: itemId }
          const group = pricingConfig.multipleChoiceGroups.find((g) => g.id === groupId)

          // Wis de hoeveelheden van de ándere opties in deze groep, zodat een
          // oude keuze niet als "spookhoeveelheid" terugkomt bij heen-en-weer kiezen.
          const quantities = { ...state.quantities }
          if (group) {
            for (const otherId of group.itemIds) {
              if (otherId !== itemId) delete quantities[otherId]
            }
          }

          // Bij het aanvinken: standaard hoeveelheid 1 voor stuks-items,
          // m²/lm-items laten we leeg zodat de verkoper actief invult.
          if (itemId && group) {
            const item = pricingConfig.categories
              .flatMap((c) => c.subcategories.flatMap((s) => s.items))
              .find((i) => i.id === itemId)
            if (item && item.unit === 'stuk' && !quantities[itemId]) {
              quantities[itemId] = 1
            }
          }

          return { groupSelections: nextSelections, quantities }
        }),

      toggleFlag: (flagId, value) =>
        set((state) => ({ flags: { ...state.flags, [flagId]: value } })),

      setDiscount: (partial) =>
        set((state) => ({ discount: { ...state.discount, ...partial } })),

      setVatRate: (rate) => set({ vatRate: rate }),

      setNotes: (value) => set({ notes: value }),

      resetQuote: () =>
        set(() => {
          const empty = emptyQuote()
          return { ...empty, meta: { ...empty.meta, number: generateQuoteNumber() } }
        }),

      newQuote: () =>
        set((state) => {
          const empty = emptyQuote()
          return {
            ...empty,
            // Behoud verkopernaam voor gemak — die wisselt zelden binnen één sessie.
            meta: {
              ...empty.meta,
              number: generateQuoteNumber(),
              salesperson: state.meta.salesperson,
            },
          }
        }),

      ensureNumber: () =>
        set((state) =>
          state.meta.number
            ? state
            : { meta: { ...state.meta, number: generateQuoteNumber() } },
        ),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        meta: state.meta,
        customer: state.customer,
        quantities: state.quantities,
        groupSelections: state.groupSelections,
        flags: state.flags,
        discount: state.discount,
        vatRate: state.vatRate,
        notes: state.notes,
      }),
    },
  ),
)

/**
 * Selector die de volledige (serialiseerbare) quote-state teruggeeft.
 *
 * Belangrijk: combineer deze altijd met `useShallow` zodat er enkel een
 * re-render gebeurt als er werkelijk iets veranderd is — zonder shallow
 * compare maakt deze selector elke keer een nieuw object aan en raakt
 * Zustand in een oneindige update-loop.
 *
 *   const state = useQuoteStore(useShallow(selectQuoteState))
 */
export const selectQuoteState = (s: QuoteStore): QuoteState => ({
  meta: s.meta,
  customer: s.customer,
  quantities: s.quantities,
  groupSelections: s.groupSelections,
  flags: s.flags,
  discount: s.discount,
  vatRate: s.vatRate,
  notes: s.notes,
})
