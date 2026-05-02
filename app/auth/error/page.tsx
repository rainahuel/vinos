import Link from 'next/link'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string }
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="font-semibold text-slate-900 mb-2">
          No pudimos iniciar tu sesión
        </h1>
        <p className="text-sm text-slate-600 mb-1">
          El link expiró o ya fue utilizado.
        </p>
        {searchParams.reason && (
          <p className="text-xs text-slate-400 mb-4">
            Detalle: {searchParams.reason}
          </p>
        )}
        <Link
          href="/login"
          className="inline-block bg-brand-600 text-white font-medium rounded-md px-4 py-2 hover:bg-brand-700"
        >
          Pedir un link nuevo
        </Link>
      </div>
    </div>
  )
}
