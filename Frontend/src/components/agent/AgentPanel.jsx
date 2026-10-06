import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, X, ArrowUp, RotateCcw } from 'lucide-react'
import useAgent from './useAgent'
import AgentPreview from './AgentPreview'

// Guided suggestions (§10) — page-aware, so the panel is never a blank box.
const SUGGESTIONS = {
  Invoices: ['Show unpaid invoices', 'Create invoice for '],
  Products: ['Low stock products', 'Add product Lemon Pickle, price 120, stock 50'],
  Customers: ['Show invoices for ', 'Create invoice for '],
  default: ['Show unpaid invoices', 'Low stock products', 'Create invoice for Raj Traders with 10 Mango Pickle'],
}

const pageKey = (pathname) => {
  const seg = pathname.split('/').filter(Boolean)[0]
  if (!seg) return 'default'
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

export default function AgentPanel() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const location = useLocation()
  const { messages, pending, loading, send, confirm, cancel, repreview, reset, createCustomerAndContinue } = useAgent()
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const suggestions = SUGGESTIONS[pageKey(location.pathname)] || SUGGESTIONS.default

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Cmd/Ctrl + K to toggle
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (e) => {
    e?.preventDefault()
    const text = input
    setInput('')
    send(text)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="WithinAgent  (⌘K)"
        aria-label="Ask WithinAgent"
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex items-center justify-center gap-2 bg-[#111827] text-white text-[12px] font-medium rounded-full w-12 h-12 sm:w-auto sm:h-auto sm:pl-3.5 sm:pr-4 sm:py-2.5 shadow-lg hover:bg-[#1F2937] transition-colors"
      >
        <Sparkles size={14} className="w-[18px] h-[18px] sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Ask WithinAgent</span>
      </button>
    )
  }

  return (
    <div
      className="fixed top-0 right-0 h-dvh w-full sm:w-[380px] bg-white z-[70] flex flex-col shadow-xl"
      style={{ borderLeft: '1px solid #E5E7EB', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#4F46E5]" />
          <span className="text-[13px] font-semibold text-[#111827]">WithinAgent</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reset} title="Clear" aria-label="Clear conversation" className="p-2.5 sm:p-1.5 rounded hover:bg-[#F3F4F6] text-[#9CA3AF]">
            <RotateCcw size={13} />
          </button>
          <button onClick={() => setOpen(false)} aria-label="Close" className="p-2.5 sm:p-1.5 rounded hover:bg-[#F3F4F6] text-[#9CA3AF]">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="pt-2">
            <div className="text-[12px] text-[#4B5563] mb-2">
              Tell me what you need in plain English. I'll show you a preview before anything is saved.
            </div>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => (s.endsWith(' ') ? (setInput(s), inputRef.current?.focus()) : send(s))}
                  className="w-full text-left text-[11px] text-[#4B5563] border border-[#E5E7EB] rounded-lg px-2.5 py-2 hover:bg-[#F3F4F6] hover:text-[#111827]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((entry, i) =>
          entry.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bg-[#EEF2FF] text-[#111827] text-[12px] rounded-lg rounded-br-sm px-3 py-1.5 max-w-[85%]">
                {entry.text}
              </div>
            </div>
          ) : (
            <AgentPreview
              key={i}
              entry={entry}
              isPending={pending && entry.status === 'preview' && i === messages.length - 1}
              isLatest={i === messages.length - 1}
              loading={loading}
              onConfirm={confirm}
              onCancel={cancel}
              onEdit={(payload) => repreview(entry.action, payload)}
              onCreateCustomer={createCustomerAndContinue}
            />
          )
        )}

        {loading && (
          <div className="flex gap-1 items-center text-[11px] text-[#9CA3AF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] animate-pulse" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={submit} className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="flex items-end gap-2 border border-[#E5E7EB] rounded-lg px-2.5 py-2 focus-within:border-[#4F46E5]">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            placeholder="Create invoice for…"
            maxLength={500}
            className="flex-1 text-[16px] sm:text-[12px] outline-none resize-none max-h-24 text-[#111827] placeholder:text-[#9CA3AF]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-6 h-6 rounded-md bg-[#4F46E5] text-white flex items-center justify-center disabled:opacity-30 flex-shrink-0"
          >
            <ArrowUp size={13} />
          </button>
        </div>
        <div className="text-[10px] text-[#9CA3AF] mt-1.5 px-0.5">
          Nothing is saved until you confirm.
        </div>
      </form>
    </div>
  )
}