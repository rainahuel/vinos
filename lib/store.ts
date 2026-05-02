'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Archivo,
  Comentario,
  Empresa,
  EstadoFila,
  HojaInfo,
  Solicitud,
  UsuarioActivo,
} from './types'
import type { HojaParseada } from './excel'
import { getSupabase } from './supabase/client'
import {
  archivoFromRow,
  comentarioFromRow,
  solicitudFromRow,
  EMPRESA_DEMO_ID,
  type ArchivoRow,
  type ComentarioRow,
  type SolicitudRow,
} from './supabase/mappers'

interface State {
  empresas: Empresa[]
  archivos: Archivo[]
  solicitudes: Solicitud[]
  comentarios: Comentario[]
  usuario: UsuarioActivo
  cargado: boolean

  setUsuario: (u: UsuarioActivo) => void
  cargarTodo: () => Promise<void>
  agregarArchivo: (
    archivo: {
      empresaId: string
      nombre: string
      mesReferencia: string
      subidoPor: string
      storagePath?: string | null
    },
    hojas: HojaParseada[],
  ) => Promise<string>
  eliminarArchivo: (archivoId: string) => Promise<void>
  agregarComentario: (c: {
    solicitudId: string
    empresaId: string
    userId: string
    rol: 'ejecutivo' | 'laboratorio' | 'admin'
    texto: string
  }) => Promise<void>
  cambiarEstado: (solicitudId: string, estado: EstadoFila) => Promise<void>
  toggleAprobado: (archivoId: string) => Promise<void>

  upsertArchivoLocal: (a: Archivo) => void
  removerArchivoLocal: (archivoId: string) => void
  upsertSolicitudLocal: (s: Solicitud) => void
  upsertComentarioLocal: (c: Comentario) => void
}

const empresaInicial: Empresa = {
  id: EMPRESA_DEMO_ID,
  nombre: 'Viña Concha y Toro',
  slug: 'concha-y-toro',
}

