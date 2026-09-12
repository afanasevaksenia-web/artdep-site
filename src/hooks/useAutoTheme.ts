import { useEffect } from "react";

/**
 * Тёмная тема — не опция, а обязательный набор токенов (CLAUDE.md, раздел 9).
 * Здесь — базовая эвристика по системной настройке и времени суток. На
 * этапе 2, когда в интерфейсе появляется активная смена, переключатель
 * нужно довести до shifts.call_time / wrap_time конкретной смены, как того
 * требует спецификация.
 */
export function useAutoTheme() {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function apply() {
      const hour = new Date().getHours();
      const isNight = hour < 7 || hour >= 21;
      const dark = mql.matches || isNight;
      document.documentElement.classList.toggle("dark", dark);
    }

    apply();
    mql.addEventListener("change", apply);
    const interval = window.setInterval(apply, 15 * 60 * 1000);
    return () => {
      mql.removeEventListener("change", apply);
      window.clearInterval(interval);
    };
  }, []);
}
