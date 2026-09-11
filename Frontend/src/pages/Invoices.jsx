import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function Invoices() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then(res => res.data.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/invoices/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries(['invoices']),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['invoices']),
  })

  const tabs = ['ALL', 'DRAFT', 'UNPAID', 'PAID', 'OVERDUE', 'CANCELLED']

  const filtered = invoices.filter(i => {
    const matchesSearch = i.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      i.customer?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const tabCount = (status) => {
    if (status === 'ALL') return invoices.length
    return invoices.filter(i => i.status === status).length
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[52px] border-b border-[#d1d0c9] bg-white flex-shrink-0">
        <div className="text-[14px] font-medium text-[#1a1a18]">Invoices</div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#b4b2a9] bg-white text-[#1a1a18] text-[13px] cursor-pointer">
            ↓ Export
          </button>
          <a href="/invoices/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer">
            + New invoice
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Search + filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white border border-[#b4b2a9] rounded-lg px-3 py-2 max-w-sm">
            <span className="text-[#888780]">🔍</span>
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-[13px] text-[#1a1a18] outline-none bg-transparent placeholder-[#b4b2a9] w-56"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white border border-[#d1d0c9] rounded-lg p-1 w-fit mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-[12px] cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab
                  ? 'bg-[#185FA5] text-white font-medium'
                  : 'text-[#5f5e5a] hover:text-[#1a1a18]'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                statusFilter === tab ? 'bg-white/20 text-white' : 'bg-[#f5f5f3] text-[#888780]'
              }`}>
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#d1d0c9] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafaf8]">
                {['Invoice no.', 'Customer', 'Date', 'Due date', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">No invoices found</td></tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-[#fafaf8] border-b border-[#e8e7e0] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#1a1a18]">{invoice.invoiceNo}</td>
                    <td className="px-4 py-3 text-[#1a1a18]">{invoice.customer?.name}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">
                      {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-[#5f5e5a]">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#1a1a18] font-medium">
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {invoice.status === 'UNPAID' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })}
                            className="text-[12px] text-[#27500A] hover:underline cursor-pointer"
                          >
                            Mark paid
                          </button>
                        )}
                        {invoice.status === 'DRAFT' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'UNPAID' })}
                            className="text-[12px] text-[#185FA5] hover:underline cursor-pointer"
                          >
                            Finalize
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(invoice.id)}
                          className="text-[12px] text-[#888780] hover:text-[#791F1F] cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
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