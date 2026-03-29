<template>
  <div ref="wrapRef" class="win-canvas-wrap">
    <canvas
      ref="canvasRef"
      :class="{ panning: isPanning }"
      @wheel.prevent="onWheel"
      @contextmenu.prevent="onContextMenu"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerenter="onCanvasPointerEnter"
      @pointerleave="onPointerLeaveCanvas"
    />
    <div class="canvas-coords-hud" :title="t('canvas.coordsHudTitle')">
      {{ hudWorldText }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";
import { hashColor } from "../lib/compileAtlas.js";
import { ensureSpriteGeometry } from "../lib/spriteGeometry.js";
import { SPRITE_MENU_OPEN, SPRITE_FOCUS } from "../menu/events.js";

const { t } = useI18n();
const store = useProjectStore();
const uiStore = useUiStore();
const {
  sprites,
  view,
  selectedIds,
  sheetImageDataUrl,
  sheetWidth,
  sheetHeight,
} = storeToRefs(store);
const { showSprites, showSheetImage } = storeToRefs(uiStore);

/** @type {import('vue').Ref<HTMLImageElement | null>} */
const sheetImg = ref(null);

const wrapRef = ref(null);
const canvasRef = ref(null);
let dpr = 1;

const isPanning = ref(false);
let panPointerId = null;
let dragPointerId = null;
let lastPanX = 0;
let lastPanY = 0;

/** 多选拖动 */
/** @type {string[] | null} */
let groupDragIds = null;
/** @type {Map<string, { x: number, y: number }> | null} */
let dragSnapshots = null;
let dragStartWorldX = 0;
let dragStartWorldY = 0;

/** 框选 */
/** @type {'candidate' | 'dragging' | null} */
let marqueeMode = null;
let marqueePointerId = null;
let marqueeStart = { x: 0, y: 0 };
let marqueeEnd = { x: 0, y: 0 };

/** 单选时拖边角/边调整尺寸 */
let resizePointerId = null;
/** @type {null | { handle: string, snap: { x: number, y: number, w: number, h: number }, startWx: number, startWy: number, spriteId: string }} */
let resizeState = null;

const spaceDown = ref(false);

/** 相对 canvas 元素 CSS 像素的指针位置；null 表示不在画布上 */
const pointerCss = ref(/** @type {{ cx: number, cy: number } | null} */ (null));

const hudWorldText = computed(() => {
  const p = pointerCss.value;
  const v = view.value;
  if (!p) return "—";
  const x = (p.cx - v.offsetX) / v.scale;
  const y = (p.cy - v.offsetY) / v.scale;
  return `${Math.floor(x)}, ${Math.floor(y)}`;
});

/** 同步左下角坐标 HUD 与 store 内指针世界坐标（用于「添加精灵」落点） */
function updateCanvasPointerTracking(ev) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;
  if (cx < 0 || cy < 0 || cx > rect.width || cy > rect.height) {
    pointerCss.value = null;
    store.setCanvasPointerHint(false);
    return;
  }
  pointerCss.value = { cx, cy };
  const w = screenToWorld(cx, cy);
  store.setCanvasPointerHint(true, w.x, w.y);
}

function onCanvasPointerEnter(ev) {
  updateCanvasPointerTracking(ev);
}

function onPointerLeaveCanvas() {
  pointerCss.value = null;
  store.setCanvasPointerHint(false);
}

function isSelected(id) {
  return selectedIds.value.includes(id);
}

function resize() {
  const canvas = canvasRef.value;
  const wrap = wrapRef.value;
  if (!canvas || !wrap) return;
  dpr = window.devicePixelRatio || 1;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  store.setCanvasViewportSize(w, h);
  draw();
}

function screenToWorld(cx, cy) {
  const { scale, offsetX, offsetY } = view.value;
  return {
    x: (cx - offsetX) / scale,
    y: (cy - offsetY) / scale,
  };
}

function hitTest(wx, wy) {
  for (let i = sprites.value.length - 1; i >= 0; i--) {
    const s = sprites.value[i];
    const { x, y, w, h } = s.frame;
    if (wx >= x && wy >= y && wx <= x + w && wy <= y + h) return s;
  }
  return null;
}

/** 调整点在屏幕上的视觉大小（约常数像素）→ 世界半径 */
function handleHalfWorld(scale) {
  return Math.max(2.5, 5 / scale) / 2;
}

