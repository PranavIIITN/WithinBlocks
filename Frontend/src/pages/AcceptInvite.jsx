import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import AuthLayout from '../components/auth/AuthLayout'
import { TeamScene } from '../components/auth/scenes'
import { Heading, ErrorNote, Field, PasswordField, SubmitButton, linkCls } from '../components/auth/fields'
import { MUTED } from '../components/auth/theme'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const res = await api.post('/users/accept-invite', {
        token,
        name: form.name,
        password: form.password,
      })
      const { token: jwt, user, company } = res.data.data
      setAuth(jwt, user, company)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <Heading title="Invalid invite link" sub="This link is missing its invite token. Ask whoever invited you to resend it." />
        <Link to="/login" className={`text-[14px] font-medium ${linkCls}`}>Back to sign in</Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout aside={<TeamScene />}>
      <Heading title="You’ve been invited" sub="Set your name and a password to activate your account." />

      {error && <ErrorNote>{error}</ErrorNote>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Your name"
          placeholder="Full name"
          autoComplete="name"
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <PasswordField
          label="Password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <PasswordField
          label="Confirm password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <SubmitButton loading={loading} loadingText="Activating…">Activate account</SubmitButton>
      </form>

      <p className="text-[13px] text-center mt-8" style={{ color: MUTED }}>
        Already activated? <Link to="/login" className={linkCls}>Sign in</Link>
      </p>
    </AuthLayout>
  )
}