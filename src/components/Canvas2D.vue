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
const { sprites, view, selectedId } = storeToRefs(store);

const wrapRef = ref(null);
const canvasRef = ref(null);
let dpr = 1;

const isPanning = ref(false);
let panPointerId = null;
let dragPointerId = null;
let lastPanX = 0;
let lastPanY = 0;
/** @type {string | null} */
let dragSpriteId = null;
let dragStartWorldX = 0;
let dragStartWorldY = 0;
let spriteStartX = 0;
let spriteStartY = 0;

const spaceDown = ref(false);

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

  for (const s of sprites.value) {
    const { x, y, w, h } = s.frame;
    ctx.fillStyle = hashColor(s.id);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle =
      s.id === selectedId.value ? "#0078d4" : "rgba(0,0,0,0.25)";
    ctx.lineWidth = s.id === selectedId.value ? 2 / scale : 1 / scale;
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
      store.select(hit.id);
      dragSpriteId = hit.id;
      dragPointerId = ev.pointerId;
      dragStartWorldX = world.x;
      dragStartWorldY = world.y;
      spriteStartX = hit.frame.x;
      spriteStartY = hit.frame.y;
      canvas.setPointerCapture(ev.pointerId);
    } else {
      store.select(null);
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

  if (dragPointerId === ev.pointerId && dragSpriteId) {
    const rect = canvas.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const world = screenToWorld(cx, cy);
    const s = sprites.value.find((x) => x.id === dragSpriteId);
    if (s) {
      s.frame.x = spriteStartX + (world.x - dragStartWorldX);
      s.frame.y = spriteStartY + (world.y - dragStartWorldY);
    }
  }
}

function onPointerUp(ev) {
  const canvas = canvasRef.value;
  if (panPointerId === ev.pointerId) {
    isPanning.value = false;
    panPointerId = null;
    canvas?.releasePointerCapture(ev.pointerId);
  }
  if (dragPointerId === ev.pointerId) {
    dragSpriteId = null;
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

watch([sprites, view, selectedId], () => draw(), { deep: true });

watch(
  () => sprites.value.length,
  () => {
    resize();
  }
);
</script>
