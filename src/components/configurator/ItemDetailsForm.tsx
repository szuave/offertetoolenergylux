import { useQuoteStore } from '@/store/quote-store'
import { getDetailFields, type DetailField } from '@/data/item-details'
import { cn } from '@/lib/cn'

/**
 * Inline sub-opties-formulier voor één lijnitem (RAL, merk, dimensie,
 * conditionele combo's). Verschijnt enkel als het item een spec heeft
 * én er een hoeveelheid > 0 is.
 */
export function ItemDetailsForm({ itemId }: { itemId: string }) {
  const fields = getDetailFields(itemId)
  const details = useQuoteStore((s) => s.details[itemId]) ?? {}
  const setItemDetail = useQuoteStore((s) => s.setItemDetail)

  if (!fields) return null

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {fields.map((field) => (
        <Field
          key={field.key}
          field={field}
          values={details}
          onChange={(key, val) => setItemDetail(itemId, key, val)}
          idPrefix={`detail-${itemId}`}
        />
      ))}
    </div>
  )
}

function Field({
  field,
  values,
  onChange,
  idPrefix,
}: {
  field: DetailField
  values: Readonly<Record<string, string>>
  onChange: (key: string, value: string) => void
  idPrefix: string
}) {
  const value = values[field.key] ?? ''
  const id = `${idPrefix}-${field.key}`

  if (field.kind === 'text') {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs text-ink-mid">
          {field.label}
        </label>
        <input
          id={id}
          type="text"
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full h-9 rounded-md border border-rule bg-surface px-2 text-sm text-ink placeholder:text-ink-muted"
        />
      </div>
    )
  }

  if (field.kind === 'conditional-select') {
    const parentValue = values[field.dependsOn]
    const options = parentValue ? (field.optionsByValue[parentValue] ?? []) : []
    const disabled = options.length === 0

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-xs text-ink-mid">
          {field.label}
        </label>
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={cn(
            'w-full h-9 rounded-md border bg-surface px-2 text-sm border-rule',
            disabled ? 'opacity-50 cursor-not-allowed text-ink-muted' : 'text-ink',
          )}
        >
          <option value="">{disabled ? `— kies eerst ${field.dependsOn} —` : '— kies —'}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Standaard select.
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs text-ink-mid">
        {field.label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        className={cn(
          'w-full h-9 rounded-md border bg-surface px-2 text-sm border-rule',
          value ? 'text-ink' : 'text-ink-muted',
        )}
      >
        <option value="">— kies —</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
