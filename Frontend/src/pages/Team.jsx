import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Copy, Check, ShieldOff } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'

export default function Team() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [lastInviteLink, setLastInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const { data: users = [], isLoading, error: listError } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(res => res.data.data),
  })

  const inviteMutation = useMutation({
    mutationFn: (email) => api.post('/users/invite', { email }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEmail('')
      // Only present in non-production responses (see Backend user.controller.js) —
      // in production there's nothing to show here yet, since there's no email
      // service wired up. The link still exists; it's just not in this response.
      setLastInviteLink(res.data.data.inviteLink || null)
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.patch(`/users/${id}/deactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const handleInvite = (e) => {
    e.preventDefault()
    inviteMutation.mutate(email)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(lastInviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const closeInviteModal = () => {
    setShowInvite(false)
    setLastInviteLink(null)
    inviteMutation.reset()
  }

  // The backend already enforces OWNER-only on every /users route — this is
  // just the matching UI-side guard so STAFF sees a clear message instead of
  // an empty table backed by a 403 they can't do anything about.
  if (currentUser?.role !== 'OWNER') {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white">
        <div className="text-[13px] text-[#71717a]">Only the account owner can manage team members.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="text-[16px] font-semibold text-[#09090b]">Team</div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[13px] font-medium cursor-pointer"
          style={{ background: '#2563eb' }}
        >
          <UserPlus size={14} />
          Invite member
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e4e4e7' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#fafafa]">
                {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-medium text-[#71717a]" style={{ borderBottom: '1px solid #e4e4e7' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#71717a]">Loading…</td></tr>
              ) : listError ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#791F1F]">Could not load team members.</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#71717a]">No team members yet.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafafa]" style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td className="px-4 py-3 font-medium text-[#09090b]">
                      {u.name || <span className="text-[#a1a1aa] font-normal italic">Invite pending</span>}
                      {u.id === currentUser?.id && <span className="text-[11px] text-[#71717a] font-normal"> (you)</span>}
                    </td>
                    <td className="px-4 py-3 text-[#52525b]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f4f4f5] text-[#52525b] font-medium">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-medium">Active</span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] font-medium">Invited</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.isActive && u.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Deactivate ${u.name || u.email}? They will no longer be able to log in.`)) {
                              deactivateMutation.mutate(u.id)
                            }
                          }}
                          disabled={deactivateMutation.isPending}
                          className="flex items-center gap-1 text-[12px] text-[#a1a1aa] hover:text-[#ef4444] cursor-pointer ml-auto disabled:opacity-50"
                        >
                          <ShieldOff size={12} />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {deactivateMutation.isError && (
          <div className="text-[12px] text-[#791F1F] bg-[#fef2f2] px-3 py-2 rounded-lg mt-3" style={{ border: '1px solid #fecaca' }}>
            {deactivateMutation.error?.response?.data?.message || 'Could not deactivate this user.'}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[420px] p-6" style={{ border: '1px solid #e4e4e7' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="text-[15px] font-semibold text-[#09090b]">Invite a team member</div>
              <button onClick={closeInviteModal} className="text-[#a1a1aa] hover:text-[#09090b] cursor-pointer">✕</button>
            </div>

            {!lastInviteLink ? (
              <form onSubmit={handleInvite} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-[#09090b] mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg text-[13px] text-[#09090b] outline-none"
                    style={{ border: '1px solid #e4e4e7' }}
                  />
                  <div className="text-[11px] text-[#71717a] mt-1.5">
                    They'll be invited as Staff — able to create invoices and view company data, but not manage the team or company settings.
                  </div>
                </div>

                {inviteMutation.isError && (
                  <div className="text-[12px] text-[#791F1F] bg-[#fef2f2] px-3 py-2 rounded-lg" style={{ border: '1px solid #fecaca' }}>
                    {inviteMutation.error?.response?.data?.message || 'Something went wrong'}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="flex-1 py-2 rounded-lg text-[13px] text-[#09090b] cursor-pointer"
                    style={{ border: '1px solid #e4e4e7' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="flex-1 py-2 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
                    style={{ background: '#2563eb' }}
                  >
                    {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
                  </button>
                </div>
              </form>
            ) : (
              // No email service — hand the owner the link to send
              // themselves in the meantime.
              <div className="flex flex-col gap-3.5">
                <div className="text-[13px] text-[#52525b]">
                  Invite created. Since email sending isn't set up yet, share this link with them directly:
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ border: '1px solid #e4e4e7', background: '#fafafa' }}>
                  <div className="flex-1 text-[12px] text-[#52525b] truncate font-mono">{lastInviteLink}</div>
                  <button onClick={copyLink} className="flex-shrink-0 text-[#2563eb] cursor-pointer">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="text-[11px] text-[#a1a1aa]">This link expires in 24 hours and can only be used once.</div>
                <button
                  onClick={closeInviteModal}
                  className="py-2 rounded-lg text-[13px] font-medium text-white cursor-pointer"
                  style={{ background: '#2563eb' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}