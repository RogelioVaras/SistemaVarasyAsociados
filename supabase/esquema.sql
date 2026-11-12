-- =====================================================================
-- Partida Doble · Esquema de base de datos para Supabase (PostgreSQL)
-- Cómo usarlo: en tu proyecto de Supabase abre "SQL Editor", pega todo
-- este archivo y presiona "Run". Se puede ejecutar más de una vez.
-- =====================================================================

-- 1. Tablas -------------------------------------------------------------

-- Todos los datos de la app se guardan como documentos JSON identificados por una ruta:
--   empresas/{id}                  datos de la empresa
--   empresas/{id}/diario/2026-10   asientos del mes
--   config/indicadores             UF, UTM y parámetros previsionales (comunes a todos)
create table if not exists public.documentos (
  path        text primary key,
  parent      text not null,               -- ruta de la colección: 'empresas', 'empresas/{id}/diario', ...
  empresa_id  text,                        -- null para documentos comunes (config)
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
-- La ruta manda: parent y empresa_id deben coincidir con ella.
alter table public.documentos drop constraint if exists documentos_ruta_ok;
alter table public.documentos add constraint documentos_ruta_ok check (
  parent = regexp_replace(path, '/[^/]+$', '')
  and ((path like 'empresas/%' and empresa_id = split_part(path, '/', 2))
       or (path not like 'empresas/%' and empresa_id is null))
);
create index if not exists documentos_parent_idx on public.documentos (parent);
create index if not exists documentos_empresa_idx on public.documentos (empresa_id);

-- Quién tiene acceso a cada empresa y con qué rol.
create table if not exists public.miembros (
  empresa_id  text not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  rol         text not null check (rol in ('dueno', 'editor', 'lector')),
  creado      timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

-- Nombre y correo visibles de cada usuario (para el historial y los accesos).
create table if not exists public.perfiles (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  nombre   text,
  email    text
);

-- 2. Funciones auxiliares ----------------------------------------------

-- Rol del usuario actual en una empresa (null si no tiene acceso).
create or replace function public.rol_en(p_empresa text)
returns text language sql stable security definer set search_path = public as $$
  select rol from public.miembros where empresa_id = p_empresa and user_id = auth.uid()
$$;

-- Crea el perfil cuando alguien se registra.
create or replace function public.nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (user_id, nombre, email)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'nombre', ''), split_part(new.email, '@', 1)), new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- Quien crea una empresa queda como dueño.
create or replace function public.empresa_creada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.parent = 'empresas' and not exists (select 1 from public.miembros where empresa_id = new.empresa_id) then
    insert into public.miembros (empresa_id, user_id, rol) values (new.empresa_id, auth.uid(), 'dueno');
  end if;
  return new;
end $$;
drop trigger if exists trg_empresa_creada on public.documentos;
create trigger trg_empresa_creada after insert on public.documentos
  for each row execute function public.empresa_creada();

-- Al eliminar una empresa se borran sus accesos.
create or replace function public.empresa_eliminada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.parent = 'empresas' then
    delete from public.miembros where empresa_id = old.empresa_id;
  end if;
  return old;
end $$;
drop trigger if exists trg_empresa_eliminada on public.documentos;
create trigger trg_empresa_eliminada after delete on public.documentos
  for each row execute function public.empresa_eliminada();

-- El dueño da acceso a otra persona (que ya debe tener cuenta) o le cambia el rol.
create or replace function public.invitar_miembro(p_empresa text, p_email text, p_rol text)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if public.rol_en(p_empresa) is distinct from 'dueno' then
    raise exception 'Solo el dueño de la empresa puede administrar accesos';
  end if;
  if p_rol not in ('dueno', 'editor', 'lector') then
    raise exception 'Rol no válido';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    return 'no_registrado';
  end if;
  insert into public.miembros (empresa_id, user_id, rol) values (p_empresa, v_user, p_rol)
  on conflict (empresa_id, user_id) do update set rol = excluded.rol;
  return 'ok';
end $$;

-- El dueño quita el acceso de una persona (no puede quitarse a sí mismo).
create or replace function public.quitar_miembro(p_empresa text, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if public.rol_en(p_empresa) is distinct from 'dueno' then
    raise exception 'Solo el dueño de la empresa puede administrar accesos';
  end if;
  if p_user = auth.uid() then
    raise exception 'No puedes quitarte tu propio acceso';
  end if;
  delete from public.miembros where empresa_id = p_empresa and user_id = p_user;
  return 'ok';
end $$;

-- 3. Seguridad por filas (RLS) ------------------------------------------
alter table public.documentos enable row level security;
alter table public.miembros   enable row level security;
alter table public.perfiles   enable row level security;

drop policy if exists doc_leer on public.documentos;
create policy doc_leer on public.documentos for select to authenticated using (
  empresa_id is null or public.rol_en(empresa_id) is not null
);

drop policy if exists doc_crear on public.documentos;
create policy doc_crear on public.documentos for insert to authenticated with check (
  empresa_id is null
  or public.rol_en(empresa_id) in ('dueno', 'editor')
  or (parent = 'empresas' and not exists (select 1 from public.miembros m where m.empresa_id = documentos.empresa_id))
);

drop policy if exists doc_modificar on public.documentos;
create policy doc_modificar on public.documentos for update to authenticated
  using (empresa_id is null or public.rol_en(empresa_id) in ('dueno', 'editor'))
  with check (empresa_id is null or public.rol_en(empresa_id) in ('dueno', 'editor'));

drop policy if exists doc_eliminar on public.documentos;
create policy doc_eliminar on public.documentos for delete to authenticated using (
  (parent <> 'empresas' and public.rol_en(empresa_id) in ('dueno', 'editor'))
  or (parent = 'empresas' and public.rol_en(empresa_id) = 'dueno')
);

drop policy if exists miembros_leer on public.miembros;
create policy miembros_leer on public.miembros for select to authenticated using (
  user_id = auth.uid() or public.rol_en(empresa_id) = 'dueno'
);
-- Las altas, cambios y bajas de miembros se hacen solo con las funciones de arriba.

drop policy if exists perfiles_leer on public.perfiles;
create policy perfiles_leer on public.perfiles for select to authenticated using (
  user_id = auth.uid()
  or exists (
    select 1 from public.miembros a join public.miembros b on a.empresa_id = b.empresa_id
    where a.user_id = auth.uid() and b.user_id = perfiles.user_id
  )
);
drop policy if exists perfiles_editar on public.perfiles;
create policy perfiles_editar on public.perfiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Tiempo real ------------------------------------------------------
-- Permite que la pantalla se actualice sola cuando otra persona registra algo.
alter table public.documentos replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.documentos;
exception when duplicate_object then null; end $$;
