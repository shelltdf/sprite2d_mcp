import { defineStore } from "pinia";

const STORAGE_KEY = "sprite2d-theme";
const SHOW_SPRITES_KEY = "sprite2d-show-sprites";
const SHOW_SHEET_KEY = "sprite2d-show-sheet";

/** @param {string} key @param {boolean} defaultVal */
function readBool(key, defaultVal) {
  const v = localStorage.getItem(key);
  if (v === "0") return false;
  if (v === "1") return true;
  return defaultVal;
}

/** @param {'system'|'light'|'dark'} mode */
export function applyThemeToDocument(mode) {
  document.documentElement.setAttribute("data-theme", mode);
}

let mediaListener = null;

export const useUiStore = defineStore("ui", {
  state: () => ({
    themeMode: /** @type {'system'|'light'|'dark'} */ (
      (() => {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "light" || v === "dark" || v === "system") return v;
        return "system";
      })()
    ),
    /** 画布上是否绘制精灵框线/锚点等 */
    showSprites: readBool(SHOW_SPRITES_KEY, true),
    /** 画布上是否绘制精灵表位图（像素图） */
    showSheetImage: readBool(SHOW_SHEET_KEY, true),
  }),
  actions: {
    setThemeMode(mode) {
      this.themeMode = mode;
      localStorage.setItem(STORAGE_KEY, mode);
      applyThemeToDocument(mode);
    },
    initTheme() {
      applyThemeToDocument(this.themeMode);
      if (mediaListener) return;
      mediaListener = () => {
        if (this.themeMode === "system") applyThemeToDocument("system");
      };
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", mediaListener);
    },
    toggleShowSprites() {
      this.showSprites = !this.showSprites;
      localStorage.setItem(SHOW_SPRITES_KEY, this.showSprites ? "1" : "0");
    },
    toggleShowSheetImage() {
      this.showSheetImage = !this.showSheetImage;
      localStorage.setItem(SHOW_SHEET_KEY, this.showSheetImage ? "1" : "0");
    },
  },
});
