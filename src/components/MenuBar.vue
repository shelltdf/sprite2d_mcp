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
import { computed, onMounted, onUnmounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";
import { persistLocale } from "../i18n/index.js";
import {
  buildSpriteMenuItems,
  buildAnimationMenuItems,
  buildSheetMenuItems,
} from "../menu/appMenus.js";

const { locale, t } = useI18n();
const store = useProjectStore();
const ui = useUiStore();
const { themeMode } = storeToRefs(ui);

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

function setLocale(code) {
  locale.value = code;
  persistLocale(code);
}

function themeLabel(mode) {
  const prefix = themeMode.value === mode ? "✓ " : "";
  const key =
    mode === "system"
      ? "menu.themeSystem"
      : mode === "light"
        ? "menu.themeLight"
        : "menu.themeDark";
  return prefix + t(key);
}

async function onFile(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  try {
    const text = await f.text();
    store.loadProjectFromText(text);
  } catch (e) {
    store.setStatus(t("status.openFailed", { msg: e?.message || e }));
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
      store.setStatus(t("status.atlasCancelled"));
    }
    return;
  }
  await store.importAtlas(jsonFile, f);
}

const menus = computed(() => {
  void locale.value;
  void themeMode.value;
  return [
    {
      id: "file",
      label: t("menu.file"),
      items: [
        { key: "new", label: t("menu.fileNew"), action: () => store.newProject() },
        { key: "open", label: t("menu.fileOpen"), action: openFilePicker },
        {
          key: "save",
          label: t("menu.fileSave"),
          action: () => store.saveProjectFile(),
        },
        {
          key: "importAtlas",
          label: t("menu.importAtlas"),
          action: openAtlasImport,
        },
        {
          key: "export",
          label: t("menu.exportAtlas"),
          action: () => store.exportAtlas(),
          disabled: () => store.sprites.length === 0,
        },
      ],
    },
    {
      id: "sheet",
      label: t("menu.sheet"),
      items: buildSheetMenuItems(store, openSheetPicker, t),
    },
    {
      id: "sprite",
      label: t("menu.sprite"),
      items: buildSpriteMenuItems(store, t),
    },
    {
      id: "anim",
      label: t("menu.animation"),
      items: buildAnimationMenuItems(store, t),
    },
    {
      id: "view",
      label: t("menu.view"),
      items: [
        {
          key: "fit",
          label: t("menu.viewFit"),
          action: () =>
            window.dispatchEvent(new CustomEvent("sprite2d-fit-view")),
        },
        {
          key: "zin",
          label: t("menu.viewZoomIn"),
          action: () =>
            store.setView({ scale: Math.min(8, store.view.scale * 1.15) }),
        },
        {
          key: "zout",
          label: t("menu.viewZoomOut"),
          action: () =>
            store.setView({ scale: Math.max(0.1, store.view.scale / 1.15) }),
        },
      ],
    },
    {
      id: "theme",
      label: t("menu.theme"),
      items: [
        {
          key: "th-sys",
          label: themeLabel("system"),
          action: () => ui.setThemeMode("system"),
        },
        {
          key: "th-light",
          label: themeLabel("light"),
          action: () => ui.setThemeMode("light"),
        },
        {
          key: "th-dark",
          label: themeLabel("dark"),
          action: () => ui.setThemeMode("dark"),
        },
      ],
    },
    {
      id: "language",
      label: t("menu.language"),
      items: [
        {
          key: "lang-zh",
          label:
            (locale.value === "zh-CN" ? "✓ " : "") + t("menu.langZh"),
          action: () => setLocale("zh-CN"),
        },
        {
          key: "lang-en",
          label:
            (locale.value === "en-US" ? "✓ " : "") + t("menu.langEn"),
          action: () => setLocale("en-US"),
        },
      ],
    },
    {
      id: "help",
      label: t("menu.help"),
      items: [
        {
          key: "about",
          label: t("menu.helpAbout"),
          action: () => store.setStatus(t("menu.helpAboutText")),
        },
      ],
    },
  ];
});

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
  background: linear-gradient(
    to bottom,
    var(--win-menu-top-from, #fdfdfd),
    var(--win-menu-top-to, #f0f0f0)
  );
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
  color: var(--win-text, inherit);
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
  background: var(--win-ctx-bg, #fff);
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
  background: var(--win-ctx-bg, #fff);
  font: inherit;
  color: var(--win-text, inherit);
  cursor: default;
}

.menu-item:hover:not(:disabled) {
  background: var(--win-active, #cce8ff);
}

.menu-item:disabled {
  opacity: 0.45;
}

.hidden-file {
  display: none;
}
</style>
