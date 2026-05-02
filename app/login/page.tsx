'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const sb = getSupabase()
      const { error: err } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (err) throw err
      router.push(next)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al iniciar sesión'
      setError(
        msg.toLowerCase().includes('invalid')
          ? 'Correo o contraseña incorrectos'
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
          Correo
        </label>
        <input
          type="email"
          required
          autoFocus
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={cargando || !email.trim() || !password}
        className="w-full bg-brand-600 text-white font-medium rounded-md py-2.5 hover:bg-brand-700 disabled:opacity-50 transition"
      >
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-sm text-center text-slate-500">
        ¿Sos nuevo?{' '}
        <Link
          href={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-brand-600 font-medium hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-brand-600 mb-1">
            Anexo IX
          </div>
          <p className="text-sm text-slate-500">
            Plataforma de revisión colaborativa
          </p>
        </div>
        <Suspense fallback={<div className="h-32" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
