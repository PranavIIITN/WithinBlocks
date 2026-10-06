import { useEffect, useState } from 'react'
import {
  BLUE_L, BLUE_XL, GRAND, GST, INK, ITEMS, LINE, MUTED, TAX, TAXABLE,
  fade, inr, lineTotal, useReducedMotion,
} from './theme'

const cardStyle = {
  background: '#0b0d13',
  border: `1px solid ${LINE}`,
  boxShadow: '0 40px 90px -40px rgba(37,99,235,0.55)',
}

function ItemsTable({ rows = ITEMS.length }) {
  return (
    <table className="w-full text-[12.5px]">
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
          <tr key={i.name} className={fade(rows > idx)} style={{ borderBottom: '1px solid #131720' }}>
            <td className="py-2.5">{i.name}</td>
            <td className="py-2.5 text-right" style={{ color: '#a3abbd' }}>{i.qty}</td>
            <td className="py-2.5 text-right" style={{ color: '#a3abbd' }}>₹{i.rate}</td>
            <td className="py-2.5 text-right font-medium">{inr(lineTotal(i))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const Row = ({ a, b, strong }) => (
  <div className={`flex justify-between ${strong ? 'font-semibold pt-2 mt-1 text-[14px]' : ''}`} style={strong ? { color: INK, borderTop: `1px solid ${LINE}` } : undefined}>
    <span>{a}</span>
    <span className="tabular-nums" style={strong ? { color: BLUE_XL } : undefined}>{b}</span>
  </div>
)

const Caption = ({ children }) => (
  <p className="text-[14px] mt-6 text-center leading-relaxed" style={{ color: MUTED }}>{children}</p>
)

// ---------------------------------------------------------------
// Sign up: your first invoice, filled in as you type
// ---------------------------------------------------------------
export function LiveInvoice({ companyName, state, name }) {
  const [same, setSame] = useState(true)
  const company = companyName.trim()
  const person = name.trim()
  const other = state === 'Maharashtra' ? 'Karnataka' : 'Maharashtra'
  const customerState = !state ? 'their state' : same ? state : other
  const dim = { color: '#4b5366' }

  return (
    <div>
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold">Tax invoice</div>
            <div className="text-[12px]" style={{ color: MUTED }}>INV-2526-001</div>
          </div>
          <div className="text-right min-w-0">
            <div className="text-[14px] font-medium truncate" style={company ? undefined : dim}>
              {company || 'Your company'}
            </div>
            <div className="text-[12px] truncate" style={state ? { color: MUTED } : dim}>
              {state || 'Your state'}
            </div>
          </div>
        </div>

        <div className="text-[12px] mb-4" style={{ color: MUTED }}>
          Billed to <span style={{ color: INK }}>Raj Traders</span> · {customerState}
        </div>

        <ItemsTable />

        <div className="mt-4 text-[13px] space-y-1.5" style={{ color: '#a3abbd' }}>
          <Row a="Taxable value" b={inr(TAXABLE)} />
          {!state ? (
            <div className="flex justify-between" style={dim}>
              <span>GST</span>
              <span>Pick your state to see how it’s charged</span>
            </div>
          ) : same ? (
            <>
              <Row a={`CGST ${GST / 2}%`} b={inr(TAX / 2)} />
              <Row a={`SGST ${GST / 2}%`} b={inr(TAX / 2)} />
            </>
          ) : (
            <Row a={`IGST ${GST}%`} b={inr(TAX)} />
          )}
          <Row a="Total" b={inr(GRAND)} strong />
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4" style={{ borderTop: '1px solid #171b25' }}>
          <span className="text-[12px] truncate" style={{ color: MUTED }}>
            Prepared by <span style={person ? { color: INK } : dim}>{person || 'you'}</span>
          </span>
          <div className="flex rounded-lg p-0.5 shrink-0" style={{ background: '#0f121a', border: `1px solid ${LINE}` }}>
            {[[true, 'Same state'], [false, 'Another state']].map(([val, label]) => (
              <button
                key={label}
                type="button"
                onClick={() => setSame(val)}
                aria-pressed={same === val}
                className="text-[11.5px] font-medium rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-[#60a5fa]"
                style={same === val ? { background: '#2563eb', color: 'white' } : { color: '#a3abbd' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Caption>Your first invoice. It fills in as you type.</Caption>
    </div>
  )
}

// ---------------------------------------------------------------
// Sign in & password pages: a quiet loop, nothing to do
// ---------------------------------------------------------------
export function AmbientInvoice({ caption = 'Your invoices and stock are right where you left them.' }) {
  const reduced = useReducedMotion()
  const [t, setT] = useState(reduced ? 9 : 0)

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setT((x) => (x >= 16 ? 0 : x + 1)), 650)
    return () => clearInterval(id)
  }, [reduced])

  const saved = t >= 6
  return (
    <div>
      <div
        className={`rounded-2xl p-6 transition-opacity duration-700 motion-reduce:transition-none ${t >= 14 ? 'opacity-0' : 'opacity-100'}`}
        style={cardStyle}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[15px] font-semibold">Raj Traders</div>
            <div className="text-[12px]" style={{ color: MUTED }}>Uttar Pradesh · CGST + SGST</div>
          </div>
          <span
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-full transition-colors duration-500"
            style={saved ? { background: 'rgba(34,197,94,0.14)', color: '#4ade80' } : { background: 'rgba(59,130,246,0.14)', color: BLUE_XL }}
          >
            {saved ? 'Saved' : 'Preview'}
          </span>
        </div>

        <ItemsTable rows={t >= 2 ? 2 : t >= 1 ? 1 : 0} />

        <div className={`mt-4 text-[13px] space-y-1.5 ${fade(t >= 3)}`} style={{ color: '#a3abbd' }}>
          <Row a="Taxable value" b={inr(TAXABLE)} />
          <Row a={`CGST ${GST / 2}%`} b={inr(TAX / 2)} />
          <Row a={`SGST ${GST / 2}%`} b={inr(TAX / 2)} />
          <Row a="Total" b={inr(GRAND)} strong />
        </div>

        <div className={`mt-4 pt-4 text-[12.5px] space-y-1 ${fade(t >= 7)}`} style={{ borderTop: '1px solid #171b25', color: '#a3abbd' }}>
          <div className="text-[11.5px] font-medium" style={{ color: '#4ade80' }}>Stock updated</div>
          {ITEMS.map((i) => (
            <div key={i.name} className="flex justify-between">
              <span>{i.name}</span>
              <span className="tabular-nums">{i.stock} → <span className="font-medium" style={{ color: BLUE_XL }}>{i.stock - i.qty}</span></span>
            </div>
          ))}
        </div>
      </div>
      <Caption>{caption}</Caption>
    </div>
  )
}

// ---------------------------------------------------------------
// Accept invite: you, joining the team
// ---------------------------------------------------------------
export function TeamScene() {
  const reduced = useReducedMotion()
  const [joined, setJoined] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const id = setTimeout(() => setJoined(true), 900)
    return () => clearTimeout(id)
  }, [reduced])

  const members = [
    { name: 'Vikram', role: 'Owner' },
    { name: 'Ananya', role: 'Staff' },
  ]
  const Avatar = ({ letter, you }) => (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0"
      style={you ? { background: 'rgba(59,130,246,0.2)', color: BLUE_XL } : { background: '#151a24', color: '#a3abbd' }}
    >
      {letter}
    </div>
  )

  return (
    <div>
      <div className="rounded-2xl p-6" style={cardStyle}>
        <div className="text-[15px] font-semibold mb-1">Your team</div>
        <div className="text-[12px] mb-4" style={{ color: MUTED }}>Same company, same invoices, same stock.</div>
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid #171b25' }}>
            <Avatar letter={m.name[0]} />
            <div className="flex-1 text-[14px]">{m.name}</div>
            <span className="text-[12px]" style={{ color: MUTED }}>{m.role}</span>
          </div>
        ))}
        <div className={`flex items-center gap-3 py-3 ${fade(joined)}`} style={{ borderTop: '1px solid #171b25' }}>
          <Avatar letter="Y" you />
          <div className="flex-1 text-[14px]">You</div>
          <span className="text-[11.5px] font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.14)', color: BLUE_L }}>Joining</span>
        </div>
      </div>
      <Caption>Set a password and you’re in. No separate signup.</Caption>
    </div>
  )
}