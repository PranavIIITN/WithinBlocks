import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import AuthLayout from '../components/auth/AuthLayout'
import { AmbientInvoice } from '../components/auth/scenes'
import { Heading, ErrorNote, PasswordField, SubmitButton, linkCls } from '../components/auth/fields'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <Heading title="Invalid reset link" sub="This link is missing its reset token. Request a new one from the sign-in page." />
        <Link to="/forgot-password" className={`text-[14px] font-medium ${linkCls}`}>Request new link</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout aside={<AmbientInvoice caption="Choose a new password and carry on." />}>
      {success ? (
        <Heading title="Password reset" sub="Your password has been changed. Taking you to sign in…" />
      ) : (
        <>
          <Heading title="Set a new password" sub="Choose a new password for your account." />

          {error && <ErrorNote>{error}</ErrorNote>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <PasswordField
              label="New password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <PasswordField
              label="Confirm new password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
            />
            <SubmitButton loading={loading} loadingText="Resetting…">Reset password</SubmitButton>
          </form>
        </>
      )}
    </AuthLayout>
  )
}