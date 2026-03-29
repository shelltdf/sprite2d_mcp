<template>
  <aside class="win-panel">
    <div class="win-panel-title">{{ t("props.title") }}</div>

    <div v-if="anim" class="prop-body">
      <p class="section-label">{{ t("props.animSection") }}</p>
      <label class="field">
        <span>{{ t("props.name") }}</span>
        <input v-model="animName" type="text" @change="commitAnimName">
      </label>
      <div class="frames-head">
        <span>{{ t("props.frameList") }}</span>
        <div class="frame-add-row">
          <select v-model="addSpriteId" class="sprite-pick">
            <option
              v-for="s in store.sprites"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </option>
          </select>
          <button
            type="button"
            class="mini-btn"
            :disabled="!addSpriteId"
            @click="addFrame"
          >
            {{ t("props.addFrame") }}
          </button>
        </div>
      </div>
      <ul class="frame-list">
        <li
          v-for="(fr, idx) in anim.frames"
          :key="idx"
          class="frame-row"
          :class="{ tlActive: store.selectedTimelineFrameIndex === idx }"
          @click="store.selectTimelineFrame(idx)"
        >
          <span class="fi">{{ idx + 1 }}</span>
          <select
            class="sprite-pick grow"
            :value="fr.spriteId"
            @click.stop
            @change="onFrameSprite(idx, $event)"
          >
            <option
              v-for="s in store.sprites"
              :key="s.id"
              :value="s.id"
            >
              {{ s.name }}
            </option>
          </select>
          <input
            class="dur"
            type="number"
            min="1"
            step="1"
            :value="fr.durationMs"
            @click.stop
            @change="onFrameDur(idx, $event)"
          >
          <span class="dur-lbl">ms</span>
          <button type="button" class="mini-btn icon" @click.stop="store.moveAnimFrame(idx, -1)">
            ↑
          </button>
          <button type="button" class="mini-btn icon" @click.stop="store.moveAnimFrame(idx, 1)">
            ↓
          </button>
          <button type="button" class="mini-btn icon danger" @click.stop="store.removeAnimFrame(idx)">
            ×
          </button>
        </li>
      </ul>
      <p v-if="!anim.frames.length" class="empty-hint">
        {{ t("props.noFrames") }}
      </p>
    </div>

    <div v-else-if="store.selectedCount === 1 && sel" class="prop-body">
      <p class="section-label">{{ t("props.spriteSection") }}</p>
      <p v-if="store.sheetWidth > 0" class="sheet-hint">
        {{ t("props.sheetCoords", { w: store.sheetWidth, h: store.sheetHeight }) }}
        <span v-if="store.sheetFileName" class="fname">{{ store.sheetFileName }}</span>
      </p>
      <label class="field">
        <span>{{ t("props.name") }}</span>
        <input v-model="name" type="text" @change="commitName">
      </label>
      <div class="grid4">
        <label class="field sm">
          <span>{{ t("props.x") }}</span>
          <input v-model.number="fx" type="number" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>{{ t("props.y") }}</span>
          <input v-model.number="fy" type="number" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>{{ t("props.w") }}</span>
          <input v-model.number="fw" type="number" min="1" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>{{ t("props.h") }}</span>
          <input v-model.number="fh" type="number" min="1" @change="commitFrame">
        </label>
      </div>
      <p class="section-label section-tight">{{ t("props.pivotSection") }}</p>
      <div class="grid4">
        <label class="field sm">
          <span>{{ t("props.pivotX") }}</span>
          <input v-model.number="pivotX" type="number" min="0" step="1" @change="commitPivot">
        </label>
        <label class="field sm">
          <span>{{ t("props.pivotY") }}</span>
          <input v-model.number="pivotY" type="number" min="0" step="1" @change="commitPivot">
        </label>
      </div>
      <p class="section-label section-tight">{{ t("props.insetSection") }}</p>
      <div class="grid4">
        <label class="field sm">
          <span>{{ t("props.insetTop") }}</span>
          <input v-model.number="insetT" type="number" min="0" step="1" @change="commitInset">
        </label>
        <label class="field sm">
          <span>{{ t("props.insetRight") }}</span>
          <input v-model.number="insetR" type="number" min="0" step="1" @change="commitInset">
        </label>
        <label class="field sm">
          <span>{{ t("props.insetBottom") }}</span>
          <input v-model.number="insetB" type="number" min="0" step="1" @change="commitInset">
        </label>
        <label class="field sm">
          <span>{{ t("props.insetLeft") }}</span>
          <input v-model.number="insetL" type="number" min="0" step="1" @change="commitInset">
        </label>
      </div>
      <div class="preview-box">
        <div class="preview-label">{{ t("props.preview") }}</div>
        <div class="preview-clip" :style="previewClipBoxStyle">
          <img
            v-if="store.sheetImageDataUrl && store.sheetWidth > 0 && store.sheetHeight > 0"
            :src="store.sheetImageDataUrl"
            alt=""
            class="preview-sheet-img"
            draggable="false"
            :style="previewSheetImgStyle"
          >
          <div
            v-else
            class="preview-fallback-fill"
          />
          <div
            v-if="innerPreviewStyle"
            class="preview-inset-outline"
            :style="innerPreviewStyle"
          />
          <div
            class="preview-pivot-dot"
            :style="pivotPreviewStyle"
          />
        </div>
        <div class="preview-meta">
          {{ previewFrame.w }} × {{ previewFrame.h }} px
        </div>
      </div>
    </div>

    <div v-else-if="store.selectedCount > 1" class="prop-empty">
      {{ t("props.multiSprites", { n: store.selectedCount }) }}
    </div>
    <div v-else class="prop-empty">
      {{ t("props.hintEmpty") }}
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";

