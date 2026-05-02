export type Rol = 'ejecutivo' | 'laboratorio' | 'admin'

export type EstadoFila = 'ok' | 'pendiente' | 'resuelto'

export interface Empresa {
  id: string
  nombre: string
  slug: string
}

export interface HojaInfo {
  nombre: string
  columnas: string[]
  totalFilas: number
}

export interface Archivo {
  id: string
  empresaId: string
  nombre: string
  mesReferencia: string
  subidoPor: string
  createdAt: string
  totalFilas: number
  hojas: HojaInfo[]
  aprobado: boolean
  aprobadoEn?: string
  aprobadoPor?: string
}

export interface Solicitud {
  id: string
  archivoId: string
  empresaId: string
  hoja: string
  filaNumero: number
  datos: Record<string, string | number>
  estado: EstadoFila
}

export interface Comentario {
  id: string
  solicitudId: string
  empresaId: string
  userId: string
  rol: Rol
  texto: string
  createdAt: string
}

export interface UsuarioActivo {
  id: string
  nombre: string
  rol: Rol
  empresaId: string
}
