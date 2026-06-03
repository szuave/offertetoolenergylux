/* eslint-disable no-console */
import xlsx from 'xlsx'

const NEW = 'C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX(1).xlsx'

const wb = xlsx.readFile(NEW)
console.log('═══ ALLE SHEETS in nieuwe Excel ═══\n')
for (const sn of wb.SheetNames) {
  const sheet = wb.Sheets[sn]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  console.log(`▼ "${sn}" — ${rows.length} rijen`)
  console.log('─'.repeat(70))
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const cells = r.map((c) => {
      const s = String(c ?? '').trim()
      return s.length > 60 ? s.slice(0, 57) + '…' : s
    })
    // Toon alleen rijen die iets bevatten
    if (cells.some((c) => c !== '')) {
      console.log(`  ${String(i + 1).padStart(3)}│ ${cells.join('  ║  ')}`)
    }
  }
  console.log()
}
