'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useStore } from '@/lib/store'
import {
  estadoArchivo,
  colorEstadoArchivo,
  labelEstadoArchivo,
} from '@/lib/archivos'

const items = [
  { href: '/', label: 'Archivos', icon: '📁' },
  { href: '/aprobados', label: 'Aprobados', icon: '✓' },
  { href: '/pendientes', label: 'Pendientes', icon: '⚠️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const archivos = useStore((s) => s.archivos)
  const solicitudes = useStore((s) => s.solicitudes)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const recientes = [...archivos]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  return (
    <aside className="w-64 shrink-0 bg-white border-r flex flex-col">
      <div className="h-14 px-5 flex items-center border-b">
        <span className="text-base font-bold text-brand-600">Anexo IX</span>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it) => {
          const active =
            it.href === '/'
              ? pathname === '/'
              : pathname.startsWith(it.href)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <span>{it.icon}</span>
              {it.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-2 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
          Recientes
        </div>
        {!mounted ? null : recientes.length === 0 ? (
          <p className="px-4 py-2 text-xs text-slate-400">Sin archivos aún.</p>
        ) : (
          <div className="px-2 pb-2 space-y-1">
            {recientes.map((a) => {
              const estado = estadoArchivo(a, solicitudes)
              const active = pathname === `/archivos/${a.id}`
              return (
                <Link
                  key={a.id}
                  href={`/archivos/${a.id}`}
                  className={clsx(
                    'block px-3 py-2 rounded-md text-xs transition',
                    active
                      ? 'bg-brand-50'
                      : 'hover:bg-slate-50',
                  )}
                  title={a.nombre}
                >
                  <div
                    className={clsx(
                      'truncate font-medium',
                      active ? 'text-brand-700' : 'text-slate-700',
                    )}
                  >
                    {a.nombre.replace(/\.xlsx?$/i, '')}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={clsx(
                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border',
                        colorEstadoArchivo[estado],
                      )}
                    >
                      {labelEstadoArchivo[estado]}
                    </span>
                    <span className="text-slate-400">{a.mesReferencia}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-3 border-t text-xs text-slate-400">
        v0.1 · Demo local
      </div>
    </aside>
  )
}
