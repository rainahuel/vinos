'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase/client'

function LoginForm() {
  const params = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      const sb = getSupabase()
      const origin = window.location.origin
      const { error: err } = await sb.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          shouldCreateUser: true,
        },
      })
      if (err) throw err
      setEnviado(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al enviar el link'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  if (enviado) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">📩</div>
        <h2 className="font-semibold text-slate-900 mb-2">
          Revisá tu correo
        </h2>
        <p className="text-sm text-slate-600">
          Te mandamos un link a <strong>{email}</strong>. Cliquealo para entrar.
        </p>
        <button
          onClick={() => {
            setEnviado(false)
            setEmail('')
          }}
          className="mt-6 text-xs text-slate-500 hover:text-slate-700 underline"
        >
          Usar otro email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@empresa.com"
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
        disabled={cargando || !email.trim()}
        className="w-full bg-brand-600 text-white font-medium rounded-md py-2.5 hover:bg-brand-700 disabled:opacity-50 transition"
      >
        {cargando ? 'Enviando…' : 'Enviar link de acceso'}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Te enviaremos un link único por email. Sin contraseñas.
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
