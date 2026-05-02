'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { getSupabase } from '@/lib/supabase/client'
import { useUsuarioActual } from '@/lib/useUsuarioActual'
import type { Rol } from '@/lib/types'

interface UsuarioRow {
  id: string
  email: string
  nombre: string | null
  rol: 'admin' | 'ejecutivo' | 'laboratorio'
  user_id: string | null
  ultimo_login: string | null
  created_at: string
}

const rolLabel: Record<Rol, string> = {
  admin: 'Admin',
  ejecutivo: 'Ejecutivo',
  laboratorio: 'Laboratorio',
}

const rolColor: Record<Rol, string> = {
  admin: 'bg-slate-100 text-slate-700 border-slate-200',
  ejecutivo: 'bg-brand-50 text-brand-700 border-brand-100',
  laboratorio: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const { cargando: cargandoUsuario, usuario } = useUsuarioActual()
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<Rol>('ejecutivo')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const cargar = async () => {
    setCargando(true)
    const { data, error } = await getSupabase()
      .from('empresa_usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setUsuarios((data ?? []) as UsuarioRow[])
    setCargando(false)
  }

  useEffect(() => {
    if (!usuario) return
    if (usuario.rol !== 'admin') router.replace('/')
    else cargar()
  }, [usuario, router])

  const invitar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(null)
    setEnviando(true)
    try {
      const { error } = await getSupabase()
        .from('empresa_usuarios')
        .insert({
          empresa_id: usuario!.empresaId,
          email: email.trim().toLowerCase(),
          nombre: nombre.trim() || null,
          rol,
          invitado_por: usuario!.id,
        })
      if (error) throw error
      setOk(
        `Invitado ${email}. Pedile que entre a la app y solicite su link en /login.`,
      )
      setEmail('')
      setNombre('')
      setRol('ejecutivo')
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo invitar')
    } finally {
      setEnviando(false)
    }
  }

  const cambiarRol = async (id: string, nuevoRol: Rol) => {
    const { error } = await getSupabase()
      .from('empresa_usuarios')
      .update({ rol: nuevoRol })
      .eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  const eliminar = async (id: string, emailUsuario: string) => {
    if (!confirm(`¿Quitar acceso a ${emailUsuario}?`)) return
    const { error } = await getSupabase()
      .from('empresa_usuarios')
      .delete()
      .eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  if (cargandoUsuario || !usuario) return null
  if (usuario.rol !== 'admin') return null

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Gestionar usuarios
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Invita a personas de tu empresa y asigna su rol.
        </p>
      </div>

      <form
        onSubmit={invitar}
        className="bg-white border rounded-lg p-4 mb-6 grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Correo
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@empresa.com"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Nombre (opcional)
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre apellido"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Rol
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="ejecutivo">Ejecutivo</option>
            <option value="laboratorio">Laboratorio</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={enviando || !email.trim()}
          className="bg-brand-600 text-white font-medium rounded-md px-4 py-2 hover:bg-brand-700 disabled:opacity-50"
        >
          {enviando ? 'Invitando…' : 'Invitar'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
          {ok}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        {cargando ? (
          <p className="p-6 text-center text-slate-400 text-sm">Cargando…</p>
        ) : usuarios.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-sm">
            Sin usuarios todavía.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Correo</th>
                <th className="text-left px-4 py-2 font-medium">Nombre</th>
                <th className="text-left px-4 py-2 font-medium">Rol</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2 text-slate-800">{u.email}</td>
                  <td className="px-4 py-2 text-slate-600">{u.nombre ?? '—'}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.rol}
                      onChange={(e) =>
                        cambiarRol(u.id, e.target.value as Rol)
                      }
                      disabled={u.id === usuario.id}
                      className={clsx(
                        'text-xs font-medium border rounded px-2 py-0.5',
                        rolColor[u.rol],
                      )}
                    >
                      <option value="admin">{rolLabel.admin}</option>
                      <option value="ejecutivo">{rolLabel.ejecutivo}</option>
                      <option value="laboratorio">
                        {rolLabel.laboratorio}
                      </option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {u.user_id ? (
                      <span className="text-emerald-600">
                        ✓ Acceso activo
                      </span>
                    ) : (
                      <span className="text-amber-600">
                        ⏳ Pendiente primer login
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.id !== usuario.id && (
                      <button
                        onClick={() => eliminar(u.id, u.email)}
                        className="text-xs text-slate-400 hover:text-rose-600"
                      >
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
