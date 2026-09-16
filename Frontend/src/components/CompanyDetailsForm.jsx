import { INDIAN_STATES } from '../constants/indianStates'

const inputClass = "w-full px-3 py-2.5 rounded-lg text-[13px] outline-none"
const labelClass = "block text-[12px] font-medium text-[#09090b] mb-1.5"

const getInputStyle = (disabled) => ({
  border: '1px solid #e4e4e7',
  background: disabled ? '#f4f4f5' : '#fafafa',
  color: disabled ? '#a1a1aa' : '#09090b',
  cursor: disabled ? 'not-allowed' : 'text',
})

// Shared by Onboarding.jsx (step 1) and Settings.jsx ("My Company"),
// so business details only need to be built once and stay identical
// everywhere they're editable. `disabled` locks every field at once —
// used to gate the whole form behind an explicit Edit button.
export default function CompanyDetailsForm({ form, setForm, disabled = false }) {
  const inputStyle = getInputStyle(disabled)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Company name *</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
            required
          />
        </div>
        <div>
          <label className={labelClass}>State *</label>
          <select
            value={form.state}
            onChange={e => setForm({ ...form, state: e.target.value })}
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
            required
          >
            <option value="" disabled>Select state</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Business phone</label>
          <input
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>GSTIN</label>
          <input
            value={form.gstin}
            onChange={e => setForm({ ...form, gstin: e.target.value })}
            placeholder="29AABCM9527A1ZK"
            className={inputClass}
            style={{ ...inputStyle, fontFamily: 'monospace' }}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
          className={inputClass}
          style={inputStyle}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Invoice prefix</label>
          <input
            value={form.invoicePrefix}
            onChange={e => setForm({ ...form, invoicePrefix: e.target.value })}
            placeholder="INV"
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
          />
        </div>
        <div>
          <label className={labelClass}>Financial year</label>
          <input
            value={form.financialYear}
            onChange={e => setForm({ ...form, financialYear: e.target.value })}
            placeholder="2627"
            className={inputClass}
            style={inputStyle}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}