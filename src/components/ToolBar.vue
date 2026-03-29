<template>
  <div class="tool-bar" role="toolbar">
    <input
      ref="sheetInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
      class="hidden-file"
      @change="onSheet"
    >
    <input
      ref="atlasJsonInput"
      type="file"
      accept=".json,application/json"
      class="hidden-file"
      @change="onAtlasJson"
    >
    <input
      ref="atlasImageInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
      class="hidden-file"
      @change="onAtlasImage"
    >
    <button type="button" class="tb-btn" title="新建工程" @click="store.newProject()">
      新建
    </button>
    <button type="button" class="tb-btn" title="添加精灵" @click="store.addSprite()">
      添加精灵
    </button>
    <button
      type="button"
      class="tb-btn"
      title="选择 PNG/JPEG 等作为精灵表（源图）底图"
      @click="pickSheet"
    >
      设置精灵表图片
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn"
      title="先选 atlas.json，再选 atlas.png"
      @click="pickAtlasJson"
    >
      导入图集
    </button>
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
import { ref } from "vue";
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();
const sheetInput = ref(null);
const atlasJsonInput = ref(null);
const atlasImageInput = ref(null);
const pendingAtlasJson = ref(/** @type {File | null} */ (null));

function pickSheet() {
  sheetInput.value?.click();
}

async function onSheet(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  await store.setSpriteSheetImage(f);
}

function pickAtlasJson() {
  pendingAtlasJson.value = null;
  atlasJsonInput.value?.click();
}

function onAtlasJson(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  pendingAtlasJson.value = f;
  atlasImageInput.value?.click();
}

async function onAtlasImage(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  const jf = pendingAtlasJson.value;
  pendingAtlasJson.value = null;
  if (!f || !jf) {
    if (!f && jf) {
      store.setStatus("已取消：请选择图集 PNG 图片");
    }
    return;
  }
  await store.importAtlas(jf, f);
}

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

.hidden-file {
  display: none;
}
</style>
