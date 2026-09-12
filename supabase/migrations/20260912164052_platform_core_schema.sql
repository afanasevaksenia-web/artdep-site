-- ============================================================================
-- Платформа для съёмочных групп — базовая многопроектная схема (Этап 1)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Расширения и общие типы
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- Старый одно-проектный прототип (posts/shifts/tasks/files) — пустой, кроме
-- profiles, где есть живой пользователь. Прототип заменяется платформенной
-- схемой ниже; profiles сохраняем и достраиваем через alter table.
drop table if exists posts cascade;
drop table if exists shifts cascade;
drop table if exists tasks cascade;
drop table if exists files cascade;

create type dept_enum as enum (
  'dir','rezh','oper','svet','zvuk','hud','rekv','kost','grim','cast','trans','other'
);

create type project_role_enum as enum ('admin','member');

create type scene_status_enum as enum ('planned','shot','partial','moved','cut');

-- ---------------------------------------------------------------------------
-- profiles — один на пользователя auth, не привязан к проекту
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles add column if not exists phone text;
alter table profiles add column if not exists email text;
alter table profiles add column if not exists avatar_url text;

alter table profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on profiles;
create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone,
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Europe/Moscow',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

-- ---------------------------------------------------------------------------
-- project_members
-- ---------------------------------------------------------------------------
create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role project_role_enum not null default 'member',
  is_actor boolean not null default false,
  invited_by uuid references profiles(id),
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table project_members enable row level security;

create table if not exists member_departments (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  dept dept_enum not null,
  primary key (project_id, user_id, dept)
);

alter table member_departments enable row level security;

-- ---------------------------------------------------------------------------
-- Вспомогательные функции для RLS (SECURITY DEFINER, чтобы не рекурсировать)
-- ---------------------------------------------------------------------------
create or replace function is_project_member(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid()
  );
$$;

create or replace function is_project_admin(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from project_members
    where project_id = p_project_id and user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function my_departments(p_project_id uuid)
returns setof dept_enum
language sql
security definer
stable
set search_path = public
as $$
  select dept from member_departments
  where project_id = p_project_id and user_id = auth.uid();
$$;

revoke all on function is_project_member(uuid) from public;
revoke all on function is_project_admin(uuid) from public;
revoke all on function my_departments(uuid) from public;
grant execute on function is_project_member(uuid) to authenticated;
grant execute on function is_project_admin(uuid) to authenticated;
grant execute on function my_departments(uuid) to authenticated;

-- projects policies (depend on is_project_member)
create policy "projects_select_member" on projects
  for select to authenticated using (is_project_member(id));

create policy "projects_insert_self" on projects
  for insert to authenticated with check (created_by = auth.uid());

create policy "projects_update_admin" on projects
  for update to authenticated using (is_project_admin(id)) with check (is_project_admin(id));

-- project_members policies
create policy "project_members_select_same_project" on project_members
  for select to authenticated using (is_project_member(project_id));

create policy "project_members_admin_manage" on project_members
  for update to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

create policy "project_members_admin_delete" on project_members
  for delete to authenticated using (is_project_admin(project_id));

-- member_departments policies
create policy "member_departments_select_same_project" on member_departments
  for select to authenticated using (is_project_member(project_id));

create policy "member_departments_admin_manage" on member_departments
  for all to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

create policy "member_departments_self_manage" on member_departments
  for insert to authenticated with check (user_id = auth.uid() and is_project_member(project_id));

-- ---------------------------------------------------------------------------
-- invites — код-приглашение, действует непрерывно, не одноразово
-- ---------------------------------------------------------------------------
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  code text not null unique,
  dept dept_enum,
  role project_role_enum not null default 'member',
  is_actor boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  revoked boolean not null default false
);

alter table invites enable row level security;

create policy "invites_admin_manage" on invites
  for all to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- episodes
-- ---------------------------------------------------------------------------
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  number integer,
  title text,
  created_at timestamptz not null default now(),
  unique (project_id, number)
);

alter table episodes enable row level security;

create policy "episodes_select_member" on episodes
  for select to authenticated using (is_project_member(project_id));

create policy "episodes_admin_manage" on episodes
  for all to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- shifts (вызывной)
-- ---------------------------------------------------------------------------
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  number integer,
  date date not null,
  call_time timestamptz,
  wrap_time timestamptz,
  location text,
  address text,
  note text,
  published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

alter table shifts enable row level security;

create policy "shifts_select_member" on shifts
  for select to authenticated using (
    is_project_member(project_id) and (published = true or is_project_admin(project_id))
  );

