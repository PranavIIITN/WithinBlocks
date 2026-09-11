import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    invoiceNo: '',
    dueDate: '',
    notes: '',
    status: 'UNPAID',
  })

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
    onSuccess: () => navigate('/invoices'),
  })

  // Add product to items
  const addProduct = (product) => {
    const existing = items.find(i => i.productId === product.id)
    if (existing) {
      setItems(items.map(i =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
        tax: product.tax || 0,
        priceType: product.priceType,
      }])
    }
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const removeItem = (productId) => {
    setItems(items.filter(i => i.productId !== productId))
  }

  const updateItem = (productId, field, value) => {
    setItems(items.map(i =>
      i.productId === productId ? { ...i, [field]: value } : i
    ))
  }

  // Calculate totals
  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = (subtotal * item.tax) / 100
    return { subtotal, taxAmount, total: subtotal + taxAmount }
  }

  const totals = items.reduce((acc, item) => {
    const { subtotal, taxAmount, total } = calculateItemTotal(item)
    return {
      subtotal: acc.subtotal + subtotal,
      tax: acc.tax + taxAmount,
      total: acc.total + total,
    }
  }, { subtotal: 0, tax: 0, total: 0 })

  const handleSubmit = (status) => {
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[52px] border-b border-[#d1d0c9] bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="text-[13px] text-[#5f5e5a] cursor-pointer hover:text-[#1a1a18]">
            ← Invoices
          </button>
          <span className="text-[#d1d0c9]">·</span>
          <div className="text-[14px] font-medium text-[#1a1a18]">New invoice</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmit('DRAFT')}
            disabled={createMutation.isPending}
            className="px-3 py-1.5 rounded-lg border border-[#b4b2a9] bg-white text-[#1a1a18] text-[13px] cursor-pointer"
          >
            Save as draft
          </button>
          <button
            onClick={() => handleSubmit('UNPAID')}
            disabled={createMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-[#185FA5] text-white text-[13px] font-medium cursor-pointer disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create invoice'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">

          {/* Invoice details */}
          <div className="bg-white border border-[#d1d0c9] rounded-lg p-5">
            <div className="text-[13px] font-medium text-[#1a1a18] mb-4">Invoice details</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Invoice no. <span className="text-[#888780] font-normal">(auto if empty)</span></label>
                <input
                  value={form.invoiceNo}
                  onChange={e => setForm({...form, invoiceNo: e.target.value})}
                  placeholder="INV-2526-003"
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1a1a18] mb-1.5">Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Payment terms, remarks..."
                  className="w-full px-3 py-2 rounded-lg border border-[#b4b2a9] bg-[#fafaf8] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white border border-[#d1d0c9] rounded-lg p-5">
            <div className="text-[13px] font-medium text-[#1a1a18] mb-4">Bill to</div>
            {selectedCustomer ? (
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[14px] font-medium text-[#1a1a18]">{selectedCustomer.name}</div>
                  <div className="text-[13px] text-[#5f5e5a] mt-1">{selectedCustomer.email}</div>
                  <div className="text-[13px] text-[#5f5e5a]">{selectedCustomer.phone}</div>
                  <div className="text-[13px] text-[#5f5e5a]">{selectedCustomer.address}</div>
                  {selectedCustomer.gstin && (
                    <div className="mt-2 inline-flex items-center bg-[#f5f5f3] border border-[#d1d0c9] rounded px-2 py-1 text-[11px] font-mono text-[#444441]">
                      GSTIN {selectedCustomer.gstin}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[12px] text-[#185FA5] cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 border border-[#b4b2a9] rounded-lg px-3 py-2 bg-[#fafaf8]">
                  <span className="text-[#888780]">🔍</span>
                  <input
                    type="text"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true) }}
                    className="flex-1 text-[13px] text-[#1a1a18] outline-none bg-transparent placeholder-[#b4b2a9]"
                  />
                </div>
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-[#d1d0c9] rounded-lg mt-1 z-10 shadow-sm overflow-hidden">
                    {customerResults.map(c => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch('') }}
                        className="px-4 py-3 hover:bg-[#f5f5f3] cursor-pointer border-b border-[#e8e7e0] last:border-0"
                      >
                        <div className="text-[13px] font-medium text-[#1a1a18]">{c.name}</div>
                        <div className="text-[11px] text-[#888780]">{c.phone} {c.gstin && `· ${c.gstin}`}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-[#d1d0c9] rounded-lg p-5">
            <div className="text-[13px] font-medium text-[#1a1a18] mb-4">Items</div>

            {items.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-2 px-2 mb-2">
                  {['Product', 'Qty', 'Rate', 'Tax %', 'Total', ''].map((h, i) => (
                    <div key={i} className={`text-[11px] font-medium text-[#5f5e5a] ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-2 text-right' : i === 5 ? 'col-span-1' : 'col-span-1'}`}>
                      {h}
                    </div>
                  ))}
                </div>
                {items.map((item) => {
                  const { total } = calculateItemTotal(item)
                  return (
                    <div key={item.productId} className="grid grid-cols-12 gap-2 items-center py-2 border-t border-[#e8e7e0]">
                      <div className="col-span-4 text-[13px] text-[#1a1a18] font-medium">{item.name}</div>
                      <div className="col-span-1">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateItem(item.productId, 'quantity', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#b4b2a9] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5] text-center"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e => updateItem(item.productId, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#b4b2a9] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={e => updateItem(item.productId, 'tax', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#b4b2a9] text-[13px] text-[#1a1a18] outline-none focus:border-[#185FA5]"
                        />
                      </div>
                      <div className="col-span-2 text-right text-[13px] font-medium text-[#1a1a18]">
                        ₹{total.toFixed(2)}
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-[#888780] hover:text-[#791F1F] cursor-pointer text-[13px]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add product search */}
            <div className="relative">
              <div className="flex items-center gap-2 border border-dashed border-[#b4b2a9] rounded-lg px-3 py-2 hover:border-[#185FA5] transition-colors">
                <span className="text-[#888780]">+</span>
                <input
                  type="text"
                  placeholder="Add product by name or scan barcode..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                  className="flex-1 text-[13px] text-[#1a1a18] outline-none bg-transparent placeholder-[#888780]"
                />
              </div>
              {showProductDropdown && productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-[#d1d0c9] rounded-lg mt-1 z-10 shadow-sm overflow-hidden">
                  {productResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="px-4 py-3 hover:bg-[#f5f5f3] cursor-pointer border-b border-[#e8e7e0] last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[13px] font-medium text-[#1a1a18]">{p.name}</div>
                          <div className="text-[11px] text-[#888780]">Stock: {p.stock} · Tax: {p.tax}%</div>
                        </div>
                        <div className="text-[13px] font-medium text-[#1a1a18]">₹{p.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="bg-white border border-[#d1d0c9] rounded-lg p-5">
              <div className="flex justify-end">
                <div className="w-64 flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#5f5e5a]">Subtotal</span>
                    <span className="text-[#1a1a18]">₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#5f5e5a]">Tax</span>
                    <span className="text-[#1a1a18]">₹{totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-[#d1d0c9] my-1"></div>
                  <div className="flex justify-between text-[14px] font-medium">
                    <span className="text-[#1a1a18]">Total</span>
                    <span className="text-[#1a1a18]">₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {createMutation.isError && (
            <div className="text-[12px] text-[#791F1F] bg-[#FCEBEB] px-4 py-3 rounded-lg">
              {createMutation.error?.response?.data?.error || 'Something went wrong'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}