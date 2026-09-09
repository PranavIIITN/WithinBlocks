import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(res => res.data.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data.data),
  })

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data.data),
  })

  const totalRevenue = invoices?.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0) || 0
  const unpaidAmount = invoices?.filter(i => i.status === 'UNPAID').reduce((sum, i) => sum + i.totalAmount, 0) || 0
  const overdueCount = invoices?.filter(i => i.status === 'OVERDUE').length || 0
  const lowStockCount = products?.filter(p => p.stock < 10).length || 0

  const recentInvoices = invoices?.slice(0, 5) || []

  const statusBadge = (status) => {
    const styles = {
      UNPAID: 'bg-[#FAEEDA] text-[#633806]',
      PAID: 'bg-[#EAF3DE] text-[#27500A]',
      OVERDUE: 'bg-[#FCEBEB] text-[#791F1F]',
      DRAFT: 'bg-[#f5f5f3] text-[#5f5e5a] border border-[#d1d0c9]',
      CANCELLED: 'bg-[#f5f5f3] text-[#5f5e5a]',
    }
    return `inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${styles[status] || ''}`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[52px] border-b border-[#d1d0c9] bg-white flex-shrink-0">
        <div className="text-[14px] font-medium text-[#1a1a18]">Dashboard</div>
        <button
          onClick={() => window.location.href = '/invoices/new'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer"
        >
          + New invoice
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'From paid invoices', color: 'text-[#3B6D11]' },
            { label: 'Unpaid invoices', value: `₹${unpaidAmount.toLocaleString('en-IN')}`, sub: `${overdueCount} overdue`, color: 'text-[#A32D2D]' },
            { label: 'Total customers', value: customers?.length || 0, sub: 'Registered', color: 'text-[#3B6D11]' },
            { label: 'Products', value: products?.length || 0, sub: `${lowStockCount} low stock`, color: 'text-[#A32D2D]' },
          ].map((m, i) => (
            <div key={i} className="bg-white border border-[#d1d0c9] rounded-lg p-4">
              <div className="text-[12px] text-[#5f5e5a] mb-2">{m.label}</div>
              <div className="text-[22px] font-medium text-[#1a1a18]">{m.value}</div>
              <div className={`text-[11px] mt-1 ${m.color}`}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent invoices */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-[13px] font-medium text-[#1a1a18]">Recent invoices</div>
          <a href="/invoices" className="text-[12px] text-[#185FA5]">View all</a>
        </div>

        <div className="bg-white border border-[#d1d0c9] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafaf8]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">Invoice</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">Customer</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">Amount</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">Due date</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#888780]">
                    No invoices yet. Create your first invoice!
                  </td>
                </tr>
              ) : (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#fafaf8] cursor-pointer border-b border-[#e8e7e0] last:border-0">
                    <td className="px-4 py-3 text-[#1a1a18]">{invoice.invoiceNo}</td>
                    <td className="px-4 py-3 text-[#1a1a18]">{invoice.customer?.name}</td>
                    <td className="px-4 py-3 text-[#1a1a18]">₹{invoice.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}