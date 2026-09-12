import type { Database } from "../types/database";

export type Dept = Database["public"]["Enums"]["dept_enum"];

export const DEPT_LABELS: Record<Dept, string> = {
  dir: "Директорская",
  rezh: "Режиссёрская",
  oper: "Операторский",
  svet: "Свет",
  zvuk: "Звук",
  hud: "Художники",
  rekv: "Реквизит",
  kost: "Костюм",
  grim: "Грим",
  cast: "Актёрский/кастинг",
  trans: "Транспорт",
  other: "Другое",
};

export const DEPT_ORDER: Dept[] = [
  "dir", "rezh", "oper", "svet", "zvuk", "hud", "rekv", "kost", "grim", "cast", "trans", "other",
];

export const SCENE_STATUS_LABELS: Record<Database["public"]["Enums"]["scene_status_enum"], string> = {
  planned: "Запланирована",
  shot: "Снята",
  partial: "Частично",
  moved: "Перенесена",
  cut: "Вычеркнута",
};
