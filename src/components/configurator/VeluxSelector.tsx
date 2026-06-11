import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Trash2 } from 'lucide-react'
import { useQuoteStore } from '@/store/quote-store'
import {
  veluxMaten,
  findMaat,
  veluxConfigUnitPrice,
  veluxConfigHasMissingPrice,
  type VeluxConfig,
} from '@/data/velux'
import { Field } from '@/components/ui/Field'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { formatEuro } from '@/lib/format'
import { cn } from '@/lib/cn'

type Props = {
  configId: string
  index: number
}

/**
 * Eén Velux-configuratie binnen de multi-Velux lijst: dropdowns voor
 * maat / basis / gootstuk / 4 accessoires + aantal + verwijder-knop.
 * "Geen prijs" verschijnt onder de keuze als een gekozen onderdeel nog
 * geen prijs in de catalogus heeft.
 */
export function VeluxSelector({ configId, index }: Props) {
  const { config, updateVeluxConfig, removeVeluxConfig } = useQuoteStore(
    useShallow((s) => ({
      config: s.veluxConfigs.find((c) => c.id === configId),
      updateVeluxConfig: s.updateVeluxConfig,
      removeVeluxConfig: s.removeVeluxConfig,
    })),
  )

  const maat = useMemo(() => (config?.maat ? findMaat(config.maat) : null), [config?.maat])
  const unitPrice = useMemo(() => (config ? veluxConfigUnitPrice(config) : 0), [config])
  const missingPrice = useMemo(
    () => (config ? veluxConfigHasMissingPrice(config) : false),
    [config],
  )

  if (!config) return null

  function update(partial: Partial<VeluxConfig>) {
    updateVeluxConfig(configId, partial)
  }

  function priceLabel(prijs: number | null): string {
    return prijs === null ? '(geen prijs)' : formatEuro(prijs)
  }

  return (
    <div className="rounded-lg border border-rule bg-surface p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-ink">
          Velux #{index + 1}
          {config.maat && config.basisCode && (
            <span className="ml-2 text-xs font-normal text-ink-mid">
              · {config.maat} · {maat?.basis.find((b) => b.code === config.basisCode)?.type}{' '}
              {config.basisCode}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => removeVeluxConfig(configId)}
          className="inline-flex items-center gap-1 text-xs text-error hover:text-error-strong"
          aria-label="Velux verwijderen"
        >
          <Trash2 size={14} /> Verwijderen
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Aantal" htmlFor={`velux-aantal-${configId}`} required>
          <QuantityInput
            id={`velux-aantal-${configId}`}
            value={config.aantal}
            onChange={(n) => update({ aantal: n })}
            unit="stuk"
          />
        </Field>

        <Field label="Maat" htmlFor={`velux-maat-${configId}`} required>
          <select
            id={`velux-maat-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.maat ?? ''}
            onChange={(e) => {
              const next = e.target.value || null
              update({
                maat: next,
                basisCode: null,
                gootstukCode: null,
                verduisterCode: null,
                zonneGordijnCode: null,
                buitenZonCode: null,
                rolluikCode: null,
              })
            }}
          >
            <option value="">— kies maat —</option>
            {veluxMaten.map((m) => (
              <option key={m.code} value={m.code}>
                {m.code} ({m.basis.length} basismodellen)
              </option>
            ))}
          </select>
        </Field>

        <Field label="Basismodel" htmlFor={`velux-basis-${configId}`} required>
          <select
            id={`velux-basis-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.basisCode ?? ''}
            disabled={!maat}
            onChange={(e) => update({ basisCode: e.target.value || null })}
          >
            <option value="">— kies basismodel —</option>
            {maat?.basis.map((b, i) => (
              <option key={`${b.code}-${i}`} value={b.code}>
                {b.type} {b.code} — {priceLabel(b.prijs)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Gootstuk" htmlFor={`velux-gs-${configId}`}>
          <select
            id={`velux-gs-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.gootstukCode ?? ''}
            disabled={!maat || maat.gootstuk.length === 0}
            onChange={(e) => update({ gootstukCode: e.target.value || null })}
          >
            <option value="">
              {maat?.gootstuk.length ? '— geen / niet nodig —' : '(geen gootstuk voor deze maat)'}
            </option>
            {maat?.gootstuk.map((g, i) => (
              <option key={`${g.code}-${i}`} value={g.code}>
                {g.code} — {priceLabel(g.prijs)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Manueel verduisteringsscherm" htmlFor={`velux-vd-${configId}`}>
          <select
            id={`velux-vd-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.verduisterCode ?? ''}
            disabled={!maat || maat.verduister.length === 0}
            onChange={(e) => update({ verduisterCode: e.target.value || null })}
          >
            <option value="">{maat?.verduister.length ? '— geen —' : '(geen)'}</option>
            {maat?.verduister.map((x, i) => (
              <option key={`${x.code}-${i}`} value={x.code}>
                {x.code} {x.kleur} — {priceLabel(x.prijs)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Zonne-energie verduisteringsgordijn" htmlFor={`velux-zg-${configId}`}>
          <select
            id={`velux-zg-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.zonneGordijnCode ?? ''}
            disabled={!maat || maat.zonneGordijn.length === 0}
            onChange={(e) => update({ zonneGordijnCode: e.target.value || null })}
          >
            <option value="">{maat?.zonneGordijn.length ? '— geen —' : '(geen)'}</option>
            {maat?.zonneGordijn.map((x, i) => (
              <option key={`${x.code}-${i}`} value={x.code}>
                {x.code} {x.kleur} — {priceLabel(x.prijs)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Buitenste zonnescherm Integra" htmlFor={`velux-bz-${configId}`}>
          <select
            id={`velux-bz-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.buitenZonCode ?? ''}
            disabled={!maat || maat.buitenZon.length === 0}
            onChange={(e) => update({ buitenZonCode: e.target.value || null })}
          >
            <option value="">{maat?.buitenZon.length ? '— geen —' : '(geen)'}</option>
            {maat?.buitenZon.map((x, i) => (
              <option key={`${x.code}-${i}`} value={x.code}>
                {x.code} {x.kleur} — {priceLabel(x.prijs)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Rolluik zonne-energie" htmlFor={`velux-rl-${configId}`}>
          <select
            id={`velux-rl-${configId}`}
            className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
            value={config.rolluikCode ?? ''}
            disabled={!maat || maat.rolluik.length === 0}
            onChange={(e) => update({ rolluikCode: e.target.value || null })}
          >
            <option value="">{maat?.rolluik.length ? '— geen —' : '(geen)'}</option>
            {maat?.rolluik.map((x, i) => (
              <option key={`${x.code}-${i}`} value={x.code}>
                {x.code} {x.kleur} — {priceLabel(x.prijs)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {missingPrice && (
        <div className="rounded-md border border-rule bg-surface-muted px-3 py-2 text-xs text-ink-mid">
          Geen prijs
        </div>
      )}

      <div
        className={cn(
          'flex items-baseline justify-between p-3 rounded-md border',
          unitPrice > 0
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-rule bg-surface-muted',
        )}
      >
        <span className="text-xs uppercase tracking-wider text-ink-mid">
          {config.aantal > 1 ? `${config.aantal} × prijs per Velux` : 'Prijs per Velux'}
        </span>
        <span className="font-display text-lg font-bold text-ink tabular-nums">
          {unitPrice > 0 ? (
            <>
              {formatEuro(unitPrice)}
              {config.aantal > 1 && (
                <span className="ml-2 text-sm font-normal text-ink-mid">
                  ({formatEuro(unitPrice * config.aantal)} totaal)
                </span>
              )}
            </>
          ) : (
            '—'
          )}
        </span>
      </div>
    </div>
  )
}
