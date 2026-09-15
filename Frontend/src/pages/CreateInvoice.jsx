import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, Plus, Trash2, ChevronDown } from 'lucide-react'
import api from '../services/api'

const PAYMENT_TERMS = [
  { label: 'Due on Receipt', days: 0 },
  { label: 'Net 15', days: 15 },
  { label: 'Net 30', days: 30 },
  { label: 'Net 45', days: 45 },
  { label: 'Net 60', days: 60 },
  { label: 'Custom', days: null },
]

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [showTermsDropdown, setShowTermsDropdown] = useState(false)
  const [items, setItems] = useState([])
  const [paymentTerm, setPaymentTerm] = useState(PAYMENT_TERMS[0])
  const [form, setForm] = useState({
    invoiceNo: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    notes: 'Thanks for your business.',
    termsAndConditions: '',
  })

  const customerRef = useRef(null)
  const productRef = useRef(null)

  // Search customers
  const { data: customerResults = [] } = useQuery({
    queryKey: ['customer-search', customerSearch],
    queryFn: () => api.get(`/invoices/search/customers?q=${customerSearch}`).then(res => res.data.data),
    enabled: customerSearch.length > 1,
  })

  // Search products
  const { data: productResults = [] } = useQuery({
    queryKey: ['product-search', productSearch],
    queryFn: () => api.get(`/invoices/search/products?q=${productSearch}`).then(res => res.data.data),
    enabled: productSearch.length > 1,
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/invoices', data),
    onSuccess: (res) => navigate(`/invoices/${res.data.data.id}`),
  })

  // Update due date when payment term changes
  useEffect(() => {
    if (paymentTerm.days !== null) {
      const date = new Date(form.invoiceDate)
      date.setDate(date.getDate() + paymentTerm.days)
      setForm(f => ({ ...f, dueDate: date.toISOString().split('T')[0] }))
    }
  }, [paymentTerm, form.invoiceDate])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerDropdown(false)
      }
      if (productRef.current && !productRef.current.contains(e.target)) {
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addProduct = (product) => {
    const existing = items.find(i => i.productId === product.id)
    if (existing) {
      setItems(items.map(i =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ))
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        image: product.image,
        hsn: product.hsn,
        quantity: 1,
        unitPrice: product.price,
        tax: product.tax || 0,
        discount: 0,
      }])
    }
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const removeItem = (productId) => setItems(items.filter(i => i.productId !== productId))

  const updateItem = (productId, field, value) => {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i))
  }

  const getItemAmount = (item) => {
    const subtotal = item.quantity * item.unitPrice
    const discountAmount = (subtotal * item.discount) / 100
    return subtotal - discountAmount
  }

  const subtotal = items.reduce((sum, item) => sum + getItemAmount(item), 0)
  const taxAmount = items.reduce((sum, item) => {
    const amount = getItemAmount(item)
    return sum + (amount * item.tax) / 100
  }, 0)
  const total = subtotal + taxAmount
  const totalQty = items.reduce((sum, item) => sum + Number(item.quantity), 0)

  const handleSave = (status) => {
    if (!selectedCustomer) return alert('Please select a customer')
    if (items.length === 0) return alert('Please add at least one item')

    createMutation.mutate({
      customerId: selectedCustomer.id,
      invoiceNo: form.invoiceNo || undefined,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
      status,
      items: items.map(i => ({
        productId: i.productId,
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        tax: parseFloat(i.tax),
      })),
    })
  }

  const inputStyle = {
    border: '1px solid #e4e4e7',
    background: '#fff',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#09090b',
    outline: 'none',
    width: '100%',
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#ef4444',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="flex items-center gap-3">
          <div className="text-[16px] font-semibold text-[#09090b] flex items-center gap-2">
            <span>📄</span> New Invoice
          </div>
        </div>
        <button onClick={() => navigate('/invoices')} className="text-[#71717a] hover:text-[#09090b] cursor-pointer text-[20px]">✕</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">

          {/* Customer + Invoice details */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Customer */}
            <div>
              <label style={labelStyle}>Customer Name *</label>
              <div ref={customerRef} className="relative">
                {selectedCustomer ? (
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer"
                    style={{ border: '1px solid #e4e4e7' }}
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <div>
                      <div className="text-[13px] font-medium text-[#09090b]">{selectedCustomer.name}</div>
                      {selectedCustomer.gstin && <div className="text-[11px] text-[#71717a]">GSTIN: {selectedCustomer.gstin}</div>}
                    </div>
                    <ChevronDown size={14} className="text-[#71717a]" />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        style={inputStyle}
                        placeholder="Select or add a customer"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                        onFocus={() => setShowCustomerDropdown(true)}
                      />
                      {showCustomerDropdown && customerResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg z-20 mt-1 overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
                          {customerResults.map(c => (
                            <div
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch('') }}
                              className="px-4 py-3 hover:bg-[#f4f4f5] cursor-pointer"
                              style={{ borderBottom: '1px solid #f4f4f5' }}
                            >
                              <div className="text-[13px] font-medium text-[#09090b]">{c.name}</div>
                              <div className="text-[11px] text-[#71717a]">{c.phone} {c.gstin && `· GSTIN: ${c.gstin}`}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="px-3 py-2 rounded-lg text-white text-[13px] cursor-pointer" style={{ background: '#2563eb' }}>
                      <Search size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ ...labelStyle, color: '#ef4444' }}>Invoice # *</label>
                <input
                  style={inputStyle}
                  placeholder="INV-000001"
                  value={form.invoiceNo}
                  onChange={e => setForm({ ...form, invoiceNo: e.target.value })}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#52525b' }}>Invoice Date *</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.invoiceDate}
                  onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#52525b' }}>Terms</label>
                <div className="relative">
                  <button
                    onClick={() => setShowTermsDropdown(!showTermsDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-[#09090b]"
                    style={{ border: '1px solid #e4e4e7' }}
                  >
                    {paymentTerm.label}
                    <ChevronDown size={14} className="text-[#71717a]" />
                  </button>
                  {showTermsDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg z-20 mt-1 overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
                      {PAYMENT_TERMS.map(term => (
                        <div
                          key={term.label}
                          onClick={() => { setPaymentTerm(term); setShowTermsDropdown(false) }}
                          className="px-4 py-2.5 hover:bg-[#f4f4f5] cursor-pointer text-[13px] text-[#09090b]"
                        >
                          {term.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, color: '#52525b' }}>Due Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-4" style={{ border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #e4e4e7' }}>
              <div className="text-[13px] font-semibold text-[#09090b]">Item Table</div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1.5 text-[12px] text-[#2563eb] cursor-pointer">
                  📷 Scan Item
                </button>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid text-[11px] font-semibold text-[#71717a] uppercase tracking-wide px-4 py-2 bg-[#fafafa]" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '12px', borderBottom: '1px solid #e4e4e7' }}>
              <div>Item Details</div>
              <div className="text-right">Quantity</div>
              <div className="text-right">Rate</div>
              <div className="text-right">Discount</div>
              <div className="text-right">Tax</div>
              <div className="text-right">Amount</div>
            </div>

            {/* Items */}
            {items.map((item, index) => (
              <div
                key={item.productId}
                className="grid px-4 py-3 items-center"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  gap: '12px',
                  borderBottom: '1px solid #f4f4f5',
                  background: index % 2 === 0 ? '#fff' : '#fafafa'
                }}
              >
                {/* Item details */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ border: '1px solid #e4e4e7', background: '#f4f4f5' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#a1a1aa] text-[18px]">📦</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#09090b]">{item.name}</div>
                    {item.hsn && <div className="text-[11px] text-[#71717a]">HSN: {item.hsn}</div>}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex justify-end">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateItem(item.productId, 'quantity', e.target.value)}
                    className="text-right w-20 px-2 py-1 rounded text-[13px] outline-none"
                    style={{ border: '1px solid #e4e4e7' }}
                    min="1"
                  />
                </div>

                {/* Rate */}
                <div className="flex justify-end">
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={e => updateItem(item.productId, 'unitPrice', e.target.value)}
                    className="text-right w-24 px-2 py-1 rounded text-[13px] outline-none"
                    style={{ border: '1px solid #e4e4e7' }}
                  />
                </div>

                {/* Discount */}
                <div className="flex justify-end items-center gap-1">
                  <input
                    type="number"
                    value={item.discount}
                    onChange={e => updateItem(item.productId, 'discount', e.target.value)}
                    className="text-right w-16 px-2 py-1 rounded text-[13px] outline-none"
                    style={{ border: '1px solid #e4e4e7' }}
                    min="0"
                    max="100"
                  />
                  <span className="text-[12px] text-[#71717a]">%</span>
                </div>

                {/* Tax */}
                <div className="flex justify-end">
                  <select
                    value={item.tax}
                    onChange={e => updateItem(item.productId, 'tax', e.target.value)}
                    className="text-right px-2 py-1 rounded text-[13px] outline-none"
                    style={{ border: '1px solid #e4e4e7' }}
                  >
                    {[0, 5, 12, 18, 28].map(r => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                  </select>
                </div>

                {/* Amount + Delete */}
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[13px] font-medium text-[#09090b] w-20 text-right">
                    ₹{getItemAmount(item).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-[#a1a1aa] hover:text-[#ef4444] cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add item row */}
            <div ref={productRef} className="px-4 py-3 relative" style={{ borderBottom: '1px solid #e4e4e7' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ border: '1px dashed #d1d5db', background: '#fafafa' }}>
                  <span className="text-[#a1a1aa] text-[18px]">📦</span>
                </div>
                <input
                  style={{ ...inputStyle, border: 'none', background: 'transparent', padding: '0' }}
                  placeholder="Type or click to select an item."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                  onFocus={() => setShowProductDropdown(true)}
                />
              </div>
              {showProductDropdown && productResults.length > 0 && (
                <div className="absolute top-full left-4 right-4 bg-white rounded-lg shadow-lg z-20 mt-1 overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
                  {productResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#f4f4f5] cursor-pointer"
                      style={{ borderBottom: '1px solid #f4f4f5' }}
                    >
                      <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0" style={{ border: '1px solid #e4e4e7' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#f4f4f5] flex items-center justify-center text-[12px]">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#09090b]">{p.name}</div>
                        <div className="text-[11px] text-[#71717a]">Stock: {p.stock} · ₹{p.price} · Tax: {p.tax}%</div>
                      </div>
                      <div className="text-[13px] font-medium text-[#09090b]">₹{p.price}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Row button */}
            <div className="px-4 py-2 flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-[12px] text-[#2563eb] cursor-pointer hover:underline">
                <Plus size={13} />
                Add New Row
              </button>
            </div>
          </div>

          {/* Notes + Totals */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Left — Notes & Terms */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Customer Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none resize-none"
                  style={{ border: '1px solid #e4e4e7' }}
                />
                <div className="text-[11px] text-[#71717a] mt-1">Will be displayed on the invoice</div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Terms & Conditions</label>
                <textarea
                  value={form.termsAndConditions}
                  onChange={e => setForm({ ...form, termsAndConditions: e.target.value })}
                  rows={3}
                  placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                  className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none resize-none"
                  style={{ border: '1px solid #e4e4e7' }}
                />
              </div>
            </div>

            {/* Right — Totals */}
            <div>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
                <div className="flex justify-between px-4 py-3 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <span className="font-semibold text-[#09090b]">Sub Total</span>
                  <span className="font-semibold text-[#09090b]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                  <span className="text-[#71717a]">Tax</span>
                  <span className="text-[#09090b]">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-[14px] font-bold text-[#09090b]">Total (₹)</span>
                  <span className="text-[14px] font-bold text-[#09090b]">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {createMutation.isError && (
            <div className="text-[13px] text-[#ef4444] bg-[#fef2f2] px-4 py-3 rounded-lg mb-4" style={{ border: '1px solid #fecaca' }}>
              {createMutation.error?.response?.data?.error || 'Something went wrong'}
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar — like Zoho */}
      <div className="flex items-center justify-between px-6 py-4 bg-white flex-shrink-0" style={{ borderTop: '1px solid #e4e4e7' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg text-[13px] text-[#09090b] cursor-pointer disabled:opacity-50"
            style={{ border: '1px solid #e4e4e7' }}
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('UNPAID')}
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
            style={{ background: '#2563eb' }}
          >
            {createMutation.isPending ? 'Saving...' : 'Save and Send'}
          </button>
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 text-[13px] text-[#71717a] cursor-pointer hover:text-[#09090b]"
          >
            Cancel
          </button>
        </div>
        <div className="text-[13px] text-[#71717a]">
          Total Amount: <span className="font-semibold text-[#09090b]">₹{total.toFixed(2)}</span>
          <span className="mx-3">·</span>
          Total Quantity: <span className="font-semibold text-[#09090b]">{totalQty}</span>
        </div>
      </div>
    </div>
  )
}