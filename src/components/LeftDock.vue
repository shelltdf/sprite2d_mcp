<template>
  <aside class="left-dock">
    <input
      ref="sheetInput"
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp"
      class="hidden-file"
      @change="onSheetFile"
    >

    <div class="dock-block">
      <button
        type="button"
        class="dock-head"
        @click="open.sheet = !open.sheet"
      >
        <span class="caret">{{ open.sheet ? "▼" : "▶" }}</span>
        {{ t("dock.sheet") }}
      </button>
      <div v-show="open.sheet" class="dock-body sheet-block">
        <div v-if="store.sheetImageDataUrl" class="sheet-row">
          <img
            class="sheet-thumb"
            :src="store.sheetImageDataUrl"
            alt=""
          >
          <div class="sheet-meta">
            <div class="sheet-name" :title="store.sheetFileName || ''">
              {{ store.sheetFileName || t("dock.loaded") }}
            </div>
            <div class="sheet-dim">
              {{ store.sheetWidth }}×{{ store.sheetHeight }} px
            </div>
          </div>
        </div>
        <p v-else class="empty-line">
          {{ t("dock.noSheet") }}
        </p>
        <button type="button" class="dock-btn" @click="pickSheet">
          {{ t("dock.setSheetBtn") }}
        </button>
      </div>
    </div>

    <div class="dock-block flex-1 min-h-0">
      <button
        type="button"
        class="dock-head"
        @click="open.sprites = !open.sprites"
      >
        <span class="caret">{{ open.sprites ? "▼" : "▶" }}</span>
        {{ t("dock.sprites") }}
      </button>
      <div v-show="open.sprites" class="dock-body flex-col min-h-0">
        <div
          class="list-scroll"
          @contextmenu.prevent="onTableAreaContext($event)"
        >
          <table class="sprite-table">
            <thead>
              <tr>
                <th>{{ t("dock.colName") }}</th>
                <th class="num">{{ t("dock.colW") }}</th>
                <th class="num">{{ t("dock.colH") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in store.sprites"
                :key="s.id"
                :class="{ active: store.isSelected(s.id) }"
                @click="onSpriteRow(s, $event)"
                @contextmenu.prevent="onSpriteRowContext(s, $event)"
              >
                <td class="name-cell">{{ s.name }}</td>
                <td class="num">{{ s.frame.w }}</td>
                <td class="num">{{ s.frame.h }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="store.sprites.length === 0" class="empty-hint">
            {{ t("dock.noSprites") }}
          </p>
        </div>
      </div>
    </div>

    <div class="dock-block dock-block-anim">
      <button
        type="button"
        class="dock-head"
        @click="open.anims = !open.anims"
      >
        <span class="caret">{{ open.anims ? "▼" : "▶" }}</span>
        {{ t("dock.anims") }}
      </button>
      <div v-show="open.anims" class="dock-body anim-block">
        <div class="anim-toolbar">
          <button type="button" class="dock-btn sm" @click="store.addAnimation()">
            {{ t("dock.newAnim") }}
          </button>
          <button
            type="button"
            class="dock-btn sm"
            :disabled="!store.selectedAnimationId"
            @click="store.deleteSelectedAnimation()"
          >
            {{ t("dock.delAnim") }}
          </button>
        </div>
        <ul class="anim-list">
          <li
            v-for="a in store.animations"
            :key="a.id"
            :class="{ active: a.id === store.selectedAnimationId }"
            @click="store.selectAnimation(a.id)"
          >
            <span class="anim-name">{{ a.name }}</span>
            <span class="anim-frames">{{ t("dock.frames", { n: a.frames.length }) }}</span>
          </li>
        </ul>
        <p v-if="store.animations.length === 0" class="empty-hint sm">
          {{ t("dock.noAnims") }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";
import { SPRITE_MENU_OPEN } from "../menu/events.js";

const { t } = useI18n();
const store = useProjectStore();
const sheetInput = ref(null);

function pickSheet() {
  sheetInput.value?.click();
}

const open = reactive({
  sheet: true,
  sprites: true,
  anims: true,
});

function onSpriteRow(s, e) {
  if (e.shiftKey) {
    store.addToSelection([s.id]);
  } else if (e.ctrlKey || e.metaKey) {
    store.toggleSelection(s.id);
  } else {
    store.setSelection([s.id]);
  }
}

function onSpriteRowContext(s, ev) {
  ev.stopPropagation();
  if (!store.isSelected(s.id)) {
    store.setSelection([s.id]);
  }
  window.dispatchEvent(
    new CustomEvent(SPRITE_MENU_OPEN, {
      detail: { x: ev.clientX, y: ev.clientY },
    })
  );
}

function onTableAreaContext(ev) {
  window.dispatchEvent(
    new CustomEvent(SPRITE_MENU_OPEN, {
      detail: { x: ev.clientX, y: ev.clientY },
    })
  );
}

async function onSheetFile(ev) {
  const f = ev.target.files?.[0];
  ev.target.value = "";
  if (!f) return;
  await store.setSpriteSheetImage(f);
}
</script>

<style scoped>
.left-dock {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--win-bar, #f9f9f9);
  border-right: 1px solid var(--win-border, #d0d0d0);
}

.flex-1 {
  flex: 1;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.min-h-0 {
  min-height: 0;
}

.dock-block {
  border-bottom: 1px solid var(--win-border, #d0d0d0);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dock-block-anim {
  flex-shrink: 0;
  max-height: 42%;
}

.dock-head {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  border: none;
  background: linear-gradient(
    to bottom,
    var(--win-panel-head-from, #fafafa),
    var(--win-panel-head-to, #f0f0f0)
  );
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  color: var(--win-text, #444);
  cursor: default;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dock-head:hover {
  background: var(--win-hover, #e5f3ff);
}

.caret {
  width: 12px;
  font-size: 9px;
  color: #666;
}

.dock-body {
  padding: 8px 10px 10px;
  background: var(--win-bar, #f9f9f9);
}

.sheet-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheet-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sheet-thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--win-input-bg, #fff);
  border: 1px solid var(--win-border, #d0d0d0);
  flex-shrink: 0;
}

.sheet-meta {
  min-width: 0;
  flex: 1;
}

.sheet-name {
  font-size: 11px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sheet-dim {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.empty-line {
  margin: 0;
  font-size: 11px;
  color: #666;
}

.dock-btn {
  height: 24px;
  padding: 0 10px;
  border: 1px solid #b8b8b8;
  border-radius: 2px;
  background: linear-gradient(to bottom, #fff, #f0f0f0);
  font: inherit;
  font-size: 11px;
  color: var(--win-text, inherit);
  cursor: default;
  align-self: flex-start;
}

.dock-btn:hover:not(:disabled) {
  border-color: #7eb4ea;
}

.dock-btn:disabled {
  opacity: 0.45;
}

.dock-btn.sm {
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
}

.list-scroll {
  flex: 1;
  overflow: auto;
  min-height: 80px;
  max-height: 240px;
}

.sprite-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.sprite-table th,
.sprite-table td {
  border-bottom: 1px solid #e0e0e0;
  padding: 4px 6px;
  text-align: left;
}

.sprite-table th {
  background: var(--win-table-head, #f0f0f0);
  font-weight: 600;
  position: sticky;
  top: 0;
}

.sprite-table tr:hover td {
  background: #f0f8ff;
}

.sprite-table tr.active td {
  background: var(--win-active, #cce8ff);
}

.num {
  text-align: right;
  width: 32px;
}

.name-cell {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  padding: 8px 0;
  color: #666;
  line-height: 1.45;
  font-size: 11px;
  user-select: text;
}

.empty-hint.sm {
  padding: 4px 0 0;
  font-size: 10px;
}

.anim-toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.anim-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 160px;
  overflow: auto;
}

.anim-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  font-size: 12px;
  border-bottom: 1px solid #e8e8e8;
  cursor: default;
}

.anim-list li:hover {
  background: #f0f8ff;
}

.anim-list li.active {
  background: var(--win-active, #cce8ff);
}

.anim-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.anim-frames {
  font-size: 10px;
  color: #666;
  flex-shrink: 0;
  margin-left: 6px;
}

.hidden-file {
  display: none;
}
</style>