const { t } = useI18n();
const store = useProjectStore();
const sel = computed(() => store.selected);
const anim = computed(() => store.selectedAnimation);

const name = ref("");
const fx = ref(0);
const fy = ref(0);
const fw = ref(32);
const fh = ref(32);
const pivotX = ref(0);
const pivotY = ref(0);
const insetT = ref(0);
const insetR = ref(0);
const insetB = ref(0);
const insetL = ref(0);

const animName = ref("");
const addSpriteId = ref("");

function syncSpriteFields(s) {
  if (!s) {
    name.value = "";
    return;
  }
  name.value = s.name;
  fx.value = s.frame.x;
  fy.value = s.frame.y;
  fw.value = s.frame.w;
  fh.value = s.frame.h;
  pivotX.value = s.pivot?.x ?? 0;
  pivotY.value = s.pivot?.y ?? 0;
  insetT.value = s.inset?.top ?? 0;
  insetR.value = s.inset?.right ?? 0;
  insetB.value = s.inset?.bottom ?? 0;
  insetL.value = s.inset?.left ?? 0;
}

watch(() => sel.value, syncSpriteFields, { immediate: true, deep: true });

watch(
  anim,
  (a) => {
    if (!a) {
      animName.value = "";
      return;
    }
    animName.value = a.name;
    if (!addSpriteId.value && store.sprites.length) {
      addSpriteId.value = store.sprites[0].id;
    }
  },
  { immediate: true }
);

watch(
  () => store.sprites.length,
  () => {
    if (!addSpriteId.value && store.sprites[0]) {
      addSpriteId.value = store.sprites[0].id;
    }
    if (
      addSpriteId.value &&
      !store.sprites.some((s) => s.id === addSpriteId.value)
    ) {
      addSpriteId.value = store.sprites[0]?.id || "";
    }
  }
);

function commitName() {
  store.updateSelected({ name: name.value });
}

function commitFrame() {
  store.updateSelected({
    frame: { x: fx.value, y: fy.value, w: fw.value, h: fh.value },
  });
}

function commitPivot() {
  store.updateSelected({
    pivot: { x: pivotX.value, y: pivotY.value },
  });
}

function commitInset() {
  store.updateSelected({
    inset: {
      top: insetT.value,
      right: insetR.value,
      bottom: insetB.value,
      left: insetL.value,
    },
  });
}

function commitAnimName() {
  store.updateAnimationName(animName.value);
}

function addFrame() {
  if (!addSpriteId.value) return;
  store.addAnimFrame(addSpriteId.value);
}

function onFrameSprite(idx, ev) {
  const v = ev.target.value;
  store.setAnimFrameSprite(idx, v);
}

function onFrameDur(idx, ev) {
  store.setAnimFrameDuration(idx, Number(ev.target.value));
}

/** 与输入框同步的裁剪矩形（未提交 store 时也能刷新预览） */
const previewFrame = computed(() => ({
  x: fx.value,
  y: fy.value,
  w: Math.max(1, fw.value),
  h: Math.max(1, fh.value),
}));

const maxPreviewPx = 120;
const maxPreviewScale = 32;

const previewScale = computed(() => {
  const { w, h } = previewFrame.value;
  if (w < 1 || h < 1) return 1;
  return Math.min(maxPreviewPx / w, maxPreviewPx / h, maxPreviewScale);
});

const previewClipBoxStyle = computed(() => {
  const s = previewScale.value;
  const { w, h } = previewFrame.value;
  return {
    width: `${Math.max(4, w * s)}px`,
    height: `${Math.max(4, h * s)}px`,
  };
});

