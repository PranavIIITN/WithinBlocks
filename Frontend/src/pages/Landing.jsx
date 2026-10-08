import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUp, Menu, Sparkles, X } from 'lucide-react'

// ===================================================================
// Design notes
// - Every content section is the same shape: text on the left, the
//   product on the right (like the ChatGPT page).
// - The agent demo is the only motion that starts on its own. The rest
//   moves when the visitor does something.
// - Dark, near-black surfaces; blue is the one accent colour.
// - All demo numbers come from the same two line items, so they always add up.
// ===================================================================

const BG = '#06070b'
const INK = '#f4f6fb'
const MUTED = '#8b93a7'
const LINE = '#1e232e'
const BLUE = '#2563eb' // buttons and fills
const BLUE_L = '#60a5fa' // blue text and accents on dark
const BLUE_XL = '#93c5fd'
const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60a5fa]'

const inr = (n) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ---- Sample data (the business is in Uttar Pradesh) ----------------
const GST = 12
const PROMPT = 'Create invoice for Raj Traders: 10 Mango Pickle, 5 Lemon Pickle'
const ITEMS = [
  { name: 'Mango Pickle 500g', hsn: '2001', qty: 10, rate: 120, stock: 140 },
  { name: 'Lemon Pickle 500g', hsn: '2001', qty: 5, rate: 140, stock: 60 },
]
const taxableOf = (i) => i.qty * i.rate
const TAXABLE = ITEMS.reduce((s, i) => s + taxableOf(i), 0) // 1900
const TAX = (TAXABLE * GST) / 100 // 228
const GRAND = TAXABLE + TAX // 2128
const lineTotal = (i) => taxableOf(i) * (1 + GST / 100)

// ---- Hooks ---------------------------------------------------------
function useReducedMotion() {
  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  return reduced
}

function useInView(ref, threshold = 0.4) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return seen
}

// Animates a number toward `value` (total, stock count).
function Num({ value, format = (v) => String(Math.round(v)), from }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(from ?? value)
  const current = useRef(from ?? value)

  useEffect(() => {
    if (reduced) return
    const start = current.current
    const delta = value - start
    if (delta === 0) return
    let raf
    let t0
    const tick = (t) => {
      t0 ??= t
      const p = Math.min((t - t0) / 600, 1)
      const v = start + delta * (1 - Math.pow(1 - p, 3))
      current.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])

  return <>{format(reduced ? value : shown)}</>
}

const fade = (on) =>
  `transition-all duration-500 ease-out motion-reduce:transition-none ${on ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1.5'}`

// Mounts hidden, then fades in. Used for chat messages.
function Reveal({ children, className = '' }) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(r)
  }, [])
  return <div className={`${fade(on)} ${className}`}>{children}</div>
}

// ---- Shared pieces ---------------------------------------------------
function Frame({ children }) {
  return (
    <div
      className="rounded-2xl bg-[#0b0d13] overflow-hidden flex flex-col h-[600px] sm:h-[620px]"
      style={{ border: `1px solid ${LINE}`, boxShadow: '0 40px 90px -40px rgba(37,99,235,0.55)' }}
    >
      <div className="flex items-center gap-1.5 px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${LINE}` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: '#2a3040' }} />
        ))}
      </div>
      <div className="relative flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  )
}

// Text on the left, product on the right.
function Split({ left, right }) {
  return (
    <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-10 lg:gap-16 items-start">
      <div className="lg:pt-10">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  )
}

const Panel = ({ children }) => (
  <div className="rounded-xl p-6 sm:p-7 bg-[#0f121a] w-full" style={{ border: `1px solid ${LINE}` }}>{children}</div>
)

const AgentAvatar = () => (
  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(59,130,246,0.16)' }}>
    <Sparkles size={12} style={{ color: BLUE_L }} />
  </div>
)

// ===================================================================
// NAV
// ===================================================================
const NAV = [
  { label: 'Product', id: 'product' },
  { label: 'Features', id: 'features' },
  { label: 'Built for India', id: 'trust' },
]

