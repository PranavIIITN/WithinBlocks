import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, Package } from 'lucide-react'
import api from '../services/api'

const UNITS = [
  { code: 'PCS', label: 'PCS - Pieces' },
  { code: 'BOX', label: 'BOX - Box' },
  { code: 'DOZ', label: 'DOZ - Dozen' },
  { code: 'SET', label: 'SET - Set' },
  { code: 'PKT', label: 'PKT - Packet' },
  { code: 'GMS', label: 'GMS - Grams' },
  { code: 'KGS', label: 'KGS - Kilograms' },
  { code: 'MGS', label: 'MGS - Milligrams' },
  { code: 'LBS', label: 'LBS - Pounds' },
  { code: 'MLT', label: 'MLT - Millilitres' },
  { code: 'LTR', label: 'LTR - Litres' },
  { code: 'CMS', label: 'CMS - Centimetres' },
  { code: 'MTR', label: 'MTR - Metres' },
  { code: 'FTS', label: 'FTS - Feet' },
  { code: 'INC', label: 'INC - Inches' },
]

const GST_RATES = [0, 5, 12, 18, 28]

export default function EditProduct() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [form, setForm] = useState(null)

  // Fetch existing product
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(res => res.data.data),
  })

  // Pre-fill form when product loads
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        mrp: product.mrp || '',
        price: product.price || '',
        priceType: product.priceType || 'EXCLUSIVE',
        stock: product.stock || 0,
        unit: product.unit || '',
        netQuantity: product.netQuantity || '',
        tax: product.tax || '',
        ean: product.ean || '',
        hsn: product.hsn || '',
      })
      if (product.image) {
        setImagePreview(product.image)
      }
    }
  }, [product])

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/products/${id}`, data)
      const updated = res.data.data

      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        await api.post(`/upload/product/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products'])
      queryClient.invalidateQueries(['product', id])
      navigate('/products')
    },
  })

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate({
      ...form,
      mrp: form.mrp ? parseFloat(form.mrp) : undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      netQuantity: form.netQuantity ? parseFloat(form.netQuantity) : undefined,
      tax: form.tax ? parseFloat(form.tax) : undefined,
    })
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg text-[13px] text-[#09090b] outline-none"
  const inputStyle = { border: '1px solid #e4e4e7', background: '#fafafa' }
  const labelClass = "block text-[12px] font-medium text-[#09090b] mb-1.5"
  const sectionClass = "bg-white rounded-xl p-5 mb-4"

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[13px] text-[#71717a]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-1.5 text-[13px] text-[#71717a] hover:text-[#09090b] cursor-pointer"
          >
            <ArrowLeft size={14} />
            Products
          </button>
          <span className="text-[#e4e4e7]">·</span>
          <div className="text-[14px] font-semibold text-[#09090b]">Edit — {product?.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/products')}
            className="px-3 py-1.5 rounded-lg text-[13px] text-[#09090b] cursor-pointer"
            style={{ border: '1px solid #e4e4e7' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
            style={{ background: '#2563eb' }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f5]">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-5">

              {/* Left — Image */}
              <div className="col-span-1">
                <div className={sectionClass} style={{ border: '1px solid #e4e4e7' }}>
                  <div className="text-[13px] font-semibold text-[#09090b] mb-4">Product image</div>
                  <div
                    className="relative rounded-xl overflow-hidden cursor-pointer flex flex-col items-center justify-center"
                    style={{
                      border: '2px dashed #e4e4e7',
                      height: '200px',
                      background: imagePreview ? 'transparent' : '#fafafa'
                    }}
                    onClick={() => fileInputRef.current.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                          <Upload size={20} className="text-white mb-2" />
                          <span className="text-[12px] text-white">Change image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center mb-3">
                          <Package size={22} className="text-[#2563eb]" />
                        </div>
                        <div className="text-[13px] font-medium text-[#09090b]">Upload image</div>
                        <div className="text-[11px] text-[#71717a] mt-1">Drag and drop or click</div>
                        <div className="text-[10px] text-[#a1a1aa] mt-1">PNG, JPG, WEBP up to 5MB</div>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageFile(null) }}
                      className="w-full mt-3 py-1.5 rounded-lg text-[12px] text-[#ef4444] cursor-pointer"
                      style={{ border: '1px solid #fecaca' }}
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              {/* Right — Details */}
              <div className="col-span-2">

                {/* Basic info */}
                <div className={sectionClass} style={{ border: '1px solid #e4e4e7' }}>
                  <div className="text-[13px] font-semibold text-[#09090b] mb-4">Basic information</div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelClass}>Product name *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        className={inputClass}
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                        rows={2}
                        className={inputClass}
                        style={{ ...inputStyle, resize: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className={sectionClass} style={{ border: '1px solid #e4e4e7' }}>
                  <div className="text-[13px] font-semibold text-[#09090b] mb-4">Pricing</div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>MRP</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#71717a]">₹</span>
                        <input
                          type="number"
                          value={form.mrp}
                          onChange={e => setForm({...form, mrp: e.target.value})}
                          className={inputClass}
                          style={{ ...inputStyle, paddingLeft: '24px' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Selling price *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#71717a]">₹</span>
                        <input
                          type="number"
                          value={form.price}
                          onChange={e => setForm({...form, price: e.target.value})}
                          className={inputClass}
                          style={{ ...inputStyle, paddingLeft: '24px' }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Price type</label>
                      <select
                        value={form.priceType}
                        onChange={e => setForm({...form, priceType: e.target.value})}
                        className={inputClass}
                        style={inputStyle}
                      >
                        <option value="EXCLUSIVE">Exclusive of GST</option>
                        <option value="INCLUSIVE">Inclusive of GST</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>GST rate</label>
                      <select
                        value={form.tax}
                        onChange={e => setForm({...form, tax: e.target.value})}
                        className={inputClass}
                        style={inputStyle}
                      >
                        <option value="">Select GST rate</option>
                        {GST_RATES.map(rate => (
                          <option key={rate} value={rate}>{rate}%</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className={sectionClass} style={{ border: '1px solid #e4e4e7' }}>
                  <div className="text-[13px] font-semibold text-[#09090b] mb-4">Inventory & units</div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>Stock quantity</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={e => setForm({...form, stock: e.target.value})}
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Unit</label>
                      <select
                        value={form.unit}
                        onChange={e => setForm({...form, unit: e.target.value})}
                        className={inputClass}
                        style={inputStyle}
                      >
                        <option value="">Select unit</option>
                        {UNITS.map(u => (
                          <option key={u.code} value={u.code}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Net quantity</label>
                    <input
                      type="number"
                      value={form.netQuantity}
                      onChange={e => setForm({...form, netQuantity: e.target.value})}
                      placeholder="e.g. 500 for 500g"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Compliance */}
                <div className={sectionClass} style={{ border: '1px solid #e4e4e7' }}>
                  <div className="text-[13px] font-semibold text-[#09090b] mb-4">GST compliance</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>HSN code</label>
                      <input
                        value={form.hsn}
                        onChange={e => setForm({...form, hsn: e.target.value})}
                        placeholder="e.g. 4820"
                        className={inputClass}
                        style={{ ...inputStyle, fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>EAN / Barcode</label>
                      <input
                        value={form.ean}
                        onChange={e => setForm({...form, ean: e.target.value})}
                        placeholder="e.g. 1234567890123"
                        className={inputClass}
                        style={{ ...inputStyle, fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>

                {updateMutation.isError && (
                  <div className="text-[13px] text-[#ef4444] bg-[#fef2f2] px-4 py-3 rounded-lg mb-4" style={{ border: '1px solid #fecaca' }}>
                    {updateMutation.error?.response?.data?.error || 'Something went wrong'}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}