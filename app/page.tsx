'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useStore } from '@/lib/store'
import { UploadButton } from '@/components/UploadButton'
import {
  estadoArchivo,
  colorEstadoArchivo,
  labelEstadoArchivo,
} from '@/lib/archivos'

type Tab = 'en_revision' | 'aprobado'

export default function HomePage() {
  const archivos = useStore((s) => s.archivos)
  const solicitudes = useStore((s) => s.solicitudes)
  const eliminarArchivo = useStore((s) => s.eliminarArchivo)
  const [tab, setTab] = useState<Tab>('en_revision')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const ordenados = [...archivos].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )

  const aprobados = ordenados.filter((a) => a.aprobado)
  const enRevision = ordenados.filter((a) => !a.aprobado)
  const lista = tab === 'aprobado' ? aprobados : enRevision

  const conteoPorArchivo = (archivoId: string) => {
    const sols = solicitudes.filter((s) => s.archivoId === archivoId)
    return {
      total: sols.length,
      pendientes: sols.filter((s) => s.estado === 'pendiente').length,
      resueltos: sols.filter((s) => s.estado === 'resuelto').length,
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Archivos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Subí un Anexo IX para empezar la revisión colaborativa.
          </p>
        </div>
        <UploadButton />
      </div>

      <div className="inline-flex rounded-md border bg-slate-50 p-0.5 text-sm mb-4">
        {(
          [
            ['en_revision', `En revisión (${enRevision.length})`],
            ['aprobado', `Aprobados (${aprobados.length})`],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={clsx(
              'px-4 py-1.5 rounded',
              tab === k
                ? 'bg-white shadow-sm font-medium text-brand-700'
                : 'text-slate-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center bg-white">
          <div className="text-4xl mb-3">
            {tab === 'aprobado' ? '✓' : '📂'}
          </div>
          <p className="text-slate-600 font-medium">
            {tab === 'aprobado'
              ? 'Aún no hay archivos aprobados'
              : archivos.length === 0
                ? 'Aún no hay archivos'
                : 'Todos los archivos están aprobados'}
          </p>
          {archivos.length === 0 && (
            <p className="text-sm text-slate-400 mt-1">
              Subí tu primer Excel o probá con el archivo demo.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {lista.map((a) => {
            const c = conteoPorArchivo(a.id)
            const estado = estadoArchivo(a, solicitudes)
            return (
              <div
                key={a.id}
                className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition"
              >
                <Link href={`/archivos/${a.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 truncate">
                      {a.nombre}
                    </span>
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-medium border',
                        colorEstadoArchivo[estado],
                      )}
                    >
                      {labelEstadoArchivo[estado]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3 flex-wrap">
                    <span>📅 {a.mesReferencia}</span>
                    <span>
                      📑 {a.hojas.length}{' '}
                      {a.hojas.length === 1 ? 'hoja' : 'hojas'}
                    </span>
                    <span>📋 {c.total} filas</span>
                    {c.pendientes > 0 && (
                      <span className="text-amber-600 font-medium">
                        ⚠ {c.pendientes} pendientes
                      </span>
                    )}
                    {c.resueltos > 0 && (
                      <span className="text-emerald-600">
                        ✓ {c.resueltos} resueltos
                      </span>
                    )}
                    {a.aprobadoEn && (
                      <span className="text-emerald-600">
                        ✓ Aprobado{' '}
                        {new Date(a.aprobadoEn).toLocaleDateString('es-CL')}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/archivos/${a.id}`}
                    className="text-sm text-brand-600 hover:underline px-3 py-1.5"
                  >
                    Abrir →
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este archivo y sus comentarios?')) {
                        eliminarArchivo(a.id)
                      }
                    }}
                    className="text-sm text-slate-400 hover:text-red-600 px-2"
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
