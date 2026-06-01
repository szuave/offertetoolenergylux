import xlsx from 'xlsx'
const wb = xlsx.readFile("C:/Users/uidlo/Downloads/RENOCHECK Artikellijst ENERGYLUX.xlsx")
for (const sheetName of wb.SheetNames) {
  console.log('\n========== SHEET:', sheetName, '==========')
  const sheet = wb.Sheets[sheetName]
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  let inSection = ''
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const A = String(r[0] ?? '').trim()
    const B = String(r[1] ?? '').trim()
    const C = String(r[2] ?? '').trim()
    const D = String(r[3] ?? '').trim()
    if (!A && !B && !C && !D) continue
    // Heading-row detection: column A bold-ish or empty B/C/D
    const isHeading = A && !B && !C && !D
    if (isHeading) {
      console.log(`\n  [HEADING] ${A}`)
      continue
    }
    // Item-row
    const filterNote = D || ''
    console.log(`    ${A.padEnd(60)} | unit=${B.padEnd(6)} | prijs=${C.padEnd(8)} | filter="${filterNote}"`)
  }
}
