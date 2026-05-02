'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useStore } from '@/lib/store'
import { useUI } from '@/lib/uiStore'
import { TablaAnexo } from '@/components/TablaAnexo'
import { PanelComentarios } from '@/components/PanelComentarios'
import { UserMenu } from '@/components/UserMenu'
import { exportarConObservaciones } from '@/lib/excel'
import {
  estadoArchivo,
  colorEstadoArchivo,
  labelEstadoArchivo,
} from '@/lib/archivos'
import type { EstadoFila } from '@/lib/types'

type Filtro = 'todas' | EstadoFila

export default function ArchivoPage({ params }: { params: { id: string } }) {
  const archivo = useStore((s) => s.archivos.find((a) => a.id === params.id))
  const todasSolicitudes = useStore((s) => s.solicitudes)
  const todas = todasSolicitudes.filter((x) => x.archivoId === params.id)
  const comentarios = useStore((s) => s.comentarios)
  const usuario = useStore((s) => s.usuario)
  const toggleAprobado = useStore((s) => s.toggleAprobado)
  const puedeEscribir = usuario.rol === 'admin' || usuario.rol === 'ejecutivo'
  const fullscreen = useUI((s) => s.fullscreen)
  const toggleFullscreen = useUI((s) => s.toggleFullscreen)
  const setFullscreen = useUI((s) => s.setFullscreen)
  useEffect(() => () => setFullscreen(false), [setFullscreen])

  const [hojaActiva, setHojaActiva] = useState<string | null>(null)
  const [seleccionadaId, setSeleccionadaId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (archivo && !hojaActiva && archivo.hojas.length > 0) {
      setHojaActiva(archivo.hojas[0].nombre)
    }
  }, [archivo, hojaActiva])

  useEffect(() => {
    setSeleccionadaId(null)
    setFiltro('todas')
    setBusqueda('')
  }, [hojaActiva])

  const filtradas = useMemo(() => {
    if (!hojaActiva) return []
    let out = todas.filter((s) => s.hoja === hojaActiva)
    if (filtro !== 'todas') out = out.filter((s) => s.estado === filtro)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      out = out.filter((s) =>
        Object.values(s.datos).some((v) => String(v).toLowerCase().includes(q)),
      )
    }
    const peso: Record<string, number> = { pendiente: 0, resuelto: 1, ok: 2 }
    return out.sort((a, b) => {
      const d = peso[a.estado] - peso[b.estado]
      return d !== 0 ? d : a.filaNumero - b.filaNumero
    })
  }, [todas, hojaActiva, filtro, busqueda])

  const seleccionada = todas.find((s) => s.id === seleccionadaId) ?? null

  if (!mounted) return null

  if (!archivo) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Archivo no encontrado.</p>
        <Link
          href="/"
          className="text-brand-600 hover:underline text-sm mt-2 inline-block"
        >
          ← Volver
        </Link>
      </div>
    )
  }

  const solicitudesHoja = todas.filter((s) => s.hoja === hojaActiva)
  const conteos = {
    total: solicitudesHoja.length,
    ok: solicitudesHoja.filter((s) => s.estado === 'ok').length,
    pendiente: solicitudesHoja.filter((s) => s.estado === 'pendiente').length,
    resuelto: solicitudesHoja.filter((s) => s.estado === 'resuelto').length,
  }

  const exportar = () => {
    const comentariosArchivo = comentarios.filter((c) =>
      todas.some((s) => s.id === c.solicitudId),
    )
    exportarConObservaciones(archivo.nombre, todas, comentariosArchivo)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="flex items-start sm:items-center justify-between mb-3 gap-3 flex-wrap">
          <div className="min-w-0">
            {!fullscreen && (
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ← Archivos
              </Link>
            )}
            <div className="flex items-center gap-3 mt-1">
              <h2
                className={clsx(
                  'font-bold text-slate-900 truncate',
                  fullscreen ? 'text-base' : 'text-xl',
                )}
              >
                {archivo.nombre}
              </h2>
              <span
                className={clsx(
                  'inline-block px-2 py-0.5 rounded text-xs font-medium border shrink-0',
                  colorEstadoArchivo[estadoArchivo(archivo, todasSolicitudes)],
                )}
              >
                {labelEstadoArchivo[estadoArchivo(archivo, todasSolicitudes)]}
              </span>
            </div>
            {!fullscreen && (
              <p className="text-xs text-slate-500 mt-1">
                📅 {archivo.mesReferencia} · {archivo.totalFilas} filas total ·{' '}
                {archivo.hojas.length}{' '}
                {archivo.hojas.length === 1 ? 'hoja' : 'hojas'}
                {archivo.aprobadoEn && archivo.aprobadoPor && (
                  <span className="text-emerald-600 ml-2">
                    · ✓ Aprobado por {archivo.aprobadoPor} el{' '}
                    {new Date(archivo.aprobadoEn).toLocaleDateString('es-CL')}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fullscreen && <UserMenu />}
            <button
              onClick={toggleFullscreen}
              title={fullscreen ? 'Salir (Esc)' : 'Pantalla completa'}
              className="px-3 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              {fullscreen ? (
                <>
                  <span>⤡</span>
                  <span className="hidden sm:inline">Salir</span>
                  <kbd className="hidden sm:inline text-[10px] text-slate-400 ml-1">
                    Esc
                  </kbd>
                </>
              ) : (
                <>
                  <span>⛶</span>
                  <span className="hidden sm:inline">Pantalla completa</span>
                </>
              )}
            </button>
            {!fullscreen && (
              <>
                {puedeEscribir && (
                  <button
                    onClick={() => {
                      const pendientes = todas.filter(
                        (s) => s.estado === 'pendiente',
                      ).length
                      if (
                        !archivo.aprobado &&
                        pendientes > 0 &&
                        !confirm(
                          `Hay ${pendientes} fila(s) pendiente(s). ¿Aprobar igual?`,
                        )
                      ) {
                        return
                      }
                      toggleAprobado(archivo.id)
                    }}
                    className={clsx(
                      'px-4 py-2 rounded-md text-sm font-medium',
                      archivo.aprobado
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700',
                    )}
                  >
                    {archivo.aprobado ? '↩ Reabrir' : '✓ Aprobar archivo'}
                  </button>
                )}
                <button
                  onClick={exportar}
                  className="px-4 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ⬇ Exportar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-1 -mb-px overflow-x-auto">
          {archivo.hojas.map((h) => {
            const solsHoja = todas.filter((s) => s.hoja === h.nombre)
            const pendientesHoja = solsHoja.filter(
              (s) => s.estado === 'pendiente',
            ).length
            const resueltosHoja = solsHoja.filter(
              (s) => s.estado === 'resuelto',
            ).length
            const isActiva = hojaActiva === h.nombre
            return (
              <button
                key={h.nombre}
                onClick={() => setHojaActiva(h.nombre)}
                className={clsx(
                  'px-3 sm:px-4 py-2 text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-1.5 sm:gap-2',
                  isActiva
                    ? pendientesHoja > 0
                      ? 'border-rose-500 text-rose-700 font-medium bg-rose-50'
                      : 'border-brand-600 text-brand-700 font-medium'
                    : pendientesHoja > 0
                      ? 'border-transparent text-rose-700 hover:bg-rose-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                {pendientesHoja > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                    aria-label="con comentarios"
                  />
                )}
                {h.nombre}
                <span className="text-xs text-slate-400">
                  ({h.totalFilas})
                </span>
                {pendientesHoja > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                    {pendientesHoja}
                  </span>
                )}
                {pendientesHoja === 0 && resueltosHoja > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 rounded">
                    ✓ {resueltosHoja}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-b bg-white px-3 sm:px-6 py-3 flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="inline-flex rounded-md border bg-slate-50 p-0.5 text-xs overflow-x-auto max-w-full">
          {(
            [
              ['todas', `Todas (${conteos.total})`],
              ['pendiente', `Pendientes (${conteos.pendiente})`],
              ['resuelto', `Resueltas (${conteos.resuelto})`],
              ['ok', `Sin obs. (${conteos.ok})`],
            ] as [Filtro, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`px-2 sm:px-3 py-1 rounded whitespace-nowrap ${
                filtro === k
                  ? 'bg-white shadow-sm font-medium text-brand-700'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar…"
          className="text-sm border rounded-md px-3 py-1.5 flex-1 min-w-[140px] sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex-1 lg:grid lg:grid-cols-[1fr_400px] overflow-hidden relative">
        <div className="min-w-0 bg-white lg:border-r overflow-hidden h-full">
          <TablaAnexo
            solicitudes={filtradas}
            seleccionadaId={seleccionadaId}
            onSeleccionar={setSeleccionadaId}
          />
        </div>
        <div
          className={clsx(
            'overflow-hidden bg-white',
            'fixed lg:static inset-0 z-40 lg:z-auto',
            'transition-transform duration-200',
            seleccionada ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          )}
        >
          {seleccionada && (
            <button
              onClick={() => setSeleccionadaId(null)}
              className="lg:hidden absolute top-3 right-3 z-10 p-2 rounded-md bg-white border shadow-sm text-slate-600 hover:bg-slate-50"
              aria-label="Cerrar comentarios"
            >
              ✕
            </button>
          )}
          <PanelComentarios solicitud={seleccionada} />
        </div>
      </div>
    </div>
  )
}
