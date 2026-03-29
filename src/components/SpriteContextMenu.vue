<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="ctx-overlay"
      @mousedown="onOverlayDown"
    >
      <div
        ref="panelRef"
        class="ctx-panel"
        role="menu"
        :style="panelStyle"
        @mousedown.stop
      >
        <div class="ctx-title">{{ t("menu.ctxSprite") }}</div>
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="ctx-item"
          role="menuitem"
          :disabled="item.disabled?.()"
          @click="run(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";
import { buildSpriteMenuItems } from "../menu/appMenus.js";
import { SPRITE_MENU_OPEN } from "../menu/events.js";

const { t } = useI18n();
const store = useProjectStore();
const visible = ref(false);
const x = ref(0);
const y = ref(0);
const panelRef = ref(null);

const items = computed(() => buildSpriteMenuItems(store, t));

const panelStyle = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
}));

function run(item) {
  if (item.disabled?.()) return;
  item.action();
  close();
}

function close() {
  visible.value = false;
}

function onOverlayDown(ev) {
  if (ev.target === ev.currentTarget) close();
}

function onOpen(ev) {
  const d = ev.detail;
  if (typeof d?.x !== "number" || typeof d?.y !== "number") return;
  x.value = d.x;
  y.value = d.y;
  visible.value = true;
  nextTick(() => {
    const el = panelRef.value;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 4;
    let nx = x.value;
    let ny = y.value;
    if (nx + r.width > window.innerWidth - pad) {
      nx = Math.max(pad, window.innerWidth - r.width - pad);
    }
    if (ny + r.height > window.innerHeight - pad) {
      ny = Math.max(pad, window.innerHeight - r.height - pad);
    }
    x.value = nx;
    y.value = ny;
  });
}

function onKey(ev) {
  if (ev.key === "Escape") close();
}

onMounted(() => {
  window.addEventListener(SPRITE_MENU_OPEN, onOpen);
  window.addEventListener("keydown", onKey);
  window.addEventListener("blur", close);
});

onUnmounted(() => {
  window.removeEventListener(SPRITE_MENU_OPEN, onOpen);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("blur", close);
});
</script>

<style scoped>
.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: transparent;
}

.ctx-panel {
  position: fixed;
  min-width: 180px;
  background: var(--win-ctx-bg, #fff);
  border: 1px solid var(--win-border, #d0d0d0);
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.18);
  padding: 2px 0 4px;
  z-index: 10001;
}

.ctx-title {
  padding: 4px 12px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid #eee;
  margin-bottom: 2px;
}

.ctx-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 16px 6px 12px;
  border: none;
  background: var(--win-ctx-bg, #fff);
  color: var(--win-text, inherit);
  font: inherit;
  font-size: 13px;
  cursor: default;
}

.ctx-item:hover:not(:disabled) {
  background: var(--win-active, #cce8ff);
}

.ctx-item:disabled {
  color: #aaa;
}
</style>
