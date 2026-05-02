'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { useStore } from '@/lib/store'
import type { Solicitud } from '@/lib/types'

export function PanelComentarios({ solicitud }: { solicitud: Solicitud | null }) {
  const usuario = useStore((s) => s.usuario)
  const comentarios = useStore((s) =>
    solicitud
      ? s.comentarios
          .filter((c) => c.solicitudId === solicitud.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : [],
  )
  const agregarComentario = useStore((s) => s.agregarComentario)
  const cambiarEstado = useStore((s) => s.cambiarEstado)
  const [texto, setTexto] = useState('')

  if (!solicitud) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 text-sm">
        Seleccioná una fila para ver y agregar comentarios.
      </div>
    )
  }

  const enviar = () => {
    if (!texto.trim()) return
    agregarComentario({
      solicitudId: solicitud.id,
      empresaId: solicitud.empresaId,
      userId: usuario.id,
      rol: usuario.rol === 'admin' ? 'ejecutivo' : usuario.rol,
      texto: texto.trim(),
    })
    setTexto('')
  }

  const datos = solicitud.datos
  const camposPrincipales = Object.entries(datos).slice(0, 4)

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">
            Fila {solicitud.filaNumero}
          </span>
          <select
            value={solicitud.estado}
            onChange={(e) =>
              cambiarEstado(solicitud.id, e.target.value as never)
            }
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="ok">OK</option>
            <option value="pendiente">Pendiente</option>
            <option value="resuelto">Resuelto</option>
          </select>
        </div>
        <div className="space-y-1">
          {camposPrincipales.map(([k, v]) => (
            <div key={k} className="text-sm">
              <span className="text-slate-400">{k}: </span>
              <span className="text-slate-800 font-medium">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {comentarios.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">
            Sin comentarios todavía.
          </p>
        )}
        {comentarios.map((c) => {
          const esLab = c.rol === 'laboratorio'
          return (
            <div
              key={c.id}
              className={clsx(
                'flex flex-col',
                esLab ? 'items-start' : 'items-end',
              )}
            >
              <div
                className={clsx(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                  esLab
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-brand-50 border border-brand-100 text-brand-700',
                )}
              >
                {c.texto}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {esLab ? '🧪 Laboratorio' : '💼 Ejecutivo'} ·{' '}
                {new Date(c.createdAt).toLocaleString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            </div>
          )
        })}
      </div>

      <div className="border-t p-3 bg-slate-50">
        <div className="text-[11px] text-slate-500 mb-2">
          Escribiendo como{' '}
          <span className="font-medium text-slate-700">
            {usuario.rol === 'laboratorio' ? '🧪 Laboratorio' : '💼 Ejecutivo'}
          </span>
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar()
          }}
          placeholder={
            usuario.rol === 'laboratorio'
              ? 'Agregar observación de laboratorio…'
              : 'Responder al laboratorio…'
          }
          rows={3}
          className="w-full text-sm border rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-slate-400">⌘/Ctrl + Enter</span>
          <button
            onClick={enviar}
            disabled={!texto.trim()}
            className="px-3 py-1.5 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
