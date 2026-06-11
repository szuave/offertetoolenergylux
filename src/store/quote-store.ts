import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { pricingConfig } from '@/data/pricing'
import { addDaysIso, toIsoDate } from '@/lib/format'
import type {
  CoverChoice,
  Customer,
  DiscountConfig,
  ItemDetails,
  QuoteMeta,
  QuoteState,
  WizardStep,
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
    categoryScope: {},
    cover: { variantId: null, areaM2: 0 },
    veluxKeuze: {
      maat: null,
      basisCode: null,
      gootstukCode: null,
      verduisterCode: null,
      zonneGordijnCode: null,
      buitenZonCode: null,
      rolluikCode: null,
    },
    details: {},
    supplements: {},
    checklistAnswers: {},
    discount: defaultDiscount(),
    vatRate: DEFAULT_VAT_RATE,
    notes: '',
  }
}

type UiState = {
  /** Huidige stap in de wizard-flow. */
  wizardStep: WizardStep
}

type QuoteActions = {
  setCustomerField: <K extends keyof Customer>(field: K, value: Customer[K]) => void
  setMetaField: <K extends keyof QuoteMeta>(field: K, value: QuoteMeta[K]) => void
  setQuantity: (itemId: string, quantity: number) => void
  selectMultipleChoice: (groupId: string, itemId: string | null) => void
  toggleFlag: (flagId: string, value: boolean) => void
  toggleCategoryScope: (categoryId: string, value: boolean) => void
  setCover: (partial: Partial<CoverChoice>) => void
  setVeluxKeuze: (partial: Partial<QuoteState['veluxKeuze']>) => void
  setItemDetail: (itemId: string, key: string, value: string) => void
  toggleSupplement: (id: string, value: boolean) => void
  setChecklistAnswer: (
    checklistId: string,
    itemId: string,
    answer: { checked?: boolean; amount?: number; text?: string; answer?: 'ja' | 'nee' },
  ) => void
  setDiscount: (partial: Partial<DiscountConfig>) => void
  setVatRate: (rate: number) => void
  setNotes: (value: string) => void
  resetQuote: () => void
  newQuote: () => void
  ensureNumber: () => void
  setWizardStep: (step: WizardStep) => void
}

export type QuoteStore = QuoteState & UiState & QuoteActions

export const WIZARD_ORDER: WizardStep[] = ['customer', 'filter', 'works']

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set) => ({
      ...emptyQuote(),
      wizardStep: 'customer',

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

      toggleCategoryScope: (categoryId, value) =>
        set((state) => ({ categoryScope: { ...state.categoryScope, [categoryId]: value } })),

      setCover: (partial) =>
        set((state) => ({ cover: { ...state.cover, ...partial } })),

      setVeluxKeuze: (partial) =>
        set((state) => ({ veluxKeuze: { ...state.veluxKeuze, ...partial } })),

      setItemDetail: (itemId, key, value) =>
        set((state) => {
          const current: ItemDetails = state.details[itemId] ?? {}
          const next: ItemDetails = { ...current }
          if (value === '') delete next[key]
          else next[key] = value
          const nextMap = { ...state.details }
          if (Object.keys(next).length === 0) delete nextMap[itemId]
          else nextMap[itemId] = next
          return { details: nextMap }
        }),

      toggleSupplement: (id, value) =>
        set((state) => ({ supplements: { ...state.supplements, [id]: value } })),

      setChecklistAnswer: (checklistId, itemId, answer) =>
        set((state) => {
          const current = state.checklistAnswers ?? {}
          const checklist = current[checklistId] ?? {}
          const prev = checklist[itemId] ?? {}
          const next = { ...prev, ...answer }
          // Verwijder een lege answer-entry om de state schoon te houden.
          // 'answer' (ja/nee voor required items) telt ook als ingevuld.
          const isEmpty =
            (next.checked === undefined || next.checked === false) &&
            (next.amount === undefined || next.amount === 0) &&
            (next.text === undefined || next.text === '') &&
            next.answer === undefined
          const nextChecklist = { ...checklist }
          if (isEmpty) delete nextChecklist[itemId]
          else nextChecklist[itemId] = next
          return {
            checklistAnswers: { ...current, [checklistId]: nextChecklist },
          }
        }),

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

      setWizardStep: (step) => set({ wizardStep: step }),
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
        categoryScope: state.categoryScope,
        cover: state.cover,
        veluxKeuze: state.veluxKeuze,
        details: state.details,
        supplements: state.supplements,
        checklistAnswers: state.checklistAnswers,
        discount: state.discount,
        vatRate: state.vatRate,
        notes: state.notes,
        wizardStep: state.wizardStep,
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
  categoryScope: s.categoryScope,
  cover: s.cover,
  veluxKeuze: s.veluxKeuze,
  details: s.details,
  supplements: s.supplements,
  checklistAnswers: s.checklistAnswers,
  discount: s.discount,
  vatRate: s.vatRate,
  notes: s.notes,
})
