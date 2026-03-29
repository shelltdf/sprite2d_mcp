const THEME_KEY = "sprite2d-theme";

/** @type {((e: MediaQueryListEvent) => void) | null} */
let mqListener = null;

function removeMqListener() {
  if (!mqListener || typeof window === "undefined") return;
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .removeEventListener("change", mqListener);
  mqListener = null;
}

/**
 * @param {"system" | "light" | "dark"} stored
 * @returns {"light" | "dark"}
 */
function resolveEffective(stored) {
  if (stored === "light") return "light";
  if (stored === "dark") return "dark";
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * @returns {"system" | "light" | "dark"}
 */
export function getThemePreference() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch (_) {
    /* ignore */
  }
  return "system";
}

/**
 * @param {"light" | "dark"} effective
 */
export function applyThemeDOM(effective) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", effective);
}

export function initTheme() {
  removeMqListener();
  const pref = getThemePreference();
  applyThemeDOM(resolveEffective(pref));
  if (pref === "system" && typeof window !== "undefined") {
    mqListener = () => applyThemeDOM(resolveEffective("system"));
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", mqListener);
  }
}

/**
 * @param {"system" | "light" | "dark"} pref
 */
export function setThemePreference(pref) {
  if (pref !== "light" && pref !== "dark" && pref !== "system") return;
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch (_) {
    /* ignore */
  }
  initTheme();
}
