import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "artdep.activeProjectId";

type ActiveProjectState = {
  projectId: string | null;
  setProjectId: (id: string | null) => void;
};

const ActiveProjectContext = createContext<ActiveProjectState>({
  projectId: null,
  setProjectId: () => {},
});

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setProjectId = (id: string | null) => {
    setProjectIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // недоступно (приватный режим) — переключение всё равно работает в рамках сессии
    }
  };

  useEffect(() => {
    // ничего — placeholder для будущей синхронизации с Dexie (офлайн, этап 5)
  }, [projectId]);

  const value = useMemo(() => ({ projectId, setProjectId }), [projectId]);

  return <ActiveProjectContext.Provider value={value}>{children}</ActiveProjectContext.Provider>;
}

export function useActiveProject() {
  return useContext(ActiveProjectContext);
}
