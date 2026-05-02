# Plan de implementación — SaaS Colaborativo Anexo IX
**Stack: Next.js 14 + Supabase · Deploy: Vercel**

---

## Visión general

Sistema web SaaS multi-tenant donde **ejecutivos** suben archivos Excel de solicitudes de exportación y **laboratorios** los revisan, agregando observaciones por fila en tiempo real. Ambas áreas colaboran desde la misma interfaz sin depender de correos.

---

## Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | Next.js 14 App Router | SSR, API Routes, auth server-side |
| Estilos | Tailwind CSS | Velocidad de desarrollo |
| Auth | Supabase Auth (magic link) | Sin contraseñas, seguro para B2B |
| Base de datos | Supabase PostgreSQL + RLS | Aislamiento por empresa incluido |
| Realtime | Supabase Realtime channels | Comentarios en vivo sin polling |
| Storage | Supabase Storage | Archivos .xlsx por empresa/mes |
| Upload/parse | API Route + librería `xlsx` | Server-side, sin exponer lógica |
| Deploy | Vercel | Zero-config con Next.js |
| Pagos (v2) | Stripe | Cuando llegue el primer cliente |

---

## Fases de implementación

### Fase 1 — Setup del proyecto (días 1–2)

```bash
npx create-next-app@latest anexo-saas --typescript --tailwind --app
cd anexo-saas
npm install @supabase/supabase-js @supabase/ssr xlsx
```

Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
```

Estructura de carpetas recomendada:

```
anexo-saas/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx               ← vista ejecutivo
│   │   └── [empresa]/
│   │       └── [mes]/page.tsx
│   └── api/
│       ├── upload/route.ts
│       └── export/route.ts
├── components/
│   ├── TablaAnexo.tsx
│   ├── PanelComentarios.tsx
│   └── PendientesList.tsx
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── server.ts
└── middleware.ts
```

---

### Fase 2 — Schema de base de datos (días 2–3)

Ejecutar en el SQL Editor de Supabase:

```sql
-- Empresas (tenants)
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Usuarios con rol por empresa
create table empresa_usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id),
  user_id uuid references auth.users(id),
  rol text check (rol in ('ejecutivo', 'laboratorio', 'admin')),
  unique(empresa_id, user_id)
);

-- Archivos subidos
create table archivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id),
  nombre text not null,
  storage_path text not null,
  mes_referencia text not null,   -- formato '2025-04'
  subido_por uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Filas del Excel parseado
create table solicitudes (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid references archivos(id) on delete cascade,
  empresa_id uuid references empresas(id),
  fila_numero int not null,
  datos jsonb not null,           -- fila completa como JSON
  estado text default 'ok' check (estado in ('ok', 'pendiente', 'resuelto')),
  created_at timestamptz default now()
);

-- Comentarios por fila
create table comentarios (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid references solicitudes(id) on delete cascade,
  empresa_id uuid references empresas(id),
  user_id uuid references auth.users(id),
  rol text not null,              -- 'ejecutivo' | 'laboratorio'
  texto text not null,
  created_at timestamptz default now()
);

-- RLS: cada empresa solo ve sus propios datos
alter table solicitudes enable row level security;
alter table comentarios enable row level security;
alter table archivos enable row level security;

create policy "empresa aislada - solicitudes"
  on solicitudes for all
  using (empresa_id in (
    select empresa_id from empresa_usuarios where user_id = auth.uid()
  ));

create policy "empresa aislada - comentarios"
  on comentarios for all
  using (empresa_id in (
    select empresa_id from empresa_usuarios where user_id = auth.uid()
  ));

create policy "empresa aislada - archivos"
  on archivos for all
  using (empresa_id in (
    select empresa_id from empresa_usuarios where user_id = auth.uid()
  ));
