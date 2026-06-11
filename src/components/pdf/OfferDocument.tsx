import { Document, Page, Text, View, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer'
import type { PdfAssets } from '@/components/pdf/assets'
import {
  company,
  brandColors as c,
  introParagraphs,
  testimonials,
  agreementPoints,
  termArticles,
} from '@/config/company'
import { findVariant, CATEGORY_LABEL } from '@/data/dakbekleding'
import { getVariantPhoto } from '@/data/dakbekleding-photos'
import { veluxKeuzeIsCompleet, veluxKeuzeSummary, veluxUnitPrice } from '@/data/velux'
import { formatDate, formatEuro, formatNumber, formatUnit } from '@/lib/format'
import type { QuoteState, Totals } from '@/types/quote'

const PAD = 40

const DETAIL_LABELS: Record<string, string> = {
  merk: 'Merk',
  ral: 'RAL',
  dimensie: 'Dimensie',
  'plaat-dimensie': 'Plaat-dimensie',
  'dakrand-breedte': 'Dakrand-breedte',
  'oversteek-combo': 'Dimensie-combo',
}

function detailLabel(key: string): string {
  return DETAIL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1)
}

const s = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: c.ink,
    paddingTop: PAD,
    paddingBottom: 64,
    paddingHorizontal: PAD,
    lineHeight: 1.5,
  },
  pageNoPad: { fontSize: 10, fontFamily: 'Helvetica', color: c.ink },

  /* ---- Footer (fixed) ---- */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
  },
  footerSite: { color: '#ffffff', fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  footerServices: { flexDirection: 'row', gap: 10 },
  footerService: { color: c.tealLight, fontSize: 7, letterSpacing: 0.6, textTransform: 'uppercase' },
  footerPage: { color: '#ffffff', fontSize: 7.5, opacity: 0.85 },

  /* ---- Cover ---- (A4 = 595.28 × 841.89 pt; image als flow-child net onder paginahoogte
     zodat react-pdf hem niet over twee pagina's wrapt) */
  coverImage: { width: 595.28, height: 840, objectFit: 'cover' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, width: 595.28, height: 840, backgroundColor: '#062a3a', opacity: 0.45 },
  coverContent: { position: 'absolute', top: 0, left: 0, width: 595.28, height: 840, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 50 },
  coverLogoPanel: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 22, paddingHorizontal: 40, alignItems: 'center' },
  coverLogo: { width: 280, height: 'auto', objectFit: 'contain' },
  coverPill: { marginTop: 24, backgroundColor: c.teal, borderRadius: 20, paddingVertical: 9, paddingHorizontal: 22 },
  coverPillText: { color: '#ffffff', fontSize: 12, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase' },
  coverBottom: { position: 'absolute', bottom: 70, left: 0, right: 0, alignItems: 'center' },
  coverKicker: { color: '#ffffff', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.85 },
  coverName: { color: '#ffffff', fontSize: 22, fontFamily: 'Helvetica-Bold', marginTop: 6 },
  coverMeta: { color: '#ffffff', fontSize: 10, opacity: 0.85, marginTop: 4 },

  /* ---- Gekozen dakbekleding (Yasid: basisvraag — foto in PDF) ---- */
  coverPickWrap: { marginTop: 18, marginBottom: 6 },
  coverPickRow: {
    flexDirection: 'row',
    gap: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.rule,
    backgroundColor: '#fafaf7',
    alignItems: 'center',
  },
  coverPickImage: {
    width: 180,
    height: 135,
    borderRadius: 6,
    objectFit: 'contain',
    backgroundColor: '#ffffff',
  },
  coverPickInfo: { flex: 1, flexDirection: 'column', gap: 4 },
  coverPickKicker: {
    fontSize: 8,
    color: c.inkSoft,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  coverPickBrand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.ink },
  coverPickDetail: { fontSize: 11, color: c.inkSoft, marginTop: 2 },
  coverPickPrice: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.primary, marginTop: 6 },
  coverPickNoPhoto: {
    width: 180,
    height: 135,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: c.rule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPickNoPhotoText: { fontSize: 8, color: c.inkSoft, letterSpacing: 1 },

  /* ---- Generic section heading ---- */
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: c.ink, marginBottom: 4 },
  sectionBar: { borderBottomWidth: 2, borderBottomColor: c.primary, paddingBottom: 6, marginBottom: 16 },
  sectionBarTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: c.ink, letterSpacing: 1, textTransform: 'uppercase' },

  /* ---- Intro letter ---- */
  letterCard: { borderWidth: 1, borderColor: c.primaryLight, borderRadius: 8, padding: 26 },
  greeting: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: c.ink, marginBottom: 14 },
  para: { fontSize: 10, color: c.inkSoft, marginBottom: 10, lineHeight: 1.55 },
  advisorRow: { flexDirection: 'row', gap: 14, marginTop: 8, alignItems: 'center' },
  advisorInfo: { flexDirection: 'column' },
  advisorName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.ink },
  advisorLine: { fontSize: 9.5, color: c.inkSoft, marginTop: 1 },

  /* ---- Realisaties grid ---- */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: (595 - PAD * 2 - 20) / 3, height: 96, borderRadius: 6, objectFit: 'cover' },

  /* ---- Testimonials ---- */
  satisfaction: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: c.teal, textAlign: 'center', letterSpacing: 0.5, marginBottom: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 18 },
  quote: { fontSize: 11, color: c.inkSoft, textAlign: 'center', fontStyle: 'italic', marginBottom: 14, paddingHorizontal: 30, lineHeight: 1.5 },

  /* ---- Customer / info ---- */
  custName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: c.ink, marginBottom: 3 },
  custLine: { fontSize: 10, color: c.inkSoft, marginBottom: 1 },
  infoTable: { marginTop: 18, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: c.rule },
  infoHeader: { flexDirection: 'row', backgroundColor: c.primary, paddingVertical: 7, paddingHorizontal: 12 },
  infoHeaderCell: { color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 12 },
  infoRowAlt: { backgroundColor: c.rowAlt },
  infoLabel: { flex: 1, fontSize: 10, color: c.inkSoft },
  infoValue: { flex: 1, fontSize: 10, color: c.ink, fontFamily: 'Helvetica-Bold' },

  /* ---- Work tables ---- */
  tableWrap: { marginBottom: 18 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: c.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  thLabel: { flex: 5, color: '#fff', fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, textTransform: 'uppercase' },
  thQty: { flex: 1.2, color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  thUnit: { flex: 1.2, color: '#fff', fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 12, alignItems: 'flex-start' },
  rowAlt: { backgroundColor: c.rowAlt },
  cellLabel: { flex: 5, fontSize: 10, color: c.ink },
  cellHint: { fontSize: 8, color: c.inkMuted, marginTop: 1 },
  cellQty: { flex: 1.2, fontSize: 10, color: c.inkSoft, textAlign: 'right' },
  cellUnit: { flex: 1.2, fontSize: 10, color: c.inkSoft, textAlign: 'right' },
  subtotalBar: { borderTopWidth: 2, borderTopColor: c.magenta, marginTop: 2 },
  subtotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 12 },
  subtotalLabel: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: c.ink, letterSpacing: 0.5, textTransform: 'uppercase' },
  subtotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.ink },

  /* ---- Totals ---- */
  totalsCard: { marginTop: 8, borderWidth: 1, borderColor: c.primary, borderRadius: 6, overflow: 'hidden' },
  totalsTitle: { backgroundColor: c.primary, color: '#fff', fontSize: 12, fontFamily: 'Helvetica-Bold', paddingVertical: 8, paddingHorizontal: 14, letterSpacing: 0.8, textTransform: 'uppercase' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14 },
  totalsRowAlt: { backgroundColor: c.surfaceMuted },
  totalsLabel: { fontSize: 10.5, color: c.inkSoft },
  totalsValue: { fontSize: 10.5, color: c.ink, fontFamily: 'Helvetica-Bold' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: c.primaryDark },
  grandLabel: { fontSize: 12, color: '#fff', fontFamily: 'Helvetica-Bold' },
  grandValue: { fontSize: 14, color: '#fff', fontFamily: 'Helvetica-Bold' },
  discountNote: { marginTop: 12, padding: 12, backgroundColor: '#f3f7d2', borderLeftWidth: 3, borderLeftColor: c.accent, borderRadius: 3 },
  discountNoteText: { fontSize: 9.5, color: c.accentDark },

  /* ---- Agreement points ---- */
  pointRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  pointText: { flex: 1, fontSize: 9.5, color: c.inkSoft, lineHeight: 1.45 },

  /* ---- Signature ---- */
  sigRow: { flexDirection: 'row', gap: 20, marginTop: 30 },
  sigBox: { flex: 1, borderWidth: 1, borderColor: c.rule, borderRadius: 6, padding: 12, height: 96 },
  sigLabel: { fontSize: 9, color: c.inkMuted, textTransform: 'uppercase', letterSpacing: 1 },
  sigSub: { fontSize: 9.5, color: c.inkSoft, marginTop: 3 },

  /* ---- Terms ---- */
  termTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: c.ink, marginTop: 10, marginBottom: 2 },
  termBody: { fontSize: 8.5, color: c.inkSoft, lineHeight: 1.45, textAlign: 'justify' },
})

