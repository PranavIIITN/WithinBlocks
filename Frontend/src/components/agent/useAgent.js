import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import api from '../../services/api'

// Turns "/invoices/new" into "Invoices" so the backend can use it as a hint.
const pageFromPath = (pathname) => {
  const seg = pathname.split('/').filter(Boolean)[0]
  if (!seg) return 'Dashboard'
  return seg.charAt(0).toUpperCase() + seg.slice(1)
}

const errText = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong.'

export default function useAgent() {
  const queryClient = useQueryClient()
  const location = useLocation()

  // Conversation log. Each entry is { role: 'user' | 'agent', ...payload }
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(null) // the preview awaiting confirmation
  const [loading, setLoading] = useState(false)

  const push = (entry) => setMessages((m) => [...m, entry])

  const send = useCallback(
    async (text) => {
      if (!text.trim() || loading) return
      push({ role: 'user', text })
      setPending(null)
      setLoading(true)
      try {
        const { data } = await api.post('/agent/run', {
          message: text,
          context: { page: pageFromPath(location.pathname) },
        })
        const result = data.data
        push({ role: 'agent', ...result })
        if (result.status === 'preview') setPending(result)
      } catch (err) {
        push({ role: 'agent', status: 'error', message: errText(err) })
      } finally {
        setLoading(false)
      }
    },
    [loading, location.pathname]
  )

  // Re-price an edited payload. All GST math stays on the server.
  const repreview = useCallback(async (action, payload) => {
    setLoading(true)
    try {
      const { data } = await api.post('/agent/preview', { action, data: payload })
      setPending(data.data)
      setMessages((m) => {
        const next = [...m]
        // Replace the last agent preview in place, so editing doesn't spam the log.
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === 'agent' && next[i].status === 'preview') {
            next[i] = { role: 'agent', ...data.data }
            return next
          }
        }
        return [...next, { role: 'agent', ...data.data }]
      })
    } catch (err) {
      push({ role: 'agent', status: 'error', message: errText(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  const confirm = useCallback(async () => {
    if (!pending) return
    setLoading(true)
    try {
      const { data } = await api.post('/agent/confirm', {
        action: pending.action,
        data: pending.data,
      })
      setMessages((m) => [...m, { role: 'agent', ...data.data }])
      setPending(null)
      // Keep the rest of the app in sync with what the agent just did.
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    } catch (err) {
      push({ role: 'agent', status: 'error', message: errText(err) })
    } finally {
      setLoading(false)
    }
  }, [pending, queryClient])

  const cancel = useCallback(() => {
    setPending(null)
    push({ role: 'agent', status: 'result', message: 'Cancelled — nothing was saved.' })
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setPending(null)
  }, [])

  return { messages, pending, loading, send, confirm, cancel, repreview, reset }
}