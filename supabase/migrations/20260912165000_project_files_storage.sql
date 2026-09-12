-- Бакет для файлов проекта и политики доступа (раздел 3 CLAUDE.md).
-- Путь объекта: {project_id}/{files|script|cast|callsheets}/{uuid}-{имя} —
-- первый сегмент пути обязан быть project_id, доступ проверяется по нему.

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "project_files_select_member" on storage.objects;
create policy "project_files_select_member" on storage.objects
  for select to authenticated using (
    bucket_id = 'project-files' and is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "project_files_insert_member" on storage.objects;
create policy "project_files_insert_member" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'project-files' and is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "project_files_delete_admin" on storage.objects;
create policy "project_files_delete_admin" on storage.objects
  for delete to authenticated using (
    bucket_id = 'project-files' and is_project_admin((storage.foldername(name))[1]::uuid)
  );
