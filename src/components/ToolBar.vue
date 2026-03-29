<template>
  <div class="tool-bar" role="toolbar">
    <button type="button" class="tb-btn" title="新建工程" @click="store.newProject()">
      新建
    </button>
    <button type="button" class="tb-btn" title="添加精灵" @click="store.addSprite()">
      添加精灵
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn"
      title="导出图集"
      :disabled="store.sprites.length === 0"
      @click="store.exportAtlas()"
    >
      导出图集
    </button>
    <button
      type="button"
      class="tb-btn"
      title="适应窗口"
      @click="fit"
    >
      适应窗口
    </button>
  </div>
</template>

<script setup>
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();

function fit() {
  window.dispatchEvent(new CustomEvent("sprite2d-fit-view"));
}
</script>

<style scoped>
.tool-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 34px;
  padding: 0 8px;
  background: linear-gradient(to bottom, #f7f7f7, #ececec);
  border-bottom: 1px solid var(--win-border, #d0d0d0);
}

.tb-btn {
  height: 24px;
  padding: 0 10px;
  border: 1px solid #b8b8b8;
  border-radius: 2px;
  background: linear-gradient(to bottom, #fff, #f0f0f0);
  font: inherit;
  font-size: 12px;
  cursor: default;
}

.tb-btn:hover:not(:disabled) {
  border-color: #7eb4ea;
  background: linear-gradient(to bottom, #fff, #e5f1fb);
}

.tb-btn:disabled {
  opacity: 0.45;
}

.tb-sep {
  width: 1px;
  height: 20px;
  background: #c0c0c0;
  margin: 0 4px;
}
</style>
