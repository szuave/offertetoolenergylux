import logoFull from '/energylux-logo.png?url'
import logoBanner from '/energylux-logo-banner.png?url'
import hero from '/pdf/hero.jpg?url'
import r1 from '/pdf/realisatie-1.jpg?url'
import r2 from '/pdf/realisatie-2.jpg?url'
import r3 from '/pdf/realisatie-3.jpg?url'
import r4 from '/pdf/realisatie-4.jpg?url'
import r5 from '/pdf/realisatie-5.jpg?url'
import r6 from '/pdf/realisatie-6.jpg?url'
import r7 from '/pdf/realisatie-7.jpg?url'
import r8 from '/pdf/realisatie-8.jpg?url'
import r9 from '/pdf/realisatie-9.jpg?url'

export type PdfAssets = {
  logoFull: string
  logoBanner: string
  hero: string
  realisaties: string[]
}

export const pdfAssets: PdfAssets = {
  logoFull,
  logoBanner,
  hero,
  realisaties: [r1, r2, r3, r4, r5, r6, r7, r8, r9],
}
