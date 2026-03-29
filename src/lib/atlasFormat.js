/**
 * 解析本工具导出的图集 JSON（atlas.json）。
 * @param {string} text
 */
export function parseAtlasJson(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("无效的 JSON");
  if (!Array.isArray(data.sprites)) throw new Error("缺少 sprites 数组");
  const sprites = data.sprites.map((raw, i) => ({
    name: String(raw.name ?? `Sprite ${i + 1}`),
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    w: Math.max(1, Number(raw.w) || 1),
    h: Math.max(1, Number(raw.h) || 1),
  }));
  return {
    version: Number(data.version) || 1,
    imageHint: typeof data.image === "string" ? data.image : "atlas.png",
    sprites,
  };
}
