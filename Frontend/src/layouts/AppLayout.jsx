import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, FileText, BarChart2, Settings, LogOut, HelpCircle, UserCog,
  PanelLeftClose, PanelLeftOpen, Menu, X,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import AgentPanel from '../components/agent/AgentPanel'
import Landing from '../pages/Landing'
import Tour from '../components/tour/Tour'
import { buildTourSteps, hasTourPending, clearTourPending } from '../components/tour/tourSteps'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Invoices', icon: FileText, path: '/invoices' },
]

const bottomItems = [
  { label: 'Reports', icon: BarChart2, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

// Sidebar palette: dark slate, muted text, lighter slate for the active item.
const SIDEBAR = '#0F172A'
const SIDEBAR_RAISED = '#1E293B'
const SIDEBAR_TEXT = '#9CA3AF'
const STORAGE_KEY = 'wb.sidebar.collapsed'

// Desktop only: a saved choice wins, otherwise the sidebar starts expanded.
const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// True from 1024px up (Tailwind's `lg`). Below that the sidebar is a drawer.
function useIsDesktop() {
  const query = '(min-width: 1024px)'
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatch(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return match
}

const ring = 'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#818CF8]'

function NavItem({ to, end, icon: Icon, label, collapsed, onNavigate, tour }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      data-tour={tour}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center h-10 lg:h-9 rounded-lg text-[13px] mb-0.5 transition-colors ${ring} ${
          collapsed ? 'justify-center' : 'gap-3 px-3'
        } ${
          isActive
            ? 'bg-[#1E293B] text-white font-medium'
            : 'text-[#9CA3AF] hover:bg-[#1E293B]/60 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#818CF8]" />}
          <Icon size={16} className="shrink-0" />
          <span className={collapsed ? 'sr-only' : 'truncate'}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function AppLayout() {
  const { user, token, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsedPref, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const firstRun = useRef(true)
  const [tourOpen, setTourOpen] = useState(false)
  const tourSteps = useMemo(() => buildTourSteps(user), [user])

  // On phones the nav lives in the drawer, so the tour opens/closes it as needed.
  const handleTourStep = useCallback((step) => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setDrawerOpen(!!step?.sidebar)
  }, [])
  const closeTour = useCallback(() => {
    setTourOpen(false)
    setDrawerOpen(false)
  }, [])

  // First sign-up only: the flag is set when the account is created. Peek here and
  // clear it when the tour actually starts, so it can never replay by itself.
  useEffect(() => {
    if (!token || !hasTourPending(user?.id)) return
    const id = setTimeout(() => {
      clearTourPending()
      setTourOpen(true)
    }, 700)
    return () => clearTimeout(id)
  }, [token, user?.id])
  // The icon-only rail is a desktop thing; the mobile drawer is always full width.
  const collapsed = collapsedPref && isDesktop

  // Remember the choice — but only once the person has actually toggled it.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, collapsedPref ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }, [collapsedPref])

  // Ctrl/Cmd + B toggles the sidebar.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        if (window.matchMedia('(min-width: 1024px)').matches) setCollapsed((c) => !c)
        else setDrawerOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // No route-level auth check exists elsewhere in the app, so it lives here
  // — AppLayout is the parent for every app route ("/", "/products",
  // "/invoices", etc). Two different outcomes depending on WHERE a signed-out
  // visitor landed:
  //   - the bare root ("/")   → show the public landing page in place of the
  //                             app shell, since that's "someone just found
  //                             the site" rather than "my session expired"
  //   - any other app path    → bounce to /login, same as a deep link into
  //                             a logged-out session always should
  // This only ever runs for a signed-out visitor; once `token` exists, this
  // whole block is skipped and the real app renders exactly as before.
  // (Kept after every hook above so hook order never changes between renders.)
  if (!token) {
    if (location.pathname === '/') return <Landing />
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
    navigate('/login')
  }
  const closeDrawer = () => setDrawerOpen(false)

  const initial = user?.name?.charAt(0).toUpperCase() || 'P'
  const ToggleIcon = !isDesktop ? X : collapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = !isDesktop ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const toggleBtn = (
    <button
      type="button"
      onClick={() => (isDesktop ? setCollapsed((c) => !c) : setDrawerOpen(false))}
      aria-label={toggleLabel}
      aria-expanded={isDesktop ? !collapsed : undefined}
      title={isDesktop ? `${toggleLabel} (Ctrl+B)` : toggleLabel}
      className={`p-1.5 rounded-md text-[#9CA3AF] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer ${ring}`}
    >
      <ToggleIcon size={16} />
    </button>
  )

  return (
    <div className="flex h-dvh bg-[#F9FAFB]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Mobile: dimmed backdrop behind the drawer */}
      <div
        aria-hidden
        onClick={closeDrawer}
        className={`fixed inset-0 z-[55] bg-slate-950/50 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sidebar */}
      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-[60] w-[280px] max-w-[85vw] transition-transform duration-200 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:z-auto lg:max-w-none lg:translate-x-0 ${collapsed ? 'lg:w-[68px]' : 'lg:w-[232px]'} flex flex-col flex-shrink-0 lg:transition-[width] motion-reduce:transition-none`}
        style={{ background: SIDEBAR }}
        inert={!isDesktop && !drawerOpen ? true : undefined}
      >

        {/* Logo + toggle */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 pt-5 pb-3">
            <div className="text-[15px] font-semibold text-white tracking-tight" title="WithinBlocks">
              w<span style={{ color: '#A5B4FC' }}>b</span>
            </div>
            {toggleBtn}
          </div>
        ) : (
          <div className="flex items-start justify-between pl-5 pr-3 pt-5 pb-3">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-white tracking-tight">
                within<span style={{ color: '#A5B4FC' }}>blocks</span>
              </div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: '#6B7280' }}>Run your business, block by block.</div>
            </div>
            {toggleBtn}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} to={item.path} end={item.path === '/'} icon={item.icon} label={item.label} collapsed={collapsed} onNavigate={closeDrawer} tour={`nav-${item.label.toLowerCase()}`} />
          ))}

          {/* Owner-only — matches backend authorizeOwner on every /users route */}
          {user?.role === 'OWNER' && (
            <NavItem to="/team" icon={UserCog} label="Team" collapsed={collapsed} onNavigate={closeDrawer} tour="nav-team" />
          )}

          <div className="h-px my-3" style={{ background: SIDEBAR_RAISED }} />

          {bottomItems.map((item) => (
            <NavItem key={item.path} to={item.path} icon={item.icon} label={item.label} collapsed={collapsed} onNavigate={closeDrawer} tour={`nav-${item.label.toLowerCase()}`} />
          ))}
        </nav>

        {/* Help: replays the product tour */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              closeDrawer()
              setTourOpen(true)
            }}
            data-tour="help"
            title={collapsed ? 'Take the tour' : undefined}
            className={`w-full flex items-center h-10 lg:h-9 rounded-lg text-[13px] hover:bg-[#1E293B]/60 hover:text-white transition-colors cursor-pointer ${ring} ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}
            style={{ color: SIDEBAR_TEXT }}
          >
            <HelpCircle size={16} className="shrink-0" />
            <span className={collapsed ? 'sr-only' : ''}>Take the tour</span>
          </button>
        </div>

        {/* User */}
        <div className="px-3 pb-4 pt-3" style={{ borderTop: `1px solid ${SIDEBAR_RAISED}` }}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
                style={{ background: SIDEBAR_RAISED, color: '#C7D2FE' }}
                title={user?.name || 'User'}
              >
                {initial}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className={`p-1.5 rounded-md hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer ${ring}`}
                style={{ color: SIDEBAR_TEXT }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
                style={{ background: SIDEBAR_RAISED, color: '#C7D2FE' }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-white truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] capitalize" style={{ color: SIDEBAR_TEXT }}>{user?.role?.toLowerCase() || 'owner'}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className={`p-1.5 rounded-md hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer flex-shrink-0 ${ring}`}
                style={{ color: SIDEBAR_TEXT }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[#F9FAFB]">
        {/* Mobile-only header: menu button + logo. Desktop never sees it. */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white flex-shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            className="-ml-2 p-2 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4F46E5]"
          >
            <Menu size={20} />
          </button>
          <div className="text-[15px] font-semibold tracking-tight text-[#111827]">
            within<span style={{ color: '#4F46E5' }}>blocks</span>
          </div>
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            data-tour="help"
            aria-label="Take the product tour"
            title="Take the tour"
            className="ml-auto -mr-2 p-2 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4F46E5]"
          >
            <HelpCircle size={20} />
          </button>
        </header>
        <Outlet />
      </div>

      {/* WithinAgent — mounted at the layout so it's available on every page */}
      <AgentPanel />

      {tourOpen && <Tour steps={tourSteps} onStepChange={handleTourStep} onClose={closeTour} />}
    </div>
  )
}