import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

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
    <div className="flex h-screen bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel — same family as Login/Register/AcceptInvite */}
      <div className="hidden lg:flex w-[55%] bg-[#0f1117] flex-col justify-between p-12">
        <div className="text-[15px] font-semibold text-white tracking-tight">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>
        <div>
          <h1 className="text-[36px] font-semibold text-white leading-tight tracking-tight mb-6">
            Forgot your<br />password?
          </h1>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            No problem. We'll email you a link to set a new one.
          </p>
        </div>
        <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 WithinBlocks. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-14">
        <div className="text-[15px] font-semibold text-[#09090b] tracking-tight mb-8">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>

        {submitted ? (
          <>
            <h2 className="text-[22px] font-semibold text-[#09090b] tracking-tight mb-1">Check your email</h2>
            <p className="text-[14px] mb-8 leading-relaxed" style={{ color: '#71717a' }}>
              If an account exists for <span className="font-medium text-[#09090b]">{email}</span>, we've sent a
              link to reset your password. It'll expire in 1 hour.
            </p>
            <Link
              to="/login"
              className="text-[13px] font-medium text-center py-2.5 rounded-lg"
              style={{ border: '1px solid #e4e4e7', color: '#09090b' }}
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-semibold text-[#09090b] tracking-tight mb-1">Reset your password</h2>
            <p className="text-[14px] mb-8" style={{ color: '#71717a' }}>
              Enter the email you sign in with and we'll send you a reset link.
            </p>

            {error && (
              <div className="text-[13px] px-4 py-3 rounded-lg mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
                  style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-white text-[14px] font-medium cursor-pointer disabled:opacity-50 mt-1"
                style={{ background: '#2563eb' }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="text-[13px] text-center mt-6" style={{ color: '#71717a' }}>
              <Link to="/login" className="font-medium" style={{ color: '#2563eb' }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}