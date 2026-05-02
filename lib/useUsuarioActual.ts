'use client'
import { useEffect, useState } from 'react'
import { useStore } from './store'
import { getSupabase } from './supabase/client'
import type { UsuarioActivo, Rol } from './types'

interface SessionState {
  cargando: boolean
  usuario: UsuarioActivo | null
  email: string | null
  sinAcceso: boolean
}

export function useUsuarioActual(): SessionState {
  const setUsuarioStore = useStore((s) => s.setUsuario)
  const [state, setState] = useState<SessionState>({
    cargando: true,
    usuario: null,
    email: null,
    sinAcceso: false,
  })

  useEffect(() => {
    const sb = getSupabase()
    let mounted = true

    const cargar = async () => {
      const {
        data: { user },
      } = await sb.auth.getUser()

      if (!user) {
        if (mounted)
          setState({
            cargando: false,
            usuario: null,
            email: null,
            sinAcceso: false,
          })
        return
      }

      const { data: euRow } = await sb
        .from('empresa_usuarios')
        .select('id, empresa_id, rol, nombre, email')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!euRow) {
        if (mounted)
          setState({
            cargando: false,
            usuario: null,
            email: user.email ?? null,
            sinAcceso: true,
          })
        return
      }

      const usuario: UsuarioActivo = {
        id: user.id,
        nombre: euRow.nombre ?? user.email ?? 'Usuario',
        rol: euRow.rol as Rol,
        empresaId: euRow.empresa_id,
      }
      setUsuarioStore(usuario)
      if (mounted)
        setState({
          cargando: false,
          usuario,
          email: user.email ?? null,
          sinAcceso: false,
        })
    }

    cargar()
    const { data: sub } = sb.auth.onAuthStateChange(() => {
      cargar()
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [setUsuarioStore])

  return state
}
