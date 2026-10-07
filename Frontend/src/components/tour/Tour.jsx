import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { placeCard } from './tourLayout'

const PAD = 6
const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]'

// The first element matching `selector` that is actually on screen
// (the same data-tour id can exist in the drawer and in the mobile header).
function findTarget(selector) {
  if (!selector) return null
  for (const el of document.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight) {
      return el
    }
  }
  return null
}

const sameRect = (a, b) =>
  a === b || (a && b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height)

// Spotlight tour. Mount it to start, unmount to stop.
//   steps:        [{ id, title, body, target?, sidebar? }]
//   onStepChange: called with the current step (the shell opens/closes the mobile drawer)
//   onClose:      called when the tour is finished or skipped
export default function Tour({ steps, onClose, onStepChange }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [cardH, setCardH] = useState(220)
  const cardRef = useRef(null)
  const nextRef = useRef(null)
  const scrolledFor = useRef(null)

  const step = steps[index]
  const last = index === steps.length - 1

  const next = () => (last ? onClose() : setIndex((i) => i + 1))
  const back = () => setIndex((i) => Math.max(0, i - 1))

  // Let the shell react to the step (e.g. open the drawer on phones).
  useEffect(() => {
    onStepChange?.(step)
  }, [step, onStepChange])

  // Keep the spotlight on its target, even while the drawer slides or the window resizes.
  useEffect(() => {
    const measure = () => {
      setVp((p) => (p.w === window.innerWidth && p.h === window.innerHeight ? p : { w: window.innerWidth, h: window.innerHeight }))
      const el = findTarget(step.target)
      if (!el) return setRect(null)
      if (scrolledFor.current !== step.id) {
        scrolledFor.current = step.id
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
      const r = el.getBoundingClientRect()
      const box = { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
      setRect((prev) => (sameRect(prev, box) ? prev : box))
    }
    measure()
    const id = setInterval(measure, 120)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(id)
      window.removeEventListener('resize', measure)
    }
  }, [step])

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight)
  }, [index])

  // Keyboard: Esc skips, arrows move, Tab stays inside the card.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') {
        next()
      } else if (e.key === 'ArrowLeft') {
        back()
      } else if (e.key === 'Tab' && cardRef.current) {
        const items = cardRef.current.querySelectorAll('button')
        if (!items.length) return
        const first = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Focus the main button on each step; give focus back when the tour ends.
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [index])
  useEffect(() => {
    const before = document.activeElement
    return () => before?.focus?.({ preventScroll: true })
  }, [])

  const pos = placeCard({ rect, cardH, vw: vp.w, vh: vp.h, pad: PAD })

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {rect ? (
        <div
          aria-hidden
          className="absolute rounded-lg pointer-events-none transition-[top,left,width,height] duration-200 motion-reduce:transition-none"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.62), 0 0 0 2px #818CF8',
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.62)' }} />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="absolute bg-white rounded-xl p-5 shadow-[0_10px_40px_rgba(15,23,42,0.35)] transition-[top,left] duration-200 motion-reduce:transition-none"
        style={{ top: pos.top, left: pos.left, width: pos.width }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-[#6B7280]" aria-live="polite">
            Step {index + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-1" aria-hidden>
            {steps.map((s, i) => (
              <span key={s.id} className="h-1.5 rounded-full transition-all" style={{ width: i === index ? 16 : 6, background: i <= index ? '#4F46E5' : '#E5E7EB' }} />
            ))}
          </div>
        </div>

        <h2 id="tour-title" className="text-[15px] font-semibold text-[#111827]">{step.title}</h2>
        <p id="tour-body" className="text-[13px] leading-relaxed text-[#4B5563] mt-1.5">{step.body}</p>

        <div className="flex items-center justify-between mt-5">
          {last ? (
            <span />
          ) : (
            <button onClick={onClose} className={`text-[12px] text-[#6B7280] hover:text-[#111827] rounded px-1 py-1 cursor-pointer ${ring}`}>
              Skip tour
            </button>
          )}
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={back}
                className={`px-3 py-2 sm:py-1.5 rounded-lg text-[13px] text-[#111827] hover:bg-[#F3F4F6] cursor-pointer ${ring}`}
                style={{ border: '1px solid #E5E7EB' }}
              >
                Back
              </button>
            )}
            <button
              ref={nextRef}
              onClick={next}
              className={`px-4 py-2 sm:py-1.5 rounded-lg text-[13px] font-medium text-white bg-[#4F46E5] hover:bg-[#4338CA] cursor-pointer ${ring}`}
            >
              {last ? 'Finish' : index === 0 ? 'Start tour' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}