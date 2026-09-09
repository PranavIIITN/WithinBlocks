import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const navItems = [
  { label: 'Dashboard', icon: '⊞', path: '/' },
  { label: 'Invoices', icon: '📄', path: '/invoices' },
  { label: 'Customers', icon: '👥', path: '/customers' },
  { label: 'Products', icon: '📦', path: '/products' },
]

const bottomItems = [
  { label: 'Reports', icon: '📊', path: '/reports' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
]

export default function AppLayout() {
  const { user, company, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#f5f5f3]">

      {/* Sidebar */}
      <div className="w-[220px] bg-white border-r border-[#d1d0c9] flex flex-col flex-shrink-0">
        
        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#d1d0c9]">
          <span className="text-[15px] font-medium text-[#1a1a18] tracking-tight">
            within<span className="text-[#185FA5]">blocks</span>
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 px-2 py-3">
          <div className="text-[10px] font-medium text-[#888780] uppercase tracking-widest px-2 py-2">
            Main
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] mb-0.5 ${
                  isActive
                    ? 'bg-[#EBF3FC] text-[#185FA5] font-medium'
                    : 'text-[#444441] hover:bg-[#f5f5f3] hover:text-[#1a1a18]'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="text-[10px] font-medium text-[#888780] uppercase tracking-widest px-2 py-2 mt-3">
            Business
          </div>
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] mb-0.5 ${
                  isActive
                    ? 'bg-[#EBF3FC] text-[#185FA5] font-medium'
                    : 'text-[#444441] hover:bg-[#f5f5f3] hover:text-[#1a1a18]'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div className="px-2 py-3 border-t border-[#d1d0c9]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <div className="w-7 h-7 rounded-full bg-[#E6F1FB] flex items-center justify-center text-[11px] font-medium text-[#185FA5] flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#1a1a18] truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-[#888780]">{user?.role || 'Owner'}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] text-[#888780] hover:text-[#1a1a18] cursor-pointer"
            >
              Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}