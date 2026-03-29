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
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipNew')"
      @click="store.newProject()"
    >
      {{ t("toolbar.new") }}
    </button>
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipAdd')"
      @click="store.addSprite()"
    >
      {{ t("toolbar.addSprite") }}
    </button>
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipSheet')"
      @click="pickSheet"
    >
      {{ t("toolbar.setSheet") }}
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipImport')"
      @click="pickAtlasJson"
    >
      {{ t("toolbar.importAtlas") }}
    </button>
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipExport')"
      :disabled="store.sprites.length === 0"
      @click="store.exportAtlas()"
    >
      {{ t("toolbar.exportAtlas") }}
    </button>
    <button
      type="button"
      class="tb-btn"
      :title="t('toolbar.tipFit')"
      @click="fit"
    >
      {{ t("toolbar.fit") }}
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-on': ui.showSprites }"
      :title="t('toolbar.tipToggleSprites')"
      :aria-pressed="ui.showSprites"
      @click="ui.toggleShowSprites()"
    >
      {{ ui.showSprites ? t("toolbar.hideSprites") : t("toolbar.showSprites") }}
    </button>
    <button
      type="button"
      class="tb-btn"
      :class="{ 'tb-on': ui.showSheetImage }"
      :title="t('toolbar.tipToggleSheet')"
      :aria-pressed="ui.showSheetImage"
      @click="ui.toggleShowSheetImage()"
    >
      {{
        ui.showSheetImage
          ? t("toolbar.hideSheetPixels")
          : t("toolbar.showSheetPixels")
      }}
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";
import { useUiStore } from "../stores/ui.js";

const { t } = useI18n();
const store = useProjectStore();
const ui = useUiStore();
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
      store.setStatus(t("status.atlasCancelled"));
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
  background: linear-gradient(
    to bottom,
    var(--win-tool-from, #f7f7f7),
    var(--win-tool-to, #ececec)
  );
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
  color: var(--win-text, inherit);
  cursor: default;
}

.tb-btn:hover:not(:disabled) {
  border-color: #7eb4ea;
  background: linear-gradient(to bottom, #fff, #e5f1fb);
}

.tb-btn:disabled {
  opacity: 0.45;
}

.tb-btn.tb-on {
  border-color: #7eb4ea;
  background: linear-gradient(to bottom, #e8f4ff, #d4e9fc);
}

.tb-sep {
  width: 1px;
  height: 20px;
  background: var(--win-border, #c0c0c0);
  margin: 0 4px;
}

.hidden-file {
  display: none;
}
</style>
