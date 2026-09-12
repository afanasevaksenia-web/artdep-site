-- record_history всё ещё имел грант на PUBLIC (=X), который перекрывает
-- точечный revoke у anon/authenticated — has_function_privilege учитывает
-- и персональный грант роли, и грант PUBLIC. Убираем оба.
revoke execute on function record_history() from public, anon, authenticated;
