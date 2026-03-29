/**
 * 解析本工具导出的图集 JSON（atlas.json）。
 * @param {string} text
 */
export function parseAtlasJson(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("无效的 JSON");
  if (!Array.isArray(data.sprites)) throw new Error("缺少 sprites 数组");
  const sprites = data.sprites.map((raw, i) => {
    const row = {
      name: String(raw.name ?? `Sprite ${i + 1}`),
      x: Number(raw.x) || 0,
      y: Number(raw.y) || 0,
      w: Math.max(1, Number(raw.w) || 1),
      h: Math.max(1, Number(raw.h) || 1),
    };
    if (raw.pivot && typeof raw.pivot === "object") {
      row.pivot = {
        x: Number(raw.pivot.x) || 0,
        y: Number(raw.pivot.y) || 0,
      };
    }
    if (raw.inset && typeof raw.inset === "object") {
      row.inset = {
        top: Math.max(0, Number(raw.inset.top) || 0),
        right: Math.max(0, Number(raw.inset.right) || 0),
        bottom: Math.max(0, Number(raw.inset.bottom) || 0),
        left: Math.max(0, Number(raw.inset.left) || 0),
      };
    }
    return row;
  });
  return {
    version: Number(data.version) || 1,
    imageHint: typeof data.image === "string" ? data.image : "atlas.png",
    sprites,
  };
}