function Nav() {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    const el = id ? document.getElementById(id) : null
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  const linkCls = `text-[14px] rounded-md px-3 py-2 transition-colors hover:text-white ${focusRing}`

  return (
    <nav
      className="sticky top-0 z-40 bg-[#06070b]/80 backdrop-blur transition-[border-color] duration-200"
      style={{ borderBottom: `1px solid ${scrolled || open ? LINE : 'transparent'}` }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 h-16 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center">
        <a href="#top" onClick={(e) => go(e, null)} className={`text-[16px] font-semibold tracking-tight justify-self-start rounded ${focusRing}`}>
          within<span style={{ color: BLUE_L }}>blocks</span>
        </a>

        <div className="hidden md:flex items-center gap-1" style={{ color: '#a3abbd' }}>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => go(e, n.id)} className={linkCls}>{n.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 justify-self-end">
          <Link to="/login" className={`px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-white/5 transition-colors ${focusRing}`}>Sign in</Link>
          <Link to="/register" className={`px-4 py-2 rounded-lg text-[14px] font-medium text-white hover:bg-[#1d4ed8] transition-colors ${focusRing}`} style={{ background: BLUE }}>Get started</Link>
        </div>

        <button
          className={`md:hidden p-2 -mr-2 rounded-md justify-self-end ${focusRing}`}
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-5 pt-2 flex flex-col gap-1 bg-[#06070b]">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={(e) => go(e, n.id)} className="py-3 text-[16px]" style={{ borderBottom: '1px solid #171b25' }}>{n.label}</a>
          ))}
          <div className="flex gap-2 pt-4">
            <Link to="/login" className="flex-1 text-center py-3 rounded-lg text-[14px] font-medium" style={{ border: `1px solid ${LINE}` }}>Sign in</Link>
            <Link to="/register" className="flex-1 text-center py-3 rounded-lg text-[14px] font-medium text-white" style={{ background: BLUE }}>Get started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ===================================================================
// PRODUCT — WithinAgent conversation (starts with the agent's greeting)
// ===================================================================
const EMPTY = { typed: '', sent: false, thinking: false, customer: false, rows: 0, tax: false, pulse: false, saved: false, done: false }
const FULL = { typed: PROMPT, sent: true, thinking: false, customer: true, rows: 2, tax: true, pulse: false, saved: true, done: true }

function Demo() {
  const ref = useRef(null)
  const scroller = useRef(null)
  const inView = useInView(ref)
  const reduced = useReducedMotion()
  const [run, setRun] = useState(0)
  const [s, setS] = useState(reduced ? FULL : EMPTY)

  useEffect(() => {
    if (!inView || reduced) return
    const timers = []
    const at = (ms, patch) => timers.push(setTimeout(() => setS((p) => ({ ...p, ...patch })), ms))

    let t = 900
    for (let i = 1; i <= PROMPT.length; i++) {
      t += 36
      at(t, { typed: PROMPT.slice(0, i) })
    }
    t += 500
    at(t, { sent: true, thinking: true })
    t += 900
    at(t, { thinking: false, customer: true })
    t += 450
    at(t, { rows: 1 })
    t += 350
    at(t, { rows: 2 })
    t += 450
    at(t, { tax: true })
    t += 1300
    at(t, { pulse: true })
    t += 900
    at(t, { pulse: false, saved: true })
    t += 800
    at(t, { done: true })

    return () => timers.forEach(clearTimeout)
  }, [inView, reduced, run])

  // Keep the newest message in view, like a real chat.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const id = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }), 60)
    return () => clearTimeout(id)
  }, [s.sent, s.customer, s.tax, s.saved, s.done, reduced])

  const replay = () => {
    setS(EMPTY)
    setRun((r) => r + 1)
  }

  const typing = !s.sent && s.typed

  return (
    <div ref={ref}>
      <Frame>
        <div
          ref={scroller}
          className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* The agent speaks first */}
          <div className="flex gap-2.5 text-[13.5px] leading-relaxed" style={{ color: INK }}>
            <AgentAvatar />
            <p className="max-w-[460px]">
              Hi, I’m WithinAgent. Tell me what you need, like creating an invoice, and I’ll take care of it.
            </p>
          </div>

          {s.sent && (
            <Reveal className="flex justify-end">
              <div className="text-[13.5px] rounded-2xl rounded-br-md px-4 py-2.5 max-w-[88%]" style={{ background: '#14203a', color: INK }}>
                {PROMPT}
              </div>
            </Reveal>
          )}

          {s.thinking && (
            <div className="flex items-center gap-2.5 text-[12.5px]" style={{ color: MUTED }}>
              <AgentAvatar />
              <span className="animate-pulse">Preparing your invoice…</span>
            </div>
          )}

          {s.customer && (
            <Reveal className="flex gap-2.5">
              <AgentAvatar />
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] leading-relaxed mb-3" style={{ color: INK }}>
                  Here’s the invoice for Raj Traders. Check it, then confirm.
                </p>
                <div className="rounded-xl p-4 sm:p-5" style={{ border: `1px solid ${LINE}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[14px] font-semibold">Raj Traders</div>
                      <div className="text-[11px]" style={{ color: MUTED }}>Uttar Pradesh · CGST + SGST</div>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-500"
                      style={s.saved ? { background: 'rgba(34,197,94,0.14)', color: '#4ade80' } : { background: 'rgba(59,130,246,0.14)', color: BLUE_XL }}
                    >
                      {s.saved ? 'Saved' : 'Preview'}
                    </span>
                  </div>

                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ color: MUTED, borderBottom: '1px solid #171b25' }}>
                        <th className="text-left font-medium pb-2">Item</th>
                        <th className="text-right font-medium pb-2">Qty</th>
                        <th className="text-right font-medium pb-2">Rate</th>
                        <th className="text-right font-medium pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ITEMS.map((i, idx) => (
                        <tr key={i.name} className={fade(s.rows > idx)} style={{ borderBottom: '1px solid #131720' }}>
                          <td className="py-2">{i.name}</td>
                          <td className="py-2 text-right" style={{ color: '#a3abbd' }}>{i.qty}</td>
                          <td className="py-2 text-right" style={{ color: '#a3abbd' }}>₹{i.rate}</td>
                          <td className="py-2 text-right font-medium">{inr(lineTotal(i))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className={`mt-3 text-[12px] space-y-1 ${fade(s.tax)}`} style={{ color: '#a3abbd' }}>
                    <div className="flex justify-between"><span>Taxable value</span><span>{inr(TAXABLE)}</span></div>
                    <div className="flex justify-between"><span>CGST {GST / 2}%</span><span>{inr(TAX / 2)}</span></div>
                    <div className="flex justify-between"><span>SGST {GST / 2}%</span><span>{inr(TAX / 2)}</span></div>
                    <div className="flex justify-between font-semibold pt-1.5 text-[13px]" style={{ color: INK, borderTop: `1px solid ${LINE}` }}>
                      <span>Total</span>
                      <span className="tabular-nums" style={{ color: BLUE_XL }}><Num value={s.tax ? GRAND : 0} from={0} format={inr} /></span>
                    </div>
                  </div>

                  {/* Confirm turns into the stock update; same height, so nothing jumps */}
                  <div className="mt-3 h-[64px]">
                    {!s.saved ? (
                      <div className={fade(s.tax)}>
                        <div
                          className="w-full text-center text-[13px] font-medium text-white rounded-lg py-2.5 transition-shadow duration-500"
                          style={{ background: BLUE, boxShadow: s.pulse ? '0 0 0 5px rgba(37,99,235,0.22)' : '0 0 0 0 rgba(37,99,235,0)' }}
                        >
                          Confirm
                        </div>
                      </div>
                    ) : (
                      <Reveal className="text-[12px] space-y-1" >
                        <div className="text-[11px] font-medium" style={{ color: '#4ade80' }}>Stock updated</div>
                        {ITEMS.map((i) => (
                          <div key={i.name} className="flex justify-between" style={{ color: '#a3abbd' }}>
                            <span>{i.name}</span>
                            <span className="tabular-nums">{i.stock} → <span className="font-medium" style={{ color: BLUE_XL }}>{i.stock - i.qty}</span></span>
                          </div>
                        ))}
                      </Reveal>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {s.done && (
            <Reveal className="flex gap-2.5 text-[13.5px] leading-relaxed">
              <AgentAvatar />
              <p>Saved as INV-2526-014. Stock is updated.</p>
            </Reveal>
          )}
        </div>

        <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5" style={{ border: `1px solid ${LINE}` }}>
            <div className="flex-1 text-[13px] truncate" style={{ color: typing ? INK : '#6b7388' }}>
              {typing ? s.typed : 'Ask WithinAgent anything…'}
            </div>
            <ArrowUp size={14} style={{ color: typing ? BLUE_L : '#3a4152' }} />
          </div>
        </div>
      </Frame>

      <div className="flex items-center justify-center gap-4 mt-5 text-[13px]" style={{ color: MUTED }}>
        <span>You always see a preview before anything is saved.</span>
        {s.done && !reduced && (
          <button onClick={replay} className={`underline underline-offset-4 rounded ${focusRing}`} style={{ color: INK }}>
            Replay
          </button>
        )}
      </div>
    </div>
  )
}

// ===================================================================
// FEATURES — left: expandable list, right: the matching live piece
// ===================================================================
function StockPiece() {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <Panel>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[14px] font-medium">Mango Pickle 500g</div>
          <div className="text-[12px]" style={{ color: MUTED }}>In stock</div>
        </div>
        <div className="text-[44px] leading-none font-semibold tracking-tight tabular-nums" style={{ color: BLUE_XL }}>
          <Num value={confirmed ? 130 : 140} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 mt-6 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
        <span className="text-[12px]" style={{ color: MUTED }}>
          {confirmed ? 'Invoice confirmed · 10 sold' : 'Invoice for 10 units'}
        </span>
        <button
          onClick={() => setConfirmed((c) => !c)}
          aria-pressed={confirmed}
          className={`text-[13px] font-medium rounded-lg px-3.5 py-2 transition-colors ${focusRing}`}
          style={confirmed ? { border: `1px solid ${LINE}`, color: INK, background: 'transparent' } : { background: BLUE, color: 'white' }}
        >
          {confirmed ? 'Cancel invoice' : 'Confirm invoice'}
        </button>
      </div>
    </Panel>
  )
}

function GstPiece() {
  const [state, setState] = useState('Uttar Pradesh')
  const within = state === 'Uttar Pradesh'
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <span className="text-[12px]" style={{ color: MUTED }}>Your business is in Uttar Pradesh. Customer is in:</span>
        <div className="flex rounded-lg p-0.5 bg-[#0b0d13]" style={{ border: `1px solid ${LINE}` }}>
          {['Uttar Pradesh', 'Maharashtra'].map((st) => (
            <button
              key={st}
              onClick={() => setState(st)}
              aria-pressed={state === st}
              className={`text-[12px] font-medium rounded-md px-3 py-1.5 transition-colors ${focusRing}`}
              style={state === st ? { background: BLUE, color: 'white' } : { color: '#a3abbd' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[13px] space-y-1.5" style={{ color: '#a3abbd' }}>
        <div className="flex justify-between"><span>Taxable value</span><span>{inr(TAXABLE)}</span></div>
        {within ? (
          <>
            <div className="flex justify-between"><span>CGST {GST / 2}%</span><span>{inr(TAX / 2)}</span></div>
            <div className="flex justify-between"><span>SGST {GST / 2}%</span><span>{inr(TAX / 2)}</span></div>
          </>
        ) : (
          <div className="flex justify-between"><span>IGST {GST}%</span><span>{inr(TAX)}</span></div>
        )}
        <div className="flex justify-between font-semibold pt-2 mt-1" style={{ color: INK, borderTop: `1px solid ${LINE}` }}>
          <span>Total</span><span>{inr(GRAND)}</span>
        </div>
      </div>
    </Panel>
  )
}

function WorkspacePiece() {
  const nav = ['Dashboard', 'Products', 'Customers', 'Invoices', 'Team', 'Settings']
  const recent = [
    { no: 'INV-2526-014', who: 'Raj Traders', amt: GRAND, paid: false },
    { no: 'INV-2526-013', who: 'Kapoor & Sons', amt: 5400, paid: true },
    { no: 'INV-2526-012', who: 'Sharma Wholesale', amt: 12850.5, paid: true },
    { no: 'INV-2526-011', who: 'Gupta Provision Store', amt: 3192, paid: true },
    { no: 'INV-2526-010', who: 'Mehta Distributors', amt: 21480, paid: false },
  ]
  return (
    <div className="h-full flex">
      <div className="w-[130px] sm:w-[170px] p-3 space-y-0.5 bg-[#0f121a] shrink-0" style={{ borderRight: `1px solid ${LINE}` }}>
        {nav.map((n) => (
          <div
            key={n}
            className="text-[13px] rounded-md px-2.5 py-2"
            style={n === 'Invoices' ? { background: '#171d2b', color: INK, fontWeight: 500, boxShadow: `0 0 0 1px ${LINE}` } : { color: MUTED }}
          >
            {n}
          </div>
        ))}
      </div>
      <div className="flex-1 p-5 sm:p-6 min-w-0">
        <div className="text-[15px] font-semibold mb-3">Invoices</div>
        {recent.map((r) => (
          <div key={r.no} className="flex items-center justify-between gap-2 py-3 text-[13px]" style={{ borderTop: '1px solid #171b25' }}>
            <div className="min-w-0">
              <div className="truncate">{r.who}</div>
              <div className="text-[12px]" style={{ color: '#6b7388' }}>{r.no}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="tabular-nums">{inr(r.amt)}</div>
              <div className="text-[12px]" style={{ color: r.paid ? '#4ade80' : '#fbbf24' }}>{r.paid ? 'Paid' : 'Unpaid'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  { title: 'Stock', tagline: 'Stock that’s always right.', text: 'Confirm an invoice and stock drops. Cancel it and stock comes back.', Piece: StockPiece, hint: 'Try it: confirm the invoice, then cancel it.' },
  { title: 'GST', tagline: 'GST, without the spreadsheet.', text: 'CGST and SGST, or IGST, chosen from your customer’s state.', Piece: GstPiece, hint: 'Try it: change the customer’s state.' },
  { title: 'Workspace', tagline: 'Everything in one place.', text: 'Products, customers, invoices and your team, in one calm workspace.', Piece: WorkspacePiece, fill: true },
]

function Features() {
  const [active, setActive] = useState(0)
  return (
    <Split
      left={
        <div role="tablist" aria-orientation="vertical">
          {FEATURES.map((f, i) => {
            const on = i === active
            return (
              <div key={f.title} className="transition-colors duration-300" style={{ borderTop: `1px solid ${on ? BLUE_L : LINE}` }}>
                <button
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActive(i)}
                  className={`w-full text-left py-5 transition-colors ${on ? '' : 'hover:text-[#a3abbd]'} ${focusRing}`}
                  style={{ color: on ? INK : '#6b7388' }}
                >
                  <span className="text-[26px] font-medium tracking-tight">{f.title}</span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="pb-7">
                      <p className="text-[16px] font-semibold leading-snug">{f.tagline}</p>
                      <p className="text-[16px] mt-3 leading-relaxed" style={{ color: MUTED }}>{f.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ borderTop: `1px solid ${LINE}` }} />
        </div>
      }
      right={
        <Frame>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              role="tabpanel"
              className={`absolute inset-0 ${i === active ? (f.fill ? 'block' : 'flex') : 'hidden'} flex-col items-center justify-center ${f.fill ? '' : 'p-6 sm:p-10'}`}
            >
              {f.fill ? (
                <f.Piece />
              ) : (
                <>
                  <div className="w-full max-w-md"><f.Piece /></div>
                  <div className="text-[13px] mt-5" style={{ color: MUTED }}>{f.hint}</div>
                </>
              )}
            </div>
          ))}
        </Frame>
      }
    />
  )
}

// ===================================================================
// TRUST — left: why, right: what a real invoice looks like
// ===================================================================
function TaxInvoicePaper() {
  const th = 'font-medium pb-2 text-right'
  const td = 'py-2 text-right tabular-nums'
  return (
    <div className="rounded-2xl bg-[#0b0d13] p-5 sm:p-7" style={{ border: `1px solid ${LINE}`, boxShadow: '0 40px 90px -40px rgba(37,99,235,0.5)' }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-[15px] font-semibold">Tax invoice</div>
          <div className="text-[11px]" style={{ color: MUTED }}>INV-2526-014</div>
        </div>
        <div className="text-right text-[11px]" style={{ color: MUTED }}>
          <div style={{ color: INK }} className="font-medium">Sunrise Foods</div>
          <div>GSTIN 09ABCDE1234F1Z5</div>
          <div>Uttar Pradesh</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-[11.5px]">
          <thead>
            <tr style={{ color: MUTED, borderBottom: '1px solid #171b25' }}>
              <th className="text-left font-medium pb-2">Item</th>
              <th className={th}>HSN</th><th className={th}>Qty</th><th className={th}>Taxable</th>
              <th className={th}>CGST</th><th className={th}>SGST</th><th className={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((i) => (
              <tr key={i.name} style={{ borderBottom: '1px solid #131720', color: '#a3abbd' }}>
                <td className="py-2 text-left" style={{ color: INK }}>{i.name}</td>
                <td className={td}>{i.hsn}</td>
                <td className={td}>{i.qty}</td>
                <td className={td}>{inr(taxableOf(i))}</td>
                <td className={td}>{inr((taxableOf(i) * GST) / 200)}</td>
                <td className={td}>{inr((taxableOf(i) * GST) / 200)}</td>
                <td className={`${td} font-medium`} style={{ color: INK }}>{inr(lineTotal(i))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold" style={{ color: INK }}>
              <td className="pt-3 text-left" colSpan={3}>Total</td>
              <td className="pt-3 text-right tabular-nums">{inr(TAXABLE)}</td>
              <td className="pt-3 text-right tabular-nums">{inr(TAX / 2)}</td>
              <td className="pt-3 text-right tabular-nums">{inr(TAX / 2)}</td>
              <td className="pt-3 text-right tabular-nums">{inr(GRAND)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const TRUST = [
  { title: 'Made for Indian tax invoices.', text: 'HSN codes, GST slabs and state-based CGST, SGST and IGST are part of every invoice.' },
  { title: 'Nothing saves until you say so.', text: 'Every change made through the assistant shows a preview first.' },
  { title: 'Your records stay yours.', text: 'Each company’s products, customers and invoices are kept separate from every other company’s.' },
]

// ===================================================================
// PAGE
// ===================================================================
const Cta = ({ children }) => (
  <Link
    to="/register"
    className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-white text-[15px] font-medium transition-colors hover:bg-[#1d4ed8] ${focusRing}`}
    style={{ background: BLUE }}
  >
    {children}
    <ArrowRight size={16} />
  </Link>
)

const Rule = () => <div className="w-12" style={{ borderTop: `2px solid ${BLUE_L}` }} />

// Soft blue light from the top of the page; sits behind everything.
const GlowTop = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-0 top-0 h-[820px] -z-10"
    style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgba(37,99,235,0.34), rgba(37,99,235,0.08) 55%, transparent 80%)' }}
  />
)

