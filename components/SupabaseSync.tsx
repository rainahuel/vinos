'use client'
import { useEffect } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import {
  archivoFromRow,
  comentarioFromRow,
  solicitudFromRow,
  EMPRESA_DEMO_ID,
  type ArchivoRow,
  type ComentarioRow,
  type SolicitudRow,
} from '@/lib/supabase/mappers'

export function SupabaseSync() {
  const cargarTodo = useStore((s) => s.cargarTodo)
  const upsertArchivo = useStore((s) => s.upsertArchivoLocal)
  const removerArchivo = useStore((s) => s.removerArchivoLocal)
  const upsertSolicitud = useStore((s) => s.upsertSolicitudLocal)
  const upsertComentario = useStore((s) => s.upsertComentarioLocal)

  useEffect(() => {
    cargarTodo().catch((e) => console.error('cargarTodo', e))
  }, [cargarTodo])

  useEffect(() => {
    const sb = getSupabase()
    const channel = sb
      .channel('anexo-saas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'archivos',
          filter: `empresa_id=eq.${EMPRESA_DEMO_ID}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            removerArchivo((payload.old as ArchivoRow).id)
          } else {
            upsertArchivo(archivoFromRow(payload.new as ArchivoRow))
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitudes',
          filter: `empresa_id=eq.${EMPRESA_DEMO_ID}`,
        },
        (payload) => {
          if (payload.eventType !== 'DELETE') {
            upsertSolicitud(solicitudFromRow(payload.new as SolicitudRow))
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comentarios',
          filter: `empresa_id=eq.${EMPRESA_DEMO_ID}`,
        },
        (payload) => {
          upsertComentario(comentarioFromRow(payload.new as ComentarioRow))
        },
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [upsertArchivo, removerArchivo, upsertSolicitud, upsertComentario])

  return null
}
