<template>
  <div class="win-app">
    <MenuBar />
    <ToolBar />
    <div class="win-main">
      <LeftDock />
      <div class="win-center-column">
        <Canvas2D />
        <AnimationTimelineDock />
      </div>
      <PropertyPanel />
    </div>
    <StatusBar />
    <SpriteContextMenu />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import MenuBar from "./components/MenuBar.vue";
import ToolBar from "./components/ToolBar.vue";
import LeftDock from "./components/LeftDock.vue";
import Canvas2D from "./components/Canvas2D.vue";
import AnimationTimelineDock from "./components/AnimationTimelineDock.vue";
import PropertyPanel from "./components/PropertyPanel.vue";
import StatusBar from "./components/StatusBar.vue";
import SpriteContextMenu from "./components/SpriteContextMenu.vue";
import { useProjectStore } from "./stores/project.js";

const store = useProjectStore();
const { locale, t } = useI18n();

watch(
  locale,
  (l) => {
    document.documentElement.lang = l === "zh-CN" ? "zh-CN" : "en-US";
    document.title = t("app.title");
    store.syncSelectionStatus();
  },
  { immediate: true }
);

function hotkey(e) {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) return;
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      store.copySelection();
    }
    if (e.key === "v" || e.key === "V") {
      e.preventDefault();
      store.pasteSprites();
    }
    if (e.key === "a" || e.key === "A") {
      e.preventDefault();
      store.selectAllSprites();
    }
  }
  if (e.key === "Delete") {
    e.preventDefault();
    if (store.selectedAnimationId) store.deleteSelectedAnimation();
    else store.deleteSelection();
  }
}

onMounted(() => window.addEventListener("keydown", hotkey));
onUnmounted(() => window.removeEventListener("keydown", hotkey));
</script>
