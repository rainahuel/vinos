'use client'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { RolSwitcher } from './RolSwitcher'
import { SupabaseSync } from './SupabaseSync'
import { useUI } from '@/lib/uiStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const fullscreen = useUI((s) => s.fullscreen)
  const setFullscreen = useUI((s) => s.setFullscreen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, setFullscreen])

  if (fullscreen) {
    return (
      <div className="h-screen flex flex-col">
        <SupabaseSync />
        {children}
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <SupabaseSync />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b bg-white px-6 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-700">
            Plataforma Anexo IX
          </h1>
          <RolSwitcher />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