const previewSheetImgStyle = computed(() => {
  const s = previewScale.value;
  const sw = store.sheetWidth;
  const sh = store.sheetHeight;
  const f = previewFrame.value;
  if (!(sw > 0 && sh > 0)) return { display: "none" };
  const up = s > 1 + 1e-6;
  return {
    width: `${sw * s}px`,
    height: `${sh * s}px`,
    marginLeft: `${-f.x * s}px`,
    marginTop: `${-f.y * s}px`,
    display: "block",
    imageRendering: up ? "pixelated" : "auto",
  };
});

const innerPreviewStyle = computed(() => {
  const f = previewFrame.value;
  const s = previewScale.value;
  const left = insetL.value;
  const right = insetR.value;
  const top = insetT.value;
  const bottom = insetB.value;
  const iw = f.w - left - right;
  const ih = f.h - top - bottom;
  if (iw <= 0 || ih <= 0) return null;
  return {
    position: "absolute",
    left: `${left * s}px`,
    top: `${top * s}px`,
    width: `${iw * s}px`,
    height: `${ih * s}px`,
    boxSizing: "border-box",
    border: "1px dashed rgba(255, 120, 0, 0.95)",
    pointerEvents: "none",
    zIndex: 2,
  };
});

const pivotPreviewStyle = computed(() => {
  const s = previewScale.value;
  return {
    position: "absolute",
    left: `${pivotX.value * s}px`,
    top: `${pivotY.value * s}px`,
    width: "8px",
    height: "8px",
    marginLeft: "-4px",
    marginTop: "-4px",
    borderRadius: "50%",
    background: "#ff6600",
    border: "1px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
    zIndex: 3,
    pointerEvents: "none",
  };
});
</script>

<style scoped>
.win-panel {
  width: 100%;
  min-width: 0;
}

.section-label {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  color: #333;
  overflow-wrap: anywhere;
}

.section-label.section-tight {
  margin: 4px 0 6px;
}

.prop-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.sheet-hint {
  margin: 0;
  font-size: 11px;
  color: #555;
  line-height: 1.4;
  user-select: text;
}

.sheet-hint .fname {
  display: block;
  margin-top: 4px;
  color: #888;
  word-break: break-all;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: #444;
  min-width: 0;
}

.field input,
.field select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.field input {
  height: 26px;
  padding: 0 8px;
  border: 1px solid #ababab;
  border-radius: 2px;
}

.grid4 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.field.sm span {
  font-size: 10px;
}

.preview-box {
  border: 1px solid var(--win-border, #d0d0d0);
  background: #fff;
  padding: 10px;
  border-radius: 2px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
}

.preview-clip {
  position: relative;
  overflow: hidden;
  margin: 0 auto 8px;
  box-sizing: border-box;
  max-width: 100%;
  border: 1px solid var(--win-border, #ababab);
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 50% / 8px
    8px;
}

.preview-sheet-img {
  vertical-align: top;
  user-select: none;
  pointer-events: none;
  position: relative;
  z-index: 1;
}

.preview-fallback-fill {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(135deg, #6b9bd1 0%, #4a7ab0 100%);
  border: none;
}

.preview-meta {
  text-align: center;
  font-size: 11px;
  color: #666;
}

.prop-empty {
  padding: 12px;
  color: #666;
  line-height: 1.5;
  user-select: text;
  font-size: 12px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.frames-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #444;
}

.frame-add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.sprite-pick {
  flex: 1;
  min-width: 0;
  height: 24px;
  font-size: 11px;
}

.sprite-pick.grow {
  flex: 1;
}

.frame-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 220px;
  overflow: auto;
}

.frame-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  cursor: default;
  border-radius: 2px;
  padding: 2px 0;
  min-width: 0;
}

.frame-row.tlActive {
  background: rgba(0, 120, 215, 0.12);
  box-shadow: inset 0 0 0 1px rgba(0, 120, 215, 0.35);
}

.fi {
  width: 16px;
  color: #888;
  flex-shrink: 0;
}

.dur {
  width: 48px;
  min-width: 40px;
  flex-shrink: 0;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #ababab;
  border-radius: 2px;
  box-sizing: border-box;
}

.dur-lbl {
  font-size: 10px;
  color: #666;
  flex-shrink: 0;
}

.mini-btn {
  height: 22px;
  padding: 0 6px;
  border: 1px solid #b8b8b8;
  border-radius: 2px;
  background: #fff;
  font: inherit;
  font-size: 10px;
  cursor: default;
  flex-shrink: 0;
}

.mini-btn:hover:not(:disabled) {
  border-color: #7eb4ea;
  background: #f5f9ff;
}

.mini-btn:disabled {
  opacity: 0.45;
}

.mini-btn.icon {
  width: 24px;
  padding: 0;
}

.mini-btn.danger:hover {
  border-color: #c42b1c;
  color: #c42b1c;
}

.empty-hint {
  margin: 0;
  font-size: 11px;
  color: #666;
}
</style>
