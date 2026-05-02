import type { ReactNode } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Panel izquierdo: branding */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#3a0d1a] via-[#5e1a26] to-[#7a1d2b] text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25), transparent 35%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wider uppercase opacity-90">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            Plataforma de revisión colaborativa
          </div>
          <div>
            <h1 className="text-4xl xl:text-5xl font-serif leading-tight mb-6">
              Revisión del Anexo IX,
              <br />
              sin correos ni planillas perdidas.
            </h1>
            <p className="text-base xl:text-lg text-white/80 max-w-md">
              Ejecutivos y laboratorio trabajan sobre la misma tabla en tiempo
              real. Cada observación queda registrada, fila por fila.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/60">
            <span>Multi-rol</span>
            <span>·</span>
            <span>Tiempo real</span>
            <span>·</span>
            <span>Export a Excel</span>
          </div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <div className="text-sm font-semibold tracking-wider uppercase text-[#7a1d2b]">
              Plataforma de revisión colaborativa
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-semibold text-slate-900">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
