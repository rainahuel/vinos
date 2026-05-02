'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'

export default function PendientesPage() {
  const archivos = useStore((s) => s.archivos)
  const solicitudes = useStore((s) => s.solicitudes)
  const comentarios = useStore((s) => s.comentarios)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const pendientes = solicitudes
    .filter((s) => s.estado === 'pendiente')
    .map((s) => {
      const archivo = archivos.find((a) => a.id === s.archivoId)
      const ultimoComentario = comentarios
        .filter((c) => c.solicitudId === s.id && c.rol === 'laboratorio')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return { s, archivo, ultimoComentario }
    })
    .filter((x) => x.archivo)

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Pendientes de respuesta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Filas marcadas con observaciones que esperan respuesta del ejecutivo.
        </p>
      </div>

      {pendientes.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center bg-white">
          <div className="text-4xl mb-3">✨</div>
          <p className="text-slate-600 font-medium">No hay pendientes</p>
          <p className="text-sm text-slate-400 mt-1">
            Todas las filas con observación están resueltas o sin comentar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendientes.map(({ s, archivo, ultimoComentario }) => {
            const primerCampo = Object.entries(s.datos)[0]
            return (
              <Link
                key={s.id}
                href={`/archivos/${archivo!.id}`}
                className="block bg-white border rounded-lg p-4 hover:shadow-sm hover:border-amber-300 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded">
                      Pendiente
                    </span>
                    <span className="text-xs text-slate-500">
                      {archivo!.nombre} · {s.hoja} · fila {s.filaNumero}
                    </span>
                  </div>
                  {primerCampo && (
                    <span className="text-xs text-slate-400">
                      {primerCampo[0]}: <strong>{String(primerCampo[1])}</strong>
                    </span>
                  )}
                </div>
                {ultimoComentario && (
                  <div className="text-sm text-slate-700 bg-amber-50 rounded p-2 mt-2">
                    🧪 {ultimoComentario.texto}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
