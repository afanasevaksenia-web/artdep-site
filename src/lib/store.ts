import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ParsedScene } from "./script-parse";
import {
  chatsSeed,
  eventsSeed,
  messagesSeed,
  menuSeed,
  notesSeed,
  nowHm,
  people,
  project,
  tasksSeed,
  type Chat,
  type ChatMsg,
  type CrewStatus,
  type DayEvent,
  type DayNote,
  type MenuPost,
  type Task,
} from "./seed";

export type Punch = { arrived?: string; stop?: string; left?: string };

type State = {
  meId: string;
  statuses: Record<string, CrewStatus>;
  chats: Chat[];
  messages: Record<string, ChatMsg[]>;
  tasks: Task[];
  notes: DayNote[];
  events: DayEvent[];
  menu: MenuPost[];
  lunch: string;
  punch: Record<string, Punch>;
  customScript: ParsedScene[];
  customScriptName: string | null;
  setMe: (id: string) => void;
  setCustomScript: (scenes: ParsedScene[], name: string) => void;
  clearCustomScript: () => void;
  setStatus: (id: string, s: CrewStatus) => void;
  send: (chatId: string, text: string, shot?: string) => void;
  readChat: (id: string) => void;
  moveTask: (id: string) => void;
  addNote: (note: Omit<DayNote, "id" | "who" | "t">) => void;
  addEvent: (e: Omit<DayEvent, "id" | "who" | "t">) => void;
  addMenu: (m: Omit<MenuPost, "id" | "who" | "t">) => void;
  markArrived: (id: string) => void;
  markStop: (id: string) => void;
  markLeft: (id: string) => void;
};

const nextCol: Record<Task["col"], Task["col"]> = {
  "к смене": "в работе",
  "в работе": "готово",
  готово: "к смене",
  блокер: "в работе",
};

export const useSmena = create<State>()(
  persist(
    (set, get) => ({
  meId: "ad2",
  statuses: Object.fromEntries(people.map((p) => [p.id, p.status])),
  chats: chatsSeed,
  messages: messagesSeed,
  tasks: tasksSeed,
  notes: notesSeed,
  events: eventsSeed,
  menu: menuSeed,
  lunch: eventsSeed.find((e) => e.lunch)?.lunch === "отмена" ? "отмена" : (eventsSeed.find((e) => e.lunch)?.lunch ?? project.lunch),
  punch: {},
  customScript: [],
  customScriptName: null,
  setMe: (id) => set({ meId: id }),
  setCustomScript: (scenes, name) => set({ customScript: scenes, customScriptName: name }),
  clearCustomScript: () => set({ customScript: [], customScriptName: null }),
  setStatus: (id, s) => set({ statuses: { ...get().statuses, [id]: s } }),
  send: (chatId, text, shot) => {
    const me = people.find((p) => p.id === get().meId);
    const msg: ChatMsg = {
      id: `${Date.now()}`,
      who: me?.name ?? "Я",
      me: true,
      t: nowHm(),
      text: text || (shot ? "кадр" : ""),
      shot,
    };
    const messages = {
      ...get().messages,
      [chatId]: [...(get().messages[chatId] ?? []), msg],
    };
    const preview = shot ? "кадр" : text;
    const chats = get().chats.map((c) =>
      c.id === chatId ? { ...c, last: `${me?.name.split(" ")[0]}: ${preview}`, unread: 0 } : c,
    );
    set({ messages, chats });
  },
  readChat: (id) =>
    set({
      chats: get().chats.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    }),
  moveTask: (id) =>
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, col: nextCol[t.col] } : t)),
    }),
  addNote: (note) => {
    const me = people.find((p) => p.id === get().meId);
    set({
      notes: [
        {
          ...note,
          id: `${Date.now()}`,
          who: me?.name ?? "Группа",
          t: "сейчас",
        },
        ...get().notes,
      ],
    });
  },
  addEvent: (e) => {
    const me = people.find((p) => p.id === get().meId);
    const event: DayEvent = {
      ...e,
      id: `${Date.now()}`,
      who: me?.name ?? "Группа",
      t: nowHm(),
    };
    set({
      events: [event, ...get().events],
      lunch: e.lunch === "отмена" ? "отмена" : e.lunch ? e.lunch : get().lunch,
    });
  },
  addMenu: (m) => {
    const me = people.find((p) => p.id === get().meId);
    set({
      menu: [
        {
          ...m,
          id: `${Date.now()}`,
          who: me?.name ?? "Буфет",
          t: nowHm(),
        },
        ...get().menu,
      ],
    });
  },
  markArrived: (id) => {
    const t = nowHm();
    set({
      punch: { ...get().punch, [id]: { arrived: t, stop: undefined, left: undefined } },
    });
  },
  markStop: (id) => {
    const t = nowHm();
    const prev = get().punch[id] ?? {};
    set({
      punch: { ...get().punch, [id]: { ...prev, arrived: prev.arrived ?? t, stop: t } },
    });
  },
  markLeft: (id) => {
    const t = nowHm();
    const prev = get().punch[id] ?? {};
    set({
      punch: {
        ...get().punch,
        [id]: { arrived: prev.arrived ?? t, stop: prev.stop ?? t, left: t },
      },
    });
  },
    }),
    {
      name: "smena-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        meId: s.meId,
        statuses: s.statuses,
        chats: s.chats,
        messages: s.messages,
        tasks: s.tasks,
        notes: s.notes,
        events: s.events,
        menu: s.menu,
        lunch: s.lunch,
        punch: s.punch,
        customScript: s.customScript,
        customScriptName: s.customScriptName,
      }),
    },
  ),
);

export function useMe() {
  const id = useSmena((s) => s.meId);
  return people.find((p) => p.id === id) ?? people[0];
}
