import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Trash2, Package, MoreHorizontal, Pencil, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Products() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [editingStock, setEditingStock] = useState(null)
  const [editingPrice, setEditingPrice] = useState(null)
  const [stockValue, setStockValue] = useState('')
  const [priceValue, setPriceValue] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const fileInputRef = useRef(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['products']),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
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

  const saveStock = (id) => {
    updateMutation.mutate({ id, data: { stock: parseInt(stockValue) } })
    setEditingStock(null)
  }

  const savePrice = (id) => {
    updateMutation.mutate({ id, data: { price: parseFloat(priceValue) } })
    setEditingPrice(null)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.ean?.includes(search)
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={() => setOpenMenu(null)}>
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="text-[14px] font-semibold text-[#09090b]">Products</div>
        <button
          onClick={() => navigate('/products/new')}
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
                {['Image', 'Name', 'Price', 'MRP', 'Stock', 'Unit', 'Tax', 'EAN', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[13px] text-[#a1a1aa]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#f4f4f5] flex items-center justify-center">
                        <Package size={20} className="text-[#a1a1aa]" />
                      </div>
                      <div className="text-[13px] text-[#71717a]">No products yet</div>
                      <button onClick={() => navigate('/products/new')} className="text-[13px] text-[#2563eb] cursor-pointer">
                        Add your first product →
                      </button>
                    </div>
                  </td>
                </tr>
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

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#09090b]">{p.name}</div>
                      {p.description && <div className="text-[11px] text-[#71717a]">{p.description}</div>}
                      {p.hsn && <div className="text-[10px] text-[#a1a1aa] font-mono">HSN: {p.hsn}</div>}
                    </td>

                    {/* Price — inline edit */}
                    <td className="px-4 py-3">
                      {editingPrice === p.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] text-[#71717a]">₹</span>
                          <input
                            type="number"
                            value={priceValue}
                            onChange={e => setPriceValue(e.target.value)}
                            className="w-20 px-2 py-1 rounded text-[13px] text-[#09090b] outline-none"
                            style={{ border: '1px solid #2563eb' }}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') savePrice(p.id)
                              if (e.key === 'Escape') setEditingPrice(null)
                            }}
                          />
                          <button onClick={() => savePrice(p.id)} className="text-[#22c55e] cursor-pointer"><Check size={13} /></button>
                          <button onClick={() => setEditingPrice(null)} className="text-[#a1a1aa] cursor-pointer"><X size={13} /></button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer hover:text-[#2563eb] flex items-center gap-1 group"
                          onClick={() => { setEditingPrice(p.id); setPriceValue(p.price) }}
                        >
                          <span className="text-[#09090b]">₹{p.price}</span>
                          <span className="text-[10px] text-[#a1a1aa]">({p.priceType === 'INCLUSIVE' ? 'inc' : 'exc'})</span>
                          <Pencil size={10} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* MRP */}
                    <td className="px-4 py-3 text-[#71717a]">
                      {p.mrp ? `₹${p.mrp}` : '—'}
                    </td>

                    {/* Stock — inline edit */}
                    <td className="px-4 py-3">
                      {editingStock === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={stockValue}
                            onChange={e => setStockValue(e.target.value)}
                            className="w-16 px-2 py-1 rounded text-[13px] text-[#09090b] outline-none"
                            style={{ border: '1px solid #2563eb' }}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveStock(p.id)
                              if (e.key === 'Escape') setEditingStock(null)
                            }}
                          />
                          <button onClick={() => saveStock(p.id)} className="text-[#22c55e] cursor-pointer"><Check size={13} /></button>
                          <button onClick={() => setEditingStock(null)} className="text-[#a1a1aa] cursor-pointer"><X size={13} /></button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer flex items-center gap-1 group"
                          onClick={() => { setEditingStock(p.id); setStockValue(p.stock) }}
                        >
                          <span className={`font-medium ${p.stock < 10 ? 'text-[#ef4444]' : 'text-[#09090b]'}`}>
                            {p.stock}
                          </span>
                          <Pencil size={10} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3 text-[#52525b]">{p.unit || '—'}</td>

                    {/* Tax */}
                    <td className="px-4 py-3 text-[#52525b]">{p.tax ? `${p.tax}%` : '—'}</td>

                    {/* EAN */}
                    <td className="px-4 py-3 font-mono text-[11px] text-[#52525b]">{p.ean || '—'}</td>

                    {/* Actions — three dot menu */}
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id) }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#a1a1aa] hover:bg-[#f4f4f5] hover:text-[#09090b] cursor-pointer"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenu === p.id && (
                          <div
                            className="absolute right-0 top-8 bg-white rounded-lg shadow-lg z-10 py-1 w-36"
                            style={{ border: '1px solid #e4e4e7' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { navigate(`/products/${p.id}/edit`); setOpenMenu(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#09090b] hover:bg-[#f4f4f5] cursor-pointer"
                            >
                              <Pencil size={13} className="text-[#71717a]" />
                              Edit product
                            </button>
                            <div style={{ borderTop: '1px solid #f4f4f5' }} />
                            <button
                              onClick={() => { deleteMutation.mutate(p.id); setOpenMenu(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
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
    </div>
  )
}