type Props = { quote: QuoteState; totals: Totals; assets: PdfAssets }

const STAR_PATH =
  'M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z'

function Stars() {
  return (
    <View style={s.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Svg key={i} width="18" height="18" viewBox="0 0 24 24">
          <Path d={STAR_PATH} fill={c.accent} />
        </Svg>
      ))}
    </View>
  )
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerSite}>{company.website.toUpperCase()}</Text>
      <View style={s.footerServices}>
        {company.services.map((svc) => (
          <Text key={svc} style={s.footerService}>
            {svc}
          </Text>
        ))}
      </View>
      <Text
        style={s.footerPage}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

function CoverPage({ quote, assets }: { quote: QuoteState; assets: PdfAssets }) {
  const fullName = `${quote.customer.firstName} ${quote.customer.lastName}`.trim()
  return (
    <Page size="A4" style={s.pageNoPad}>
      <Image src={assets.hero} style={s.coverImage} />
      <View style={s.coverOverlay} />
      <View style={s.coverContent}>
        <View style={s.coverLogoPanel}>
          <Image src={assets.logoFull} style={s.coverLogo} />
        </View>
        <View style={s.coverPill}>
          <Text style={s.coverPillText}>{company.tagline}</Text>
        </View>
      </View>
      <View style={s.coverBottom}>
        <Text style={s.coverKicker}>Offertevoorstel</Text>
        {fullName ? <Text style={s.coverName}>{fullName}</Text> : null}
        <Text style={s.coverMeta}>
          {[quote.meta.number, formatDate(quote.meta.issueDate)].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Page>
  )
}

function IntroPage({ quote }: { quote: QuoteState }) {
  const fullName = `${quote.customer.firstName} ${quote.customer.lastName}`.trim() || 'mevrouw, mijnheer'
  return (
    <Page size="A4" style={s.page}>
      <View style={s.letterCard}>
        <Text style={s.greeting}>Geachte {fullName},</Text>
        {introParagraphs.map((p, i) => (
          <Text key={i} style={s.para}>
            {p}
          </Text>
        ))}
        <Text style={[s.para, { marginTop: 4 }]}>
          Voor verdere toelichting kan u onze {company.advisor.role.toLowerCase()},{' '}
          {company.advisor.name}, rechtstreeks bereiken:
        </Text>
        <View style={s.advisorRow}>
          <View style={s.advisorInfo}>
            <Text style={s.advisorName}>{company.advisor.name}</Text>
            <Text style={s.advisorLine}>{company.advisor.email}</Text>
            <Text style={s.advisorLine}>{company.advisor.mobile}</Text>
            <Text style={s.advisorLine}>
              {company.addresses[0]!.line1}, {company.addresses[0]!.line2} · BTW {company.vat}
            </Text>
          </View>
        </View>
      </View>
      <Footer />
    </Page>
  )
}

function RealisatiesPage({ assets }: { assets: PdfAssets }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.sectionBar}>
        <Text style={s.sectionBarTitle}>Realisaties</Text>
      </View>
      <Text style={[s.para, { marginBottom: 14 }]}>Een greep uit onze recente projecten.</Text>
      <View style={s.grid}>
        {assets.realisaties.map((src, i) => (
          <Image key={i} src={src} style={s.gridItem} />
        ))}
      </View>
      <Footer />
    </Page>
  )
}

