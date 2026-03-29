/**
 * 主菜单与右键「精灵」菜单共用的条目构造（避免重复逻辑）。
 */

/** @typedef {{ key: string, label: string, action: () => void, disabled?: () => boolean }} MenuItem */

/**
 * @param {any} store
 * @param {(key: string, values?: Record<string, unknown>) => string} t
 * @returns {MenuItem[]}
 */
export function buildSpriteMenuItems(store, t) {
  return [
    { key: "add", label: t("menu.spriteAdd"), action: () => store.addSprite() },
    {
      key: "selectAll",
      label: t("menu.spriteSelectAll"),
      action: () => store.selectAllSprites(),
      disabled: () => store.sprites.length === 0,
    },
    {
      key: "copy",
      label: t("menu.spriteCopy"),
      action: () => store.copySelection(),
      disabled: () => store.selectedIds.length === 0,
    },
    {
      key: "paste",
      label: t("menu.spritePaste"),
      action: () => store.pasteSprites(),
      disabled: () => store.spriteClipboard.length === 0,
    },
    {
      key: "delete",
      label: t("menu.spriteDelete"),
      action: () => store.deleteSelection(),
      disabled: () => store.selectedIds.length === 0,
    },
  ];
}

/**
 * @param {any} store
 * @param {(key: string, values?: Record<string, unknown>) => string} t
 * @returns {MenuItem[]}
 */
export function buildAnimationMenuItems(store, t) {
  return [
    {
      key: "addAnim",
      label: t("menu.animNew"),
      action: () => store.addAnimation(),
    },
    {
      key: "delAnim",
      label: t("menu.animDelete"),
      action: () => store.deleteSelectedAnimation(),
      disabled: () => !store.selectedAnimationId,
    },
  ];
}

/**
 * @param {any} store
 * @param {() => void} openSheetPicker
 * @param {(key: string, values?: Record<string, unknown>) => string} t
 * @returns {MenuItem[]}
 */
export function buildSheetMenuItems(store, openSheetPicker, t) {
  return [
    {
      key: "setSheet",
      label: t("menu.sheetSet"),
      action: () => openSheetPicker(),
    },
  ];
}
