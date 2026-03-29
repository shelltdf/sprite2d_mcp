import { i18n } from "./index.js";

/** @param {string} key @param {Record<string, unknown>} [values] */
export function T(key, values) {
  return i18n.global.t(key, values ?? {});
}
