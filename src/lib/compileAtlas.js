import { ensureSpriteGeometry, defaultPivot, defaultInset } from "./spriteGeometry.js";

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
    ensureSpriteGeometry(s);
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
      sx: Math.round(s.frame.x),
      sy: Math.round(s.frame.y),
      sw: w,
      sh: h,
      color: hashColor(s.id),
      pivot: { x: s.pivot.x, y: s.pivot.y },
      inset: {
        top: s.inset.top,
        right: s.inset.right,
        bottom: s.inset.bottom,
        left: s.inset.left,
      },
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
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("无法解码精灵表图片"));
    img.src = dataUrl;
  });
}

/**
 * Clamp drawImage source rect to bitmap bounds.
 * @param {HTMLImageElement} img
 * @param {number} sx
 * @param {number} sy
 * @param {number} sw
 * @param {number} sh
 */
function clampSourceRect(img, sx, sy, sw, sh) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let x = sx;
  let y = sy;
  let w = sw;
  let h = sh;
  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  w = Math.max(0, Math.min(w, iw - x));
  h = Math.max(0, Math.min(h, ih - y));
  return { sx: x, sy: y, sw: w, sh: h };
}

/**
 * @param {import('../stores/project').Sprite[]} sprites
 * @param {string | null} [sheetDataUrl] 已导入的精灵表（data URL）；无则使用色块占位
 */
export async function buildAtlasBlob(sprites, sheetDataUrl = null) {
  const { width, height, placed } = layoutAtlas(sprites);
  const c = document.createElement("canvas");
  c.width = Math.max(4, width);
  c.height = Math.max(4, height);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas 不可用");

  let sheetImg = null;
  if (sheetDataUrl) {
    try {
      sheetImg = await loadImageFromDataUrl(sheetDataUrl);
    } catch {
      sheetImg = null;
    }
  }

  ctx.fillStyle = "#2a2a2e";
  ctx.fillRect(0, 0, c.width, c.height);
  for (const p of placed) {
    if (sheetImg && sheetImg.complete && sheetImg.naturalWidth > 0) {
      const { sx, sy, sw, sh } = clampSourceRect(
        sheetImg,
        p.sx,
        p.sy,
        p.sw,
        p.sh
      );
      if (sw > 0 && sh > 0) {
        ctx.drawImage(sheetImg, sx, sy, sw, sh, p.x, p.y, p.w, p.h);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    }
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
      sprites: placed.map((p) => {
        const piv = p.pivot || defaultPivot();
        const ins = p.inset || defaultInset();
        return {
          name: p.name,
          x: p.x,
          y: p.y,
          w: p.w,
          h: p.h,
          pivot: { x: piv.x, y: piv.y },
          inset: {
            top: ins.top,
            right: ins.right,
            bottom: ins.bottom,
            left: ins.left,
          },
        };
      }),
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
