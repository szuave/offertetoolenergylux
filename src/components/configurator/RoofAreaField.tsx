import { useShallow } from 'zustand/react/shallow'
import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { parseLocaleNumber } from '@/lib/parse'

const DAK_CATEGORIES = ['hellend-dak', 'plat-dak']

/**
 * Dakoppervlakte verschijnt enkel als er een dakwerk-categorie in scope is
 * (hellend en/of plat dak). Wordt gebruikt voor de prijs/m²-controle.
 */
export function RoofAreaField() {
  const { categoryScope, roofAreaM2, setMetaField } = useQuoteStore(
    useShallow((s) => ({
      categoryScope: s.categoryScope,
      roofAreaM2: s.meta.roofAreaM2,
      setMetaField: s.setMetaField,
    })),
  )

  const dakwerkActief = DAK_CATEGORIES.some((id) => categoryScope[id])
  if (!dakwerkActief) return null

  return (
    <Card>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dakoppervlakte" htmlFor="roofArea">
            <Input
              id="roofArea"
              type="text"
              inputMode="decimal"
              value={roofAreaM2 === 0 ? '' : String(roofAreaM2).replace('.', ',')}
              onChange={(e) => {
                const parsed = parseLocaleNumber(e.target.value)
                setMetaField('roofAreaM2', parsed === null ? 0 : Math.max(0, parsed))
              }}
              placeholder="m²"
              trailingAdornment="m²"
            />
          </Field>
        </div>
      </CardBody>
    </Card>
  )
}
