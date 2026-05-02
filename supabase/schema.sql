-- ============================================================
-- Anexo IX SaaS — Schema inicial (sin auth todavía, demo abierta)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1) Empresas (tenants)
create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- Empresa demo única para esta etapa
insert into empresas (id, nombre, slug)
values ('00000000-0000-0000-0000-000000000001', 'Viña Concha y Toro', 'concha-y-toro')
on conflict (slug) do nothing;

-- 2) Archivos subidos (anexos)
create table if not exists archivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  storage_path text,
  mes_referencia text not null,
  total_filas int not null default 0,
  hojas jsonb not null default '[]'::jsonb,
  aprobado boolean not null default false,
  aprobado_en timestamptz,
  aprobado_por text,
  subido_por text,
  created_at timestamptz default now()
);

create index if not exists archivos_empresa_idx on archivos(empresa_id, created_at desc);

-- 3) Solicitudes (filas parseadas)
create table if not exists solicitudes (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null references archivos(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  hoja text not null,
  fila_numero int not null,
  datos jsonb not null,
  estado text not null default 'ok' check (estado in ('ok','pendiente','resuelto')),
  created_at timestamptz default now()
);

create index if not exists solicitudes_archivo_idx on solicitudes(archivo_id, hoja, fila_numero);
create index if not exists solicitudes_empresa_estado_idx on solicitudes(empresa_id, estado);

-- 4) Comentarios por fila
create table if not exists comentarios (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references solicitudes(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id text,
  rol text not null check (rol in ('ejecutivo','laboratorio','admin')),
  texto text not null,
  created_at timestamptz default now()
);

create index if not exists comentarios_solicitud_idx on comentarios(solicitud_id, created_at);

-- 5) Realtime: replicar cambios para suscripciones en vivo
alter publication supabase_realtime add table comentarios;
alter publication supabase_realtime add table solicitudes;
alter publication supabase_realtime add table archivos;

-- 6) RLS abierta para demo (publishable key tiene acceso total)
--    ⚠️ TEMPORAL: cuando pongamos auth, reemplazamos por policies por empresa_id.
alter table archivos enable row level security;
alter table solicitudes enable row level security;
alter table comentarios enable row level security;
alter table empresas enable row level security;

drop policy if exists "demo_open_archivos" on archivos;
drop policy if exists "demo_open_solicitudes" on solicitudes;
drop policy if exists "demo_open_comentarios" on comentarios;
drop policy if exists "demo_open_empresas" on empresas;

create policy "demo_open_archivos" on archivos for all using (true) with check (true);
create policy "demo_open_solicitudes" on solicitudes for all using (true) with check (true);
create policy "demo_open_comentarios" on comentarios for all using (true) with check (true);
create policy "demo_open_empresas" on empresas for all using (true) with check (true);

-- 7) Storage bucket para los .xlsx originales
insert into storage.buckets (id, name, public)
values ('archivos-excel', 'archivos-excel', false)
on conflict (id) do nothing;

drop policy if exists "demo_open_storage_select" on storage.objects;
drop policy if exists "demo_open_storage_insert" on storage.objects;
drop policy if exists "demo_open_storage_delete" on storage.objects;

create policy "demo_open_storage_select" on storage.objects
  for select using (bucket_id = 'archivos-excel');
create policy "demo_open_storage_insert" on storage.objects
  for insert with check (bucket_id = 'archivos-excel');
create policy "demo_open_storage_delete" on storage.objects
  for delete using (bucket_id = 'archivos-excel');