const usuarioInicial: UsuarioActivo = {
  id: 'user-demo',
  nombre: 'Demo',
  rol: 'ejecutivo',
  empresaId: empresaInicial.id,
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      empresas: [empresaInicial],
      archivos: [],
      solicitudes: [],
      comentarios: [],
      usuario: usuarioInicial,
      cargado: false,

      setUsuario: (u) => set({ usuario: u }),

      cargarTodo: async () => {
        const sb = getSupabase()
        const [archivosRes, solicitudesRes, comentariosRes] = await Promise.all(
          [
            sb
              .from('archivos')
              .select('*')
              .eq('empresa_id', EMPRESA_DEMO_ID)
              .order('created_at', { ascending: false }),
            sb
              .from('solicitudes')
              .select('*')
              .eq('empresa_id', EMPRESA_DEMO_ID),
            sb
              .from('comentarios')
              .select('*')
              .eq('empresa_id', EMPRESA_DEMO_ID),
          ],
        )
        if (archivosRes.error) throw archivosRes.error
        if (solicitudesRes.error) throw solicitudesRes.error
        if (comentariosRes.error) throw comentariosRes.error

        set({
          archivos: (archivosRes.data as ArchivoRow[]).map(archivoFromRow),
          solicitudes: (solicitudesRes.data as SolicitudRow[]).map(
            solicitudFromRow,
          ),
          comentarios: (comentariosRes.data as ComentarioRow[]).map(
            comentarioFromRow,
          ),
          cargado: true,
        })
      },

      agregarArchivo: async (archivo, hojas) => {
        const sb = getSupabase()
        const hojasInfo: HojaInfo[] = hojas.map((h) => ({
          nombre: h.nombre,
          columnas: h.columnas,
          totalFilas: h.filas.length,
        }))
        const totalFilas = hojas.reduce((acc, h) => acc + h.filas.length, 0)

        const { data: archivoRow, error: errArchivo } = await sb
          .from('archivos')
          .insert({
            empresa_id: archivo.empresaId,
            nombre: archivo.nombre,
            mes_referencia: archivo.mesReferencia,
            subido_por: archivo.subidoPor,
            storage_path: archivo.storagePath ?? null,
            total_filas: totalFilas,
            hojas: hojasInfo,
            aprobado: false,
          })
          .select()
          .single()
        if (errArchivo) throw errArchivo

        const archivoId = (archivoRow as ArchivoRow).id

        const inserts = hojas.flatMap((h) =>
          h.filas.map((row, i) => ({
            archivo_id: archivoId,
            empresa_id: archivo.empresaId,
            hoja: h.nombre,
            fila_numero: i + 2,
            datos: row,
            estado: 'ok' as const,
          })),
        )

        if (inserts.length > 0) {
          const CHUNK = 500
          for (let i = 0; i < inserts.length; i += CHUNK) {
            const { error } = await sb
              .from('solicitudes')
              .insert(inserts.slice(i, i + CHUNK))
            if (error) throw error
          }
        }

        await get().cargarTodo()
        return archivoId
      },

      eliminarArchivo: async (archivoId) => {
        const sb = getSupabase()
        const { error } = await sb.from('archivos').delete().eq('id', archivoId)
        if (error) throw error
        const solicitudIds = get()
          .solicitudes.filter((s) => s.archivoId === archivoId)
          .map((s) => s.id)
        set({
          archivos: get().archivos.filter((a) => a.id !== archivoId),
          solicitudes: get().solicitudes.filter(
            (s) => s.archivoId !== archivoId,
          ),
          comentarios: get().comentarios.filter(
            (c) => !solicitudIds.includes(c.solicitudId),
          ),
        })
      },

      agregarComentario: async (c) => {
        const sb = getSupabase()
        const estadoNuevo: EstadoFila =
          c.rol === 'laboratorio' ? 'pendiente' : 'resuelto'
        const { error: errCom } = await sb.from('comentarios').insert({
          solicitud_id: c.solicitudId,
          empresa_id: c.empresaId,
          user_id: c.userId,
          rol: c.rol,
          texto: c.texto,
        })
        if (errCom) throw errCom
        const { error: errEstado } = await sb
          .from('solicitudes')
          .update({ estado: estadoNuevo })
          .eq('id', c.solicitudId)
        if (errEstado) throw errEstado
      },

      cambiarEstado: async (solicitudId, estado) => {
        const sb = getSupabase()
        const { error } = await sb
          .from('solicitudes')
          .update({ estado })
          .eq('id', solicitudId)
        if (error) throw error
      },

      toggleAprobado: async (archivoId) => {
        const sb = getSupabase()
        const archivo = get().archivos.find((a) => a.id === archivoId)
        if (!archivo) return
        const usuario = get().usuario
        const patch = archivo.aprobado
          ? { aprobado: false, aprobado_en: null, aprobado_por: null }
          : {
              aprobado: true,
              aprobado_en: new Date().toISOString(),
              aprobado_por: usuario.nombre,
            }
        const { error } = await sb
          .from('archivos')
          .update(patch)
          .eq('id', archivoId)
        if (error) throw error
      },

      upsertArchivoLocal: (a) => {
        const exists = get().archivos.some((x) => x.id === a.id)
        set({
          archivos: exists
            ? get().archivos.map((x) => (x.id === a.id ? a : x))
            : [a, ...get().archivos],
        })
      },
      removerArchivoLocal: (archivoId) => {
        const solicitudIds = get()
          .solicitudes.filter((s) => s.archivoId === archivoId)
          .map((s) => s.id)
        set({
          archivos: get().archivos.filter((a) => a.id !== archivoId),
          solicitudes: get().solicitudes.filter(
            (s) => s.archivoId !== archivoId,
          ),
          comentarios: get().comentarios.filter(
            (c) => !solicitudIds.includes(c.solicitudId),
          ),
        })
      },
      upsertSolicitudLocal: (s) => {
        const exists = get().solicitudes.some((x) => x.id === s.id)
        set({
          solicitudes: exists
            ? get().solicitudes.map((x) => (x.id === s.id ? s : x))
            : [...get().solicitudes, s],
        })
      },
      upsertComentarioLocal: (c) => {
        if (get().comentarios.some((x) => x.id === c.id)) return
        set({ comentarios: [...get().comentarios, c] })
      },
    }),
    {
      name: 'anexo-saas-ui',
      version: 4,
      partialize: (s) => ({ usuario: s.usuario }),
    },
  ),
)