/**
 * @param {number} wx
 * @param {number} wy
 * @param {{ x: number, y: number, w: number, h: number }} f
 * @param {number} scale
 * @returns {string | null}
 */
function hitTestResizeHandle(wx, wy, f, scale) {
  const half = handleHalfWorld(scale);
  const { x, y, w, h } = f;
  const centers = [
    ["nw", x, y],
    ["ne", x + w, y],
    ["se", x + w, y + h],
    ["sw", x, y + h],
    ["n", x + w / 2, y],
    ["e", x + w, y + h / 2],
    ["s", x + w / 2, y + h],
    ["w", x, y + h / 2],
  ];
  for (const [name, cx, cy] of centers) {
    if (
      wx >= cx - half &&
      wx <= cx + half &&
      wy >= cy - half &&
      wy <= cy + half
    ) {
      return /** @type {string} */ (name);
    }
  }
  return null;
}

/**
 * @param {{ x: number, y: number, w: number, h: number }} snap
 * @param {string} handle
 * @param {number} dx
 * @param {number} dy
 */
function computeResizedFrame(snap, handle, dx, dy) {
  let x = snap.x;
  let y = snap.y;
  let w = snap.w;
  let h = snap.h;
  if (handle.includes("n")) {
    y = snap.y + dy;
    h = snap.h - dy;
  }
  if (handle.includes("s")) {
    h = snap.h + dy;
  }
  if (handle.includes("w")) {
    x = snap.x + dx;
    w = snap.w - dx;
  }
  if (handle.includes("e")) {
    w = snap.w + dx;
  }
  if (w < 1) {
    if (handle.includes("w")) x = snap.x + snap.w - 1;
    w = 1;
  }
  if (h < 1) {
    if (handle.includes("n")) y = snap.y + snap.h - 1;
    h = 1;
  }
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.max(1, Math.round(w)),
    h: Math.max(1, Math.round(h)),
  };
}

function drawResizeHandles(ctx, scale, f) {
  const hs = handleHalfWorld(scale) * 2;
  const pts = [
    [f.x, f.y],
    [f.x + f.w / 2, f.y],
    [f.x + f.w, f.y],
    [f.x + f.w, f.y + f.h / 2],
    [f.x + f.w, f.y + f.h],
    [f.x + f.w / 2, f.y + f.h],
    [f.x, f.y + f.h],
    [f.x, f.y + f.h / 2],
  ];
  const half = hs / 2;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#0078d4";
  ctx.lineWidth = 1 / scale;
  for (const [hx, hy] of pts) {
    ctx.fillRect(hx - half, hy - half, hs, hs);
    ctx.strokeRect(
      hx - half + 0.5 / scale,
      hy - half + 0.5 / scale,
      hs - 1 / scale,
      hs - 1 / scale
    );
  }
}

function updateCanvasCursor(world) {
  const el = canvasRef.value;
  if (!el) return;
  const map = {
    nw: "nwse-resize",
    n: "ns-resize",
    ne: "nesw-resize",
    e: "ew-resize",
    se: "nwse-resize",
    s: "ns-resize",
    sw: "nesw-resize",
    w: "ew-resize",
  };
  if (resizePointerId != null && resizeState) {
    el.style.cursor = map[resizeState.handle] || "crosshair";
    return;
  }
  if (
    dragPointerId != null ||
    panPointerId != null ||
    marqueeMode
  ) {
    return;
  }
  if (showSprites.value && selectedIds.value.length === 1) {
    const s = sprites.value.find((x) => x.id === selectedIds.value[0]);
    if (s) {
      const h = hitTestResizeHandle(
        world.x,
        world.y,
        s.frame,
        view.value.scale
      );
      if (h) {
        el.style.cursor = map[h] || "crosshair";
        return;
      }
    }
  }
  el.style.cursor = "";
}

