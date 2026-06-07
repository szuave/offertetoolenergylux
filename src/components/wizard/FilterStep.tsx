import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { pricingConfig } from '@/data/pricing'
import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { itemFlagOverride, subcategoryFlag } from '@/data/filter-mappings'
import { cn } from '@/lib/cn'
import type { OptionalFlagDef } from '@/types/quote'

/**
 * Filters die we niet aan de verkoper tonen in stap 2.
 * - "bakgoten-en-hanggoten": Yasid wil bakgoten en hanggoten apart laten kiezen
 *   (mail v2). Items met deze tag verschijnen zodra één van beide aan staat.
 * - "dakpan-toebehoren": items verschijnen automatisch zodra de verkoper
 *   een dakpan-variant in de DakbekledingSelector kiest (Yasid Excel:
 *   "altijd bij keuze dakpan").
 * - "roofing" / "epdm": Daryl 4 juni — geen filter meer; verschijnt als
 *   radio-keuze in de Dakdichtingswerken-rubriek van plat dak.
 */
const HIDDEN_FLAGS = new Set(['bakgoten-en-hanggoten', 'dakpan-toebehoren', 'roofing', 'epdm'])

/**
 * Stap 2 — Filter opties.
 *
 * Bovenaan: het type werken (categorie). Daaronder verschijnen, per gekozen
 * type, de filters die specifiek bij die categorie horen. Verkoper ziet
 * dus enkel filters die effect hebben op zijn keuze — geen ruis.
 */
export function FilterStep() {
  const { categoryScope, flags, toggleCategoryScope, toggleFlag } = useQuoteStore(
    useShallow((s) => ({
      categoryScope: s.categoryScope,
      flags: s.flags,
      toggleCategoryScope: s.toggleCategoryScope,
      toggleFlag: s.toggleFlag,
    })),
  )

  const anyCategory = Object.values(categoryScope).some((v) => v === true)

  // Filters mappen op categorie (welke flags hebben items in die categorie).
  const flagsByCategory = useMemo(() => {
    const map: Record<string, OptionalFlagDef[]> = {}
    for (const cat of pricingConfig.categories) {
      const ids = new Set<string>()
      for (const sub of cat.subcategories) {
        const subFlag = subcategoryFlag(sub.id)
        if (subFlag) ids.add(subFlag)
        for (const item of sub.items) {
          if (item.filter.kind === 'optional') ids.add(item.filter.flagId)
          const override = itemFlagOverride(item.id)
          if (override) ids.add(override)
        }
      }
      map[cat.id] = pricingConfig.optionalFlags.filter(
        (f) => ids.has(f.id) && !HIDDEN_FLAGS.has(f.id),
      )
    }
    return map
  }, [])

  // Yasid mail v2: "Deze chronologie in excel volgen" — gebruik de Excel-
  // volgorde uit de catalog (hellend dak → gevelwerken → plat dak) i.p.v.
  // een hardcoded UI-volgorde.
  const orderedCategories = pricingConfig.categories

  return (
    <section className="space-y-4">
      <SectionHeading title="Filter opties" />

      <Card>
        <CardBody className="space-y-6">
          {/* Type werken. */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                Type werken
              </h3>
              <span className="text-xs text-ink-mid">— kies minstens één</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {orderedCategories.map((cat) => (
                <CheckboxTile
                  key={cat.id}
                  label={cat.label}
                  emphasis
                  checked={categoryScope[cat.id] === true}
                  onChange={(v) => toggleCategoryScope(cat.id, v)}
                />
              ))}
            </div>
          </div>

          {/* Filters per gekozen categorie — verschijnt onder type werken. */}
          {!anyCategory ? (
            <div className="text-xs text-ink-mid italic">
              — eerst type werken kiezen voor filters verschijnen
            </div>
          ) : (
            orderedCategories
              .filter((cat) => categoryScope[cat.id])
              .map((cat) => {
                const catFlags = flagsByCategory[cat.id] ?? []
                return (
                  <div key={cat.id} className="space-y-3 pt-2 border-t border-rule">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink uppercase tracking-wider">
                        Filters bij {cat.label}
                      </h3>
                    </div>
                    {catFlags.length === 0 ? (
                      <p className="text-xs text-ink-mid italic">
                        Geen sub-filters voor {cat.label} — alle werken in deze
                        categorie verschijnen automatisch in stap 3.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {catFlags.map((flag) => (
                          <CheckboxTile
                            key={flag.id}
                            label={flag.label}
                            description={flag.description}
                            checked={flags[flag.id] === true}
                            onChange={(v) => toggleFlag(flag.id, v)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </CardBody>
      </Card>
    </section>
  )
}

function CheckboxTile({
  label,
  description,
  checked,
  emphasis,
  disabled,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  emphasis?: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        emphasis ? 'min-h-12' : '',
        disabled
          ? 'border-rule bg-surface-muted/40 cursor-not-allowed opacity-50'
          : checked
            ? 'border-brand-primary bg-brand-primary/5 cursor-pointer'
            : emphasis
              ? 'border-rule bg-surface hover:border-brand-primary cursor-pointer'
              : 'border-rule bg-surface hover:border-ink cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'h-4 w-4 accent-brand-primary',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-sm leading-tight',
            disabled ? 'text-ink-muted' : 'text-ink',
            emphasis ? 'font-semibold' : 'font-medium',
          )}
        >
          {label}
        </div>
        {description && (
          <div className="text-xs text-ink-mid mt-0.5 leading-snug">{description}</div>
        )}
      </div>
    </label>
  )
}
