import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, FileText, Users, Plus, Search, Bell, ChevronDown } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(res => res.data.data),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data.data),
  })

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0)
  const outstandingAmount = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').reduce((sum, i) => sum + i.totalAmount, 0)
  const lowStockProducts = products.filter(p => p.stock < 10)
  const recentInvoices = invoices.slice(0, 5)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const statusBadge = (status) => {
    const styles = {
      UNPAID: 'bg-[#fef3c7] text-[#92400e]',
      PAID: 'bg-[#dcfce7] text-[#166534]',
      OVERDUE: 'bg-[#fee2e2] text-[#991b1b]',
      DRAFT: 'bg-[#F3F4F6] text-[#4B5563]',
      CANCELLED: 'bg-[#F3F4F6] text-[#4B5563]',
    }
    return `inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${styles[status] || ''}`
  }

  const metrics = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      sub: `${lowStockProducts.length} low stock`,
      subColor: lowStockProducts.length > 0 ? '#ef4444' : '#22c55e',
      subIcon: lowStockProducts.length > 0 ? '↑' : '↑',
    },
    {
      label: 'Low Stock Items',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      iconBg: '#fff7ed',
      iconColor: '#ea580c',
      sub: 'Need restock',
      subColor: '#ef4444',
      subIcon: '↑',
    },
    {
      label: 'Outstanding Invoices',
      value: `₹${outstandingAmount.toLocaleString('en-IN')}`,
      icon: FileText,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      sub: `${invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length} pending`,
      subColor: '#ef4444',
      subIcon: '↓',
    },
    {
      label: 'Total Customers',
      value: customers.length,
      icon: Users,
      iconBg: '#faf5ff',
      iconColor: '#9333ea',
      sub: 'Registered',
      subColor: '#22c55e',
      subIcon: '↑',
    },
  ]

  const quickActions = [
    { label: 'Add Product', icon: Plus, color: '#4F46E5', bg: '#EEF2FF', path: '/products' },
    { label: 'Create Invoice', icon: Plus, color: '#111827', bg: '#F3F4F6', path: '/invoices/new' },
    { label: 'Add Customer', icon: Plus, color: '#111827', bg: '#F3F4F6', path: '/customers' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2 bg-[#F3F4F6] rounded-lg px-3 py-2 flex-1 min-w-0 lg:flex-none lg:w-80">
          <Search size={14} className="text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search products, customers, invoices..."
            className="flex-1 min-w-0 text-[16px] lg:text-[13px] text-[#111827] outline-none bg-transparent placeholder-[#9CA3AF]"
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[13px] text-[#111827] cursor-pointer hover:bg-[#F3F4F6]">
            <FileText size={14} className="text-[#4B5563]" />
            <span>My Company</span>
            <ChevronDown size={12} className="text-[#9CA3AF]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center cursor-pointer hover:bg-[#E5E7EB]">
            <Bell size={15} className="text-[#4B5563]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#E0E7FF] flex items-center justify-center text-[12px] font-semibold text-[#4F46E5] cursor-pointer">
            {user?.name?.charAt(0).toUpperCase() || 'P'}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6">

        {/* Greeting */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5 lg:mb-6">
          <div>
            <h1 className="text-[20px] lg:text-[22px] font-semibold text-[#111827] tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Pranav'} 👋
            </h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Here's what's happening with your business today.</p>
          </div>
          <div className="sm:text-right">
            <div className="text-[13px] font-medium text-[#111827]">{today}</div>
            <div className="text-[12px] text-[#6B7280] mt-0.5">Small steps. Bigger businesses.</div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-6">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-[13px] text-[#6B7280]">{m.label}</div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.iconBg }}>
                    <Icon size={15} style={{ color: m.iconColor }} />
                  </div>
                </div>
                <div className="text-[24px] font-semibold text-[#111827] tracking-tight">{m.value}</div>
                <div className="text-[12px] mt-1" style={{ color: m.subColor }}>
                  {m.subIcon} {m.sub}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent invoices */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
              <div className="text-[14px] font-semibold text-[#111827]">Recent Invoices</div>
              <button onClick={() => navigate('/invoices')} className="text-[12px] text-[#4F46E5] cursor-pointer hover:underline">
                View all →
              </button>
            </div>
            {/* Phones: stacked rows instead of a four-column table */}
            <div className="sm:hidden">
              {recentInvoices.length === 0 ? (
                <div className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
                  No invoices yet. <span className="text-[#4F46E5] cursor-pointer" onClick={() => navigate('/invoices/new')}>Create one →</span>
                </div>
              ) : recentInvoices.map((inv) => (
                <div key={inv.id} className="px-4 py-3 flex flex-col gap-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-[#111827]">{inv.invoiceNo}</span>
                    <span className="text-[13px] font-medium text-[#111827]">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-[#4B5563] truncate">{inv.customer?.name}</span>
                    <span className={statusBadge(inv.status)}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <table className="hidden sm:table w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  {['Invoice', 'Customer', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-medium text-[#6B7280]" style={{ borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
                      No invoices yet. <span className="text-[#4F46E5] cursor-pointer" onClick={() => navigate('/invoices/new')}>Create one →</span>
                    </td>
                  </tr>
                ) : recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9FAFB] cursor-pointer" style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td className="px-5 py-3 font-medium text-[#111827]">{inv.invoiceNo}</td>
                    <td className="px-5 py-3 text-[#4B5563]">{inv.customer?.name}</td>
                    <td className="px-5 py-3 font-medium text-[#111827]">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick actions + low stock */}
          <div className="flex flex-col gap-4">

            {/* Quick actions */}
            <div className="bg-white rounded-xl p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]">
              <div className="text-[14px] font-semibold text-[#111827] mb-3">Quick Actions</div>
              <div className="flex flex-col gap-2">
                {quickActions.map((a, i) => {
                  const Icon = a.icon
                  return (
                    <button
                      key={i}
                      onClick={() => navigate(a.path)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer hover:opacity-90 transition-opacity w-full text-left"
                      style={{ background: a.bg, color: a.color, border: i === 0 ? 'none' : '1px solid #E5E7EB' }}
                    >
                      <Icon size={14} />
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Low stock */}
            <div className="bg-white rounded-xl p-5 flex-1 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[14px] font-semibold text-[#111827]">Low Stock</div>
                <button onClick={() => navigate('/products')} className="text-[12px] text-[#4F46E5] cursor-pointer">View all →</button>
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="text-[13px] text-[#9CA3AF] py-4 text-center">All products in stock ✓</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lowStockProducts.slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <div>
                        <div className="text-[13px] font-medium text-[#111827]">{p.name}</div>
                        <div className="text-[11px] text-[#6B7280]">{p.ean || 'No EAN'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold text-[#ef4444]">{p.stock}</div>
                        <div className="text-[10px] text-[#9CA3AF]">in stock</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}