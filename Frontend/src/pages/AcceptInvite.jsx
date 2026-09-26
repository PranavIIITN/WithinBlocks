import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'

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
      <div className="flex h-screen items-center justify-center bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="bg-white rounded-xl p-8 max-w-sm text-center" style={{ border: '1px solid #e4e4e7' }}>
          <div className="text-[15px] font-semibold text-[#09090b] mb-2">Invalid invite link</div>
          <div className="text-[13px] mb-5" style={{ color: '#71717a' }}>
            This link is missing its invite token. Ask whoever invited you to resend it.
          </div>
          <Link to="/login" className="text-[13px] font-medium" style={{ color: '#2563eb' }}>Back to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel — same family as Register.jsx */}
      <div className="hidden lg:flex w-[55%] bg-[#0f1117] flex-col justify-between p-12">
        <div className="text-[15px] font-semibold text-white tracking-tight">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>
        <div>
          <h1 className="text-[36px] font-semibold text-white leading-tight tracking-tight mb-6">
            You've been invited<br />to join your team.
          </h1>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Set a password to activate your account and get straight to work — no separate signup needed.
          </p>
        </div>
        <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 WithinBlocks. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-14 overflow-y-auto">
        <div className="text-[15px] font-semibold text-[#09090b] tracking-tight mb-8">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>

        <h2 className="text-[22px] font-semibold text-[#09090b] tracking-tight mb-1">Activate your account</h2>
        <p className="text-[14px] mb-8" style={{ color: '#71717a' }}>Set your name and a password to get started</p>

        {error && (
          <div className="text-[13px] px-4 py-3 rounded-lg mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Your name *</label>
            <input
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Password *</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Confirm password *</label>
            <input
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white text-[14px] font-medium cursor-pointer disabled:opacity-50 mt-1"
            style={{ background: '#2563eb' }}
          >
            {loading ? 'Activating…' : 'Activate account'}
          </button>
        </form>

        <p className="text-[13px] text-center mt-6" style={{ color: '#71717a' }}>
          Already activated? <Link to="/login" className="font-medium" style={{ color: '#2563eb' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}