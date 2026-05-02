'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { getSupabase } from '@/lib/supabase/client'
import { useUsuarioActual } from '@/lib/useUsuarioActual'
import type { Rol } from '@/lib/types'

const rolLabel: Record<Rol, string> = {
  admin: 'Admin',
  ejecutivo: 'Ejecutivo',
  laboratorio: 'Laboratorio',
}

const rolEmoji: Record<Rol, string> = {
  admin: '👤',
  ejecutivo: '💼',
  laboratorio: '🧪',
}

export function UserMenu() {
  const { cargando, usuario, email, sinAcceso } = useUsuarioActual()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const logout = async () => {
    await getSupabase().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (cargando) return <div className="w-32 h-8" />

  if (sinAcceso) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-rose-600">Sin acceso a esta empresa</span>
        <button
          onClick={logout}
          className="px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (!usuario) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 text-sm"
      >
        <span>{rolEmoji[usuario.rol]}</span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-slate-800 font-medium">{usuario.nombre}</span>
          <span className="text-[10px] text-slate-500">
            {rolLabel[usuario.rol]}
          </span>
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-400"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-medium text-slate-900 truncate">
              {usuario.nombre}
            </div>
            <div className="text-xs text-slate-500 truncate">{email}</div>
            <div
              className={clsx(
                'inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium border',
                usuario.rol === 'admin'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : usuario.rol === 'ejecutivo'
                    ? 'bg-brand-50 text-brand-700 border-brand-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200',
              )}
            >
              {rolLabel[usuario.rol]}
            </div>
          </div>
          {usuario.rol === 'admin' && (
            <Link
              href="/admin/usuarios"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              👥 Gestionar usuarios
            </Link>
          )}
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
