import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'

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
      <div className="flex h-screen items-center justify-center bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="bg-white rounded-xl p-8 max-w-sm text-center" style={{ border: '1px solid #e4e4e7' }}>
          <div className="text-[15px] font-semibold text-[#09090b] mb-2">Invalid reset link</div>
          <div className="text-[13px] mb-5" style={{ color: '#71717a' }}>
            This link is missing its reset token. Request a new one from the sign-in page.
          </div>
          <Link to="/forgot-password" className="text-[13px] font-medium" style={{ color: '#2563eb' }}>Request new link</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white rounded-xl w-full max-w-[400px] p-8" style={{ border: '1px solid #e4e4e7' }}>
        <div className="text-[15px] font-semibold text-[#09090b] tracking-tight mb-6">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>

        {success ? (
          <>
            <div className="text-[15px] font-semibold text-[#09090b] mb-2">Password reset</div>
            <div className="text-[13px]" style={{ color: '#71717a' }}>
              Your password has been changed. Taking you to sign in…
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[18px] font-semibold text-[#09090b] tracking-tight mb-1">Set a new password</h2>
            <p className="text-[13px] mb-6" style={{ color: '#71717a' }}>Choose a new password for your account.</p>

            {error && (
              <div className="text-[13px] px-4 py-3 rounded-lg mb-5" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">New password</label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
                  style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
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
                {loading ? 'Resetting…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}