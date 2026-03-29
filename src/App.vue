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
import MenuBar from "./components/MenuBar.vue";
import ToolBar from "./components/ToolBar.vue";
import SpriteListPanel from "./components/SpriteListPanel.vue";
import Canvas2D from "./components/Canvas2D.vue";
import PropertyPanel from "./components/PropertyPanel.vue";
import StatusBar from "./components/StatusBar.vue";
</script>
