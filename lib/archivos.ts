import type { Archivo, Solicitud } from './types'

export type EstadoArchivo = 'aprobado' | 'pendiente' | 'en_revision'

export function estadoArchivo(
  archivo: Archivo,
  solicitudes: Solicitud[],
): EstadoArchivo {
  if (archivo.aprobado) return 'aprobado'
  const sols = solicitudes.filter((s) => s.archivoId === archivo.id)
  if (sols.some((s) => s.estado === 'pendiente')) return 'pendiente'
  return 'en_revision'
}

export const labelEstadoArchivo: Record<EstadoArchivo, string> = {
  aprobado: 'Aprobado',
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
}

export const colorEstadoArchivo: Record<EstadoArchivo, string> = {
  aprobado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  en_revision: 'bg-slate-100 text-slate-600 border-slate-200',
}
