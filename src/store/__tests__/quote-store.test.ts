import { beforeEach, describe, expect, it } from 'vitest'
import { useQuoteStore } from '@/store/quote-store'

function reset() {
  useQuoteStore.getState().resetQuote()
}

describe('quote-store — selectMultipleChoice', () => {
  beforeEach(reset)

  it('wist de hoeveelheid van de vorige keuze bij wisselen binnen de groep', () => {
    const s = useQuoteStore.getState()
    // Kies dakpannen en geef hoeveelheid
    s.selectMultipleChoice('verwijderen-dakbekleding', 'verwijderen-dakpannen')
    s.setQuantity('verwijderen-dakpannen', 80)
    expect(useQuoteStore.getState().quantities['verwijderen-dakpannen']).toBe(80)

    // Wissel naar asbest → oude dakpannen-hoeveelheid moet weg zijn
    useQuoteStore.getState().selectMultipleChoice('verwijderen-dakbekleding', 'verwijderen-asbest')
    const q = useQuoteStore.getState().quantities
    expect(q['verwijderen-dakpannen']).toBeUndefined()
    expect(useQuoteStore.getState().groupSelections['verwijderen-dakbekleding']).toBe(
      'verwijderen-asbest',
    )
  })

  it('zet standaard hoeveelheid 1 voor een stuk-keuze', () => {
    useQuoteStore.getState().selectMultipleChoice('afvoeren-afval', 'afvoeren-werfpuin')
    expect(useQuoteStore.getState().quantities['afvoeren-werfpuin']).toBe(1)
  })
})

describe('quote-store — setQuantity', () => {
  beforeEach(reset)

  it('verwijdert de sleutel bij hoeveelheid 0', () => {
    const s = useQuoteStore.getState()
    s.setQuantity('verwijderen-dakpannen', 10)
    expect(useQuoteStore.getState().quantities['verwijderen-dakpannen']).toBe(10)
    useQuoteStore.getState().setQuantity('verwijderen-dakpannen', 0)
    expect(useQuoteStore.getState().quantities['verwijderen-dakpannen']).toBeUndefined()
  })
})

describe('quote-store — ensureNumber', () => {
  beforeEach(reset)

  it('genereert een nummer als het leeg is en behoudt het daarna', () => {
    // resetQuote genereert al een nummer; leeg eerst expliciet
    useQuoteStore.setState({ meta: { ...useQuoteStore.getState().meta, number: '' } })
    useQuoteStore.getState().ensureNumber()
    const first = useQuoteStore.getState().meta.number
    expect(first).toMatch(/^EN-\d{4}-\d{2}-\d{2}-\d{2}$/)
    // tweede keer mag niet wijzigen
    useQuoteStore.getState().ensureNumber()
    expect(useQuoteStore.getState().meta.number).toBe(first)
  })
})
