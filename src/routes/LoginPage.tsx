import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const redirectTo = window.location.href.split("#")[0] + "#/projects";
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: redirectTo,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Не удалось отправить ссылку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-text">Платформа для съёмочных групп</h1>
        <p className="mb-6 text-sm text-muted">
          Вход по почте. Вход по номеру телефона (SMS) появится, когда подключим SMS-провайдера — так
          сказано в разделе 8 CLAUDE.md.
        </p>

        {sent ? (
          <p className="text-sm text-text">
            Ссылка для входа отправлена на <b>{email}</b>. Откройте почту на этом же телефоне и
            перейдите по ссылке.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-muted">
              Имя
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
                placeholder="Как вас видит группа"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-muted">
              Почта
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-tap rounded-lg border border-border bg-bg px-3 text-text"
                placeholder="you@example.com"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="min-h-tap rounded-lg bg-accent px-4 font-medium text-white disabled:opacity-60"
            >
              {loading ? "Отправляем…" : "Получить ссылку для входа"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
