'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Car, GitCompare, Sparkles,
  LogOut, Sun, Moon, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Veículos', icon: Car },
  { href: '/compare', label: 'Comparativo', icon: GitCompare },
  { href: '/extract', label: 'Extrair Specs', icon: Sparkles },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <aside className="w-64 flex flex-col border-r fixed h-full"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>

        <div className="p-6 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' }}>
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                Ford Pickup Intel
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Inteligência Competitiva
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = typeof window !== 'undefined' && window.location.pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group"
                style={{
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--muted)'
                }}>
                <Icon className="w-4 h-4" />
                {item.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--muted)' }}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>

          <div className="px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
              {user.email}
            </p>
            <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
              {user.role}
            </p>
          </div>

          <button
            onClick={() => { logout(); router.push('/login') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-red-500">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}