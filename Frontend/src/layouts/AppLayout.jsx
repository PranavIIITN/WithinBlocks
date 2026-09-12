import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Users, FileText, BarChart2, Settings, LogOut, HelpCircle } from 'lucide-react'
import useAuthStore from '../store/authStore'

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

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f4f4f5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <div className="w-[210px] bg-white flex flex-col flex-shrink-0" style={{ borderRight: '1px solid #e4e4e7' }}>

        {/* Logo */}
        <div className="px-5 py-5">
          <div className="text-[15px] font-semibold text-[#09090b] tracking-tight">
            within<span style={{ color: '#2563eb' }}>blocks</span>
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5">Run your business, block by block.</div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5 transition-colors ${
                    isActive
                      ? 'bg-[#eff6ff] text-[#2563eb] font-medium'
                      : 'text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#09090b]'
                  }`
                }
              >
                <Icon size={15} />
                {item.label}
              </NavLink>
            )
          })}

          <div className="h-px bg-[#e4e4e7] my-3" />

          {bottomItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-0.5 transition-colors ${
                    isActive
                      ? 'bg-[#eff6ff] text-[#2563eb] font-medium'
                      : 'text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#09090b]'
                  }`
                }
              >
                <Icon size={15} />
                {item.label}
              </NavLink>
            )
          })}
        </div>

        {/* Help */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#52525b] cursor-pointer hover:bg-[#f4f4f5]">
            <HelpCircle size={15} />
            Need help?
          </div>
        </div>

        {/* User */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid #e4e4e7' }}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#f4f4f5] cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-[#dbeafe] flex items-center justify-center text-[11px] font-semibold text-[#2563eb] flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#09090b] truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-[#71717a] capitalize">{user?.role?.toLowerCase() || 'owner'}</div>
            </div>
            <LogOut
              size={14}
              className="text-[#a1a1aa] group-hover:text-[#52525b] cursor-pointer flex-shrink-0"
              onClick={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}