import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORY_LABEL,
  dakbekledingVariants,
  findVariant,
  listBrands,
  listColors,
  listTypes,
  resolveVariant,
  type DakbekledingCategory,
  type DakbekledingVariant,
} from '@/data/dakbekleding'
import { getVariantPhoto } from '@/data/dakbekleding-photos'
import { useQuoteStore } from '@/store/quote-store'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { QuantityInput } from '@/components/ui/QuantityInput'
import { RichSelect, type RichOption } from '@/components/ui/RichSelect'
import { formatEuro } from '@/lib/format'

function priceRange(vs: DakbekledingVariant[]): string {
  const prices = vs.map((v) => v.unitPrice).filter((p): p is number => p !== null)
  if (prices.length === 0) return 'Prijs volgt'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatEuro(min) : `${formatEuro(min)} – ${formatEuro(max)}`
}

function VariantThumb({ variant, size = 64 }: { variant: DakbekledingVariant; size?: number }) {
  const photo = getVariantPhoto(variant.id)
  const style = { width: size, height: Math.round(size * 0.75) }
  if (photo) {
    return (
      <img
        src={photo}
        alt={`${variant.brand} ${variant.color}`}
        loading="lazy"
        className="rounded border border-rule object-contain bg-white"
        style={style}
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center bg-surface-muted border border-rule rounded text-[9px] uppercase tracking-wider text-ink-muted font-medium"
      style={style}
      aria-label={`Foto van ${variant.brand} ${variant.color}`}
    >
      foto
    </span>
  )
}

export function DakbekledingSelector() {
  const cover = useQuoteStore((s) => s.cover)
  const setCover = useQuoteStore((s) => s.setCover)

  const activeVariant = findVariant(cover.variantId)

  const [category, setCategory] = useState<DakbekledingCategory | ''>(
    activeVariant?.category ?? '',
  )
  const [brand, setBrand] = useState(activeVariant?.brand ?? '')
  const [type, setType] = useState(activeVariant?.type ?? '')
  const [color, setColor] = useState(activeVariant?.color ?? '')
  const [syncedId, setSyncedId] = useState<string | null>(activeVariant?.id ?? null)

  if ((activeVariant?.id ?? null) !== syncedId) {
    setSyncedId(activeVariant?.id ?? null)
    setCategory(activeVariant?.category ?? '')
    setBrand(activeVariant?.brand ?? '')
    setType(activeVariant?.type ?? '')
    setColor(activeVariant?.color ?? '')
  }

  // --- Opties per niveau, met meta-info per optie ---

  const categoryOptions = useMemo<RichOption[]>(() => {
    return (['dakpannen', 'leien', 'sandwichpanelen'] as DakbekledingCategory[]).map((c) => {
      const vs = dakbekledingVariants.filter((v) => v.category === c)
      return {
        value: c,
        label: CATEGORY_LABEL[c],
        sublabel: `${vs.length} ${vs.length === 1 ? 'variant' : 'varianten'}`,
        meta: priceRange(vs),
      }
    })
  }, [])

  const brandOptions = useMemo<RichOption[]>(() => {
    if (!category) return []
    return listBrands(category).map((b) => {
      const vs = dakbekledingVariants.filter((v) => v.category === category && v.brand === b)
      const types = new Set(vs.map((v) => v.type)).size
      return {
        value: b,
        label: b,
        sublabel: `${types} ${types === 1 ? 'model' : 'modellen'} · ${vs.length} kleur${vs.length === 1 ? '' : 'en'}`,
        meta: priceRange(vs),
      }
    })
  }, [category])

  const typeOptions = useMemo<RichOption[]>(() => {
    if (!category || !brand) return []
    return listTypes(category, brand).map((t) => {
      const vs = dakbekledingVariants.filter(
        (v) => v.category === category && v.brand === brand && v.type === t,
      )
      return {
        value: t,
        label: t,
        sublabel: `${vs.length} kleur${vs.length === 1 ? '' : 'en'}`,
        meta: priceRange(vs),
      }
    })
  }, [category, brand])

  const colorOptions = useMemo<RichOption[]>(() => {
    if (!category || !brand || !type) return []
    return listColors(category, brand, type).map((c) => {
      const v = resolveVariant(category, brand, type, c)!
      return {
        value: c,
        label: c,
        visual: <VariantThumb variant={v} size={64} />,
        triggerVisual: <VariantThumb variant={v} size={28} />,
        meta: v.unitPrice === null ? 'Prijs volgt' : `${formatEuro(v.unitPrice)}/m²`,
      }
    })
  }, [category, brand, type])

  // --- Handlers ---

  // Bij wissel van een ouder-niveau proberen we de keuzes "eronder" te
  // behouden als die ook bestaan in de nieuwe context. Enkel wat niet meer
  // past wordt gewist — zo verdwijnt de selectie-kaart niet onnodig.

  // Belangrijk: bij elke wijziging updaten we ook `syncedId` zodat de
  // adjust-state-during-render sync hierboven niet denkt dat de store
  // extern gereset is en daardoor de hele cascade weggooit (bug: van
  // type wisselen leegde ook category/merk).

  function pickCategory(c: string) {
    const newCat = c as DakbekledingCategory
    setCategory(newCat)
    const brands = listBrands(newCat)
    const keepBrand = brand && brands.includes(brand) ? brand : ''
    setBrand(keepBrand)
    if (keepBrand) {
      const types = listTypes(newCat, keepBrand)
      const keepType = type && types.includes(type) ? type : ''
      setType(keepType)
      if (keepType) {
        const colors = listColors(newCat, keepBrand, keepType)
        const keepColor = color && colors.includes(color) ? color : ''
        setColor(keepColor)
        const v = keepColor ? resolveVariant(newCat, keepBrand, keepType, keepColor) : null
        setSyncedId(v?.id ?? null)
        setCover({ variantId: v?.id ?? null })
        return
      }
    }
    setType('')
    setColor('')
    setSyncedId(null)
    setCover({ variantId: null })
  }

  function pickBrand(b: string) {
    setBrand(b)
    if (!category) {
      setSyncedId(null)
      return
    }
    const types = listTypes(category, b)
    const keepType = type && types.includes(type) ? type : ''
    setType(keepType)
    if (keepType) {
      const colors = listColors(category, b, keepType)
      const keepColor = color && colors.includes(color) ? color : ''
      setColor(keepColor)
      const v = keepColor ? resolveVariant(category, b, keepType, keepColor) : null
      setSyncedId(v?.id ?? null)
      setCover({ variantId: v?.id ?? null })
      return
    }
    setColor('')
    setSyncedId(null)
    setCover({ variantId: null })
  }

  function pickType(t: string) {
    setType(t)
    if (!category || !brand) {
      setSyncedId(null)
      return
    }
    const colors = listColors(category, brand, t)
    const keepColor = color && colors.includes(color) ? color : ''
    setColor(keepColor)
    const v = keepColor ? resolveVariant(category, brand, t, keepColor) : null
    setSyncedId(v?.id ?? null)
    setCover({ variantId: v?.id ?? null })
  }

  function pickColor(c: string) {
    setColor(c)
    if (category && brand && type) {
      const v = resolveVariant(category, brand, type, c)
      setSyncedId(v?.id ?? null)
      setCover({ variantId: v?.id ?? null })
    }
  }

  function clearChoice() {
    setCategory('')
    setBrand('')
    setType('')
    setColor('')
    setSyncedId(null)
    setCover({ variantId: null, areaM2: 0 })
  }

  const lineTotal =
    activeVariant && activeVariant.unitPrice !== null && cover.areaM2 > 0
      ? activeVariant.unitPrice * cover.areaM2
      : 0

  return (
    <Card>
      <CardHeader
        title="Nieuwe dakbekleding"
        actions={
          activeVariant ? (
            <button
              type="button"
              onClick={clearChoice}
              className="text-xs text-ink-mid hover:text-ink underline-offset-2 hover:underline"
            >
              keuze wissen
            </button>
          ) : null
        }
      />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RichSelect
            label="Categorie"
            value={category}
            options={categoryOptions}
            onChange={pickCategory}
          />
          <RichSelect
            label="Merk"
            value={brand}
            options={brandOptions}
            onChange={pickBrand}
            disabled={!category}
            emptyHint="Kies eerst categorie"
          />
          <RichSelect
            label="Type"
            value={type}
            options={typeOptions}
            onChange={pickType}
            disabled={!brand}
            emptyHint="Kies eerst merk"
          />
          <RichSelect
            label="Kleur"
            value={color}
            options={colorOptions}
            onChange={pickColor}
            disabled={!type}
            emptyHint="Kies eerst type"
          />
        </div>

        {activeVariant ? (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-6 pt-4 border-t border-rule">
            <SelectedPhoto variant={activeVariant} />
            <div className="flex flex-col gap-3 min-w-0">
              <div>
                <div className="text-xs uppercase tracking-wider text-ink-muted">Gekozen</div>
                <div className="font-display text-base font-bold text-ink leading-tight">
                  {activeVariant.brand}
                </div>
                <div className="text-sm text-ink-soft">
                  {activeVariant.type} · {activeVariant.color}
                </div>
                {activeVariant.group && (
                  <div className="text-xs text-ink-mid mt-0.5">{activeVariant.group}</div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-ink-muted mb-1">
                    Oppervlakte
                  </div>
                  <QuantityInput
                    value={cover.areaM2}
                    onChange={(n) => setCover({ areaM2: Math.max(0, n) })}
                    unit="m2"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-ink-mid">
                    {activeVariant.unitPrice !== null
                      ? `${formatEuro(activeVariant.unitPrice)} / m²`
                      : 'Prijs volgt'}
                  </div>
                  <div className="font-display text-xl font-bold text-ink tabular-nums">
                    {activeVariant.unitPrice !== null && cover.areaM2 > 0
                      ? formatEuro(lineTotal)
                      : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

function SelectedPhoto({ variant }: { variant: DakbekledingVariant }) {
  const photo = getVariantPhoto(variant.id)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (!zoom) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setZoom(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoom])

  if (!photo) {
    return (
      <div className="aspect-[4/3] w-full bg-surface-muted border border-rule rounded-lg flex flex-col items-center justify-center p-4 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">Foto volgt</div>
        <div className="mt-1 text-xs font-medium text-ink leading-tight">{variant.brand}</div>
        <div className="text-[11px] text-ink-mid">{variant.color}</div>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="group relative aspect-[4/3] w-full overflow-hidden border border-rule rounded-lg bg-white cursor-zoom-in"
        aria-label="Foto vergroten"
      >
        <img
          src={photo}
          alt={`${variant.brand} ${variant.type} — ${variant.color}`}
          loading="lazy"
          className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <span className="absolute right-2 bottom-2 inline-flex items-center px-2 py-1 rounded-md bg-ink/75 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
          Vergroten
        </span>
      </button>

      {zoom && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4 sm:p-10 animate-overlay-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setZoom(false)
            }}
            className="absolute top-4 right-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20 animate-close-fade"
            aria-label="Sluiten"
          >
            ×
          </button>
          <figure
            className="max-w-[min(1100px,95vw)] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo}
              alt={`${variant.brand} ${variant.type} — ${variant.color}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-photo-iris will-change-transform"
            />
            <figcaption className="mt-3 text-white text-sm text-center animate-caption-rise">
              <span className="font-semibold">{variant.brand}</span>
              <span className="text-white/70"> · {variant.type} · {variant.color}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </>
  )
}