create policy "shifts_admin_manage" on shifts
  for all to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- scenes (КПП)
-- ---------------------------------------------------------------------------
create table if not exists scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  episode_id uuid references episodes(id) on delete set null,
  shift_id uuid references shifts(id) on delete set null,
  number text not null,
  mode text,
  int_ext text,
  story_day text,
  location text,
  sub_location text,
  synopsis text,
  characters text,
  costume_makeup text,
  props text,
  stunts text,
  status scene_status_enum not null default 'planned',
  sort_order integer not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

alter table scenes enable row level security;

create policy "scenes_select_member" on scenes
  for select to authenticated using (is_project_member(project_id));

create policy "scenes_admin_manage" on scenes
  for all to authenticated using (is_project_admin(project_id)) with check (is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- shift_timing (тайминг план/факт вызывного)
-- ---------------------------------------------------------------------------
create table if not exists shift_timing (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references shifts(id) on delete cascade,
  scene_id uuid references scenes(id) on delete set null,
  label text not null,
  plan_start timestamptz,
  plan_duration_min integer,
  fact_start timestamptz,
  fact_end timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shift_timing enable row level security;

create policy "shift_timing_select_member" on shift_timing
  for select to authenticated using (
    exists (
      select 1 from shifts s
      where s.id = shift_timing.shift_id
        and is_project_member(s.project_id)
        and (s.published = true or is_project_admin(s.project_id))
    )
  );

create policy "shift_timing_admin_manage" on shift_timing
  for all to authenticated using (
    exists (select 1 from shifts s where s.id = shift_timing.shift_id and is_project_admin(s.project_id))
  ) with check (
    exists (select 1 from shifts s where s.id = shift_timing.shift_id and is_project_admin(s.project_id))
  );

-- ---------------------------------------------------------------------------
-- shift_acks (подтверждение вызывного)
-- ---------------------------------------------------------------------------
create table if not exists shift_acks (
  shift_id uuid not null references shifts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (shift_id, user_id)
);

alter table shift_acks enable row level security;

create policy "shift_acks_select_member" on shift_acks
  for select to authenticated using (
    exists (select 1 from shifts s where s.id = shift_acks.shift_id and is_project_member(s.project_id))
  );

create policy "shift_acks_self_insert" on shift_acks
  for insert to authenticated with check (
    user_id = auth.uid() and
    exists (select 1 from shifts s where s.id = shift_acks.shift_id and s.published = true and is_project_member(s.project_id))
  );

-- ---------------------------------------------------------------------------
-- history (аудит правок КПП и вызывного, для отката)
-- ---------------------------------------------------------------------------
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  table_name text not null,
  row_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

alter table history enable row level security;

create policy "history_select_admin" on history
  for select to authenticated using (is_project_admin(project_id));

create or replace function record_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
begin
  v_project_id := coalesce(new.project_id, old.project_id);
  insert into history (project_id, table_name, row_id, action, old_data, new_data, changed_by)
  values (
    v_project_id,
    tg_table_name,
    coalesce(new.id, old.id),
    lower(tg_op),
    case when tg_op in ('update','delete') then to_jsonb(old) else null end,
    case when tg_op in ('insert','update') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists scenes_history on scenes;
create trigger scenes_history
  after insert or update or delete on scenes
  for each row execute function record_history();

drop trigger if exists shifts_history on shifts;
create trigger shifts_history
  after insert or update or delete on shifts
  for each row execute function record_history();

-- ---------------------------------------------------------------------------
-- chats / messages (заготовка под этап 3, чаты создаются уже в этапе 1)
-- ---------------------------------------------------------------------------
create type chat_kind_enum as enum ('general','dept','direct');

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind chat_kind_enum not null,
  dept dept_enum,
  created_at timestamptz not null default now()
);

alter table chats enable row level security;

create table if not exists chat_members (
  chat_id uuid not null references chats(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (chat_id, user_id)
);

alter table chat_members enable row level security;

create policy "chats_select_member" on chats
  for select to authenticated using (
    exists (select 1 from chat_members cm where cm.chat_id = chats.id and cm.user_id = auth.uid())
  );

create policy "chat_members_select_own_chats" on chat_members
  for select to authenticated using (
    exists (select 1 from chat_members cm2 where cm2.chat_id = chat_members.chat_id and cm2.user_id = auth.uid())
  );

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text,
  attachment jsonb,
  scene_id uuid references scenes(id) on delete set null,
  shift_id uuid references shifts(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "messages_select_chat_member" on messages
  for select to authenticated using (
    exists (select 1 from chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = auth.uid())
  );

create policy "messages_insert_chat_member" on messages
  for insert to authenticated with check (
    author_id = auth.uid() and
    exists (select 1 from chat_members cm where cm.chat_id = messages.chat_id and cm.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  payload jsonb,
  urgent boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- files (метаданные хранилища)
-- ---------------------------------------------------------------------------
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  dept dept_enum,
  scene_id uuid references scenes(id) on delete set null,
  shift_id uuid references shifts(id) on delete set null,
  kind text not null default 'files',
  name text not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table files enable row level security;

create policy "files_select_member" on files
  for select to authenticated using (is_project_member(project_id));

create policy "files_insert_member" on files
  for insert to authenticated with check (uploaded_by = auth.uid() and is_project_member(project_id));

create policy "files_admin_delete" on files
  for delete to authenticated using (is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- RPC: create_project
-- ---------------------------------------------------------------------------
create or replace function create_project(p_name text, p_timezone text default 'Europe/Moscow', p_dept dept_enum default null)
returns projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project projects;
  v_general_chat uuid;
  v_dept_chat uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'project name required';
  end if;

  insert into projects (name, timezone, created_by)
  values (p_name, coalesce(p_timezone, 'Europe/Moscow'), auth.uid())
  returning * into v_project;

  insert into project_members (project_id, user_id, role, invited_by)
  values (v_project.id, auth.uid(), 'admin', auth.uid());

  if p_dept is not null then
    insert into member_departments (project_id, user_id, dept)
    values (v_project.id, auth.uid(), p_dept)
    on conflict do nothing;
  end if;

  insert into chats (project_id, kind) values (v_project.id, 'general') returning id into v_general_chat;
  insert into chat_members (chat_id, user_id) values (v_general_chat, auth.uid());

  if p_dept is not null then
    insert into chats (project_id, kind, dept) values (v_project.id, 'dept', p_dept) returning id into v_dept_chat;
    insert into chat_members (chat_id, user_id) values (v_dept_chat, auth.uid());
  end if;

  return v_project;
end;
$$;

revoke all on function create_project(text, text, dept_enum) from public;
grant execute on function create_project(text, text, dept_enum) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: accept_invite
-- ---------------------------------------------------------------------------
create or replace function accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites;
  v_general_chat uuid;
  v_dept_chat uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_invite from invites where code = p_code for update;
  if not found then
    raise exception 'invite not found';
  end if;
  if v_invite.revoked then
    raise exception 'invite revoked';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'invite expired';
  end if;
  if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
    raise exception 'invite exhausted';
  end if;

  insert into project_members (project_id, user_id, role, is_actor, invited_by)
  values (v_invite.project_id, auth.uid(), v_invite.role, v_invite.is_actor, v_invite.created_by)
  on conflict (project_id, user_id) do nothing;

  if v_invite.dept is not null then
    insert into member_departments (project_id, user_id, dept)
    values (v_invite.project_id, auth.uid(), v_invite.dept)
    on conflict do nothing;
  end if;

  update invites set used_count = used_count + 1 where id = v_invite.id;

  select id into v_general_chat from chats where project_id = v_invite.project_id and kind = 'general' limit 1;
  if v_general_chat is not null then
    insert into chat_members (chat_id, user_id) values (v_general_chat, auth.uid())
    on conflict do nothing;
  end if;

  if v_invite.dept is not null then
    select id into v_dept_chat from chats where project_id = v_invite.project_id and kind = 'dept' and dept = v_invite.dept limit 1;
    if v_dept_chat is null then
      insert into chats (project_id, kind, dept) values (v_invite.project_id, 'dept', v_invite.dept) returning id into v_dept_chat;
    end if;
    insert into chat_members (chat_id, user_id) values (v_dept_chat, auth.uid())
    on conflict do nothing;
  end if;

  return v_invite.project_id;
end;
$$;

revoke all on function accept_invite(text) from public;
grant execute on function accept_invite(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: open_direct_chat
-- ---------------------------------------------------------------------------
create or replace function open_direct_chat(p_project_id uuid, p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not is_project_member(p_project_id) then
    raise exception 'not a project member';
  end if;

  select c.id into v_chat_id
  from chats c
  join chat_members m1 on m1.chat_id = c.id and m1.user_id = auth.uid()
  join chat_members m2 on m2.chat_id = c.id and m2.user_id = p_other_user
  where c.project_id = p_project_id and c.kind = 'direct'
  limit 1;

  if v_chat_id is null then
    insert into chats (project_id, kind) values (p_project_id, 'direct') returning id into v_chat_id;
    insert into chat_members (chat_id, user_id) values (v_chat_id, auth.uid()), (v_chat_id, p_other_user);
  end if;

  return v_chat_id;
end;
$$;

revoke all on function open_direct_chat(uuid, uuid) from public;
grant execute on function open_direct_chat(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: set_scene_status
-- ---------------------------------------------------------------------------
create or replace function set_scene_status(p_scene_id uuid, p_status scene_status_enum)
returns scenes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scene scenes;
begin
  select * into v_scene from scenes where id = p_scene_id;
  if not found then
    raise exception 'scene not found';
  end if;
  if not is_project_admin(v_scene.project_id) then
    raise exception 'not authorized';
  end if;

  update scenes set status = p_status, updated_at = now() where id = p_scene_id
  returning * into v_scene;

  return v_scene;
end;
$$;

revoke all on function set_scene_status(uuid, scene_status_enum) from public;
grant execute on function set_scene_status(uuid, scene_status_enum) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: revert_history
-- ---------------------------------------------------------------------------
create or replace function revert_history(p_history_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row history;
begin
  select * into v_row from history where id = p_history_id;
  if not found then
    raise exception 'history entry not found';
  end if;
  if not is_project_admin(v_row.project_id) then
    raise exception 'not authorized';
  end if;
  if v_row.old_data is null then
    raise exception 'nothing to revert to';
  end if;

  if v_row.table_name = 'scenes' then
    update scenes set
      number = v_row.old_data->>'number',
      mode = v_row.old_data->>'mode',
      int_ext = v_row.old_data->>'int_ext',
      story_day = v_row.old_data->>'story_day',
      location = v_row.old_data->>'location',
      sub_location = v_row.old_data->>'sub_location',
      synopsis = v_row.old_data->>'synopsis',
      characters = v_row.old_data->>'characters',
      costume_makeup = v_row.old_data->>'costume_makeup',
      props = v_row.old_data->>'props',
      stunts = v_row.old_data->>'stunts',
      status = (v_row.old_data->>'status')::scene_status_enum,
      shift_id = nullif(v_row.old_data->>'shift_id','')::uuid,
      sort_order = coalesce((v_row.old_data->>'sort_order')::int, 0),
      updated_at = now()
    where id = v_row.row_id;
  elsif v_row.table_name = 'shifts' then
    update shifts set
      date = (v_row.old_data->>'date')::date,
      call_time = (v_row.old_data->>'call_time')::timestamptz,
      wrap_time = (v_row.old_data->>'wrap_time')::timestamptz,
      location = v_row.old_data->>'location',
      address = v_row.old_data->>'address',
      note = v_row.old_data->>'note',
      published = (v_row.old_data->>'published')::boolean,
      updated_at = now()
    where id = v_row.row_id;
  else
    raise exception 'revert not supported for table %', v_row.table_name;
  end if;
end;
$$;

revoke all on function revert_history(uuid) from public;
grant execute on function revert_history(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: notify_call_sheet — уведомить группу об изменениях вызывного
-- ---------------------------------------------------------------------------
create or replace function notify_call_sheet(p_shift_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shift shifts;
begin
  select * into v_shift from shifts where id = p_shift_id;
  if not found then
    raise exception 'shift not found';
  end if;
  if not is_project_admin(v_shift.project_id) then
    raise exception 'not authorized';
  end if;

  insert into notifications (project_id, user_id, kind, title, body, payload, urgent)
  select
    v_shift.project_id,
    pm.user_id,
    'call_sheet_updated',
    'Вызывной обновлён',
    'Смена на ' || to_char(v_shift.date, 'DD.MM.YYYY'),
    jsonb_build_object('shift_id', v_shift.id),
    false
  from project_members pm
  where pm.project_id = v_shift.project_id;
end;
$$;

revoke all on function notify_call_sheet(uuid) from public;
grant execute on function notify_call_sheet(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Индексы
-- ---------------------------------------------------------------------------
create index if not exists idx_project_members_project on project_members(project_id);
create index if not exists idx_project_members_user on project_members(user_id);
create index if not exists idx_scenes_project on scenes(project_id);
create index if not exists idx_scenes_shift on scenes(shift_id);
create index if not exists idx_shifts_project on shifts(project_id);
create index if not exists idx_shift_timing_shift on shift_timing(shift_id);
create index if not exists idx_history_project on history(project_id);
create index if not exists idx_messages_chat on messages(chat_id);
create index if not exists idx_notifications_user on notifications(user_id, read_at);
create index if not exists idx_files_project on files(project_id);
create index if not exists idx_invites_project on invites(project_id);
