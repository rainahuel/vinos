-- ============================================================
-- Anexo IX SaaS — Migración 003: Self-signup con email + password
-- Refactor del trigger handle_new_user para soportar registro libre.
-- Ejecutar en SQL Editor.
-- ============================================================

-- 1) Trigger refactorizado: si email ya existe en empresa_usuarios (pre-cargado como admin)
--    vincula el user_id manteniendo su rol. Si no existe, crea la fila con metadata
--    del signUp (nombre, rol, empresa_id) — limitando rol self a ejecutivo/laboratorio.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nombre text := meta->>'nombre';
  v_rol_solicitado text := coalesce(meta->>'rol', 'ejecutivo');
  v_rol_seguro text := case
    when v_rol_solicitado in ('ejecutivo','laboratorio') then v_rol_solicitado
    else 'ejecutivo'
  end;
  v_empresa_id uuid := coalesce(
    (meta->>'empresa_id')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );
  existente_id uuid;
begin
  -- Caso A: ya hay una fila pre-cargada con ese email (ej: Rocío admin)
  select id into existente_id
    from public.empresa_usuarios
   where lower(email) = lower(new.email)
   order by user_id nulls first
   limit 1;

  if existente_id is not null then
    update public.empresa_usuarios
       set user_id = new.id,
           nombre = coalesce(nombre, v_nombre),
           ultimo_login = now()
     where id = existente_id;
  else
    insert into public.empresa_usuarios
      (empresa_id, user_id, email, nombre, rol, ultimo_login)
    values (
      v_empresa_id,
      new.id,
      new.email,
      v_nombre,
      v_rol_seguro,
      now()
    );
  end if;

  return new;
end;
$$;

-- 2) Permitir leer la propia fila aún antes de que user_empresa_id() resuelva
--    (necesario en el callback inmediato post-signup)
drop policy if exists "eu_self_select" on empresa_usuarios;
create policy "eu_self_select" on empresa_usuarios for select
  using (user_id = auth.uid());

-- 3) Permitir listar viñas (empresas) en la página de registro, sin sesión.
--    Solo expone id + nombre + slug (no datos sensibles).
drop policy if exists "empresas_public_list" on empresas;
create policy "empresas_public_list" on empresas for select
  using (true);
