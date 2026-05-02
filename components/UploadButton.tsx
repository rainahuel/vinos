'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { parseExcel, generarPlantillaDemo } from '@/lib/excel'
import { getSupabase } from '@/lib/supabase/client'

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const usuario = useStore((s) => s.usuario)
  const agregarArchivo = useStore((s) => s.agregarArchivo)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const procesar = async (file: File) => {
    setCargando(true)
    setError(null)
    try {
      const hojas = await parseExcel(file)
      if (hojas.length === 0) {
        setError('El archivo no contiene hojas con datos')
        return
      }

      const ahora = new Date()
      const mes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`

      const sb = getSupabase()
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${usuario.empresaId}/${mes}/${Date.now()}_${safeName}`
      const { error: errStorage } = await sb.storage
        .from('archivos-excel')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (errStorage) console.warn('storage upload', errStorage)

      const archivoId = await agregarArchivo(
        {
          empresaId: usuario.empresaId,
          nombre: file.name,
          mesReferencia: mes,
          subidoPor: usuario.id,
          storagePath: errStorage ? null : path,
        },
        hojas,
      )
      router.push(`/archivos/${archivoId}`)
    } catch (e) {
      setError('No se pudo leer o subir el archivo.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await procesar(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  const usarDemo = async () => {
    await procesar(generarPlantillaDemo())
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={onChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={cargando}
        className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {cargando ? 'Procesando…' : 'Subir Excel'}
      </button>
      <button
        onClick={usarDemo}
        disabled={cargando}
        className="px-3 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
      >
        Usar archivo demo
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
