import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { keysOf } from "@/lib/objects";
import { blocks, scriptScenes } from "@/lib/seed";
import { libretto } from "@/lib/libretto";
import { cn } from "@/lib/cn";
import { docxToText } from "@/lib/docx-text";
import { parseScript } from "@/lib/script-parse";
import { useSmena } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/script")({ component: Script });

const eps = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function Script() {
  const [tab, setTab] = useState<"day" | "lib" | "mine">("day");
  const [ep, setEp] = useState<(typeof eps)[number]>(5);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return libretto.filter((s) => {
      if (s.ep !== ep) return false;
      if (!query) return true;
      return `${s.id} ${s.loc} ${s.syn} ${s.cast}`.toLowerCase().includes(query);
    });
  }, [ep, q]);

  return (
    <div className="px-5 pt-8 pb-6">
      <Link to="/more" className="text-sm font-semibold text-accent">
        ← ещё
      </Link>
      <div className="mt-3 flex items-end justify-between">
        <h1 className="font-display text-3xl">Сценарий</h1>
        <span className="text-xs text-accent">чтение</span>
      </div>
      <p className="mb-4 text-sm text-muted">выборки дня · либретто 8 серий от 24.08</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("day")}
          className={cn(
            "min-h-10 rounded-full border px-3 text-sm font-semibold",
            tab === "day" ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
          )}
        >
          Сцены дня
        </button>
        <button
          onClick={() => setTab("lib")}
          className={cn(
            "min-h-10 rounded-full border px-3 text-sm font-semibold",
            tab === "lib" ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
          )}
        >
          Либретто
        </button>
        <button
          onClick={() => setTab("mine")}
          className={cn(
            "min-h-10 rounded-full border px-3 text-sm font-semibold",
            tab === "mine" ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
          )}
        >
          Мой сценарий
        </button>
      </div>

      {tab === "day" &&
        (() => {
          const dayIds = blocks.filter((b) => b.scene).flatMap((b) => keysOf(b.scene!));
          const dayLib = libretto.filter((s) => dayIds.includes(s.id));
          const extra = scriptScenes.filter((s) => !dayLib.some((l) => l.id === s.id || s.id.startsWith(l.id)));
          return (
            <>
              {dayLib.map((s) => (
                <article key={s.id} className="border-t border-line py-4">
                  <h2 className="font-display text-lg">
                    {s.id}. {s.loc}
                  </h2>
                  <p className="text-xs text-faint">
                    {s.mode} · {s.dur} · {s.cast}
                  </p>
                  <p className="mt-2 leading-relaxed text-muted">{s.syn}</p>
                </article>
              ))}
              {extra.map((s) => (
                <article key={s.id} className="border-t border-line py-4">
                  <h2 className="font-display text-lg">{s.heading}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                </article>
              ))}
            </>
          );
        })()}

      {tab === "lib" && (
        <>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {eps.map((n) => (
              <button
                key={n}
                onClick={() => setEp(n)}
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-md border text-sm font-semibold",
                  ep === n ? "border-accent bg-accent-dim text-accent" : "border-line text-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="сцена, объект, персонаж…"
            className="mb-3 min-h-11 w-full rounded-md border border-line bg-card px-3 text-sm outline-none placeholder:text-faint"
          />
          <p className="mb-2 text-xs text-faint">
            серия {ep} · {list.length} сцен
          </p>
          {list.map((s) => (
            <article key={s.id} className="border-t border-line py-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{s.id}</h2>
                <span className="text-xs text-faint">
                  {s.mode} · {s.dur}
                </span>
              </div>
              <p className="text-xs text-accent">{s.loc}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.syn}</p>
              {s.cast ? <p className="mt-1 text-xs text-faint">{s.cast}</p> : null}
            </article>
          ))}
        </>
      )}

      {tab === "mine" && <MyScript />}
    </div>
  );
}

function MyScript() {
  const customScript = useSmena((s) => s.customScript);
  const customScriptName = useSmena((s) => s.customScriptName);
  const setCustomScript = useSmena((s) => s.setCustomScript);
  const clearCustomScript = useSmena((s) => s.clearCustomScript);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = file.name.toLowerCase().endsWith(".docx") ? await docxToText(file) : await file.text();
      const scenes = parseScript(text);
      if (scenes.length === 0) {
        toast("Сцен не нашли — нужны строки вида «5-4. НАТ. …» или «INT. …»");
        return;
      }
      setCustomScript(scenes, file.name);
      toast(`Загружено ${scenes.length} сцен из «${file.name}»`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Не удалось прочитать файл");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.fountain,.docx,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleFile(file);
        }}
      />

      {customScript.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted">
            Загрузи свой сценарий — .txt, .fountain или .docx. Разобьём на сцены по заголовкам «ИНТ./НАТ.» или
            «INT./EXT.».
          </p>
          <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Upload className="size-4" /> {busy ? "Читаем…" : "Загрузить файл"}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-card px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{customScriptName}</div>
              <div className="text-xs text-muted">{customScript.length} сцен</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="line" onClick={() => inputRef.current?.click()} disabled={busy}>
                Заменить
              </Button>
              <Button variant="ghost" onClick={clearCustomScript} aria-label="Удалить">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {customScript.map((s) => (
            <article key={s.id} className="border-t border-line py-3">
              <h2 className="font-semibold">{s.heading}</h2>
              {s.body && <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>}
            </article>
          ))}
        </>
      )}
      <p className="mt-4 text-xs text-faint">
        Права на правку сценария выдают продюсер или второй режиссёр. Файл хранится только в этом браузере.
      </p>
    </div>
  );
}
