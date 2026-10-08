// Steps for the first-run tour, plus the "show it once after sign-up" flag.
//
// `target` is a CSS selector for the element to spotlight (the app shell marks
// those with data-tour="…"). A step with no target is shown centred.
// `sidebar: true` tells the shell to open the mobile drawer for that step.

export function buildTourSteps(user) {
  const first = user?.name?.trim().split(/\s+/)[0]
  const isOwner = user?.role === 'OWNER'

  return [
    {
      id: 'welcome',
      title: first ? `Welcome, ${first}` : 'Welcome to WithinBlocks',
      body: 'Here’s a quick tour of where everything lives. It takes about a minute, and you can replay it any time with the ? button.',
    },
    {
      id: 'dashboard',
      target: '[data-tour="nav-dashboard"]',
      sidebar: true,
      title: 'Dashboard',
      body: 'Your day at a glance: low stock, unpaid invoices and your latest activity.',
    },
    {
      id: 'products',
      target: '[data-tour="nav-products"]',
      sidebar: true,
      title: 'Products',
      body: 'Add what you sell, with its HSN code, GST rate, price and stock. Stock goes down when you confirm an invoice.',
    },
    {
      id: 'customers',
      target: '[data-tour="nav-customers"]',
      sidebar: true,
      title: 'Customers',
      body: 'Save your customers’ details, including their GSTIN, so GST is worked out correctly on their invoices.',
    },
    {
      id: 'invoices',
      target: '[data-tour="nav-invoices"]',
      sidebar: true,
      title: 'Invoices',
      body: 'Create invoices, finalize them, mark them paid and download the PDF.',
    },
    // Owners only: the Team page is owner-only in the app and on the server.
    ...(isOwner
      ? [
          {
            id: 'team',
            target: '[data-tour="nav-team"]',
            sidebar: true,
            title: 'Team',
            body: 'Invite people from your business. They get a link to set their own password and join your workspace.',
          },
        ]
      : []),
    {
      id: 'settings',
      target: '[data-tour="nav-settings"]',
      sidebar: true,
      title: 'Settings',
      body: 'Add your company details and logo. They appear on every invoice you create.',
    },
    {
      id: 'agent',
      target: '[data-tour="agent"]',
      title: 'WithinAgent',
      body: 'Ask in plain words, like “Create invoice for Raj Traders”. You’ll see a preview first, and nothing is saved until you confirm.',
    },
    {
      id: 'help',
      target: '[data-tour="help"]',
      title: 'Need this again?',
      body: 'Tap the ? button any time to replay this tour.',
    },
  ]
}

// ---- "first time only" flag -------------------------------------------
// Set right after a brand-new account is created (sign-up, or accepting an
// invite). The shell starts the tour once when it sees the flag, then clears it.
const KEY = 'wb.tour.pending'

export function markTourPending(userId) {
  try {
    localStorage.setItem(KEY, String(userId ?? '1'))
  } catch {
    /* storage unavailable */
  }
}

export function hasTourPending(userId) {
  try {
    const v = localStorage.getItem(KEY)
    return v !== null && (v === '1' || v === String(userId))
  } catch {
    return false
  }
}

export function clearTourPending() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}