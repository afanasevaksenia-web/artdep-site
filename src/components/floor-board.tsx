import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { overtimeOf, shiftLen, type FloorRow } from "@/lib/seed";
import { useSmena, type Punch } from "@/lib/store";

function statusOf(p?: Punch) {
  if (p?.left) return "уехал";
  if (p?.stop) return "стоп";
  if (p?.arrived) return "на площадке";
  return "нет";
}

function Row({ row }: { row: FloorRow }) {
  const punch = useSmena((s) => s.punch[row.id]);
  const markArrived = useSmena((s) => s.markArrived);
  const markStop = useSmena((s) => s.markStop);
  const markLeft = useSmena((s) => s.markLeft);
  const end = punch?.stop ?? punch?.left;
  const ot = end ? overtimeOf(end, row.wrap) : null;
  const worked = end ? shiftLen(punch?.arrived ?? row.call, end) : null;
  const st = statusOf(punch);

  return (
    <li className="border-t border-line py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold">{row.name}</div>
          {row.detail && <div className="text-xs text-muted">{row.detail}</div>}
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-accent tabular-nums">{row.call}</div>
          <div
            className={cn(
              "text-xs font-semibold",
              st === "на площадке" && "text-ok",
              st === "нет" && "text-warn",
              st === "стоп" && "text-accent",
              st === "уехал" && "text-faint",
            )}
          >
            {st}
          </div>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          onClick={() => {
            markArrived(row.id);
            toast(`${row.name}: приехал`);
          }}
          className={cn(
            "min-h-11 rounded-md text-xs font-semibold",
            punch?.arrived && !punch.left ? "bg-accent text-bg" : "border border-line bg-surface",
          )}
        >
          Приехал
        </button>
        <button
          onClick={() => {
            markStop(row.id);
            toast(`${row.name}: стоп`);
          }}
          className={cn(
            "min-h-11 rounded-md text-xs font-semibold",
            punch?.stop && !punch.left ? "bg-accent-dim text-accent" : "border border-line bg-surface",
          )}
        >
          Стоп
        </button>
        <button
          onClick={() => {
            markLeft(row.id);
            toast(`${row.name}: уехал`);
          }}
          className={cn(
            "min-h-11 rounded-md text-xs font-semibold",
            punch?.left ? "border border-line bg-surface text-faint" : "border border-line bg-surface",
          )}
        >
          Уехал
        </button>
      </div>
      {(punch?.arrived || punch?.stop || punch?.left) && (
        <p className="mt-2 text-xs text-muted">
          {punch.arrived && <span>приехал {punch.arrived}</span>}
          {punch.stop && <span> · стоп {punch.stop}</span>}
          {punch.left && <span> · уехал {punch.left}</span>}
          {worked && worked !== "00:00" && <span> · смена {worked}</span>}
          {ot ? (
            <span className="font-semibold text-warn"> · переработка +{ot}</span>
          ) : punch.stop || punch.left ? (
            <span> · без переработки</span>
          ) : null}
        </p>
      )}
    </li>
  );
}

export function FloorBoard({ rows }: { rows: FloorRow[] }) {
  return (
    <ul>
      {rows.map((r) => (
        <Row key={r.id} row={r} />
      ))}
    </ul>
  );
}

export function missingNames(rows: FloorRow[], punch: Record<string, Punch>) {
  return rows.filter((r) => !punch[r.id]?.arrived && !punch[r.id]?.left).map((r) => r.name);
}

export function hereNames(rows: FloorRow[], punch: Record<string, Punch>) {
  return rows.filter((r) => punch[r.id]?.arrived && !punch[r.id]?.left).map((r) => r.name);
}
