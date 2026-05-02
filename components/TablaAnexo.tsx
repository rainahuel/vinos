'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import type { Solicitud, EstadoFila } from '@/lib/types'
import { useStore } from '@/lib/store'

const badge: Record<EstadoFila, string> = {
  ok: 'bg-slate-100 text-slate-600',
  pendiente: 'bg-rose-100 text-rose-700',
  resuelto: 'bg-emerald-100 text-emerald-700',
}

const label: Record<EstadoFila, string> = {
  ok: 'OK',
  pendiente: 'Pendiente',
  resuelto: 'Resuelto',
}

const filaColor: Record<EstadoFila, string> = {
  ok: 'bg-white hover:bg-slate-50',
  pendiente: 'bg-rose-50 hover:bg-rose-100 border-l-4 border-l-rose-400',
  resuelto:
    'bg-emerald-50/40 hover:bg-emerald-50 border-l-4 border-l-emerald-300',
}

export function TablaAnexo({
  solicitudes,
  seleccionadaId,
  onSeleccionar,
}: {
  solicitudes: Solicitud[]
  seleccionadaId: string | null
  onSeleccionar: (id: string) => void
}) {
  const comentarios = useStore((s) => s.comentarios)
  const topRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [tableWidth, setTableWidth] = useState(0)

  useLayoutEffect(() => {
    const sync = () => {
      if (tableRef.current) setTableWidth(tableRef.current.scrollWidth)
    }
    sync()
    const ro = new ResizeObserver(sync)
    if (tableRef.current) ro.observe(tableRef.current)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [solicitudes])

  useEffect(() => {
    const top = topRef.current
    const bot = bottomRef.current
    if (!top || !bot) return
    let lock = false
    const onTop = () => {
      if (lock) return
      lock = true
      bot.scrollLeft = top.scrollLeft
      lock = false
    }
    const onBot = () => {
      if (lock) return
      lock = true
      top.scrollLeft = bot.scrollLeft
      lock = false
    }
    top.addEventListener('scroll', onTop)
    bot.addEventListener('scroll', onBot)
    return () => {
      top.removeEventListener('scroll', onTop)
      bot.removeEventListener('scroll', onBot)
    }
  }, [])

  if (solicitudes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Sin filas para mostrar.
      </div>
    )
  }

  const columnas = Object.keys(solicitudes[0].datos)
  const conteoComentarios = (solicitudId: string) =>
    comentarios.filter((c) => c.solicitudId === solicitudId).length

  return (
    <div className="h-full flex flex-col">
      <div
        ref={topRef}
        className="scroll-x-fat overflow-x-auto overflow-y-hidden border-b bg-slate-50 sticky top-0 z-20"
      >
        <div style={{ width: tableWidth, height: 1 }} />
      </div>
      <div ref={bottomRef} className="scroll-x-fat flex-1 overflow-auto">
        <table
          ref={tableRef}
          className="min-w-full w-max text-sm border-collapse"
        >
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-slate-500 border-b w-12">
                #
              </th>
              <th className="text-left px-3 py-2 font-medium text-slate-500 border-b w-28">
                Estado
              </th>
              {columnas.map((col) => (
                <th
                  key={col}
                  className="text-left px-3 py-2 font-medium text-slate-600 border-b whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              <th className="text-left px-3 py-2 font-medium text-slate-500 border-b w-20">
                💬
              </th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => {
              const isSelected = seleccionadaId === s.id
              const count = conteoComentarios(s.id)
              return (
                <tr
                  key={s.id}
                  onClick={() => onSeleccionar(s.id)}
                  className={clsx(
                    'cursor-pointer border-b transition',
                    isSelected
                      ? 'bg-brand-50 border-l-4 border-l-brand-500'
                      : filaColor[s.estado],
                  )}
                >
                  <td className="px-3 py-2 text-slate-400 text-xs">
                    {s.filaNumero}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={clsx(
                        'inline-block px-2 py-0.5 rounded text-xs font-medium',
                        badge[s.estado],
                      )}
                    >
                      {label[s.estado]}
                    </span>
                  </td>
                  {columnas.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 text-slate-700 whitespace-nowrap"
                    >
                      {String(s.datos[col] ?? '')}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-slate-500 text-xs">
                    {count > 0 ? `💬 ${count}` : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
