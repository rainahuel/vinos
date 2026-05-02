'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'
import { SupabaseSync } from './SupabaseSync'
import { useUI } from '@/lib/uiStore'
import { useUsuarioActual } from '@/lib/useUsuarioActual'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullscreen = useUI((s) => s.fullscreen)
  const setFullscreen = useUI((s) => s.setFullscreen)
  const toggleSidebar = useUI((s) => s.toggleSidebar)
  const { usuario, cargando, sinAcceso } = useUsuarioActual()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen, setFullscreen])

  // Páginas públicas — sin shell
  const isPublic =
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/signup') ||
    pathname?.startsWith('/auth')
  if (isPublic) return <>{children}</>

  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-400 text-sm">
        Cargando…
      </div>
    )
  }

  if (sinAcceso || !usuario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border rounded-2xl shadow-sm p-8 text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h1 className="font-semibold text-slate-900 mb-2">Sin acceso</h1>
          <p className="text-sm text-slate-600 mb-4">
            Tu correo no tiene permisos para esta empresa. Pedile a un
            administrador que te invite.
          </p>
          <UserMenu />
        </div>
      </div>
    )
  }

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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b bg-white px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
              aria-label="Abrir/cerrar menú"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-sm font-semibold text-slate-700 truncate">
              <span className="hidden sm:inline">Plataforma </span>Anexo IX
            </h1>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
