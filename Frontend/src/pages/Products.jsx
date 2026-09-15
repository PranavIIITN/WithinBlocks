import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Package, MoreHorizontal, Pencil, Check, X, AlertTriangle } from 'lucide-react'
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

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of stock', color: '#ef4444', bg: '#fef2f2' }
    if (stock < 10) return { label: 'Low stock', color: '#f59e0b', bg: '#fffbeb' }
    return { label: 'Active', color: '#22c55e', bg: '#f0fdf4' }
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
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa] w-[35%]">Product details</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa] w-[20%]">Price & MRP</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa] w-[15%]">Stock</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa] w-[15%]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-medium text-[#71717a] bg-[#fafafa] w-[15%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#a1a1aa]">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
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
                filtered.map((p) => {
                  const status = getStockStatus(p.stock)
                  return (
                    <tr key={p.id} className="hover:bg-[#fafafa]" style={{ borderBottom: '1px solid #f4f4f5' }}>

                      {/* Product details */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {/* Image */}
                          <div
                            className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer relative group flex-shrink-0"
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
                                  <Upload size={14} className="text-white" />
                                </div>
                              </>
                            ) : (
                              <>
                                <Package size={20} className="text-[#a1a1aa]" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                  <Upload size={14} className="text-[#52525b]" />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Details */}
                          <div>
                            <div className="font-medium text-[#09090b] mb-0.5">{p.name}</div>
                            {p.description && <div className="text-[11px] text-[#71717a] mb-0.5">{p.description}</div>}
                            <div className="flex items-center gap-2 mt-1">
                              {p.ean && (
                                <span className="text-[10px] font-mono text-[#71717a] bg-[#f4f4f5] px-1.5 py-0.5 rounded">
                                  EAN: {p.ean}
                                </span>
                              )}
                              {p.hsn && (
                                <span className="text-[10px] font-mono text-[#71717a] bg-[#f4f4f5] px-1.5 py-0.5 rounded">
                                  HSN: {p.hsn}
                                </span>
                              )}
                              {p.unit && (
                                <span className="text-[10px] text-[#71717a] bg-[#f4f4f5] px-1.5 py-0.5 rounded">
                                  {p.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price & MRP */}
                      <td className="px-4 py-4">
                        {/* Selling price — inline edit */}
                        {editingPrice === p.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[12px] text-[#71717a]">₹</span>
                            <input
                              type="number"
                              value={priceValue}
                              onChange={e => setPriceValue(e.target.value)}
                              className="w-20 px-2 py-1 rounded text-[13px] outline-none"
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
                            className="flex items-center gap-1.5 cursor-pointer group mb-1"
                            onClick={() => { setEditingPrice(p.id); setPriceValue(p.price) }}
                          >
                            <span className="text-[13px] font-medium text-[#09090b]">₹{p.price}</span>
                            <span className="text-[10px] text-[#a1a1aa]">{p.priceType === 'INCLUSIVE' ? 'incl. GST' : 'excl. GST'}</span>
                            <Pencil size={10} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                        {p.mrp && (
                          <div className="text-[11px] text-[#71717a]">
                            MRP: <span className="line-through">₹{p.mrp}</span>
                            <span className="text-[#22c55e] ml-1">
                              {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off
                            </span>
                          </div>
                        )}
                        {p.tax && (
                          <div className="text-[10px] text-[#a1a1aa] mt-0.5">GST: {p.tax}%</div>
                        )}
                      </td>

                      {/* Stock — inline edit */}
                      <td className="px-4 py-4">
                        {editingStock === p.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={stockValue}
                              onChange={e => setStockValue(e.target.value)}
                              className="w-16 px-2 py-1 rounded text-[13px] outline-none"
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
                            className="cursor-pointer group"
                            onClick={() => { setEditingStock(p.id); setStockValue(p.stock) }}
                          >
                            <div className="flex items-center gap-1">
                              <span className={`text-[13px] font-medium ${p.stock < 10 ? 'text-[#ef4444]' : 'text-[#09090b]'}`}>
                                {p.stock} units
                              </span>
                              <Pencil size={10} className="text-[#a1a1aa] opacity-0 group-hover:opacity-100" />
                            </div>
                            {p.stock < 10 && p.stock > 0 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <AlertTriangle size={10} className="text-[#f59e0b]" />
                                <span className="text-[10px] text-[#f59e0b]">Low stock</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium"
                          style={{ background: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/products/${p.id}/edit`)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717a] hover:bg-[#eff6ff] hover:text-[#2563eb] cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>

                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id) }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#71717a] hover:bg-[#f4f4f5] cursor-pointer"
                              title="More"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                            {openMenu === p.id && (
                              <div
                                className="absolute right-0 top-8 bg-white rounded-lg shadow-lg z-10 py-1 w-36"
                                style={{ border: '1px solid #e4e4e7' }}
                                onClick={e => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    fileInputRef.current.dataset.productId = p.id
                                    fileInputRef.current.click()
                                    setOpenMenu(null)
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#09090b] hover:bg-[#f4f4f5] cursor-pointer"
                                >
                                  <Upload size={13} className="text-[#71717a]" />
                                  Upload image
                                </button>
                                <div style={{ borderTop: '1px solid #f4f4f5' }} />
                                <button
                                  onClick={() => { deleteMutation.mutate(p.id); setOpenMenu(null) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer"
                                >
                                  <Package size={13} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
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