function clampSpriteToSheet(s) {
  store.clampSpriteFrameToSheet(s);
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#e8e8ec";
  ctx.fillRect(0, 0, w, h);

  const { scale, offsetX, offsetY } = view.value;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const step = 32;
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 1 / scale;
  const margin = 2000;
  for (let gx = -margin; gx < margin; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, -margin);
    ctx.lineTo(gx, margin);
    ctx.stroke();
  }
  for (let gy = -margin; gy < margin; gy += step) {
    ctx.beginPath();
    ctx.moveTo(-margin, gy);
    ctx.lineTo(margin, gy);
    ctx.stroke();
  }

  const simg = sheetImg.value;
  const sheetPixelsVisible =
    !!(
      showSheetImage.value &&
      simg &&
      simg.complete &&
      simg.naturalWidth > 0
    );
  if (sheetPixelsVisible) {
    // 缩放 ≥ 1 时用最近邻，放大后保持硬边缘像素；缩小时略开平滑便于总览
    ctx.imageSmoothingEnabled = scale < 1;
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = "high";
    ctx.drawImage(simg, 0, 0);
  }

  {
    const arm = 14;
    ctx.strokeStyle = "rgba(220, 35, 35, 0.95)";
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    ctx.moveTo(-arm, 0);
    ctx.lineTo(arm, 0);
    ctx.moveTo(0, -arm);
    ctx.lineTo(0, arm);
    ctx.stroke();
  }

  if (marqueeMode === "dragging") {
    const mx = Math.min(marqueeStart.x, marqueeEnd.x);
    const my = Math.min(marqueeStart.y, marqueeEnd.y);
    const mw = Math.abs(marqueeEnd.x - marqueeStart.x);
    const mh = Math.abs(marqueeEnd.y - marqueeStart.y);
    ctx.fillStyle = "rgba(0, 120, 215, 0.12)";
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = "#0078d4";
    ctx.lineWidth = 1 / scale;
    ctx.setLineDash([4 / scale, 3 / scale]);
    ctx.strokeRect(mx + 0.5 / scale, my + 0.5 / scale, mw - 1 / scale, mh - 1 / scale);
    ctx.setLineDash([]);
  }

  const useSpriteColorFill = !sheetPixelsVisible;

  if (showSprites.value) {
    for (const s of sprites.value) {
      const { x, y, w, h } = s.frame;
      const sel = isSelected(s.id);
      const ins = s.inset ?? {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      };
      const innerW = w - ins.left - ins.right;
      const innerH = h - ins.top - ins.bottom;
      if (useSpriteColorFill) {
        ctx.fillStyle = hashColor(s.id);
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeStyle = sel ? "#0078d4" : "rgba(0,0,0,0.35)";
      ctx.lineWidth = sel ? 2 / scale : 1 / scale;
      ctx.strokeRect(x + 0.5 / scale, y + 0.5 / scale, w - 1 / scale, h - 1 / scale);

      if (innerW > 0 && innerH > 0) {
        ctx.strokeStyle = sel
          ? "rgba(255, 140, 0, 0.95)"
          : "rgba(200, 100, 0, 0.65)";
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([5 / scale, 4 / scale]);
        ctx.strokeRect(
          x + ins.left + 0.5 / scale,
          y + ins.top + 0.5 / scale,
          innerW - 1 / scale,
          innerH - 1 / scale
        );
        ctx.setLineDash([]);
      }

      const piv = s.pivot ?? { x: 0, y: 0 };
      const px = x + piv.x;
      const py = y + piv.y;
      const pr = 5 / scale;
      ctx.strokeStyle = sel ? "#ff6600" : "rgba(200, 80, 0, 0.85)";
      ctx.lineWidth = 1.25 / scale;
      ctx.beginPath();
      ctx.moveTo(px - pr, py);
      ctx.lineTo(px + pr, py);
      ctx.moveTo(px, py - pr);
      ctx.lineTo(px, py + pr);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 2.2 / scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (showSprites.value && selectedIds.value.length === 1) {
    const sid = selectedIds.value[0];
    const sel = sprites.value.find((x) => x.id === sid);
    if (sel) drawResizeHandles(ctx, scale, sel.frame);
  }
}

function onContextMenu(ev) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;
  const world = screenToWorld(cx, cy);
  const hit = hitTest(world.x, world.y);
  if (hit && !store.isSelected(hit.id)) {
    store.setSelection([hit.id]);
  }
  window.dispatchEvent(
    new CustomEvent(SPRITE_MENU_OPEN, {
      detail: { x: ev.clientX, y: ev.clientY },
    })
  );
}

function onWheel(ev) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;
  const factor = ev.deltaY < 0 ? 1.1 : 1 / 1.1;
  store.zoomAt(cx, cy, factor);
}

