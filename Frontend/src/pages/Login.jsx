import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import AuthLayout from '../components/auth/AuthLayout'
import { AmbientInvoice } from '../components/auth/scenes'
import { Heading, ErrorNote, Field, PasswordField, SubmitButton, linkCls } from '../components/auth/fields'
import { MUTED } from '../components/auth/theme'

export default function Login() {
  const navigate = useNavigate()
  const { token, setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already signed in — skip the form, same reasoning as AppLayout's guard.
  if (token) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
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
    <AuthLayout aside={<AmbientInvoice />}>
      <Heading title="Welcome back" sub="Sign in to pick up where you left off." />

      {error && <ErrorNote>{error}</ErrorNote>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Email address"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div>
          <PasswordField
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <div className="flex justify-end mt-2.5">
            <Link to="/forgot-password" className={`text-[13px] ${linkCls}`}>Forgot password?</Link>
          </div>
        </div>
        <SubmitButton loading={loading} loadingText="Signing in…">Sign in</SubmitButton>
      </form>

      <p className="text-center text-[13px] mt-8" style={{ color: MUTED }}>
        New to WithinBlocks?{' '}
        <Link to="/register" className={linkCls}>Create an account</Link>
      </p>
    </AuthLayout>
  )
}