```

---

### Fase 3 — Upload y parsing del Excel (días 3–4)

`app/api/upload/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const formData = await req.formData()
  const file = formData.get('file') as File
  const empresaId = formData.get('empresa_id') as string
  const mesReferencia = formData.get('mes') as string

  // 1. Subir archivo original a Storage
  const buffer = await file.arrayBuffer()
  const { data: storageData, error: storageError } = await supabase.storage
    .from('archivos-excel')
    .upload(`${empresaId}/${mesReferencia}/${file.name}`, buffer, {
      upsert: true
    })

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  // 2. Registrar en tabla archivos
  const { data: archivo } = await supabase
    .from('archivos')
    .insert({
      empresa_id: empresaId,
      nombre: file.name,
      storage_path: storageData.path,
      mes_referencia: mesReferencia
    })
    .select()
    .single()

  // 3. Parsear Excel y persistir filas
  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)

  const solicitudes = rows.map((row: any, i: number) => ({
    archivo_id: archivo!.id,
    empresa_id: empresaId,
    fila_numero: i + 2,
    datos: row,
    estado: 'ok'
  }))

  await supabase.from('solicitudes').insert(solicitudes)

  return NextResponse.json({ ok: true, archivo_id: archivo!.id })
}
```

---

### Fase 4 — Comentarios en tiempo real (días 4–5)

`components/PanelComentarios.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function PanelComentarios({ solicitudId }: { solicitudId: string }) {
  const supabase = createClient()
  const [comentarios, setComentarios] = useState<any[]>([])
  const [texto, setTexto] = useState('')

  useEffect(() => {
    // Cargar comentarios existentes
    supabase
      .from('comentarios')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at')
      .then(({ data }) => setComentarios(data ?? []))

    // Suscripción realtime — llega cuando laboratorio agrega observación
    const channel = supabase
      .channel(`comentarios:${solicitudId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comentarios',
        filter: `solicitud_id=eq.${solicitudId}`
      }, (payload) => {
        setComentarios(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [solicitudId])

  async function enviarComentario() {
    if (!texto.trim()) return
    await supabase.from('comentarios').insert({
      solicitud_id: solicitudId,
      texto,
      rol: 'laboratorio'  // viene del perfil del usuario autenticado
    })
    // Actualizar estado de la fila a 'pendiente'
    await supabase
      .from('solicitudes')
      .update({ estado: 'pendiente' })
      .eq('id', solicitudId)
    setTexto('')
  }

  return (
    <div>
      {comentarios.map((c) => (
        <div key={c.id} className={`bubble ${c.rol}`}>
          <p>{c.texto}</p>
          <span>{c.rol} · {new Date(c.created_at).toLocaleString()}</span>
        </div>
      ))}
      <textarea value={texto} onChange={e => setTexto(e.target.value)} />
      <button onClick={enviarComentario}>Enviar</button>
    </div>
  )
}
```

---

### Fase 5 — Export Excel con observaciones (día 5)

`app/api/export/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const archivoId = searchParams.get('archivo_id')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener solicitudes con sus comentarios
  const { data: solicitudes } = await supabase
    .from('solicitudes')
    .select('*, comentarios(*)')
    .eq('archivo_id', archivoId)
    .order('fila_numero')

  // Construir filas para el Excel
  const rows = solicitudes!.map((s) => {
    const obs = s.comentarios
      .filter((c: any) => c.rol === 'laboratorio')
      .map((c: any) => c.texto)
      .join(' | ')
    return {
      ...s.datos,
      'Estado': s.estado,
      'Observaciones laboratorio': obs
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Solicitud')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Anexo_IX_revisado.xlsx"`
    }
  })
}
```

---

### Fase 6 — Auth y middleware (día 6)

`middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie helpers */ } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirigir a login si no hay sesión
  if (!session && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

---

## Roadmap de producto

### MVP (semanas 1–3)
- [x] Auth por magic link (email)
- [x] Upload de Excel y parsing automático
- [x] Tabla de solicitudes con filtros y búsqueda
- [x] Panel de comentarios por fila con realtime
- [x] Pestaña de pendientes
- [x] Export Excel con observaciones incluidas
- [x] Aislamiento multi-tenant con RLS

### V1 (semanas 4–6)
- [ ] Notificaciones por email (Resend) cuando laboratorio agrega observación
- [ ] Dashboard de resumen mensual por empresa
- [ ] Historial de versiones del archivo por mes
- [ ] Onboarding de nuevas empresas (self-service)

### V2 (meses 2–3)
- [ ] Integración Stripe para cobro mensual
- [ ] Portal de administración (super-admin)
- [ ] Soporte multi-país / multi-idioma
- [ ] API pública para integrar con sistemas ERP del cliente

---

## Modelo de precios sugerido

| Plan | Precio | Límites |
|---|---|---|
| Startup | USD 149/mes | Hasta 5 usuarios, 1 empresa |
| Business | USD 299/mes | Hasta 15 usuarios, múltiples áreas |
| Enterprise | Desde USD 500/mes | Custom, SSO, soporte dedicado |

> Descuento del 20% pagando anual. Factura en CLP/USD según país.

---

## Costos de infraestructura (bootstrap)

| Servicio | Costo |
|---|---|
| Supabase Pro | USD 25/mes |
| Vercel (hobby → pro cuando escale) | USD 0–20/mes |
| Dominio | USD 12/año |
| Resend (emails) | USD 0 (hasta 3k emails/mes) |
| **Total inicial** | **~USD 35–45/mes** |

---

## Tiempo estimado de desarrollo

| Fase | Tiempo |
|---|---|
| Setup + schema | 2 días |
| Upload + parsing Excel | 2 días |
| UI tabla + panel comentarios | 3 días |
| Realtime + notificaciones | 2 días |
| Export + auth + middleware | 2 días |
| QA + deploy | 1 día |
| **Total MVP** | **~2–3 semanas** (fines de semana con Cursor) |