function TestimonialsPage({ assets }: { assets: PdfAssets }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
        <Image src={assets.logoFull} style={{ width: 180, height: 'auto', objectFit: 'contain', marginBottom: 16 }} />
        <Text style={s.satisfaction}>{company.satisfaction}% KLANTENTEVREDENHEID</Text>
        <Stars />
      </View>
      {testimonials.map((t, i) => (
        <Text key={i} style={s.quote}>
          “{t.quote}”
        </Text>
      ))}
      <Footer />
    </Page>
  )
}

function OffertePages({ quote, totals }: Props) {
  const cust = quote.customer
  const fullName = `${cust.firstName} ${cust.lastName}`.trim()
  const projectAddress = cust.projectAddress.trim()
  // Adresregel enkel opbouwen uit ingevulde delen (geen losse komma bij leeg).
  const streetPart = cust.street.trim()
  const cityPart = `${cust.postalCode} ${cust.city}`.trim()
  const factAddr = [streetPart, cityPart].filter(Boolean).join(', ')

  const infoRows: [string, string][] = [
    ['Datum', formatDate(quote.meta.issueDate) || '—'],
    ['Geldig tot', formatDate(quote.meta.validUntilDate) || '—'],
    // Dakoppervlakte enkel tonen bij dakwerken (niet relevant voor gevelwerken).
    ...(quote.meta.roofAreaM2 > 0
      ? ([['Dakoppervlakte', `${formatNumber(quote.meta.roofAreaM2)} m²`]] as [string, string][])
      : []),
    ['Referentie', quote.meta.projectReference || '—'],
    ['BTW-tarief', `${Math.round(quote.vatRate * 100)}%`],
  ]

  return (
    <Page size="A4" style={s.page} wrap>
      {/* Klantgegevens */}
      <View style={s.sectionBar}>
        <Text style={s.sectionBarTitle}>Ons voorstel aan</Text>
      </View>
      {fullName ? <Text style={s.custName}>{fullName}</Text> : null}
      {factAddr ? <Text style={s.custLine}>{factAddr}</Text> : null}
      {projectAddress && projectAddress !== factAddr ? (
        <Text style={s.custLine}>Werfadres: {projectAddress}</Text>
      ) : null}
      {cust.phone ? <Text style={s.custLine}>{cust.phone}</Text> : null}
      {cust.email ? <Text style={s.custLine}>{cust.email}</Text> : null}

      {/* Info-tabel */}
      <View style={s.infoTable}>
        <View style={s.infoHeader}>
          <Text style={[s.infoHeaderCell, { flex: 1 }]}>Gegeven</Text>
          <Text style={[s.infoHeaderCell, { flex: 1 }]}>Waarde</Text>
        </View>
        {infoRows.map(([label, value], i) => (
          <View key={label} style={[s.infoRow, ...(i % 2 === 1 ? [s.infoRowAlt] : [])]}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={s.infoValue}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Yasid 8 juni: gekozen dakpan moet als foto in de PDF (basisvraag). */}
      {(() => {
        const variant = quote.cover.variantId ? findVariant(quote.cover.variantId) : null
        if (!variant) return null
        const photo = getVariantPhoto(variant.id)
        return (
          <View style={s.coverPickWrap} wrap={false}>
            <View style={s.sectionBar}>
              <Text style={s.sectionBarTitle}>Gekozen dakbekleding</Text>
            </View>
            <View style={s.coverPickRow}>
              {photo ? (
                <Image src={photo} style={s.coverPickImage} />
              ) : (
                <View style={s.coverPickNoPhoto}>
                  <Text style={s.coverPickNoPhotoText}>FOTO VOLGT</Text>
                </View>
              )}
              <View style={s.coverPickInfo}>
                <Text style={s.coverPickKicker}>{CATEGORY_LABEL[variant.category]}</Text>
                <Text style={s.coverPickBrand}>{variant.brand}</Text>
                <Text style={s.coverPickDetail}>
                  {variant.type} · {variant.color}
                </Text>
                {variant.unitPrice !== null && quote.cover.areaM2 > 0 ? (
                  <Text style={s.coverPickPrice}>
                    {formatEuro(variant.unitPrice)} / m² · {quote.cover.areaM2} m² ={' '}
                    {formatEuro(variant.unitPrice * quote.cover.areaM2)}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )
      })()}

      {/* Gedetailleerde werken */}
      <View style={[s.sectionBar, { marginTop: 22 }]}>
        <Text style={s.sectionBarTitle}>Uw gedetailleerde offerte</Text>
      </View>

      {totals.subtotals.length === 0 ? (
        <Text style={s.para}>Geen werken geselecteerd.</Text>
      ) : (
        totals.subtotals.map((sub) => (
          <View key={`${sub.categoryId}-${sub.subcategoryId}`} style={s.tableWrap} wrap={false}>
            <View style={s.tableHeader}>
              <Text style={s.thLabel}>{sub.subcategoryLabel.toUpperCase()}</Text>
              <Text style={s.thQty}>Aantal</Text>
              <Text style={s.thUnit}>Eenheid</Text>
            </View>
            {sub.items.map((line, i) => {
              const details = quote.details[line.def.id]
              const detailParts =
                details && Object.entries(details)
                  .filter(([, v]) => v && v.trim() !== '')
                  .map(([k, v]) => `${detailLabel(k)}: ${v}`)
              const detailText = detailParts && detailParts.length > 0 ? detailParts.join(' · ') : null
              return (
                <View key={line.def.id} style={[s.row, ...(i % 2 === 1 ? [s.rowAlt] : [])]}>
                  <View style={s.cellLabel}>
                    <Text>{line.def.label}</Text>
                    {line.def.hint ? <Text style={s.cellHint}>{line.def.hint}</Text> : null}
                    {detailText ? <Text style={s.cellHint}>{detailText}</Text> : null}
                    {/* Yasid 8 juni: voor "Veluxen nieuw" toon de gekozen
                        velux-config (maat + basis + accessoires). */}
                    {line.def.id === 'veluxen-nieuw' && veluxKeuzeIsCompleet(quote.veluxKeuze) ? (
                      <Text style={s.cellHint}>
                        {veluxKeuzeSummary(quote.veluxKeuze)} ·{' '}
                        {formatEuro(veluxUnitPrice(quote.veluxKeuze))} / stuk
                      </Text>
                    ) : null}
                  </View>
                  <Text style={s.cellQty}>{formatNumber(line.quantity)}</Text>
                  <Text style={s.cellUnit}>{formatUnit(line.def.unit)}</Text>
                </View>
              )
            })}
            <View style={s.subtotalBar}>
              <View style={s.subtotalRow}>
                <Text style={s.subtotalLabel}>{sub.subcategoryLabel} — totaal</Text>
                <Text style={s.subtotalValue}>{formatEuro(sub.amount)}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Totaalprijs */}
      <View style={s.totalsCard} wrap={false}>
        <Text style={s.totalsTitle}>Totaalprijs</Text>
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Bedrag offerte (excl. BTW)</Text>
          <Text style={s.totalsValue}>{formatEuro(totals.subtotalExVat)}</Text>
        </View>
        {totals.discountAmount > 0 ? (
          <View style={[s.totalsRow, s.totalsRowAlt]}>
            <Text style={[s.totalsLabel, { color: c.accentDark }]}>
              Beslissingskorting ({quote.discount.percentage}%)
            </Text>
            <Text style={[s.totalsValue, { color: c.accentDark }]}>
              - {formatEuro(totals.discountAmount)}
            </Text>
          </View>
        ) : null}
        <View style={[s.totalsRow, ...(totals.discountAmount > 0 ? [] : [s.totalsRowAlt])]}>
          <Text style={s.totalsLabel}>BTW ({Math.round(quote.vatRate * 100)}%)</Text>
          <Text style={s.totalsValue}>{formatEuro(totals.vatAmount)}</Text>
        </View>
        <View style={s.grandRow}>
          <Text style={s.grandLabel}>Totaalbedrag (incl. {Math.round(quote.vatRate * 100)}% BTW)</Text>
          <Text style={s.grandValue}>{formatEuro(totals.totalIncVat)}</Text>
        </View>
      </View>

      {quote.discount.enabled && totals.discountAmount > 0 ? (
        <View style={s.discountNote}>
          <Text style={s.discountNoteText}>
            De beslissingskorting van {quote.discount.percentage}% ({formatEuro(totals.discountAmount)})
            is geldig bij ondertekening binnen {quote.discount.conditionDays} dagen na opmaak van deze offerte.
          </Text>
        </View>
      ) : null}

      {quote.notes.trim() ? (
        <View style={{ marginTop: 14 }}>
          <Text style={[s.subtotalLabel, { marginBottom: 4 }]}>Opmerkingen</Text>
          <Text style={s.para}>{quote.notes}</Text>
        </View>
      ) : null}

      <Footer />
    </Page>
  )
}

function ConditionsPage({ quote }: { quote: QuoteState }) {
  return (
    <Page size="A4" style={s.page} wrap>
      <View style={s.sectionBar}>
        <Text style={s.sectionBarTitle}>Goede afspraken maken goede vrienden</Text>
      </View>
      {agreementPoints.map((p, i) => (
        <View key={i} style={s.pointRow}>
          <Svg width="13" height="13" viewBox="0 0 24 24" style={{ marginTop: 1 }}>
            <Path d="M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z" fill={c.check} />
            <Path d="M7 12 L10.5 15.5 L17 8.5" stroke="#ffffff" strokeWidth={2.5} fill="none" />
          </Svg>
          <Text style={s.pointText}>{p}</Text>
        </View>
      ))}

      <View style={{ marginTop: 24 }}>
        <Text style={s.para}>
          Door zijn bestelling aanvaardt de medecontractant de toepassing van onze algemene voorwaarden.
          Onze prijzen zijn geldig gedurende {quote.discount.conditionDays >= 21 ? 30 : 30} dagen vanaf de
          datum op het voorblad. Deze offerte mag eenzijdig geannuleerd worden door {company.legalName} voor
          de werken zijn aangevangen.
        </Text>
      </View>

      <View style={s.sigRow}>
        <View style={s.sigBox}>
          <Text style={s.sigLabel}>Voor akkoord — klant</Text>
          <Text style={s.sigSub}>Datum, plaats, naam + handtekening</Text>
          <Text style={s.sigSub}>(voorafgegaan door “gelezen en goedgekeurd”)</Text>
        </View>
        <View style={s.sigBox}>
          <Text style={s.sigLabel}>{company.name}</Text>
          <Text style={s.sigSub}>{quote.meta.salesperson || company.advisor.name}</Text>
        </View>
      </View>

      <Footer />
    </Page>
  )
}

function TermsPage() {
  return (
    <Page size="A4" style={s.page} wrap>
      <View style={s.sectionBar}>
        <Text style={s.sectionBarTitle}>Aannemingsvoorwaarden</Text>
      </View>
      {termArticles.map((art) => (
        <View key={art.title} wrap={false}>
          <Text style={s.termTitle}>Artikel {art.title}</Text>
          <Text style={s.termBody}>{art.body}</Text>
        </View>
      ))}
      <Footer />
    </Page>
  )
}

export function OfferDocument({ quote, totals, assets }: Props) {
  return (
    <Document
      title={`Offerte ${quote.meta.number} — ${quote.customer.firstName} ${quote.customer.lastName}`}
      author={company.name}
      creator={company.name}
      producer={company.name}
    >
      <CoverPage quote={quote} assets={assets} />
      <IntroPage quote={quote} />
      <RealisatiesPage assets={assets} />
      <TestimonialsPage assets={assets} />
      <OffertePages quote={quote} totals={totals} assets={assets} />
      <ConditionsPage quote={quote} />
      <TermsPage />
    </Document>
  )
}
