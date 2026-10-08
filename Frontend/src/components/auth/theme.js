// Shared tokens and sample data for the auth pages (dark, black + blue).
import { useState } from 'react'

export const BG = '#06070b'
export const INK = '#f4f6fb'
export const MUTED = '#8b93a7'
export const LINE = '#1e232e'
export const BLUE = '#2563eb' // fills and buttons
export const BLUE_L = '#60a5fa' // blue text and accents on dark
export const BLUE_XL = '#93c5fd'

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60a5fa]'

export const inr = (n) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// One sample invoice, so every number on every auth page adds up.
export const GST = 12
export const ITEMS = [
  { name: 'Mango Pickle 500g', qty: 10, rate: 120, stock: 140 },
  { name: 'Lemon Pickle 500g', qty: 5, rate: 140, stock: 60 },
]
export const taxableOf = (i) => i.qty * i.rate
export const TAXABLE = ITEMS.reduce((s, i) => s + taxableOf(i), 0) // 1900
export const TAX = (TAXABLE * GST) / 100 // 228
export const GRAND = TAXABLE + TAX // 2128
export const lineTotal = (i) => taxableOf(i) * (1 + GST / 100)

export const fade = (on) =>
  `transition-all duration-500 ease-out motion-reduce:transition-none ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'}`

export function useReducedMotion() {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  return reduced
}