'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'

export default function AprobadosPage() {
  const archivos = useStore((s) => s.archivos)
  const solicitudes = useStore((s) => s.solicitudes)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const aprobados = archivos
    .filter((a) => a.aprobado)
    .sort((a, b) =>
      (b.aprobadoEn ?? b.createdAt).localeCompare(a.aprobadoEn ?? a.createdAt),
    )

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Archivos aprobados</h2>
        <p className="text-sm text-slate-500 mt-1">
          Anexos cerrados, listos para enviar al SAG / cliente.
        </p>
      </div>

      {aprobados.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center bg-white">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-slate-600 font-medium">Aún no hay aprobados</p>
          <p className="text-sm text-slate-400 mt-1">
            Aprobá un archivo desde su vista de detalle.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {aprobados.map((a) => {
            const filas = solicitudes.filter((s) => s.archivoId === a.id).length
            return (
              <Link
                key={a.id}
                href={`/archivos/${a.id}`}
                className="bg-white border border-emerald-200 rounded-lg p-4 hover:shadow-sm transition flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate flex items-center gap-2">
                    <span>{a.nombre}</span>
                    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium px-2 py-0.5 rounded">
                      ✓ Aprobado
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3 flex-wrap">
                    <span>📅 {a.mesReferencia}</span>
                    <span>📋 {filas} filas</span>
                    {a.aprobadoEn && (
                      <span>
                        Aprobado{' '}
                        {new Date(a.aprobadoEn).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                        {a.aprobadoPor ? ` · por ${a.aprobadoPor}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-brand-600 hover:underline shrink-0 ml-3">
                  Abrir →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
