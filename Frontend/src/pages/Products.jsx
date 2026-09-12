import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Trash2, Package } from 'lucide-react'
import api from '../services/api'

export default function Products() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const fileInputRef = useRef(null)
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

  const uploadImage = async (productId, file) => {
    setUploadingId(productId)
    try {
      const formData = new FormData()
      formData.append('image', file)
      await api.post(`/upload/product/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      queryClient.invalidateQueries(['products'])
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploadingId(null)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ean?.includes(search)
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      tax: form.tax ? parseFloat(form.tax) : undefined,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="text-[14px] font-semibold text-[#09090b]">Products</div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white cursor-pointer"
          style={{ background: '#2563eb' }}
        >
          <Plus size={14} />
          Add product
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Search */}
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mb-4 max-w-sm" style={{ border: '1px solid #e4e4e7' }}>
          <Search size={14} className="text-[#a1a1aa]" />
          <input
            type="text"
            placeholder="Search by name or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] text-[#09090b] outline-none bg-transparent placeholder-[#a1a1aa]"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #e4e4e7' }}>
                {['Image', 'Name', 'Price', 'Stock', 'Unit', 'Tax', 'EAN', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-[#a1a1aa]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-[#a1a1aa]">No products found</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafafa]" style={{ borderBottom: '1px solid #f4f4f5' }}>
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div
                        className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer relative group"
                        style={{ border: '1px solid #e4e4e7', background: '#f4f4f5' }}
                        onClick={() => {
                          fileInputRef.current.dataset.productId = p.id
                          fileInputRef.current.click()
                        }}
                      >
                        {uploadingId === p.id ? (
                          <div className="text-[10px] text-[#71717a]">...</div>
                        ) : p.image ? (
                          <>
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload size={12} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <Package size={16} className="text-[#a1a1aa]" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                              <Upload size={12} className="text-[#52525b]" />
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#09090b]">{p.name}</div>
                      {p.description && <div className="text-[11px] text-[#71717a]">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#09090b]">
                      ₹{p.price}
                      <span className="text-[10px] text-[#a1a1aa] ml-1">({p.priceType === 'INCLUSIVE' ? 'inc' : 'exc'})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${p.stock < 10 ? 'text-[#ef4444]' : 'text-[#09090b]'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#52525b]">{p.unit || '—'}</td>
                    <td className="px-4 py-3 text-[#52525b]">{p.tax ? `${p.tax}%` : '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#52525b]">{p.ean || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="text-[#a1a1aa] hover:text-[#ef4444] cursor-pointer transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0]
            const productId = e.target.dataset.productId
            if (file && productId) uploadImage(productId, file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Add product modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[500px] p-6" style={{ border: '1px solid #e4e4e7' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold text-[#09090b]">Add product</div>
              <button onClick={() => setShowAdd(false)} className="text-[#a1a1aa] hover:text-[#09090b] cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                    required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Price *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}
                    required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Stock</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Unit</label>
                  <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                    placeholder="kg, piece, box"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Tax %</label>
                  <input type="number" value={form.tax} onChange={e => setForm({...form, tax: e.target.value})}
                    placeholder="18"
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">EAN / Barcode</label>
                  <input value={form.ean} onChange={e => setForm({...form, ean: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                    style={{ border: '1px solid #e4e4e7', background: '#fafafa' }} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Price type</label>
                <select value={form.priceType} onChange={e => setForm({...form, priceType: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                  style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}>
                  <option value="EXCLUSIVE">Exclusive of GST</option>
                  <option value="INCLUSIVE">Inclusive of GST</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none focus:border-[#2563eb]"
                  style={{ border: '1px solid #e4e4e7', background: '#fafafa' }} />
              </div>

              {createMutation.isError && (
                <div className="text-[12px] text-[#ef4444] bg-[#fef2f2] px-3 py-2 rounded-lg">
                  {createMutation.error?.response?.data?.error || 'Something went wrong'}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 rounded-lg text-[13px] text-[#09090b] cursor-pointer"
                  style={{ border: '1px solid #e4e4e7' }}>
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2 rounded-lg text-white text-[13px] font-medium cursor-pointer disabled:opacity-50"
                  style={{ background: '#2563eb' }}>
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