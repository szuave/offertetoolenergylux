/**
 * Trimt de witte achtergrond van de dakbekleding-foto's (uit Yasid's docx)
 * zodat de dakpan/lei het frame goed vult i.p.v. klein in een witte zee.
 *
 * - Werkt in-place op /public/dakbekleding/ — backup zit in de docx.
 * - sharp.trim() detecteert achtergrondpixels uit de hoeken en hakt ze weg.
 * - We voegen daarna een dun marge (10 px) toe zodat het dakpan-randje niet
 *   tegen de container plakt.
 */
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const DIR = path.resolve('public/dakbekleding')
const PAD = 10
const TRIM_THRESHOLD = 18

const files = await fs.readdir(DIR)

let done = 0
let skipped = 0
for (const file of files) {
  if (!/\.(jpe?g|png)$/i.test(file)) continue
  const full = path.join(DIR, file)
  try {
    const original = await fs.readFile(full)
    const trimmed = await sharp(original)
      .trim({ background: '#ffffff', threshold: TRIM_THRESHOLD })
      .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: '#ffffff' })
      .toBuffer()
    await fs.writeFile(full, trimmed)
    done++
    console.log(`✓ ${file}`)
  } catch (err) {
    skipped++
    console.warn(`! ${file}: ${err.message}`)
  }
}

console.log(`\n${done} getrimd, ${skipped} overgeslagen.`)
