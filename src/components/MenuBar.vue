<template>
  <header class="menu-bar" @keydown.escape.window="closeAll">
    <div
      v-for="m in menus"
      :key="m.id"
      class="menu-root"
    >
      <button
        type="button"
        class="menu-top"
        :class="{ open: openId === m.id }"
        @mousedown.prevent
        @click="toggle(m.id)"
      >
        {{ m.label }}
      </button>
      <div
        v-if="openId === m.id"
        class="menu-drop"
        role="menu"
      >
        <button
          v-for="item in m.items"
          :key="item.key"
          type="button"
          class="menu-item"
          :disabled="item.disabled?.()"
          role="menuitem"
          @click="run(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <input
      ref="fileRef"
      type="file"
      accept=".json,application/json"
      class="hidden-file"
      @change="onFile"
    >
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();
const openId = ref(null);
const fileRef = ref(null);

function closeAll() {
  openId.value = null;
}

function toggle(id) {
  openId.value = openId.value === id ? null : id;
}

function run(item) {
  closeAll();
  item.action();
}

function openFilePicker() {
  fileRef.value?.click();
}

async function onFile(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  try {
    const text = await f.text();
    store.loadProjectFromText(text);
  } catch (e) {
    store.setStatus(`打开失败: ${e?.message || e}`);
  }
}

const menus = [
  {
    id: "file",
    label: "文件(F)",
    items: [
      { key: "new", label: "新建工程", action: () => store.newProject() },
      { key: "open", label: "打开工程…", action: openFilePicker },
      { key: "save", label: "保存工程…", action: () => store.saveProjectFile() },
      {
        key: "export",
        label: "导出图集…",
        action: () => store.exportAtlas(),
        disabled: () => store.sprites.length === 0,
      },
    ],
  },
  {
    id: "edit",
    label: "编辑(E)",
    items: [
      {
        key: "add",
        label: "添加精灵",
        action: () => store.addSprite(),
      },
    ],
  },
  {
    id: "view",
    label: "视图(V)",
    items: [
      {
        key: "fit",
        label: "适应窗口",
        action: () => window.dispatchEvent(new CustomEvent("sprite2d-fit-view")),
      },
      {
        key: "zin",
        label: "放大",
        action: () =>
          store.setView({ scale: Math.min(8, store.view.scale * 1.15) }),
      },
      {
        key: "zout",
        label: "缩小",
        action: () =>
          store.setView({ scale: Math.max(0.1, store.view.scale / 1.15) }),
      },
    ],
  },
  {
    id: "help",
    label: "帮助(H)",
    items: [
      {
        key: "about",
        label: "关于 Sprite2D",
        action: () =>
          store.setStatus("Sprite2D 精灵表编译工具 v0.1 — Vue + Canvas"),
      },
    ],
  },
];

function onDocClick(e) {
  if (!e.target.closest(".menu-bar")) closeAll();
}

onMounted(() => document.addEventListener("click", onDocClick));
onUnmounted(() => document.removeEventListener("click", onDocClick));
</script>

<style scoped>
.menu-bar {
  display: flex;
  align-items: stretch;
  height: 28px;
  background: linear-gradient(to bottom, #fdfdfd, #f0f0f0);
  border-bottom: 1px solid var(--win-border, #d0d0d0);
  padding: 0 4px;
  gap: 0;
  position: relative;
  z-index: 50;
}

.menu-root {
  position: relative;
}

.menu-top {
  height: 100%;
  padding: 0 10px;
  border: none;
  background: transparent;
  font: inherit;
  cursor: default;
}

.menu-top:hover,
.menu-top.open {
  background: var(--win-hover, #e5f3ff);
}

.menu-drop {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background: #fff;
  border: 1px solid var(--win-border, #d0d0d0);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.12);
  padding: 2px 0;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 6px 24px 6px 12px;
  border: none;
  background: #fff;
  font: inherit;
  cursor: default;
}

.menu-item:hover:not(:disabled) {
  background: var(--win-active, #cce8ff);
}

.menu-item:disabled {
  color: #aaa;
}

.hidden-file {
  display: none;
}
</style>
