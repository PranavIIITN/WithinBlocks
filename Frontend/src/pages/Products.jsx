import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function Products() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', price: '', stock: '',
    unit: '', tax: '', ean: '', priceType: 'EXCLUSIVE'
  })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      setShowAdd(false)
      setForm({ name: '', description: '', price: '', stock: '', unit: '', tax: '', ean: '', priceType: 'EXCLUSIVE' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['products']),
  })

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ean?.includes(search)
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      tax: form.tax ? parseFloat(form.tax) : undefined,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[52px] border-b border-[#d1d0c9] bg-white flex-shrink-0">
        <div className="text-[14px] font-medium text-[#1a1a18]">Products</div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer"
        >
          + Add product
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#b4b2a9] rounded-lg px-3 py-2 mb-4 max-w-sm">
          <span className="text-[#888780]">🔍</span>
          <input
            type="text"
            placeholder="Search by name or barcode..."
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
                {['Name', 'Price', 'Stock', 'Unit', 'Tax', 'EAN', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#5f5e5a] border-b border-[#d1d0c9]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[13px] text-[#888780]">No products found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafaf8] border-b border-[#e8e7e0] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1a1a18]">{p.name}</div>
                      {p.description && <div className="text-[11px] text-[#888780]">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#1a1a18]">₹{p.price} <span className="text-[11px] text-[#888780]">({p.priceType})</span></td>
                    <td className="px-4 py-3">
                      <span className={`text-[13px] font-medium ${p.stock < 10 ? 'text-[#791F1F]' : 'text-[#1a1a18]'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{p.unit || '—'}</td>
                    <td className="px-4 py-3 text-[#5f5e5a]">{p.tax ? `${p.tax}%` : '—'}</td>
                    <td className="px-4 py-3 text-[#5f5e5a] font-mono text-[12px]">{p.ean || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
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

      {/* Add product modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-[#d1d0c9] w-[480px] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-[15px] font-medium text-[#1a1a18]">Add product</div>
              <button onClick={() => setShowAdd(false)} className="text-[#888780] hover:text-[#1a1a18] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                    required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                    required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Unit</label>
                  <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    placeholder="kg, piece, box"
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Tax %</label>
                  <input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})}
                    placeholder="18"
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">EAN / Barcode</label>
                  <input value={form.ean} onChange={e => setForm({...form, ean: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Price type</label>
                <select value={form.priceType} onChange={e => setForm({...form, priceType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]">
                  <option value="EXCLUSIVE">Exclusive of GST</option>
                  <option value="INCLUSIVE">Inclusive of GST</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]" />
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
                  {createMutation.isPending ? 'Adding...' : 'Add product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}