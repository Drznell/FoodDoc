import { useLocation, useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, User } from 'lucide-react'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/analyse', label: 'Analyse', icon: Search },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="max-w-md mx-auto">
        <div className="glass-strong rounded-2xl flex overflow-hidden">
          {tabs.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center py-3.5 gap-1 transition-all duration-200 ${
                  active
                    ? 'text-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-primary/15' : ''}`}>
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
