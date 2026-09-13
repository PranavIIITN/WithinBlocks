import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    companyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        name: form.name,
        email: form.email,
        password: form.password,
      })
      const token = res.data.token
      const { user, company } = res.data.data
      setAuth(token, user, company)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel */}
      <div className="hidden lg:flex w-[55%] bg-[#0f1117] flex-col justify-between p-12">
        <div className="text-[15px] font-semibold text-white tracking-tight">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>
        <div>
          <h1 className="text-[36px] font-semibold text-white leading-tight tracking-tight mb-6">
            Everything your business<br />needs, in one place.
          </h1>
          <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join hundreds of Indian distributors and wholesalers managing their business with WithinBlocks.
          </p>
          <div className="mt-12 flex flex-col gap-6">
            {[
              { icon: '🧾', text: 'GST-compliant invoices with auto CGST/SGST/IGST calculation' },
              { icon: '📦', text: 'Inventory tracking with low stock alerts' },
              { icon: '🤖', text: 'AI agent — create invoices in natural language' },
              { icon: '👥', text: 'Multi-user support with role based access' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  {f.icon}
                </div>
                <span className="text-[14px] leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 WithinBlocks. All rights reserved.</div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-center px-14 overflow-y-auto">
        <div className="text-[15px] font-semibold text-[#09090b] tracking-tight mb-8">
          within<span style={{ color: '#2563eb' }}>blocks</span>
        </div>

        <h2 className="text-[22px] font-semibold text-[#09090b] tracking-tight mb-1">Create your account</h2>
        <p className="text-[14px] mb-8" style={{ color: '#71717a' }}>Set up your company and start managing your business</p>

        {error && (
          <div className="text-[13px] px-4 py-3 rounded-lg mb-6" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Company name */}
          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">
              Company name *
            </label>
            <input
              type="text"
              placeholder="e.g. Swa-Jay Agro Processing"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
            />
          </div>

          {/* Your name */}
          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">
              Your name *
            </label>
            <input
              type="text"
              placeholder="e.g. Pranav"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">
              Email address *
            </label>
            <input
              type="email"
              placeholder="pranav@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
              style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
              required
            />
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">
                Password *
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
                style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">
                Confirm password *
              </label>
              <input
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
                style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-[14px] font-medium text-white cursor-pointer disabled:opacity-50 mt-1"
            style={{ background: '#2563eb' }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: '#e4e4e7' }}></div>
          <span className="text-[12px]" style={{ color: '#a1a1aa' }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#e4e4e7' }}></div>
        </div>

        <p className="text-center text-[13px]" style={{ color: '#71717a' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb' }}>Sign in</Link>
        </p>

        <p className="text-[11px] text-center mt-6 leading-relaxed" style={{ color: '#a1a1aa' }}>
          By creating an account you agree to our{' '}
          <span style={{ color: '#2563eb', cursor: 'pointer' }}>Terms of Service</span>{' '}
          and{' '}
          <span style={{ color: '#2563eb', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}