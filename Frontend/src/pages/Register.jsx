import { useEffect, useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { INDIAN_STATES } from '../constants/indianStates'
import AuthLayout from '../components/auth/AuthLayout'
import { LiveInvoice } from '../components/auth/scenes'
import { Heading, ErrorNote, Field, PasswordField, SelectField, SubmitButton, linkCls } from '../components/auth/fields'
import { BLUE_L, LINE, MUTED, focusRing } from '../components/auth/theme'

// Shown while the sign-up request is in flight.
function Setup({ company, state }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setTick(1), 700)
    const b = setTimeout(() => setTick(2), 1500)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  const steps = [`Creating ${company}`, `Applying GST rules for ${state}`, 'Opening your workspace']
  return (
    <div>
      <Heading title="Setting up your workspace" sub="This only takes a moment." />
      <ul className="space-y-4" aria-live="polite">
        {steps.map((text, i) => (
          <li key={text} className="flex items-center gap-3 text-[14px]" style={{ color: i <= tick ? '#f4f6fb' : '#4b5366' }}>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={i < tick ? { background: 'rgba(34,197,94,0.16)', color: '#4ade80' } : { border: `1px solid ${LINE}` }}
            >
              {i < tick ? (
                <Check size={12} />
              ) : i === tick ? (
                <span className="w-3 h-3 rounded-full border-2 border-[#60a5fa]/30 border-t-[#60a5fa] animate-spin" />
              ) : null}
            </span>
            <span className="truncate">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { token, setAuth } = useAuthStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    companyName: '',
    state: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already signed in — skip the form, same reasoning as AppLayout's guard.
  // Placed after every hook above (never before) so hook call order stays
  // identical across renders — putting this earlier, before useState calls,
  // would violate React's Rules of Hooks.
  if (token) return <Navigate to="/" replace />

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleContinue = (e) => {
    e.preventDefault()
    setError('')
    setStep(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        companyName: form.companyName,
        state: form.state,
        name: form.name,
        email: form.email,
        password: form.password,
      })
      const { token, user, company } = res.data.data
      setAuth(token, user, company)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout aside={<LiveInvoice companyName={form.companyName} state={form.state} name={form.name} />}>
      {loading ? (
        <Setup company={form.companyName.trim()} state={form.state} />
      ) : (
        <>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5 flex-1" aria-hidden>
              {[0, 1].map((i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ background: i <= step ? BLUE_L : LINE }} />
              ))}
            </div>
            <span className="text-[12px]" style={{ color: MUTED }}>Step {step + 1} of 2</span>
          </div>

          {step === 0 ? (
            <>
              <Heading title="Set up your company" sub="Tell us about your business. Your invoice fills in as you go." />
              <form onSubmit={handleContinue} className="flex flex-col gap-5">
                <Field
                  label="Company name"
                  placeholder="e.g. Sunrise Foods"
                  autoComplete="organization"
                  autoFocus
                  value={form.companyName}
                  onChange={set('companyName')}
                  required
                />
                <SelectField
                  label="Company state"
                  hint="Used to decide CGST/SGST vs IGST on your invoices."
                  value={form.state}
                  onChange={set('state')}
                  required
                >
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectField>
                <SubmitButton>Continue</SubmitButton>
              </form>
            </>
          ) : (
            <>
              <Heading title="Now, you" sub="Create the sign-in you’ll use every day." />
              {error && <ErrorNote>{error}</ErrorNote>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Field
                  label="Your name"
                  placeholder="e.g. Rohan"
                  autoComplete="name"
                  autoFocus
                  value={form.name}
                  onChange={set('name')}
                  required
                />
                <Field
                  label="Email address"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
                <PasswordField
                  label="Password"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <PasswordField
                  label="Confirm password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                />
                <SubmitButton loading={loading} loadingText="Creating account…">Create account</SubmitButton>
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(0) }}
                  className={`self-start flex items-center gap-1.5 text-[13px] rounded hover:text-white transition-colors cursor-pointer ${focusRing}`}
                  style={{ color: MUTED }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </form>
            </>
          )}

          <p className="text-center text-[13px] mt-8" style={{ color: MUTED }}>
            Already have an account?{' '}
            <Link to="/login" className={linkCls}>Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}