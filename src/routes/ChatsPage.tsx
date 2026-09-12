export default function ChatsPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
      Чаты (общий, по цехам, личные) — этап 3 по CLAUDE.md. Таблицы и права в базе уже есть
      (<code>chats</code>, <code>chat_members</code>, <code>messages</code>, RPC{" "}
      <code>open_direct_chat</code>), общий чат и чат вашего цеха уже создаются автоматически при
      создании проекта или входе по приглашению — экран появится в следующем этапе.
    </div>
  );
}
