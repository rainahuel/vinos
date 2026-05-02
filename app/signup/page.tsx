'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import type { Rol } from '@/lib/types'

interface Vina {
  id: string
  nombre: string
}

function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'

  const [vinas, setVinas] = useState<Vina[]>([])
  const [cargandoVinas, setCargandoVinas] = useState(true)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [rol, setRol] = useState<Exclude<Rol, 'admin'>>('ejecutivo')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sb = getSupabase()
    sb.from('empresas')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => {
        const lista = (data ?? []) as Vina[]
        setVinas(lista)
        if (lista.length > 0) setEmpresaId(lista[0].id)
        setCargandoVinas(false)
      })
  }, [])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      if (password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }
      const sb = getSupabase()
      const { error: errSignup } = await sb.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            rol,
            empresa_id: empresaId,
          },
        },
      })
      if (errSignup) throw errSignup

      // Si Supabase tiene confirmación de email habilitada, no hay sesión inmediata.
      // Si no, ya quedó logueado. Forzamos login por las dudas.
      const { error: errLogin } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (errLogin) {
        // Probablemente requiere confirmar email
        router.push('/login?registrado=1')
        return
      }
      router.push(next)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear la cuenta'
      setError(
        msg.toLowerCase().includes('already registered')
          ? 'Ese correo ya está registrado. Iniciá sesión.'
          : msg,
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre y apellido
        </label>
        <input
          required
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Contraseña
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Viña
        </label>
        <select
          value={empresaId}
          onChange={(e) => setEmpresaId(e.target.value)}
          disabled={cargandoVinas}
          required
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {cargandoVinas ? (
            <option>Cargando…</option>
          ) : (
            vinas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Rol
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['ejecutivo', '💼 Ejecutivo', 'Sube y aprueba anexos'],
              ['laboratorio', '🧪 Laboratorio', 'Comenta filas'],
            ] as [Exclude<Rol, 'admin'>, string, string][]
          ).map(([k, label, sub]) => (
            <button
              key={k}
              type="button"
              onClick={() => setRol(k)}
              className={`text-left p-3 rounded-md border text-sm transition ${
                rol === k
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="font-medium text-slate-800">{label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando || !email || !password || !nombre || !empresaId}
        className="w-full bg-brand-600 text-white font-medium rounded-md py-2.5 hover:bg-brand-700 disabled:opacity-50 transition"
      >
        {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="text-sm text-center text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="text-brand-600 font-medium hover:underline"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-brand-600 mb-1">
            Crear cuenta
          </div>
          <p className="text-sm text-slate-500">
            Plataforma Anexo IX
          </p>
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
