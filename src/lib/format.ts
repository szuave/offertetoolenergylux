import type { Unit } from '@/types/quote'

const eurFormatter = new Intl.NumberFormat('nl-BE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('nl-BE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('nl-BE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

export function formatEuro(value: number): string {
  return eurFormatter.format(value)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatUnit(unit: Unit): string {
  switch (unit) {
    case 'stuk':
      return 'stuk'
    case 'm2':
      return 'm²'
    case 'lm':
      return 'lm'
  }
}

export function formatQuantityWithUnit(quantity: number, unit: Unit): string {
  return `${formatNumber(quantity)} ${formatUnit(unit)}`
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return dateFormatter.format(date)
}

export function toIsoDate(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}
