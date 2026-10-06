import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/auth/AuthLayout'
import { AmbientInvoice } from '../components/auth/scenes'
import { Heading, ErrorNote, Field, SubmitButton, linkCls } from '../components/auth/fields'
import { INK, LINE, MUTED, focusRing } from '../components/auth/theme'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      // Shown regardless of whether the email exists — the backend's
      // response is deliberately identical either way, so the frontend
      // has nothing more specific to show even if it wanted to.
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout aside={<AmbientInvoice caption="Nothing is lost. Your invoices and stock are waiting." />}>
      {submitted ? (
        <>
          <Heading
            title="Check your email"
            sub={
              <>
                If an account exists for <span className="font-medium" style={{ color: INK }}>{email}</span>, we’ve sent a
                link to reset your password. It’ll expire in 1 hour.
              </>
            }
          />
          <Link
            to="/login"
            className={`block text-[14px] font-medium text-center py-3 rounded-lg hover:bg-white/5 transition-colors ${focusRing}`}
            style={{ border: `1px solid ${LINE}`, color: INK }}
          >
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <Heading title="Reset your password" sub="Enter the email you sign in with and we’ll send you a reset link." />

          {error && <ErrorNote>{error}</ErrorNote>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field
              label="Email address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <SubmitButton loading={loading} loadingText="Sending…">Send reset link</SubmitButton>
          </form>

          <p className="text-[13px] text-center mt-8" style={{ color: MUTED }}>
            <Link to="/login" className={linkCls}>Back to sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}