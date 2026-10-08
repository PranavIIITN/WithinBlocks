import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function Invoices() {
  const navigate = useNavigate()
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
      DRAFT: 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]',
      CANCELLED: 'bg-[#F3F4F6] text-[#4B5563]',
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
      <div className="flex items-center justify-between px-4 lg:px-6 h-[52px] border-b border-[#E5E7EB] bg-white flex-shrink-0">
        <div className="text-[14px] font-medium text-[#111827]">Invoices</div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#111827] text-[13px] cursor-pointer">
            ↓ Export
          </button>
          <a href="/invoices/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F46E5] text-white text-[13px] font-medium cursor-pointer">
            + New invoice
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6">

        {/* Search + filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-[#6B7280]">🔍</span>
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-[16px] lg:text-[13px] text-[#111827] outline-none bg-transparent placeholder-[#9CA3AF] lg:w-56"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg p-1 w-fit max-w-full overflow-x-auto mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-[12px] cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusFilter === tab
                  ? 'bg-[#4F46E5] text-white font-medium'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                statusFilter === tab ? 'bg-white/20 text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        {/* Phones and tablets: one card per invoice */}
        <div className="lg:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="py-8 text-center text-[13px] text-[#6B7280]">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#6B7280]">No invoices found</div>
          ) : (
            filtered.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="bg-white rounded-xl p-4 cursor-pointer shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-[#111827]">{invoice.invoiceNo}</span>
                  <span className="text-[14px] font-semibold text-[#111827]">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between gap-3 mt-1.5">
                  <span className="text-[13px] text-[#4B5563] truncate">{invoice.customer?.name}</span>
                  <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                </div>
                <div className="text-[12px] text-[#6B7280] mt-1.5">
                  {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {invoice.dueDate && <> · Due {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                </div>
                <div className="flex items-center gap-5 mt-3 pt-3 border-t border-[#F3F4F6]" onClick={(e) => e.stopPropagation()}>
                  {invoice.status === 'UNPAID' && (
                    <button onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'PAID' })} className="text-[13px] py-1 text-[#27500A] cursor-pointer">Mark paid</button>
                  )}
                  {invoice.status === 'DRAFT' && (
                    <button onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'UNPAID' })} className="text-[13px] py-1 text-[#4F46E5] cursor-pointer">Finalize</button>
                  )}
                  <button onClick={() => deleteMutation.mutate(invoice.id)} className="text-[13px] py-1 text-[#6B7280] hover:text-[#791F1F] cursor-pointer">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden lg:block bg-white rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.05),0_1px_3px_rgba(16,24,40,0.06)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#F9FAFB]">
                {['Invoice no.', 'Customer', 'Date', 'Due date', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#4B5563] border-b border-[#E5E7EB]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#6B7280]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#6B7280]">No invoices found</td></tr>
              ) : (
                filtered.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="hover:bg-[#F9FAFB] border-b border-[#E5E7EB] last:border-0 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-[#111827]">{invoice.invoiceNo}</td>
                    <td className="px-4 py-3 text-[#111827]">{invoice.customer?.name}</td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#111827] font-medium">
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(invoice.status)}>{invoice.status}</span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
                            className="text-[12px] text-[#4F46E5] hover:underline cursor-pointer"
                          >
                            Finalize
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(invoice.id)}
                          className="text-[12px] text-[#6B7280] hover:text-[#791F1F] cursor-pointer"
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