function onPointerDown(ev) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (ev.button === 1) ev.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const cx = ev.clientX - rect.left;
  const cy = ev.clientY - rect.top;
  const world = screenToWorld(cx, cy);

  const wantPan =
    ev.button === 1 || (ev.button === 0 && spaceDown.value);

  if (wantPan) {
    isPanning.value = true;
    panPointerId = ev.pointerId;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
    canvas.setPointerCapture(ev.pointerId);
    return;
  }

  if (ev.button === 0) {
    if (showSprites.value && selectedIds.value.length === 1) {
      const sid = selectedIds.value[0];
      const selSpr = sprites.value.find((x) => x.id === sid);
      if (selSpr) {
        const h = hitTestResizeHandle(
          world.x,
          world.y,
          selSpr.frame,
          view.value.scale
        );
        if (h) {
          const { x, y, w, h: hh } = selSpr.frame;
          resizeState = {
            handle: h,
            snap: { x, y, w, h: hh },
            startWx: world.x,
            startWy: world.y,
            spriteId: sid,
          };
          resizePointerId = ev.pointerId;
          canvas.setPointerCapture(ev.pointerId);
          return;
        }
      }
    }

    const hit = hitTest(world.x, world.y);
    if (hit) {
      /** 本次按下前，被点的精灵是否已在选中集中（用于避免「首次点选就拖动」误操作） */
      const wasHitAlreadySelected = store.isSelected(hit.id);

      if (ev.shiftKey) {
        store.addToSelection([hit.id]);
      } else if (ev.ctrlKey || ev.metaKey) {
        store.toggleSelection(hit.id);
      } else {
        if (!wasHitAlreadySelected) {
          store.setSelection([hit.id]);
        }
      }
      if (!store.isSelected(hit.id)) {
        return;
      }
      if (!wasHitAlreadySelected) {
        return;
      }
      groupDragIds = [...store.selectedIds];
      dragSnapshots = new Map();
      for (const id of groupDragIds) {
        const s = sprites.value.find((x) => x.id === id);
        if (s) {
          dragSnapshots.set(id, { x: s.frame.x, y: s.frame.y });
        }
      }
      dragPointerId = ev.pointerId;
      dragStartWorldX = world.x;
      dragStartWorldY = world.y;
      canvas.setPointerCapture(ev.pointerId);
    } else {
      marqueePointerId = ev.pointerId;
      marqueeStart = { x: world.x, y: world.y };
      marqueeEnd = { x: world.x, y: world.y };
      marqueeMode = "candidate";
      canvas.setPointerCapture(ev.pointerId);
    }
  }
}

function onPointerMove(ev) {
  const canvas = canvasRef.value;
  if (!canvas) return;
  updateCanvasPointerTracking(ev);

  const rectHud = canvas.getBoundingClientRect();
  const cxHud = ev.clientX - rectHud.left;
  const cyHud = ev.clientY - rectHud.top;
  const worldHud = screenToWorld(cxHud, cyHud);
  updateCanvasCursor(worldHud);

  if (resizePointerId === ev.pointerId && resizeState) {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const world = screenToWorld(cx, cy);
    const dx = world.x - resizeState.startWx;
    const dy = world.y - resizeState.startWy;
    const s = sprites.value.find((x) => x.id === resizeState.spriteId);
    if (s) {
      const nf = computeResizedFrame(
        resizeState.snap,
        resizeState.handle,
        dx,
        dy
      );
      s.frame.x = nf.x;
      s.frame.y = nf.y;
      s.frame.w = nf.w;
      s.frame.h = nf.h;
      clampSpriteToSheet(s);
      ensureSpriteGeometry(s);
    }
    return;
  }

  if (panPointerId === ev.pointerId && isPanning.value) {
    const dx = ev.clientX - lastPanX;
    const dy = ev.clientY - lastPanY;
    lastPanX = ev.clientX;
    lastPanY = ev.clientY;
    store.setView({
      offsetX: view.value.offsetX + dx,
      offsetY: view.value.offsetY + dy,
    });
    return;
  }

  if (marqueePointerId === ev.pointerId && marqueeMode) {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    marqueeEnd = screenToWorld(cx, cy);
    const dx = marqueeEnd.x - marqueeStart.x;
    const dy = marqueeEnd.y - marqueeStart.y;
    if (marqueeMode === "candidate" && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      marqueeMode = "dragging";
    }
    draw();
    return;
  }

  if (dragPointerId === ev.pointerId && groupDragIds && dragSnapshots) {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const world = screenToWorld(cx, cy);
    const ddx = world.x - dragStartWorldX;
    const ddy = world.y - dragStartWorldY;
    for (const id of groupDragIds) {
      const s = sprites.value.find((x) => x.id === id);
      const snap = dragSnapshots.get(id);
      if (s && snap) {
        s.frame.x = snap.x + ddx;
        s.frame.y = snap.y + ddy;
        clampSpriteToSheet(s);
      }
    }
  }
}

