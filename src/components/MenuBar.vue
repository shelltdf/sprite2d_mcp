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
    <input
      ref="sheetFileRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
      class="hidden-file"
      @change="onSheetFile"
    >
    <input
      ref="atlasJsonRef"
      type="file"
      accept=".json,application/json"
      class="hidden-file"
      @change="onAtlasJson"
    >
    <input
      ref="atlasImageRef"
      type="file"
      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
      class="hidden-file"
      @change="onAtlasImage"
    >
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();
const openId = ref(null);
const fileRef = ref(null);
const sheetFileRef = ref(null);
const atlasJsonRef = ref(null);
const atlasImageRef = ref(null);

/** @type {import('vue').Ref<File | null>} */
const pendingAtlasJsonFile = ref(null);

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

function openSheetPicker() {
  sheetFileRef.value?.click();
}

function openAtlasImport() {
  pendingAtlasJsonFile.value = null;
  atlasJsonRef.value?.click();
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

async function onSheetFile(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  await store.setSpriteSheetImage(f);
}

async function onAtlasJson(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  pendingAtlasJsonFile.value = f;
  atlasImageRef.value?.click();
}

async function onAtlasImage(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  const jsonFile = pendingAtlasJsonFile.value;
  pendingAtlasJsonFile.value = null;
  if (!f || !jsonFile) {
    if (!f && jsonFile) {
      store.setStatus("已取消：请选择图集 PNG 图片");
    }
    return;
  }
  await store.importAtlas(jsonFile, f);
}

const menus = [
  {
    id: "file",
    label: "文件(F)",
    items: [
      { key: "new", label: "新建工程", action: () => store.newProject() },
      { key: "open", label: "打开工程…", action: openFilePicker },
      {
        key: "setSheet",
        label: "设置精灵表图片…",
        action: openSheetPicker,
      },
      { key: "save", label: "保存工程…", action: () => store.saveProjectFile() },
      {
        key: "importAtlas",
        label: "导入图集…",
        action: openAtlasImport,
      },
      {
        key: "export",
        label: "导出图集…",
        action: () => store.exportAtlas(),
        disabled: () => store.sprites.length === 0,
      },
    ],
  },
  {
    id: "sprite",
    label: "精灵(S)",
    items: [
      { key: "add", label: "添加精灵", action: () => store.addSprite() },
      {
        key: "selectAll",
        label: "全选",
        action: () => store.selectAllSprites(),
        disabled: () => store.sprites.length === 0,
      },
      {
        key: "copy",
        label: "复制",
        action: () => store.copySelection(),
        disabled: () => store.selectedIds.length === 0,
      },
      {
        key: "paste",
        label: "粘贴",
        action: () => store.pasteSprites(),
        disabled: () => store.spriteClipboard.length === 0,
      },
      {
        key: "delete",
        label: "删除",
        action: () => store.deleteSelection(),
        disabled: () => store.selectedIds.length === 0,
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
          store.setStatus(
            "Sprite2D — 精灵表与图集工具（精灵表 = 源图，图集 = 导出打包）"
          ),
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
  min-width: 200px;
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
