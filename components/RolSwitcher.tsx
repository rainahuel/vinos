'use client'
import { useStore } from '@/lib/store'
import type { Rol } from '@/lib/types'
import { useEffect, useState } from 'react'

export function RolSwitcher() {
  const usuario = useStore((s) => s.usuario)
  const setUsuario = useStore((s) => s.setUsuario)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-48 h-8" />

  const cambiar = (rol: Rol) => {
    setUsuario({
      ...usuario,
      rol,
      nombre: rol === 'ejecutivo' ? 'Ejecutivo demo' : 'Laboratorio demo',
    })
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">Ver como:</span>
      <div className="inline-flex rounded-md border bg-slate-50 p-0.5">
        <button
          onClick={() => cambiar('ejecutivo')}
          className={`px-3 py-1 rounded ${
            usuario.rol === 'ejecutivo'
              ? 'bg-white shadow-sm font-medium text-brand-700'
              : 'text-slate-500'
          }`}
        >
          Ejecutivo
        </button>
        <button
          onClick={() => cambiar('laboratorio')}
          className={`px-3 py-1 rounded ${
            usuario.rol === 'laboratorio'
              ? 'bg-white shadow-sm font-medium text-brand-700'
              : 'text-slate-500'
          }`}
        >
          Laboratorio
        </button>
      </div>
    </div>
  )
}
