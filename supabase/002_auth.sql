-- ============================================================
-- Anexo IX SaaS — Migración 002: Auth + roles + RLS estricta
-- Reemplaza las policies "demo_open_*" por policies reales basadas en user_id.
-- Ejecutar en SQL Editor.
-- ============================================================

-- 1) Tabla de usuarios por empresa
create table if not exists empresa_usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  nombre text,
  rol text not null check (rol in ('admin','ejecutivo','laboratorio')),
  invitado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  ultimo_login timestamptz
);

create unique index if not exists eu_email_empresa_idx
  on empresa_usuarios(empresa_id, lower(email));
create index if not exists eu_user_idx on empresa_usuarios(user_id);

-- 2) Helpers SECURITY DEFINER (evitan recursión en policies)
create or replace function public.user_empresa_id()
returns uuid
language sql security definer stable
set search_path = public
as $$
  select empresa_id from public.empresa_usuarios
  where user_id = auth.uid()
  limit 1
$$;

create or replace function public.user_rol()
returns text
language sql security definer stable
set search_path = public
as $$
  select rol from public.empresa_usuarios
  where user_id = auth.uid()
  limit 1
$$;

-- 3) Trigger: al primer login, vincular auth.users.id con empresa_usuarios.email
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update public.empresa_usuarios
     set user_id = new.id,
         ultimo_login = now()
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Pre-cargar admin (Rocío)
insert into empresa_usuarios (empresa_id, email, rol, nombre)
values (
  '00000000-0000-0000-0000-000000000001',
  'rociorainahuelrain@gmail.com',
  'admin',
  'Rocío Rainahuel'
)
on conflict (empresa_id, lower(email)) do nothing;

-- 5) Reemplazar policies demo abiertas por policies basadas en user_id
drop policy if exists "demo_open_archivos" on archivos;
drop policy if exists "demo_open_solicitudes" on solicitudes;
drop policy if exists "demo_open_comentarios" on comentarios;
drop policy if exists "demo_open_empresas" on empresas;

create policy "auth_archivos" on archivos for all
  using (empresa_id = public.user_empresa_id())
  with check (empresa_id = public.user_empresa_id());

create policy "auth_solicitudes" on solicitudes for all
  using (empresa_id = public.user_empresa_id())
  with check (empresa_id = public.user_empresa_id());

create policy "auth_comentarios" on comentarios for all
  using (empresa_id = public.user_empresa_id())
  with check (empresa_id = public.user_empresa_id());

create policy "auth_empresas_select" on empresas for select
  using (id = public.user_empresa_id());

-- 6) RLS sobre empresa_usuarios
alter table empresa_usuarios enable row level security;

drop policy if exists "eu_select_same_empresa" on empresa_usuarios;
drop policy if exists "eu_admin_insert" on empresa_usuarios;
drop policy if exists "eu_admin_update" on empresa_usuarios;
drop policy if exists "eu_admin_delete" on empresa_usuarios;

create policy "eu_select_same_empresa" on empresa_usuarios for select
  using (empresa_id = public.user_empresa_id());

create policy "eu_admin_insert" on empresa_usuarios for insert
  with check (
    empresa_id = public.user_empresa_id()
    and public.user_rol() = 'admin'
  );

create policy "eu_admin_update" on empresa_usuarios for update
  using (
    empresa_id = public.user_empresa_id()
    and public.user_rol() = 'admin'
  );

create policy "eu_admin_delete" on empresa_usuarios for delete
  using (
    empresa_id = public.user_empresa_id()
    and public.user_rol() = 'admin'
  );

-- 7) Storage: archivos solo del propio empresa_id
drop policy if exists "demo_open_storage_select" on storage.objects;
drop policy if exists "demo_open_storage_insert" on storage.objects;
drop policy if exists "demo_open_storage_delete" on storage.objects;

create policy "auth_storage_select" on storage.objects for select
  using (
    bucket_id = 'archivos-excel'
    and (storage.foldername(name))[1] = public.user_empresa_id()::text
  );

create policy "auth_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'archivos-excel'
    and (storage.foldername(name))[1] = public.user_empresa_id()::text
  );

create policy "auth_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'archivos-excel'
    and (storage.foldername(name))[1] = public.user_empresa_id()::text
  );

-- 8) Realtime para empresa_usuarios (para actualizar lista al invitar)
alter publication supabase_realtime add table empresa_usuarios;
