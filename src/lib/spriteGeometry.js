/**
 * 精灵锚点（相对精灵矩形左上角，像素）
 * @typedef {{ x: number, y: number }} Pivot
 */

/**
 * 内边界：从矩形四边向内的留白（像素）
 * @typedef {{ top: number, right: number, bottom: number, left: number }} Inset
 */

/** @deprecated 新建精灵请用 pivotCenterForFrame(w,h)；保留供旧 JSON 显式 {0,0} 等场景 */
export function defaultPivot() {
  return { x: 0, y: 0 };
}

/** 锚点默认在矩形中心（像素整数，偏左/上取整） */
export function pivotCenterForFrame(w, h) {
  const ww = Math.max(1, Math.round(Number(w) || 1));
  const hh = Math.max(1, Math.round(Number(h) || 1));
  return { x: Math.floor(ww / 2), y: Math.floor(hh / 2) };
}

/**
 * 将 frame 四字段取整；w/h 至少为 1。
 * @param {{ x: number, y: number, w: number, h: number }} f
 */
export function roundSpriteFrameIntegers(f) {
  f.x = Math.round(Number(f.x) || 0);
  f.y = Math.round(Number(f.y) || 0);
  f.w = Math.max(1, Math.round(Number(f.w) || 1));
  f.h = Math.max(1, Math.round(Number(f.h) || 1));
}

export function defaultInset() {
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

/**
 * 确保存在 pivot/inset，并按当前 frame 尺寸钳制。
 * @param {{ frame: { w: number, h: number }, pivot?: unknown, inset?: unknown }} s
 */
export function ensureSpriteGeometry(s) {
  const w = Math.max(1, Number(s.frame?.w) || 1);
  const h = Math.max(1, Number(s.frame?.h) || 1);

  if (!s.pivot || typeof s.pivot !== "object") {
    s.pivot = pivotCenterForFrame(w, h);
  } else {
    s.pivot = {
      x: Number(s.pivot.x) || 0,
      y: Number(s.pivot.y) || 0,
    };
  }
  s.pivot.x = Math.max(0, Math.min(Math.round(s.pivot.x), w));
  s.pivot.y = Math.max(0, Math.min(Math.round(s.pivot.y), h));

  if (!s.inset || typeof s.inset !== "object") {
    s.inset = defaultInset();
  } else {
    s.inset = {
      top: Math.max(0, Number(s.inset.top) || 0),
      right: Math.max(0, Number(s.inset.right) || 0),
      bottom: Math.max(0, Number(s.inset.bottom) || 0),
      left: Math.max(0, Number(s.inset.left) || 0),
    };
  }
  const ins = s.inset;

  if (w <= 1) {
    ins.left = 0;
    ins.right = 0;
  } else if (ins.left + ins.right >= w) {
    const t = ins.left + ins.right;
    ins.left = Math.max(0, Math.floor((ins.left * (w - 1)) / t));
    ins.right = Math.max(0, w - 1 - ins.left);
  }

  if (h <= 1) {
    ins.top = 0;
    ins.bottom = 0;
  } else if (ins.top + ins.bottom >= h) {
    const t = ins.top + ins.bottom;
    ins.top = Math.max(0, Math.floor((ins.top * (h - 1)) / t));
    ins.bottom = Math.max(0, h - 1 - ins.top);
  }
}
