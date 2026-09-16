import { useMemo, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon } from 'lucide-react'

// Purely a staging component now — it never calls the API itself. Picking a
// file just hands the raw File back to the parent (via onFileSelect); the
// parent decides when to actually upload it. This mirrors AddProduct.jsx's
// pattern (stage the file, upload it only when the surrounding form saves)
// and Zoho's own organization-profile flow (logo is part of the same
// Save as the rest of the business details, not an instant separate action).
function UploadBox({ label, hint, savedUrl, file, onFileSelect, disabled }) {
  const fileInputRef = useRef(null)

  // Object URLs must be created during render (via useMemo) rather than
  // via setState-in-an-effect — the effect below only ever revokes the
  // previous one on cleanup, it never sets state itself.
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displaySrc = previewUrl || savedUrl

  const handleFile = (selected) => {
    if (!selected || disabled) return
    onFileSelect(selected)
  }

  return (
    <div>
      <div className="text-[13px] font-semibold text-[#09090b] mb-1">{label}</div>
      <div className="text-[11px] text-[#71717a] mb-3">{hint}</div>
      <div
        className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center"
        style={{
          border: '2px dashed #e4e4e7',
          height: '160px',
          background: displaySrc ? '#fff' : (disabled ? '#f4f4f5' : '#fafafa'),
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={() => !disabled && fileInputRef.current.click()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        onDragOver={(e) => e.preventDefault()}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={label}
            className="max-w-full max-h-full object-contain p-3"
            style={{ opacity: disabled ? 0.6 : 1 }}
          />
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center mb-2">
              <ImageIcon size={18} className="text-[#2563eb]" />
            </div>
            <div className="text-[12px] font-medium text-[#09090b]">Upload</div>
            <div className="text-[10px] text-[#a1a1aa] mt-1">PNG, JPG, WEBP up to 5MB</div>
          </>
        )}

        {!disabled && displaySrc && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
            <Upload size={18} className="text-white mb-1" />
            <span className="text-[11px] text-white">Change</span>
          </div>
        )}

        {file && (
          <div
            className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: '#eff6ff', color: '#2563eb' }}
          >
            Pending — save to apply
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}

// Shared by Onboarding.jsx (step 2) and Settings.jsx ("My Company").
// `company` supplies the currently-saved logo/signature URLs; `logoFile`/
// `signatureFile` are staged File objects owned by the parent, cleared by
// the parent on Cancel and uploaded by the parent on Save.
export default function LogoSignatureUpload({
  company,
  logoFile,
  signatureFile,
  onLogoFileChange,
  onSignatureFileChange,
  disabled = false,
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <UploadBox
        label="Company logo"
        hint="Shown at the top of every invoice"
        savedUrl={company?.logo}
        file={logoFile}
        onFileSelect={onLogoFileChange}
        disabled={disabled}
      />
      <UploadBox
        label="Signature"
        hint="Shown at the bottom of every invoice"
        savedUrl={company?.signature}
        file={signatureFile}
        onFileSelect={onSignatureFileChange}
        disabled={disabled}
      />
    </div>
  )
}