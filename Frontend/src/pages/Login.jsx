import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="flex h-screen bg-[#f5f5f3]">

      {/* Left panel */}
      <div className="hidden lg:flex w-[65%] bg-[#0f1117] flex-col justify-between p-12">
        <div className="text-[15px] font-medium text-white tracking-tight">
          within<span className="text-[#378ADD]">blocks</span>
        </div>

        <div>
          <h1 className="text-[36px] font-medium text-white leading-tight tracking-tight mb-6">
            Run your business,<br />not your spreadsheets.
          </h1>
          <p className="text-[15px] text-white/50 leading-relaxed max-w-sm">
            GST-compliant invoicing, inventory tracking and AI agents — all in one place for Indian businesses.
          </p>
          <div className="mt-12 flex flex-col gap-6">
            {[
              { icon: '🧾', text: 'Auto GST calculation — CGST, SGST and IGST' },
              { icon: '🤖', text: 'AI agent to create invoices from natural language' },
              { icon: '📦', text: 'Real-time inventory tracking with low stock alerts' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-lg flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-[14px] text-white/55 leading-snug">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[12px] text-white/20">© 2026 WithinBlocks. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[35%] bg-white flex flex-col justify-center px-20">
        <div className="text-[15px] font-medium text-[#1a1a18] tracking-tight mb-8">
          within<span className="text-[#185FA5]">blocks</span>
        </div>

        <h2 className="text-[22px] font-medium text-[#1a1a18] tracking-tight mb-1">Welcome back</h2>
        <p className="text-[14px] text-[#5f5e5a] mb-8">Sign in to your account to continue</p>

        {error && (
          <div className="bg-[#FCEBEB] border border-[#f5c5c5] text-[#791F1F] text-[13px] px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              placeholder="pranav@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[#1a1a18] text-[13px] outline-none focus:border-[#185FA5] focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[#1a1a18] text-[13px] outline-none focus:border-[#185FA5] focus:bg-white"
              required
            />
          </div>

          <div className="flex justify-end">
            <span className="text-[12px] text-[#185FA5] cursor-pointer">Forgot password?</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#185FA5] text-white text-[14px] font-medium cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#d1d0c9]"></div>
          <span className="text-[12px] text-[#888780]">or</span>
          <div className="flex-1 h-px bg-[#d1d0c9]"></div>
        </div>

        <p className="text-center text-[13px] text-[#5f5e5a]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#185FA5]">Create one</Link>
        </p>

        <p className="text-[11px] text-[#888780] text-center mt-6 leading-relaxed">
          By signing in you agree to our{' '}
          <span className="text-[#185FA5] cursor-pointer">Terms of Service</span>{' '}
          and{' '}
          <span className="text-[#185FA5] cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}