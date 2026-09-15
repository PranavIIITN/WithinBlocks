import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Printer, Trash2, CheckCircle2, Ban, MoreVertical } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

const STATUS_STYLES = {
  UNPAID: { bg: '#FAEEDA', text: '#633806' },
  PAID: { bg: '#EAF3DE', text: '#27500A' },
  OVERDUE: { bg: '#fef2f2', text: '#ef4444' },
  DRAFT: { bg: '#f4f4f5', text: '#71717a', border: '1px solid #e4e4e7' },
  CANCELLED: { bg: '#f4f4f5', text: '#a1a1aa' },
}

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// HSN | Item | Qty | Rate | Total | Tax% | CGST | SGST | IGST | Taxable Value
// Mirrors ITEM_GRID_COLS in CreateInvoice.jsx (minus the trailing delete-button column)
const INVOICE_ITEM_GRID_COLS = '70px 1.8fr 60px 90px 90px 55px 75px 75px 75px 100px'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { company } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(res => res.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status) => api.put(`/invoices/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/invoices/${id}`),
    onSuccess: () => navigate('/invoices'),
  })

  const handleDelete = () => {
    if (window.confirm('Delete this invoice? This cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-[13px] text-[#71717a]">Loading invoice...</div>
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-3">
        <div className="text-[13px] text-[#71717a]">Invoice not found</div>
        <button onClick={() => navigate('/invoices')} className="text-[13px] text-[#2563eb] cursor-pointer hover:underline">
          ← Back to invoices
        </button>
      </div>
    )
  }

  const badge = STATUS_STYLES[invoice.status] || STATUS_STYLES.DRAFT
  const hasIgst = Number(invoice.igst) > 0
  const hasCgstSgst = Number(invoice.cgst) > 0 || Number(invoice.sgst) > 0

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
        }
      `}</style>

      {/* Topbar */}
      <div className="no-print flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="text-[#71717a] hover:text-[#09090b] cursor-pointer flex items-center">
            <ArrowLeft size={18} />
          </button>
          <span style={{ color: '#e4e4e7' }}>|</span>
          <div className="text-[16px] font-semibold text-[#09090b]">{invoice.invoiceNo}</div>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded uppercase tracking-wide"
            style={{ background: badge.bg, color: badge.text, border: badge.border }}
          >
            {invoice.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={() => statusMutation.mutate('UNPAID')}
              disabled={statusMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
              style={{ background: '#2563eb' }}
            >
              Finalize invoice
            </button>
          )}
          {invoice.status === 'UNPAID' && (
            <button
              onClick={() => statusMutation.mutate('PAID')}
              disabled={statusMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
              style={{ background: '#16a34a' }}
            >
              <CheckCircle2 size={14} />
              Mark as Paid
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-[#09090b] cursor-pointer"
            style={{ border: '1px solid #e4e4e7' }}
          >
            <Printer size={14} />
            Print
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(s => !s)}
              className="p-1.5 rounded-lg text-[#71717a] hover:text-[#09090b] cursor-pointer"
              style={{ border: '1px solid #e4e4e7' }}
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div
                className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg z-20 overflow-hidden"
                style={{ border: '1px solid #e4e4e7', minWidth: '160px' }}
                onMouseLeave={() => setShowMenu(false)}
              >
                {invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT' && (
                  <button
                    onClick={() => { setShowMenu(false); statusMutation.mutate('CANCELLED') }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#09090b] hover:bg-[#f4f4f5] cursor-pointer text-left"
                  >
                    <Ban size={14} />
                    Cancel invoice
                  </button>
                )}
                <button
                  onClick={() => { setShowMenu(false); handleDelete() }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-[#ef4444] hover:bg-[#fef2f2] cursor-pointer text-left"
                >
                  <Trash2 size={14} />
                  Delete invoice
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto print-area">
        <div className="max-w-5xl mx-auto p-6">
          <div className="rounded-lg p-8" style={{ border: '1px solid #e4e4e7' }}>

            {/* Header: company + invoice meta */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                {company?.logo && (
                  <img src={company.logo} alt={company.name} className="w-12 h-12 rounded-lg object-cover" style={{ border: '1px solid #e4e4e7' }} />
                )}
                <div>
                  <div className="text-[16px] font-semibold text-[#09090b]">{company?.name || 'Your Company'}</div>
                  {company?.address && <div className="text-[12px] text-[#71717a] mt-0.5 max-w-xs">{company.address}</div>}
                  {company?.gstin && <div className="text-[12px] text-[#71717a]">GSTIN: {company.gstin}</div>}
                  {company?.phone && <div className="text-[12px] text-[#71717a]">{company.phone}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold text-[#09090b] tracking-tight">INVOICE</div>
                <div className="text-[13px] text-[#52525b] mt-1">{invoice.invoiceNo}</div>
              </div>
            </div>

            {/* Bill to + dates */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wide mb-2">Bill To</div>
                <div className="text-[13px] font-medium text-[#09090b]">{invoice.customer?.name}</div>
                {invoice.customer?.address && <div className="text-[12px] text-[#71717a] mt-1 max-w-xs">{invoice.customer.address}</div>}
                {invoice.customer?.phone && <div className="text-[12px] text-[#71717a]">{invoice.customer.phone}</div>}
                {invoice.customer?.email && <div className="text-[12px] text-[#71717a]">{invoice.customer.email}</div>}
                {invoice.customer?.gstin && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded text-[11px] font-mono text-[#52525b]" style={{ background: '#f4f4f5', border: '1px solid #e4e4e7' }}>
                    GSTIN {invoice.customer.gstin}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex justify-end gap-8 text-[13px] mb-1.5">
                  <span className="text-[#71717a]">Invoice Date</span>
                  <span className="text-[#09090b] font-medium w-28">{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex justify-end gap-8 text-[13px] mb-1.5">
                  <span className="text-[#71717a]">Due Date</span>
                  <span className="text-[#09090b] font-medium w-28">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-end gap-8 text-[13px]">
                  <span className="text-[#71717a]">Created By</span>
                  <span className="text-[#09090b] font-medium w-28">{invoice.createdBy?.name || '—'}</span>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="mb-6 rounded-lg overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
              <div
                className="grid text-[11px] font-semibold text-[#71717a] uppercase tracking-wide px-4 py-2.5 bg-[#fafafa]"
                style={{ gridTemplateColumns: INVOICE_ITEM_GRID_COLS, gap: '8px', borderBottom: '1px solid #e4e4e7' }}
              >
                <div>HSN Code</div>
                <div>Item</div>
                <div className="text-right">Qty</div>
                <div className="text-right">Rate</div>
                <div className="text-right">Total</div>
                <div className="text-right">Tax %</div>
                <div className="text-right">CGST</div>
                <div className="text-right">SGST</div>
                <div className="text-right">IGST</div>
                <div className="text-right">Taxable Value</div>
              </div>
              {invoice.items?.map((item, index) => {
                // Backend stores the tax-inclusive line total plus the cgst/sgst/igst
                // split — back out the pre-tax "Total" column from those.
                const preTax = item.total - (item.cgst || 0) - (item.sgst || 0) - (item.igst || 0)
                return (
                <div
                  key={item.id}
                  className="grid px-4 py-3 items-center text-[13px]"
                  style={{
                    gridTemplateColumns: INVOICE_ITEM_GRID_COLS,
                    gap: '8px',
                    borderBottom: index === invoice.items.length - 1 ? 'none' : '1px solid #f4f4f5',
                  }}
                >
                  <div className="text-[12px] text-[#52525b]">{item.product?.hsn || '—'}</div>
                  <div className="font-medium text-[#09090b] truncate" title={item.product?.name}>{item.product?.name}</div>
                  <div className="text-right text-[#52525b]">{item.quantity}</div>
                  <div className="text-right text-[#52525b]">{formatMoney(item.unitPrice)}</div>
                  <div className="text-right text-[#52525b]">{formatMoney(preTax)}</div>
                  <div className="text-right text-[#52525b]">{item.tax}%</div>
                  <div className="text-right text-[12px] text-[#52525b]">{item.cgst > 0 ? formatMoney(item.cgst) : '—'}</div>
                  <div className="text-right text-[12px] text-[#52525b]">{item.sgst > 0 ? formatMoney(item.sgst) : '—'}</div>
                  <div className="text-right text-[12px] text-[#52525b]">{item.igst > 0 ? formatMoney(item.igst) : '—'}</div>
                  <div className="text-right font-medium text-[#09090b]">{formatMoney(item.total)}</div>
                </div>
                )
              })}
            </div>

            {/* Notes + Totals */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                {invoice.notes && (
                  <div>
                    <div className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wide mb-1.5">Notes</div>
                    <div className="text-[13px] text-[#52525b]">{invoice.notes}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
                  <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                    <span className="text-[#71717a]">Subtotal</span>
                    <span className="text-[#09090b]">{formatMoney(invoice.subtotal)}</span>
                  </div>
                  {hasCgstSgst && (
                    <>
                      <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                        <span className="text-[#71717a]">CGST</span>
                        <span className="text-[#09090b]">{formatMoney(invoice.cgst)}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                        <span className="text-[#71717a]">SGST</span>
                        <span className="text-[#09090b]">{formatMoney(invoice.sgst)}</span>
                      </div>
                    </>
                  )}
                  {hasIgst && (
                    <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                      <span className="text-[#71717a]">IGST</span>
                      <span className="text-[#09090b]">{formatMoney(invoice.igst)}</span>
                    </div>
                  )}
                  {!hasCgstSgst && !hasIgst && (
                    <div className="flex justify-between px-4 py-2.5 text-[13px]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                      <span className="text-[#71717a]">Tax</span>
                      <span className="text-[#09090b]">{formatMoney(invoice.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-3" style={{ background: '#fafafa' }}>
                    <span className="text-[14px] font-bold text-[#09090b]">Total</span>
                    <span className="text-[14px] font-bold text-[#09090b]">{formatMoney(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {statusMutation.isError && (
            <div className="no-print text-[13px] text-[#ef4444] bg-[#fef2f2] px-4 py-3 rounded-lg mt-4" style={{ border: '1px solid #fecaca' }}>
              {statusMutation.error?.response?.data?.message || 'Failed to update invoice status'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}