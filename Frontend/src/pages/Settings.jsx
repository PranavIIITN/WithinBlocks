import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import CompanyDetailsForm from '../components/CompanyDetailsForm'
import LogoSignatureUpload from '../components/LogoSignatureUpload'

const emptyForm = { name: '', state: '', phone: '', gstin: '', address: '', invoicePrefix: '', financialYear: '' }

const formFromCompany = (company) => ({
  name: company.name || '',
  state: company.state || '',
  phone: company.phone || '',
  gstin: company.gstin || '',
  address: company.address || '',
  invoicePrefix: company.invoicePrefix || '',
  financialYear: company.financialYear || '',
})

export default function Settings() {
  const queryClient = useQueryClient()
  const { company: authCompany, user, token, setAuth } = useAuthStore()
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadedCompanyId, setLoadedCompanyId] = useState(null)

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get('/company').then(res => res.data.data),
  })

  // Adjusting state during render instead of in a useEffect — see Onboarding.jsx for why.
  if (company && company.id !== loadedCompanyId) {
    setLoadedCompanyId(company.id)
    setForm(formFromCompany(company))
  }

  const updateMutation = useMutation({
    // Same sequencing as AddProduct.jsx: save the record itself first, then
    // attach any staged image(s) — logo/signature are no longer uploaded the
    // instant a file is picked, only once "Save changes" actually runs.
    mutationFn: async (data) => {
      const res = await api.put('/company', data)
      let updatedCompany = res.data.data

      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        const logoRes = await api.post('/upload/company/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        updatedCompany = { ...updatedCompany, logo: logoRes.data.data.logo }
      }

      if (signatureFile) {
        const formData = new FormData()
        formData.append('signature', signatureFile)
        const signatureRes = await api.post('/upload/company/signature', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        updatedCompany = { ...updatedCompany, signature: signatureRes.data.data.signature }
      }

      return updatedCompany
    },
    onSuccess: (updatedCompany) => {
      queryClient.setQueryData(['company'], updatedCompany)
      setAuth(token, user, { ...authCompany, ...updatedCompany })
      setLogoFile(null)
      setSignatureFile(null)
      setIsEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  const handleCancel = () => {
    if (company) setForm(formFromCompany(company))
    setLogoFile(null)
    setSignatureFile(null)
    setIsEditing(false)
  }

  const isValid = form.name.trim() !== '' && form.state !== ''

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center justify-between px-6 h-[56px] bg-white flex-shrink-0" style={{ borderBottom: '1px solid #e4e4e7' }}>
        <div className="text-[14px] font-semibold text-[#09090b]">My Company</div>
        <div className="flex items-center gap-3">
          {saved && !isEditing && (
            <span className="text-[12px] text-[#16a34a] font-medium">Saved ✓</span>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium text-[#09090b] cursor-pointer"
              style={{ border: '1px solid #e4e4e7' }}
            >
              <Pencil size={13} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-[13px] text-[#09090b] cursor-pointer disabled:opacity-50"
                style={{ border: '1px solid #e4e4e7' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !isValid}
                className="px-4 py-1.5 rounded-lg text-[13px] font-medium text-white cursor-pointer disabled:opacity-50"
                style={{ background: '#2563eb' }}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#f4f4f5]">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {isLoading ? (
            <div className="text-[13px] text-[#71717a]">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e4e4e7' }}>
                <div className="text-[13px] font-semibold text-[#09090b] mb-4">Business details</div>
                <CompanyDetailsForm form={form} setForm={setForm} disabled={!isEditing} />
              </div>

              <div className="bg-white rounded-xl p-5" style={{ border: '1px solid #e4e4e7' }}>
                <div className="text-[13px] font-semibold text-[#09090b] mb-4">Branding</div>
                <LogoSignatureUpload
                  company={company}
                  logoFile={logoFile}
                  signatureFile={signatureFile}
                  onLogoFileChange={setLogoFile}
                  onSignatureFileChange={setSignatureFile}
                  disabled={!isEditing}
                />
              </div>

              {updateMutation.isError && (
                <div className="text-[13px] text-[#ef4444] bg-[#fef2f2] px-4 py-3 rounded-lg" style={{ border: '1px solid #fecaca' }}>
                  Something went wrong saving your changes
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}