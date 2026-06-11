import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { veluxMaten, findMaat, veluxUnitPrice } from '@/data/velux'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { formatEuro } from '@/lib/format'
import { cn } from '@/lib/cn'

/**
 * Yasid 8 juni: Velux-prijslijst integratie. Verkoper kiest een maat
 * (CK01/CK02/MK06/...), basismodel (Velux/Integra + productcode) en
 * optioneel een gootstuk + accessoires. De prijs wordt per Velux opgeteld
 * en vermenigvuldigd met de qty van "Veluxen nieuw".
 *
 * Verschijnt onder het "Veluxen nieuw" item zodra qty > 0.
 */
export function VeluxSelector() {
  const { veluxKeuze, setVeluxKeuze } = useQuoteStore(
    useShallow((s) => ({
      veluxKeuze: s.veluxKeuze,
      setVeluxKeuze: s.setVeluxKeuze,
    })),
  )

  const maat = useMemo(() => (veluxKeuze.maat ? findMaat(veluxKeuze.maat) : null), [veluxKeuze.maat])
  const unitPrice = useMemo(() => veluxUnitPrice(veluxKeuze), [veluxKeuze])

  return (
    <Card className="mt-3">
      <CardHeader title="Velux-configuratie" />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Maat" htmlFor="velux-maat" required>
            <select
              id="velux-maat"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.maat ?? ''}
              onChange={(e) => {
                const next = e.target.value || null
                setVeluxKeuze({
                  maat: next,
                  // Reset onderliggende keuzes bij maat-wissel
                  basisCode: null, gootstukCode: null,
                  verduisterCode: null, zonneGordijnCode: null,
                  buitenZonCode: null, rolluikCode: null,
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

          <Field label="Basismodel" htmlFor="velux-basis" required>
            <select
              id="velux-basis"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.basisCode ?? ''}
              disabled={!maat}
              onChange={(e) => setVeluxKeuze({ basisCode: e.target.value || null })}
            >
              <option value="">— kies basismodel —</option>
              {maat?.basis.map((b, i) => (
                <option key={`${b.code}-${i}`} value={b.code}>
                  {b.type} {b.code} — {formatEuro(b.prijs)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Gootstuk" htmlFor="velux-gs">
            <select
              id="velux-gs"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.gootstukCode ?? ''}
              disabled={!maat || maat.gootstuk.length === 0}
              onChange={(e) => setVeluxKeuze({ gootstukCode: e.target.value || null })}
            >
              <option value="">{maat?.gootstuk.length ? '— geen / niet nodig —' : '(geen voor deze maat)'}</option>
              {maat?.gootstuk.map((g, i) => (
                <option key={`${g.code}-${i}`} value={g.code}>
                  {g.code} — {formatEuro(g.prijs)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Manueel verduisteringsscherm" htmlFor="velux-vd">
            <select
              id="velux-vd"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.verduisterCode ?? ''}
              disabled={!maat || maat.verduister.length === 0}
              onChange={(e) => setVeluxKeuze({ verduisterCode: e.target.value || null })}
            >
              <option value="">{maat?.verduister.length ? '— geen —' : '(geen)'}</option>
              {maat?.verduister.map((x, i) => (
                <option key={`${x.code}-${i}`} value={x.code}>
                  {x.code} {x.kleur} — {formatEuro(x.prijs)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Zonne-energie verduisteringsgordijn" htmlFor="velux-zg">
            <select
              id="velux-zg"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.zonneGordijnCode ?? ''}
              disabled={!maat || maat.zonneGordijn.length === 0}
              onChange={(e) => setVeluxKeuze({ zonneGordijnCode: e.target.value || null })}
            >
              <option value="">{maat?.zonneGordijn.length ? '— geen —' : '(geen)'}</option>
              {maat?.zonneGordijn.map((x, i) => (
                <option key={`${x.code}-${i}`} value={x.code}>
                  {x.code} {x.kleur} — {formatEuro(x.prijs)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Buitenste zonnescherm Integra" htmlFor="velux-bz">
            <select
              id="velux-bz"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.buitenZonCode ?? ''}
              disabled={!maat || maat.buitenZon.length === 0}
              onChange={(e) => setVeluxKeuze({ buitenZonCode: e.target.value || null })}
            >
              <option value="">{maat?.buitenZon.length ? '— geen —' : '(geen)'}</option>
              {maat?.buitenZon.map((x, i) => (
                <option key={`${x.code}-${i}`} value={x.code}>
                  {x.code} {x.kleur} — {formatEuro(x.prijs)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Rolluik zonne-energie" htmlFor="velux-rl">
            <select
              id="velux-rl"
              className="w-full h-10 rounded-md border border-rule bg-surface px-2 text-sm"
              value={veluxKeuze.rolluikCode ?? ''}
              disabled={!maat || maat.rolluik.length === 0}
              onChange={(e) => setVeluxKeuze({ rolluikCode: e.target.value || null })}
            >
              <option value="">{maat?.rolluik.length ? '— geen —' : '(geen)'}</option>
              {maat?.rolluik.map((x, i) => (
                <option key={`${x.code}-${i}`} value={x.code}>
                  {x.code} {x.kleur} — {formatEuro(x.prijs)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className={cn(
          'flex items-baseline justify-between p-3 rounded-md border',
          unitPrice > 0 ? 'border-brand-primary bg-brand-primary/5' : 'border-rule bg-surface-muted',
        )}>
          <span className="text-xs uppercase tracking-wider text-ink-mid">Prijs per Velux</span>
          <span className="font-display text-lg font-bold text-ink tabular-nums">
            {unitPrice > 0 ? formatEuro(unitPrice) : '—'}
          </span>
        </div>
      </CardBody>
    </Card>
  )
}