export default function Landing() {
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.backgroundColor
    root.style.backgroundColor = BG
    return () => {
      root.style.backgroundColor = prev
    }
  }, [])

  return (
    <div id="top" className="relative isolate min-h-screen overflow-x-clip" style={{ color: INK, background: BG }}>
      <GlowTop />
      <Nav />

      {/* Hook */}
      <header className="px-6 lg:px-10 pt-16 sm:pt-24 pb-16 sm:pb-24 flex flex-col items-center text-center">
        <h1 className="text-[44px] sm:text-[68px] lg:text-[88px] font-semibold tracking-[-0.035em] leading-[1.02] max-w-4xl">
          Invoices and stock, handled.
        </h1>
        <p className="text-[17px] sm:text-[20px] mt-6 max-w-lg leading-relaxed" style={{ color: MUTED }}>
          Tell WithinBlocks who you’re billing. GST is worked out, stock is updated, the invoice is ready.
        </p>
        <div className="mt-10"><Cta>Get started</Cta></div>
        <div className="text-[13px] mt-4" style={{ color: '#6b7388' }}>No credit card required.</div>
      </header>

      {/* Product */}
      <section id="product" className="scroll-mt-16 px-6 lg:px-10 pb-24 lg:pb-32">
        <Split
          left={
            <div>
              <Rule />
              <h2 className="text-[26px] font-medium tracking-tight mt-5">WithinAgent</h2>
              <p className="text-[16px] font-semibold leading-snug mt-5">Create invoices by asking.</p>
              <p className="text-[16px] mt-3 leading-relaxed" style={{ color: MUTED }}>
                Type who you’re billing and what they bought. WithinAgent builds the invoice, shows you a preview, and saves it only when you confirm.
              </p>
            </div>
          }
          right={<Demo />}
        />
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 px-6 lg:px-10 pb-24 lg:pb-32">
        <Features />
      </section>

      {/* Trust */}
      <section id="trust" className="scroll-mt-16 px-6 lg:px-10 pb-24 lg:pb-32">
        <Split
          left={
            <div>
              <Rule />
              <h2 className="text-[26px] font-medium tracking-tight leading-tight mt-5">
                Built around how Indian invoices actually work.
              </h2>
              <div className="mt-6">
                {TRUST.map((t) => (
                  <div key={t.title} className="py-5" style={{ borderTop: `1px solid ${LINE}` }}>
                    <p className="text-[16px] font-semibold leading-snug">{t.title}</p>
                    <p className="text-[16px] mt-2 leading-relaxed" style={{ color: MUTED }}>{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          }
          right={<TaxInvoicePaper />}
        />
      </section>

      {/* Convert */}
      <section className="relative px-6 lg:px-10 pb-28 lg:pb-40 pt-20 flex flex-col items-center text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(55% 70% at 50% 100%, rgba(37,99,235,0.3), transparent 75%)' }}
        />
        <h2 className="text-[34px] sm:text-[52px] font-semibold tracking-[-0.03em] leading-[1.05] max-w-2xl">
          Your next invoice can be one sentence.
        </h2>
        <div className="mt-10"><Cta>Create your account</Cta></div>
        <div className="text-[13px] mt-4" style={{ color: '#6b7388' }}>No credit card required.</div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${LINE}` }}>
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[14px] font-semibold tracking-tight">
            within<span style={{ color: BLUE_L }}>blocks</span>
          </div>
          <div className="flex items-center gap-6 text-[13px]" style={{ color: MUTED }}>
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={`hover:text-white rounded ${focusRing}`}>{n.label}</a>
            ))}
            <Link to="/login" className={`hover:text-white rounded ${focusRing}`}>Sign in</Link>
          </div>
          <div className="text-[12px]" style={{ color: '#6b7388' }}>© 2026 WithinBlocks</div>
        </div>
      </footer>
    </div>
  )
}