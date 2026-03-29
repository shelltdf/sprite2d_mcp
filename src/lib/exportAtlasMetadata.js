/**
 * 第三方图集描述导出：仅元数据（路径、矩形、锚点、动画等），不含像素图。
 */

/**
 * @param {string} s
 */
function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {{
 *   name: string;
 *   sheetImagePath: string | null;
 *   sheetFileName: string | null;
 *   sheetWidth: number;
 *   sheetHeight: number;
 *   sprites: Array<{ id: string, name: string, frame: object, pivot: object, inset: object }>;
 *   animations: Array<{ id: string, name: string, frames: Array<{ spriteId: string, durationMs: number }> }>;
 * }} payload
 */
export function buildAtlasMetadataObject(payload) {
  const imagePath =
    payload.sheetImagePath ||
    payload.sheetFileName ||
    "";
  return {
    format: "sprite2d-atlas-metadata",
    version: 1,
    projectName: payload.name,
    image: {
      path: imagePath,
      width: Math.max(0, Math.round(Number(payload.sheetWidth) || 0)),
      height: Math.max(0, Math.round(Number(payload.sheetHeight) || 0)),
    },
    sprites: payload.sprites.map((s) => ({
      id: s.id,
      name: s.name,
      frame: {
        x: s.frame.x,
        y: s.frame.y,
        w: s.frame.w,
        h: s.frame.h,
      },
      pivot: { x: s.pivot.x, y: s.pivot.y },
      inset: {
        top: s.inset.top,
        right: s.inset.right,
        bottom: s.inset.bottom,
        left: s.inset.left,
      },
    })),
    animations: payload.animations.map((a) => ({
      id: a.id,
      name: a.name,
      frames: a.frames.map((f) => ({
        spriteId: f.spriteId,
        durationMs: f.durationMs,
      })),
    })),
  };
}

/**
 * @param {Parameters<typeof buildAtlasMetadataObject>[0]} payload
 */
export function buildAtlasMetadataJsonString(payload) {
  return JSON.stringify(buildAtlasMetadataObject(payload), null, 2);
}

/**
 * @param {Parameters<typeof buildAtlasMetadataObject>[0]} payload
 */
export function buildAtlasMetadataXmlString(payload) {
  const o = buildAtlasMetadataObject(payload);
  const ip = escapeXml(o.image.path);
  const iw = o.image.width;
  const ih = o.image.height;
  const spriteLines = o.sprites
    .map(
      (s) =>
        `  <sprite id="${escapeXml(s.id)}" name="${escapeXml(s.name)}" x="${s.frame.x}" y="${s.frame.y}" w="${s.frame.w}" h="${s.frame.h}">\n` +
        `    <pivot x="${s.pivot.x}" y="${s.pivot.y}"/>\n` +
        `    <inset top="${s.inset.top}" right="${s.inset.right}" bottom="${s.inset.bottom}" left="${s.inset.left}"/>\n` +
        `  </sprite>`
    )
    .join("\n");
  const animLines = o.animations
    .map((a) => {
      const fr = a.frames
        .map(
          (f) =>
            `      <frame spriteId="${escapeXml(f.spriteId)}" durationMs="${f.durationMs}"/>`
        )
        .join("\n");
      return (
        `  <animation id="${escapeXml(a.id)}" name="${escapeXml(a.name)}">\n` +
        (fr ? `${fr}\n` : "") +
        `  </animation>`
      );
    })
    .join("\n");

  const pn = escapeXml(o.projectName || "");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<atlas format="sprite2d-atlas-metadata" version="1" projectName="${pn}" imagePath="${ip}" imageWidth="${iw}" imageHeight="${ih}">\n` +
    `  <sprites>\n${spriteLines ? spriteLines + "\n" : ""}  </sprites>\n` +
    `  <animations>\n${animLines ? animLines + "\n" : ""}  </animations>\n` +
    `</atlas>\n`
  );
}
