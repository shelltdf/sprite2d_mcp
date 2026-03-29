const PADDING = 2;
const WRAP_W = 1024;

/**
 * Row-wrap layout for atlas packing (minimal).
 * @param {import('../stores/project').Sprite[]} sprites
 */
export function layoutAtlas(sprites) {
  let x = PADDING;
  let y = PADDING;
  let rowH = 0;
  let atlasW = PADDING;
  let atlasH = PADDING;

  const placed = sprites.map((s) => {
    const w = Math.max(1, Math.round(s.frame.w));
    const h = Math.max(1, Math.round(s.frame.h));
    if (x + w + PADDING > WRAP_W && x > PADDING) {
      x = PADDING;
      y += rowH + PADDING;
      rowH = 0;
    }
    const px = x;
    const py = y;
    x += w + PADDING;
    rowH = Math.max(rowH, h);
    atlasW = Math.max(atlasW, x);
    atlasH = Math.max(atlasH, py + h + PADDING);
    return {
      name: s.name,
      x: px,
      y: py,
      w,
      h,
      color: hashColor(s.id),
    };
  });

  return { width: atlasW, height: atlasH, placed };
}

export function hashColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 45% 72%)`;
}

/**
 * @param {import('../stores/project').Sprite[]} sprites
 */
export async function buildAtlasBlob(sprites) {
  const { width, height, placed } = layoutAtlas(sprites);
  const c = document.createElement("canvas");
  c.width = Math.max(4, width);
  c.height = Math.max(4, height);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(0, 0, c.width, c.height);
  for (const p of placed) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
  }
  const blob = await new Promise((resolve) =>
    c.toBlob((b) => resolve(b), "image/png")
  );
  return { blob, placed, width: c.width, height: c.height };
}

export function buildAtlasJson(placed) {
  return JSON.stringify(
    {
      version: 1,
      image: "atlas.png",
      sprites: placed.map(({ name, x, y, w, h }) => ({ name, x, y, w, h })),
    },
    null,
    2
  );
}

export function triggerDownload(filename, blobOrString, mime) {
  const a = document.createElement("a");
  a.style.display = "none";
  if (typeof blobOrString === "string") {
    const blob = new Blob([blobOrString], { type: mime || "application/json" });
    a.href = URL.createObjectURL(blob);
  } else {
    a.href = URL.createObjectURL(blobOrString);
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
