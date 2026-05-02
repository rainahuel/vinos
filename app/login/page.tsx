'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'
import { AuthLayout } from '@/components/AuthLayout'

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
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1d2b] focus:border-[#7a1d2b]"
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
          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1d2b] focus:border-[#7a1d2b]"
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
        className="w-full bg-[#7a1d2b] text-white font-medium rounded-md py-2.5 hover:bg-[#5e1a26] disabled:opacity-50 transition"
      >
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="text-sm text-center text-slate-500">
        ¿Sos nuevo?{' '}
        <Link
          href={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-[#7a1d2b] font-medium hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <AuthLayout title="Iniciar sesión" subtitle="Accedé con tu correo y contraseña.">
      <Suspense fallback={<div className="h-32" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
