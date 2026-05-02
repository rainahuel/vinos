import * as XLSX from 'xlsx'
import type { Comentario, Solicitud } from './types'

export type FilaCruda = Record<string, string | number>

export interface HojaParseada {
  nombre: string
  columnas: string[]
  filas: FilaCruda[]
}

const esVacio = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '')

function filaVacia(fila: FilaCruda) {
  return Object.values(fila).every(esVacio)
}

function trimColumnas(columnas: string[], filas: FilaCruda[]): string[] {
  return columnas.filter((col) =>
    filas.some((f) => !esVacio(f[col])),
  )
}

function parseHoja(sheet: XLSX.WorkSheet, nombre: string): HojaParseada {
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })
  if (matriz.length === 0) {
    return { nombre, columnas: [], filas: [] }
  }
  const headerRaw = (matriz[0] as unknown[]).map((c, i) => {
    const v = String(c ?? '').trim()
    return v === '' ? `Columna ${i + 1}` : v
  })
  const seen = new Map<string, number>()
  const columnas = headerRaw.map((h) => {
    const n = (seen.get(h) ?? 0) + 1
    seen.set(h, n)
    return n === 1 ? h : `${h} (${n})`
  })

  const filas: FilaCruda[] = []
  for (let i = 1; i < matriz.length; i++) {
    const row = matriz[i] as unknown[]
    const obj: FilaCruda = {}
    columnas.forEach((col, j) => {
      const val = row[j]
      obj[col] = typeof val === 'number' ? val : String(val ?? '').trim()
    })
    if (!filaVacia(obj)) filas.push(obj)
  }

  const columnasFinales = trimColumnas(columnas, filas)
  const filasFinales = filas.map((f) => {
    const out: FilaCruda = {}
    for (const col of columnasFinales) out[col] = f[col]
    return out
  })

  return { nombre, columnas: columnasFinales, filas: filasFinales }
}

export async function parseExcel(file: File): Promise<HojaParseada[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { cellDates: true })
  return wb.SheetNames.map((name) => parseHoja(wb.Sheets[name], name)).filter(
    (h) => h.filas.length > 0,
  )
}

export function exportarConObservaciones(
  nombreArchivo: string,
  solicitudes: Solicitud[],
  comentarios: Comentario[],
) {
  const wb = XLSX.utils.book_new()
  const porHoja = new Map<string, Solicitud[]>()
  for (const s of solicitudes) {
    const arr = porHoja.get(s.hoja) ?? []
    arr.push(s)
    porHoja.set(s.hoja, arr)
  }

  for (const [hoja, sols] of porHoja) {
    const filas = sols
      .sort((a, b) => a.filaNumero - b.filaNumero)
      .map((s) => {
        const obs = comentarios
          .filter((c) => c.solicitudId === s.id && c.rol === 'laboratorio')
          .map((c) => c.texto)
          .join(' | ')
        const respuestas = comentarios
          .filter((c) => c.solicitudId === s.id && c.rol === 'ejecutivo')
          .map((c) => c.texto)
          .join(' | ')
        return {
          ...s.datos,
          Estado: s.estado,
          'Observaciones laboratorio': obs,
          'Respuesta ejecutivo': respuestas,
        }
      })
    const ws = XLSX.utils.json_to_sheet(filas)
    XLSX.utils.book_append_sheet(wb, ws, hoja.slice(0, 31))
  }

  XLSX.writeFile(wb, `${nombreArchivo.replace(/\.xlsx$/i, '')}_revisado.xlsx`)
}

export function generarPlantillaDemo(): File {
  const sample = [
    {
      Sociedad: 'Viña Concha y Toro S.A.',
      Boletin: 138208,
      Pais: 'Brasil',
      'Pedido de ventas': 617010,
      Material: 10217333,
      Vino: '2135-2025',
      Etiqueta: 'RESERVADO',
      'Cantidad entrega': 1800,
      Lote: 'L1V210326',
      'Peso neto': 16200,
      'Gr.Alcohol': 12,
      Formato: 12,
      Capacidad: 0.75,
      'PUERTO DESCARGA': 'ITAJAI-SC',
    },
    {
      Sociedad: 'Viña Concha y Toro S.A.',
      Boletin: 137268,
      Pais: 'Brasil',
      'Pedido de ventas': 616999,
      Material: 10218737,
      Vino: '2182-2024',
      Etiqueta: 'RESERVA CASILLERO DEL DIABLO',
      'Cantidad entrega': 1610,
      Lote: 'L1611226',
      'Peso neto': 14490,
      'Gr.Alcohol': 13.5,
      Formato: 12,
      Capacidad: 0.75,
      'PUERTO DESCARGA': 'ITAJAI-SC',
    },
    {
      Sociedad: 'Viña Concha y Toro S.A.',
      Boletin: 137270,
      Pais: 'Brasil',
      'Pedido de ventas': 617006,
      Material: 10219170,
      Vino: '2188-2025',
      Etiqueta: 'RESERVA CASILLERO DEL DIABLO ROSE',
      'Cantidad entrega': 1190,
      Lote: 'L4110526',
      'Peso neto': 10710,
      'Gr.Alcohol': 12,
      Formato: 12,
      Capacidad: 0.75,
      'PUERTO DESCARGA': 'ITAJAI-SC',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(sample)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitud')
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([buffer], 'Anexo_IX_demo.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
