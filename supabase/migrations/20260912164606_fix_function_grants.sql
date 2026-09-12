-- anon/authenticated получают EXECUTE через default privileges Supabase
-- независимо от псевдороли PUBLIC — "revoke ... from public" их не трогает.
-- Отзываем явно у anon и authenticated, затем выдаём обратно только то, что нужно.

revoke execute on function is_project_member(uuid) from anon, authenticated;
revoke execute on function is_project_admin(uuid) from anon, authenticated;
revoke execute on function my_departments(uuid) from anon, authenticated;
revoke execute on function create_project(text, text, dept_enum) from anon, authenticated;
revoke execute on function accept_invite(text) from anon, authenticated;
revoke execute on function open_direct_chat(uuid, uuid) from anon, authenticated;
revoke execute on function set_scene_status(uuid, scene_status_enum) from anon, authenticated;
revoke execute on function revert_history(uuid) from anon, authenticated;
revoke execute on function notify_call_sheet(uuid) from anon, authenticated;
revoke execute on function record_history() from anon, authenticated;
revoke execute on function handle_new_user() from anon, authenticated;

-- Только authenticated может звать пользовательские RPC. anon (до входа)
-- не должен вызывать ничего из этого — вход отдельным потоком через auth.*.
grant execute on function is_project_member(uuid) to authenticated;
grant execute on function is_project_admin(uuid) to authenticated;
grant execute on function my_departments(uuid) to authenticated;
grant execute on function create_project(text, text, dept_enum) to authenticated;
grant execute on function accept_invite(text) to authenticated;
grant execute on function open_direct_chat(uuid, uuid) to authenticated;
grant execute on function set_scene_status(uuid, scene_status_enum) to authenticated;
grant execute on function revert_history(uuid) to authenticated;
grant execute on function notify_call_sheet(uuid) to authenticated;
-- record_history — только внутренний триггер, handle_new_user — только триггер auth.users.
-- Ни anon, ни authenticated не вызывают их напрямую.

-- На будущее: новые функции в public по умолчанию не должны светиться anon/authenticated.
alter default privileges in schema public revoke execute on functions from anon, authenticated;
