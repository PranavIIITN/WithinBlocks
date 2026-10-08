import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BG, INK, LINE, BLUE_L, focusRing } from './theme'

// Form on the left, a piece of the product on the right.
// Without `aside` (e.g. invalid-link screens) the form is centred on its own.
export default function AuthLayout({ children, aside }) {
  // Keep the area behind overscroll dark too.
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.backgroundColor
    root.style.backgroundColor = BG
    return () => {
      root.style.backgroundColor = prev
    }
  }, [])

  return (
    <div
      className="relative isolate min-h-screen overflow-x-clip"
      style={{ background: BG, color: INK, fontFamily: 'Inter, sans-serif' }}
    >
      {/* Soft blue light behind the form on small screens (the aside carries it on large ones) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[460px] -z-10 ${aside ? 'lg:hidden' : ''}`}
        style={{ background: 'radial-gradient(70% 60% at 50% 0%, rgba(37,99,235,0.3), transparent 75%)' }}
      />

      <div className={`min-h-screen grid ${aside ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]' : ''}`}>
        <div className="flex flex-col min-h-screen px-6 sm:px-10 lg:px-16 py-8">
          <Link to="/" className={`self-start text-[16px] font-semibold tracking-tight rounded ${focusRing}`}>
            within<span style={{ color: BLUE_L }}>blocks</span>
          </Link>
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="w-full max-w-[380px]">{children}</div>
          </div>
          <div className="text-[12px]" style={{ color: '#4b5366' }}>© 2026 WithinBlocks</div>
        </div>

        {aside && (
          <div
            className="hidden lg:flex relative overflow-hidden items-center justify-center p-12 xl:p-16"
            style={{ background: '#080a10', borderLeft: `1px solid ${LINE}` }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 60% at 70% 0%, rgba(37,99,235,0.36), transparent 70%), radial-gradient(60% 50% at 15% 100%, rgba(37,99,235,0.14), transparent 70%)',
              }}
            />
            <div className="relative w-full max-w-[540px]">{aside}</div>
          </div>
        )}
      </div>
    </div>
  )
}