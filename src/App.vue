<template>
  <div class="win-app">
    <MenuBar />
    <ToolBar />
    <div class="win-main">
      <SpriteListPanel />
      <Canvas2D />
      <PropertyPanel />
    </div>
    <StatusBar />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import MenuBar from "./components/MenuBar.vue";
import ToolBar from "./components/ToolBar.vue";
import SpriteListPanel from "./components/SpriteListPanel.vue";
import Canvas2D from "./components/Canvas2D.vue";
import PropertyPanel from "./components/PropertyPanel.vue";
import StatusBar from "./components/StatusBar.vue";
import { useProjectStore } from "./stores/project.js";

const store = useProjectStore();

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
    store.deleteSelection();
  }
}

onMounted(() => window.addEventListener("keydown", hotkey));
onUnmounted(() => window.removeEventListener("keydown", hotkey));
</script>
