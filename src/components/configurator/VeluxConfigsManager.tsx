import { useShallow } from 'zustand/react/shallow'
import { Plus } from 'lucide-react'
import { useQuoteStore } from '@/store/quote-store'
import { VeluxSelector } from '@/components/configurator/VeluxSelector'

/**
 * Yasid 11 juni: lijst van Velux-configuraties met "+ Velux toevoegen".
 * Elke entry is een complete VeluxSelector. Verkoper kan zoveel
 * configuraties toevoegen als nodig (bv. 3× MK04 GGL 2066 + 1× UK04 GGU).
 *
 * Verschijnt onder "Veluxen nieuw" zodra de verkoper er minstens 1 toevoegt.
 */
export function VeluxConfigsManager() {
  const { configs, addVeluxConfig } = useQuoteStore(
    useShallow((s) => ({
      configs: s.veluxConfigs,
      addVeluxConfig: s.addVeluxConfig,
    })),
  )

  return (
    <div className="mt-3 space-y-3">
      {configs.map((c, i) => (
        <VeluxSelector key={c.id} configId={c.id} index={i} />
      ))}
      <button
        type="button"
        onClick={addVeluxConfig}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-rule px-3 py-2 text-sm font-medium text-ink-mid hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <Plus size={16} />
        {configs.length === 0 ? 'Velux toevoegen' : 'Nog een Velux toevoegen'}
      </button>
    </div>
  )
}