function onPointerUp(ev) {
  const canvas = canvasRef.value;

  if (marqueePointerId === ev.pointerId) {
    if (marqueeMode === "dragging") {
      store.selectByMarquee(
        marqueeStart.x,
        marqueeStart.y,
        marqueeEnd.x,
        marqueeEnd.y,
        ev.shiftKey
      );
    } else if (marqueeMode === "candidate" && !ev.shiftKey) {
      store.clearSelection();
    }
    marqueeMode = null;
    marqueePointerId = null;
    canvas?.releasePointerCapture(ev.pointerId);
    draw();
  }

  if (panPointerId === ev.pointerId) {
    isPanning.value = false;
    panPointerId = null;
    canvas?.releasePointerCapture(ev.pointerId);
  }
  if (resizePointerId === ev.pointerId) {
    resizePointerId = null;
    resizeState = null;
    canvas?.releasePointerCapture(ev.pointerId);
    draw();
  }
  if (dragPointerId === ev.pointerId) {
    groupDragIds = null;
    dragSnapshots = null;
    dragPointerId = null;
    canvas?.releasePointerCapture(ev.pointerId);
  }
}

function onFitView() {
  const wrap = wrapRef.value;
  if (!wrap) return;
  store.fitToRect(wrap.clientWidth, wrap.clientHeight);
}

/** @param {CustomEvent<{ spriteId: string }>} ev */
function onFocusSprite(ev) {
  const id = ev.detail?.spriteId;
  if (!id) return;
  const s = sprites.value.find((x) => x.id === id);
  const wrap = wrapRef.value;
  if (!s || !wrap) return;
  const cw = wrap.clientWidth;
  const ch = wrap.clientHeight;
  const { scale } = view.value;
  const cxWorld = s.frame.x + s.frame.w / 2;
  const cyWorld = s.frame.y + s.frame.h / 2;
  store.setView({
    offsetX: cw / 2 - cxWorld * scale,
    offsetY: ch / 2 - cyWorld * scale,
  });
  draw();
}

function onKeyDown(e) {
  if (e.code === "Space" && !spaceDown.value) {
    spaceDown.value = true;
    e.preventDefault();
  }
}

function onKeyUp(e) {
  if (e.code === "Space") {
    spaceDown.value = false;
  }
}

let ro;
onMounted(() => {
  resize();
  ro = new ResizeObserver(() => resize());
  if (wrapRef.value) ro.observe(wrapRef.value);
  window.addEventListener("sprite2d-fit-view", onFitView);
  window.addEventListener(SPRITE_FOCUS, onFocusSprite);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onUnmounted(() => {
  ro?.disconnect();
  window.removeEventListener("sprite2d-fit-view", onFitView);
  window.removeEventListener(SPRITE_FOCUS, onFocusSprite);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
});

watch(
  view,
  () => {
    const p = pointerCss.value;
    if (!p) return;
    const w = screenToWorld(p.cx, p.cy);
    store.setCanvasPointerHint(true, w.x, w.y);
  },
  { deep: true }
);

watch(
  () => sheetImageDataUrl.value,
  (url) => {
    if (!url) {
      sheetImg.value = null;
      draw();
      return;
    }
    const im = new Image();
    im.onload = () => {
      sheetImg.value = im;
      draw();
    };
    im.onerror = () => {
      sheetImg.value = null;
      draw();
    };
    im.src = url;
  },
  { immediate: true }
);

watch(
  [sprites, view, selectedIds, showSprites, showSheetImage],
  () => draw(),
  { deep: true }
);

watch(
  () => sprites.value.length,
  () => {
    resize();
  }
);
</script>

<style scoped>
.canvas-coords-hud {
  position: absolute;
  left: 8px;
  bottom: 6px;
  z-index: 2;
  pointer-events: none;
  font-size: 11px;
  line-height: 1.2;
  font-family: var(--win-font, system-ui, sans-serif);
  color: var(--win-text, #1a1a1a);
  background: color-mix(in srgb, var(--win-bar, #f9f9f9) 88%, transparent);
  border: 1px solid var(--win-border, #c0c0c0);
  border-radius: 2px;
  padding: 3px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  user-select: none;
  min-width: 4.5em;
  text-align: center;
}
</style>
