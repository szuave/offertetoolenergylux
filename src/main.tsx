import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyUrlSeed } from '@/lib/seed'
import './index.css'

// Seed MOET lopen vóór de store-module geïmporteerd wordt: Zustand's persist
// hydrateert localStorage op import-tijd. Daarom importeren we App pas
// dynamisch ná het seeden (statische imports worden gehoist en zouden de
// store anders te vroeg hydrateren).
applyUrlSeed()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

const [{ default: App }, { ErrorBoundary }] = await Promise.all([
  import('@/App'),
  import('@/components/layout/ErrorBoundary'),
])

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
