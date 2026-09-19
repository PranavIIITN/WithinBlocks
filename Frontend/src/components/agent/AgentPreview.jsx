import { useState } from 'react'
import { AlertTriangle, Check, X, Pencil, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ---------------------------------------------------------------
// INVOICE PREVIEW — a real tax invoice summary, not a text blob
// ---------------------------------------------------------------
function InvoicePreview({ entry, onEdit, disabled }) {
  const p = entry.preview
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.data.items)

  const applyEdits = () => {
    setEditing(false)
    onEdit({ ...entry.data, items: draft })
  }

  const setQty = (productId, value) =>
    setDraft((d) =>
      d.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(1, parseInt(value) || 1) } : i
      )
    )

  return (
    <div className="border border-[#e4e4e7] rounded-lg bg-white overflow-hidden">
      <div className="px-3 py-2 border-b border-[#e4e4e7] flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#09090b]">{p.customer.name}</div>
          <div className="text-[10px] text-[#71717a]">
            {p.customer.state}
            {p.customer.gstin ? ` · ${p.customer.gstin}` : ''}
            {' · '}
            {p.taxType === 'IGST' ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}
          </div>
        </div>
        <button
          onClick={() => (editing ? applyEdits() : setEditing(true))}
          disabled={disabled}
          className="text-[11px] text-[#2563eb] flex items-center gap-1 hover:underline disabled:opacity-40"
        >
          <Pencil size={11} />
          {editing ? 'Apply' : 'Edit'}
        </button>
      </div>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[#71717a] bg-[#fafafa]">
            <th className="text-left font-medium px-3 py-1.5">Item</th>
            <th className="text-right font-medium px-1 py-1.5">Qty</th>
            <th className="text-right font-medium px-1 py-1.5">Rate</th>
            <th className="text-right font-medium px-1 py-1.5">GST</th>
            <th className="text-right font-medium px-3 py-1.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {p.items.map((item) => (
            <tr key={item.productId} className="border-t border-[#f4f4f5]">
              <td className="px-3 py-1.5 text-[#09090b]">
                {item.name}
                {item.hsn && <span className="text-[#a1a1aa]"> · {item.hsn}</span>}
              </td>
              <td className="px-1 py-1.5 text-right">
                {editing ? (
                  <input
                    type="number"
                    min="1"
                    value={draft.find((d) => d.productId === item.productId)?.quantity ?? item.quantity}
                    onChange={(e) => setQty(item.productId, e.target.value)}
                    className="w-12 border border-[#e4e4e7] rounded px-1 py-0.5 text-right text-[11px]"
                  />
                ) : (
                  item.quantity
                )}
              </td>
              <td className="px-1 py-1.5 text-right text-[#52525b]">{inr(item.unitPrice)}</td>
              <td className="px-1 py-1.5 text-right text-[#52525b]">{item.taxRate ?? 0}%</td>
              <td className="px-3 py-1.5 text-right font-medium text-[#09090b]">{inr(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-3 py-2 border-t border-[#e4e4e7] bg-[#fafafa] text-[11px] space-y-0.5">
        <Row label="Taxable value" value={inr(p.subtotal)} />
        {p.taxType === 'IGST' ? (
          <Row label="IGST" value={inr(p.igst)} />
        ) : (
          <>
            <Row label="CGST" value={inr(p.cgst)} />
            <Row label="SGST" value={inr(p.sgst)} />
          </>
        )}
        <div className="flex justify-between pt-1 mt-1 border-t border-[#e4e4e7] text-[12px] font-semibold text-[#09090b]">
          <span>Total</span>
          <span>{inr(p.totalAmount)}</span>
        </div>
      </div>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex justify-between text-[#52525b]">
    <span>{label}</span>
    <span>{value}</span>
  </div>
)

// ---------------------------------------------------------------
// PRODUCT PREVIEW
// ---------------------------------------------------------------
function ProductPreview({ entry }) {
  const p = entry.preview
  const fields = [
    ['Name', p.name],
    ['Price', inr(p.price)],
    ['Stock', p.stock],
    ['GST', p.tax != null ? `${p.tax}%` : '—'],
    ['Unit', p.unit || '—'],
  ]
  return (
    <div className="border border-[#e4e4e7] rounded-lg bg-white p-3 space-y-1">
      {fields.map(([k, v]) => (
        <div key={k} className="flex justify-between text-[11px]">
          <span className="text-[#71717a]">{k}</span>
          <span className="text-[#09090b] font-medium">{v}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------
// QUERY RESULT TABLE
// ---------------------------------------------------------------
function ResultTable({ table }) {
  if (!table?.rows?.length) return null
  return (
    <div className="border border-[#e4e4e7] rounded-lg bg-white overflow-hidden">
      <table className="w-full text-[11px]">
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.id} className="border-b border-[#f4f4f5] last:border-0">
              {table.columns.map((col) => (
                <td key={col} className="px-2.5 py-1.5 text-[#52525b] first:text-[#09090b] first:font-medium">
                  {col === 'totalAmount' || col === 'price'
                    ? inr(row[col])
                    : col === 'tax' && row[col] != null
                    ? `${row[col]}%`
                    : String(row[col] ?? '—')}
                </td>
              ))}
              <td className="px-2 py-1.5 text-right">
                <Link to={row.link} className="text-[#2563eb]">
                  <ExternalLink size={11} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {table.totalCount > table.rows.length && (
        <div className="px-2.5 py-1.5 text-[10px] text-[#71717a] bg-[#fafafa]">
          Showing {table.rows.length} of {table.totalCount}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------
export default function AgentPreview({ entry, isPending, onConfirm, onCancel, onEdit, loading }) {
  return (
    <div className="space-y-2">
      {entry.message && (
        <div
          className={`text-[12px] ${
            entry.status === 'error' ? 'text-[#791F1F]' : 'text-[#52525b]'
          }`}
        >
          {entry.message}
        </div>
      )}

      {entry.status === 'preview' && entry.action === 'create_invoice' && (
        <InvoicePreview entry={entry} onEdit={onEdit} disabled={!isPending || loading} />
      )}
      {entry.status === 'preview' && entry.action === 'add_product' && <ProductPreview entry={entry} />}
      {entry.status === 'result' && entry.table && <ResultTable table={entry.table} />}

      {entry.warnings?.map((w) => (
        <div key={w} className="flex items-start gap-1.5 text-[11px] text-[#633806] bg-[#FAEEDA] rounded px-2 py-1.5">
          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
          <span>{w}</span>
        </div>
      ))}

      {entry.clarify?.map((c) =>
        c.candidates?.length ? (
          <div key={c.query} className="space-y-1">
            <div className="text-[10px] text-[#71717a] uppercase tracking-wide">{c.field}: {c.query}</div>
            {c.candidates.map((cand) => (
              <div
                key={cand.id}
                className="border border-[#e4e4e7] rounded px-2.5 py-1.5 text-[11px] text-[#09090b] bg-white"
              >
                {cand.name}
                <span className="text-[#71717a]">
                  {cand.state ? ` · ${cand.state}` : ''}
                  {cand.stock != null ? ` · ${cand.stock} in stock` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : null
      )}

      {entry.status === 'result' && entry.link && (
        <Link to={entry.link} className="inline-flex items-center gap-1 text-[11px] text-[#2563eb] hover:underline">
          Open <ExternalLink size={11} />
        </Link>
      )}

      {/* Confirm / Cancel — only on the live preview, never on history */}
      {entry.status === 'preview' && isPending && (
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={onConfirm}
            disabled={loading || entry.blocked}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#2563eb] text-white text-[12px] font-medium rounded-lg py-2 hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={13} />
            {entry.blocked ? 'Not enough stock' : 'Confirm'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 flex items-center justify-center gap-1.5 border border-[#e4e4e7] text-[#52525b] text-[12px] rounded-lg py-2 hover:bg-[#f4f4f5]"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}