import type {
  Archivo,
  Comentario,
  HojaInfo,
  Solicitud,
} from '@/lib/types'

export const EMPRESA_DEMO_ID = '00000000-0000-0000-0000-000000000001'

export interface ArchivoRow {
  id: string
  empresa_id: string
  nombre: string
  storage_path: string | null
  mes_referencia: string
  total_filas: number
  hojas: HojaInfo[]
  aprobado: boolean
  aprobado_en: string | null
  aprobado_por: string | null
  subido_por: string | null
  created_at: string
}

export interface SolicitudRow {
  id: string
  archivo_id: string
  empresa_id: string
  hoja: string
  fila_numero: number
  datos: Record<string, string | number>
  estado: 'ok' | 'pendiente' | 'resuelto'
  created_at: string
}

export interface ComentarioRow {
  id: string
  solicitud_id: string
  empresa_id: string
  user_id: string | null
  rol: 'ejecutivo' | 'laboratorio' | 'admin'
  texto: string
  created_at: string
}

export const archivoFromRow = (r: ArchivoRow): Archivo => ({
  id: r.id,
  empresaId: r.empresa_id,
  nombre: r.nombre,
  mesReferencia: r.mes_referencia,
  subidoPor: r.subido_por ?? '',
  createdAt: r.created_at,
  totalFilas: r.total_filas,
  hojas: r.hojas ?? [],
  aprobado: r.aprobado,
  aprobadoEn: r.aprobado_en ?? undefined,
  aprobadoPor: r.aprobado_por ?? undefined,
})

export const solicitudFromRow = (r: SolicitudRow): Solicitud => ({
  id: r.id,
  archivoId: r.archivo_id,
  empresaId: r.empresa_id,
  hoja: r.hoja,
  filaNumero: r.fila_numero,
  datos: r.datos,
  estado: r.estado,
})

export const comentarioFromRow = (r: ComentarioRow): Comentario => ({
  id: r.id,
  solicitudId: r.solicitud_id,
  empresaId: r.empresa_id,
  userId: r.user_id ?? '',
  rol: r.rol,
  texto: r.texto,
  createdAt: r.created_at,
})
