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
      accept=".json,.xml,application/json,text/xml,application/xml"
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
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipNew')"
      :aria-label="t('toolbar.new')"
      @click="store.newProject()"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"
        />
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          d="M12 11v6 M9 14h6"
        />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipAdd')"
      :aria-label="t('toolbar.addSprite')"
      @click="store.addSprite()"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          d="M12 8v8 M8 12h8"
        />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipSheet')"
      :aria-label="t('toolbar.setSheet')"
      @click="pickSheet"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <circle cx="8.5" cy="10" r="1.25" fill="currentColor" />
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 17l5-5 4 4 5-6 4 4"
        />
      </svg>
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipImport')"
      :aria-label="t('toolbar.importAtlas')"
      @click="pickAtlasJson"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 11V3 M8 7l4-4 4 4 M4 15h16v5H4z"
        />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipExport')"
      :aria-label="t('toolbar.exportAtlas')"
      :disabled="store.sprites.length === 0"
      @click="store.exportAtlas()"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 4h16v5H4z M12 9v8 M8 15l4 4 4-4"
        />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :title="t('toolbar.tipFit')"
      :aria-label="t('toolbar.fit')"
      @click="fit"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4 10V4h6 M14 4h6v6 M20 14v6h-6 M10 20H4v-6"
        />
      </svg>
    </button>
    <span class="tb-sep" />
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :class="{ 'tb-on': ui.showSprites }"
      :title="t('toolbar.tipToggleSprites')"
      :aria-label="t('toolbar.tipToggleSprites')"
      :aria-pressed="ui.showSprites"
      @click="ui.toggleShowSprites()"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="8"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <rect
          x="13"
          y="3"
          width="8"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <rect
          x="3"
          y="13"
          width="8"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <rect
          x="13"
          y="13"
          width="8"
          height="8"
          rx="1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
      </svg>
    </button>
    <button
      type="button"
      class="tb-btn tb-icon-only"
      :class="{ 'tb-on': ui.showSheetImage }"
      :title="t('toolbar.tipToggleSheet')"
      :aria-label="t('toolbar.tipToggleSheet')"
      :aria-pressed="ui.showSheetImage"
      @click="ui.toggleShowSheetImage()"
    >
      <svg class="tb-ico" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        />
        <circle cx="8" cy="10" r="1.25" fill="currentColor" />
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          d="M3 15l4-3 3 3 5-5 6 5"
        />
        <path
          v-if="!ui.showSheetImage"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          d="M4 20L20 4"
        />
      </svg>
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
  gap: 2px;
  height: 34px;
  padding: 0 6px;
  background: linear-gradient(
    to bottom,
    var(--win-tool-from, #f7f7f7),
    var(--win-tool-to, #ececec)
  );
  border-bottom: 1px solid var(--win-border, #d0d0d0);
}

.tb-btn.tb-icon-only {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  min-width: 28px;
  height: 26px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  font: inherit;
  color: var(--win-text, #222);
  cursor: default;
}

.tb-btn.tb-icon-only:hover:not(:disabled) {
  border-color: #7eb4ea;
  background: linear-gradient(to bottom, #fff, #e5f1fb);
}

.tb-btn.tb-icon-only:disabled {
  opacity: 0.45;
}

.tb-btn.tb-icon-only.tb-on {
  border-color: #7eb4ea;
  background: linear-gradient(to bottom, #e8f4ff, #d4e9fc);
}

.tb-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  pointer-events: none;
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
