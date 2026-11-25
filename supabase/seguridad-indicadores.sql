-- =====================================================================
-- Partida Doble · Cierre de los datos comunes (config/indicadores)
-- Qué hace: los indicadores compartidos (UF, UTM, parámetros
-- previsionales) quedan escribibles solo por administradores. Antes,
-- cualquier cuenta con sesión podía sobrescribirlos.
-- Cómo se usa: pega TODO este archivo en el SQL Editor de Supabase y
-- presiona Run. Se puede ejecutar más de una vez sin daño.
-- =====================================================================

-- 1. Tabla de administradores ------------------------------------------
create table if not exists public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nota    text,
  creado  timestamptz not null default now()
);
alter table public.administradores enable row level security;

drop policy if exists adm_leer on public.administradores;
create policy adm_leer on public.administradores for select to authenticated
  using (user_id = auth.uid());

grant select on public.administradores to authenticated;

-- ¿El usuario actual es administrador de los datos comunes?
create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administradores where user_id = auth.uid())
$$;

-- 2. Quién queda como administrador ------------------------------------
-- Primero, quien hoy es dueño de alguna empresa.
insert into public.administradores (user_id, nota)
select distinct m.user_id, 'dueño de empresa al aplicar el cierre'
from public.miembros m
where m.rol = 'dueno'
on conflict (user_id) do nothing;

-- Respaldo: si la consulta anterior no encontró a nadie, se toma a quien
-- más documentos ha guardado (es el usuario que usa el sistema de verdad).
insert into public.administradores (user_id, nota)
select d.updated_by, 'por actividad (respaldo del cierre)'
from public.documentos d
where d.updated_by is not null
  and not exists (select 1 from public.administradores)
group by d.updated_by
order by count(*) desc
limit 1;

-- 3. Políticas de documentos -------------------------------------------
-- Los datos comunes solo los escribe un administrador; los de empresa,
-- dueño o editor de esa empresa (igual que antes).
drop policy if exists doc_crear on public.documentos;
create policy doc_crear on public.documentos for insert to authenticated with check (
  (empresa_id is null and public.es_admin())
  or (empresa_id is not null and (
        public.rol_en(empresa_id) in ('dueno', 'editor')
        or (parent = 'empresas' and not exists (
              select 1 from public.miembros m where m.empresa_id = documentos.empresa_id))
     ))
);

drop policy if exists doc_modificar on public.documentos;
create policy doc_modificar on public.documentos for update to authenticated
  using ((empresa_id is null and public.es_admin())
         or (empresa_id is not null and public.rol_en(empresa_id) in ('dueno', 'editor')))
  with check ((empresa_id is null and public.es_admin())
         or (empresa_id is not null and public.rol_en(empresa_id) in ('dueno', 'editor')));

-- 4. Comprobación ------------------------------------------------------
-- Debe listar al menos una fila, con tu correo. Si aparece vacío,
-- avisa antes de seguir usando el sistema.
select a.user_id, p.email, a.nota, a.creado
from public.administradores a
left join public.perfiles p on p.user_id = a.user_id
order by a.creado;
