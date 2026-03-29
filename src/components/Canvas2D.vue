<template>
  <div ref="wrapRef" class="win-canvas-wrap">
    <canvas
      ref="canvasRef"
      :class="{ panning: isPanning }"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useProjectStore } from "../stores/project.js";
import { hashColor } from "../lib/compileAtlas.js";

const store = useProjectStore();
const {
  sprites,
  view,
  selectedIds,
  sheetImageDataUrl,
  sheetWidth,
  sheetHeight,
} = storeToRefs(store);

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

const spaceDown = ref(false);

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

function clampSpriteToSheet(s) {
  const sw = sheetWidth.value;
  const sh = sheetHeight.value;
  if (!(sw > 0 && sh > 0)) return;
  const f = s.frame;
  f.w = Math.min(f.w, sw);
  f.h = Math.min(f.h, sh);
  f.x = Math.max(0, Math.min(f.x, sw - f.w));
  f.y = Math.max(0, Math.min(f.y, sh - f.h));
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
  if (simg && simg.complete && simg.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(simg, 0, 0);
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

  const hasSheet = !!(simg && simg.complete && simg.naturalWidth > 0);
  for (const s of sprites.value) {
    const { x, y, w, h } = s.frame;
    const sel = isSelected(s.id);
    if (hasSheet) {
      ctx.fillStyle = sel
        ? "rgba(0, 120, 215, 0.22)"
        : "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.fillStyle = hashColor(s.id);
      ctx.fillRect(x, y, w, h);
    }
    ctx.strokeStyle = sel ? "#0078d4" : "rgba(0,0,0,0.35)";
    ctx.lineWidth = sel ? 2 / scale : 1 / scale;
    ctx.strokeRect(x + 0.5 / scale, y + 0.5 / scale, w - 1 / scale, h - 1 / scale);
  }
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
    const hit = hitTest(world.x, world.y);
    if (hit) {
      if (ev.shiftKey) {
        store.addToSelection([hit.id]);
      } else if (ev.ctrlKey || ev.metaKey) {
        store.toggleSelection(hit.id);
      } else {
        if (!store.isSelected(hit.id)) {
          store.setSelection([hit.id]);
        }
      }
      if (!store.isSelected(hit.id)) {
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
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
});

onUnmounted(() => {
  ro?.disconnect();
  window.removeEventListener("sprite2d-fit-view", onFitView);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
});

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

watch([sprites, view, selectedIds], () => draw(), { deep: true });

watch(
  () => sprites.value.length,
  () => {
    resize();
  }
);
</script>
