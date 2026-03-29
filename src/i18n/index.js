import { createI18n } from "vue-i18n";
import zhCN from "../locales/zh-CN.json";
import enUS from "../locales/en-US.json";

const STORAGE_KEY = "sprite2d-locale";

const saved = localStorage.getItem(STORAGE_KEY);
const browser = (typeof navigator !== "undefined" && navigator.language) || "";
const fallback = browser.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
const initialLocale =
  saved === "zh-CN" || saved === "en-US" ? saved : fallback;

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
  },
});

export function persistLocale(code) {
  localStorage.setItem(STORAGE_KEY, code);
}
