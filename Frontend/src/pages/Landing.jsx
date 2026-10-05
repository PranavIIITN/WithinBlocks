import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Sparkles, ArrowUp, ShieldCheck, Lock, Building2,
  UserPlus, Package,
} from 'lucide-react'

// ===================================================================
// MINI PRODUCT MOCKUPS — small, styled replicas of the real app screens
// (the actual invoice table from AgentPreview.jsx, the actual agent panel
// from AgentPanel.jsx, the actual team table from Team.jsx), not generic
// icons. This is the one change that actually makes a landing page sell:
// showing the specific, real thing rather than an abstract illustration
// of a vague concept.
// ===================================================================

const BrowserChrome = ({ children }) => (
  <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: '1px solid #e4e4e7' }}>
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white" style={{ borderBottom: '1px solid #e4e4e7' }}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fca5a5' }} />
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#fcd34d' }} />
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#86efac' }} />
    </div>
    {children}
  </div>
)

function InvoiceMockup() {
  const items = [
    { name: 'Mango Pickle 500g', hsn: '2001', qty: 10, rate: 120, gst: 12, total: 1478.40 },
    { name: 'Lemon Pickle 500g', hsn: '2001', qty: 5, rate: 140, gst: 12, total: 784.00 },
  ]
  return (
    <BrowserChrome>
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[13px] font-semibold text-[#09090b]">Raj Traders</div>
            <div className="text-[11px] text-[#71717a]">Maharashtra · Intra-state (CGST + SGST)</div>
          </div>
          <div className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: '#eff6ff', color: '#2563eb' }}>
            Preview
          </div>
        </div>
        <table className="w-full text-[12px] mb-3">
          <thead>
            <tr className="text-[#71717a]" style={{ borderBottom: '1px solid #f4f4f5' }}>
              <th className="text-left font-medium pb-2">Item</th>
              <th className="text-right font-medium pb-2">Qty</th>
              <th className="text-right font-medium pb-2">Rate</th>
              <th className="text-right font-medium pb-2">GST</th>
              <th className="text-right font-medium pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.name} style={{ borderBottom: '1px solid #fafafa' }}>
                <td className="py-2 text-[#09090b]">{i.name} <span className="text-[#a1a1aa]">· {i.hsn}</span></td>
                <td className="py-2 text-right text-[#52525b]">{i.qty}</td>
                <td className="py-2 text-right text-[#52525b]">₹{i.rate}</td>
                <td className="py-2 text-right text-[#52525b]">{i.gst}%</td>
                <td className="py-2 text-right font-medium text-[#09090b]">₹{i.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rounded-lg p-3 text-[12px] space-y-1" style={{ background: '#fafafa' }}>
          <div className="flex justify-between text-[#52525b]"><span>Taxable value</span><span>₹2,017.86</span></div>
          <div className="flex justify-between text-[#52525b]"><span>CGST</span><span>₹121.07</span></div>
          <div className="flex justify-between text-[#52525b]"><span>SGST</span><span>₹121.07</span></div>
          <div className="flex justify-between font-semibold text-[#09090b] pt-1.5 mt-1" style={{ borderTop: '1px solid #e4e4e7' }}>
            <span>Total</span><span>₹2,260.00</span>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function AgentMockup() {
  return (
    <BrowserChrome>
      <div className="bg-white p-6 flex flex-col gap-3">
        <div className="flex justify-end">
          <div className="text-[12px] rounded-lg rounded-br-sm px-3 py-2 max-w-[80%]" style={{ background: '#eff6ff', color: '#09090b' }}>
            Create invoice for Raj Traders with 10 Mango Pickle
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: '#2563eb' }}>
            <Sparkles size={12} className="text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="text-[12px] text-[#52525b]">Here's the invoice — check it over before I save it:</div>
            <div className="rounded-lg p-3 text-[11px] space-y-1.5" style={{ border: '1px solid #e4e4e7' }}>
              <div className="flex justify-between"><span className="text-[#09090b] font-medium">10 × Mango Pickle</span><span className="text-[#52525b]">₹1,478.40</span></div>
              <div className="flex justify-between font-semibold text-[#09090b] pt-1.5" style={{ borderTop: '1px solid #f4f4f5' }}>
                <span>Total</span><span>₹1,478.40</span>
              </div>
            </div>
            <button className="w-full text-[11px] font-medium text-white rounded-lg py-2" style={{ background: '#2563eb' }}>
              Confirm
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mt-1" style={{ border: '1px solid #e4e4e7' }}>
          <div className="flex-1 text-[11px] text-[#a1a1aa]">Ask WithinAgent anything…</div>
          <ArrowUp size={12} style={{ color: '#2563eb' }} />
        </div>
      </div>
    </BrowserChrome>
  )
}

function TeamMockup() {
  const rows = [
    { name: 'Priya Sharma', email: 'priya@rajtraders.in', role: 'OWNER', status: 'Active' },
    { name: 'Arjun Mehta', email: 'arjun@rajtraders.in', role: 'STAFF', status: 'Active' },
    { name: '—', email: 'new.hire@rajtraders.in', role: 'STAFF', status: 'Invited' },
  ]
  return (
    <BrowserChrome>
      <div className="bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[13px] font-semibold text-[#09090b]">Team</div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-white rounded-lg px-3 py-1.5" style={{ background: '#2563eb' }}>
            <UserPlus size={11} /> Invite member
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
          <table className="w-full text-[12px]">
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td className="px-3 py-2.5 font-medium text-[#09090b]">
                    {r.name === '—' ? <span className="text-[#a1a1aa] italic font-normal">Invite pending</span> : r.name}
                  </td>
                  <td className="px-3 py-2.5 text-[#52525b]">{r.email}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#f4f4f5', color: '#52525b' }}>{r.role}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={r.status === 'Active' ? { background: '#dcfce7', color: '#166534' } : { background: '#fef3c7', color: '#92400e' }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BrowserChrome>
  )
}

const TABS = [
  { key: 'invoice', label: 'Invoicing', title: 'GST handled, automatically.', desc: 'CGST, SGST and IGST calculated from your customer\'s state the moment you add items — no manual splits, no spreadsheet formulas to get wrong.', Mockup: InvoiceMockup },
  { key: 'agent', label: 'WithinAgent', title: 'Just say what you need.', desc: 'Describe an invoice, a new product, or a question about your stock in plain English. Every action shows a real preview before anything is saved — you\'re always in control.', Mockup: AgentMockup },
  { key: 'team', label: 'Team', title: 'Built for more than one person.', desc: 'Invite staff with role-based access. They can bill customers and manage stock without ever touching your company settings or billing details.', Mockup: TeamMockup },
]

const FEATURES = [
  { icon: Package, title: 'Stock that stays accurate', desc: 'Inventory is deducted the moment an invoice is confirmed, with low-stock visibility before you run out.' },
  { icon: ShieldCheck, title: 'Your data, isolated', desc: 'Every company\'s products, customers and invoices are fully separated — enforced at the database query level, not just the UI.' },
  { icon: Lock, title: 'Industry-standard auth', desc: 'Passwords are hashed with bcrypt, never stored or transmitted in plain text. Password resets use short-lived, single-use tokens.' },
  { icon: Building2, title: 'Built for Indian SMBs', desc: 'Designed around how distributors and wholesalers actually invoice — HSN codes, GST slabs, and state-based tax rules included.' },
]

export default function Landing() {
  const [activeTab, setActiveTab] = useState('invoice')
  const active = TABS.find((t) => t.key === activeTab)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 h-[64px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="text-[15px] font-semibold text-[#09090b] tracking-tight">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#09090b] hover:bg-[#f4f4f5] transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-colors" style={{ background: '#2563eb' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-12 pt-20 pb-6 lg:pt-28 flex flex-col items-center text-center overflow-hidden">
        {/* Decorative background blobs — subtle, behind everything */}
        <div className="absolute -z-10 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.07]" style={{ background: '#2563eb', top: '-120px', left: '-100px' }} />
        <div className="absolute -z-10 w-[400px] h-[400px] rounded-full blur-3xl opacity-[0.06]" style={{ background: '#f59e0b', top: '20px', right: '-80px' }} />

        <div
          className="text-[12px] font-medium px-3 py-1 rounded-full mb-6"
          style={{ background: '#eff6ff', color: '#2563eb' }}
        >
          Built for Indian distributors &amp; wholesalers
        </div>
        <h1 className="text-[40px] lg:text-[60px] font-semibold text-[#09090b] leading-[1.08] tracking-tight max-w-4xl">
          Billing that keeps up<br />with your business.
        </h1>
        <p className="text-[16px] lg:text-[19px] mt-6 max-w-xl leading-relaxed" style={{ color: '#71717a' }}>
          GST-compliant invoicing, real-time stock, and an AI assistant that handles the busywork —
          built for how Indian SMBs actually work.
        </p>
        <div className="flex items-center gap-3 mt-10">
          <Link
            to="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white text-[14px] font-medium transition-colors"
            style={{ background: '#2563eb' }}
          >
            Create your account
            <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-lg text-[14px] font-medium text-[#09090b] transition-colors"
            style={{ border: '1px solid #e4e4e7' }}
          >
            Sign in
          </Link>
        </div>
        <div className="flex items-center gap-5 mt-8 text-[12px]" style={{ color: '#a1a1aa' }}>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#22c55e' }} /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Check size={13} style={{ color: '#22c55e' }} /> Set up in minutes</span>
        </div>
      </section>

      {/* Tabbed product showcase — the actual sell: real screens, real copy */}
      <section className="px-6 lg:px-12 pt-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-10">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={
                  activeTab === t.key
                    ? { background: '#09090b', color: 'white' }
                    : { background: '#f4f4f5', color: '#52525b' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-[26px] lg:text-[30px] font-semibold text-[#09090b] tracking-tight mb-3 leading-tight">
                {active.title}
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: '#71717a' }}>
                {active.desc}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <active.Mockup />
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[26px] font-semibold text-[#09090b] tracking-tight text-center mb-2">
            Everything else you'd expect.
          </h2>
          <p className="text-[14px] text-center mb-12" style={{ color: '#71717a' }}>
            And a few things you might not have thought to ask for.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-5 rounded-xl" style={{ border: '1px solid #e4e4e7' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: '#eff6ff' }}>
                    <Icon size={16} style={{ color: '#2563eb' }} />
                  </div>
                  <div className="text-[14px] font-semibold text-[#09090b] mb-1.5">{f.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: '#71717a' }}>{f.desc}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA band */}
      <section className="px-6 lg:px-12 pb-24">
        <div
          className="max-w-5xl mx-auto rounded-2xl px-8 py-14 lg:py-20 flex flex-col items-center text-center relative overflow-hidden"
          style={{ background: '#0f1117' }}
        >
          <div className="absolute -z-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-20" style={{ background: '#2563eb', bottom: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
          <h2 className="relative text-[28px] lg:text-[36px] font-semibold text-white tracking-tight max-w-lg leading-tight">
            Stop reconciling GST by hand.
          </h2>
          <p className="relative text-[15px] mt-4 max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Create your account and send your first compliant invoice in the next five minutes.
          </p>
          <Link
            to="/register"
            className="relative flex items-center gap-2 px-6 py-3 rounded-lg text-white text-[14px] font-medium mt-8"
            style={{ background: '#2563eb' }}
          >
            Create your account
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 flex items-center justify-between" style={{ borderTop: '1px solid #e4e4e7' }}>
        <div className="text-[13px] text-[#09090b] font-medium">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>
        <div className="text-[12px]" style={{ color: '#a1a1aa' }}>© 2026 WithinBlocks. All rights reserved.</div>
      </footer>
    </div>
  )
}