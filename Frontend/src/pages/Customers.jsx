import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { INDIAN_STATES } from '../constants/indianStates'

export default function Customers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', shipToAddress: '', state: '', gstin: ''
  })
  const [sameAsBilling, setSameAsBilling] = useState(true)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(res => res.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      setShowAdd(false)
      setForm({ name: '', email: '', phone: '', address: '', shipToAddress: '', state: '', gstin: '' })
      setSameAsBilling(true)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['customers']),
  })

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      shipToAddress: sameAsBilling ? form.address : form.shipToAddress,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[52px] border-b border-[#d1d0c9] bg-white flex-shrink-0">
        <div className="text-[14px] font-medium text-[#1a1a18]">Customers</div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer"
        >
          + Add customer
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#b4b2a9] rounded-lg px-3 py-2 mb-4 max-w-sm">
          <span className="text-[#888780]">🔍</span>
          <input
            type="text"
            placeholder="Search by name, phone or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-[#1a1a18] outline-none bg-transparent placeholder-[#b4b2a9]"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#d1d0c9] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#fafaf8]">
                {['Name', 'Email', 'Phone', 'Address', 'State', 'GSTIN', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">No customers found</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fafaf8] border-b border-[#e8e7e0] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#1a1a18]">{c.name}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{c.address || '—'}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{c.state || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#5f5e5a]">{c.gstin || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteMutation.mutate(c.id)}
                        className="text-[12px] text-[#888780] hover:text-[#791F1F] cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add customer modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-[#d1d0c9] w-[480px] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[15px] font-medium text-[#1a1a18]">Add customer</div>
              <button onClick={() => setShowAdd(false)} className="text-[#888780] hover:text-[#1a1a18] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                  required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Billing Address</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[12px] text-[#1a1a18] mb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsBilling}
                    onChange={e => setSameAsBilling(e.target.checked)}
                    className="cursor-pointer"
                  />
                  Shipping Address same as Billing Address
                </label>
                {!sameAsBilling && (
                  <input value={form.shipToAddress} onChange={e => setForm({...form, shipToAddress: e.target.value})}
                    placeholder="Shipping address"
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">State *</label>
                <select value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                  required>
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">GSTIN</label>
                <input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value})}
                  placeholder="29AABCM9527A1ZK"
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5] font-mono" />
              </div>

              {createMutation.isError && (
                <div className="text-[12px] text-[#791F1F] bg-[#FCEBEB] px-3 py-2 rounded-lg">
                  {createMutation.error?.response?.data?.error || 'Something went wrong'}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 rounded-lg border border-[#b4b2a9] text-[13px] text-[#1a1a18] cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer disabled:opacity-50">
                  {createMutation.isPending ? 'Adding...' : 'Add customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}