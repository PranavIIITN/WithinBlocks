// Where to put the tour card relative to the highlighted element.
export const CARD_W = 340
const GAP = 14
const MARGIN = 12

// rect: {top,left,width,height,right,bottom} of the target, or null for "centre it".
export function placeCard({ rect, cardH, vw, vh, pad = 6 }) {
  const w = Math.min(CARD_W, vw - MARGIN * 2)
  const clampTop = (y) => Math.min(Math.max(y, MARGIN), Math.max(MARGIN, vh - cardH - MARGIN))
  const clampLeft = (x) => Math.min(Math.max(x, MARGIN), Math.max(MARGIN, vw - w - MARGIN))

  if (!rect) return { left: (vw - w) / 2, top: clampTop((vh - cardH) / 2), width: w }

  // Phones: pin the card to the top or bottom, on the side away from the target.
  if (vw < 640) {
    const targetIsLow = rect.top + rect.height / 2 > vh / 2
    return { left: MARGIN, width: vw - MARGIN * 2, top: targetIsLow ? MARGIN : clampTop(vh - cardH - MARGIN) }
  }

  const t = { top: rect.top - pad, bottom: rect.bottom + pad, right: rect.right + pad }
  if (t.right + GAP + w <= vw - MARGIN) {
    return { left: t.right + GAP, top: clampTop(rect.top + rect.height / 2 - cardH / 2), width: w } // right of it
  }
  if (t.bottom + GAP + cardH <= vh - MARGIN) {
    return { left: clampLeft(rect.left + rect.width / 2 - w / 2), top: t.bottom + GAP, width: w } // below it
  }
  if (t.top - GAP - cardH >= MARGIN) {
    return { left: clampLeft(rect.right - w), top: t.top - GAP - cardH, width: w } // above it
  }
  return { left: (vw - w) / 2, top: clampTop((vh - cardH) / 2), width: w }
}