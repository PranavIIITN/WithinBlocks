import { useId, useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { BLUE, INK, LINE, MUTED, focusRing } from './theme'

const inputCls =
  'w-full rounded-lg px-3.5 py-3 text-[16px] sm:text-[14px] outline-none transition placeholder:text-[#4b5366] focus:border-[#60a5fa] focus:shadow-[0_0_0_3px_rgba(96,165,250,0.18)]'
const inputStyle = { background: '#0d1017', border: `1px solid ${LINE}`, color: INK }
const labelCls = 'block text-[13px] font-medium mb-2'
const labelStyle = { color: '#c3c9d6' }

export const linkCls = `text-[#60a5fa] hover:text-[#93c5fd] rounded transition-colors ${focusRing}`

export function Heading({ title, sub }) {
  return (
    <div className="mb-8">
      <h1 className="text-[28px] font-semibold tracking-tight leading-tight">{title}</h1>
      {sub && <p className="text-[14px] mt-2 leading-relaxed" style={{ color: MUTED }}>{sub}</p>}
    </div>
  )
}

export function ErrorNote({ children }) {
  return (
    <div
      role="alert"
      className="text-[13px] px-4 py-3 rounded-lg mb-6"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
    >
      {children}
    </div>
  )
}

export function Field({ label, hint, ...props }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={labelCls} style={labelStyle}>{label}</label>
      <input id={id} className={inputCls} style={inputStyle} {...props} />
      {hint && <p className="text-[12px] mt-2" style={{ color: MUTED }}>{hint}</p>}
    </div>
  )
}

export function PasswordField({ label, hint, ...props }) {
  const id = useId()
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className={labelCls} style={labelStyle}>{label}</label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} className={`${inputCls} pr-11`} style={inputStyle} {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors hover:text-white ${focusRing}`}
          style={{ color: MUTED }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {hint && <p className="text-[12px] mt-2" style={{ color: MUTED }}>{hint}</p>}
    </div>
  )
}

export function SelectField({ label, hint, children, ...props }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className={labelCls} style={labelStyle}>{label}</label>
      <div className="relative">
        <select
          id={id}
          className={`${inputCls} appearance-none pr-10`}
          style={{ ...inputStyle, colorScheme: 'dark' }}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: MUTED }} />
      </div>
      {hint && <p className="text-[12px] mt-2 leading-relaxed" style={{ color: MUTED }}>{hint}</p>}
    </div>
  )
}

export function SubmitButton({ loading, loadingText, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full py-3 rounded-lg text-[14px] font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${focusRing}`}
      style={{ background: BLUE }}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
      {loading ? loadingText : children}
    </button>
  )
}