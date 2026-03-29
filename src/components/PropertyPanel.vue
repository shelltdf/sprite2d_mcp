<template>
  <aside class="win-panel">
    <div class="win-panel-title">精灵属性</div>
    <div v-if="store.selectedCount === 1 && sel" class="prop-body">
      <p v-if="store.sheetWidth > 0" class="sheet-hint">
        坐标相对精灵表底图：{{ store.sheetWidth }}×{{ store.sheetHeight }} px
        <span v-if="store.sheetFileName" class="fname">{{ store.sheetFileName }}</span>
      </p>
      <label class="field">
        <span>名称</span>
        <input v-model="name" type="text" @change="commitName">
      </label>
      <div class="grid4">
        <label class="field sm">
          <span>X</span>
          <input v-model.number="fx" type="number" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>Y</span>
          <input v-model.number="fy" type="number" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>宽</span>
          <input v-model.number="fw" type="number" min="1" @change="commitFrame">
        </label>
        <label class="field sm">
          <span>高</span>
          <input v-model.number="fh" type="number" min="1" @change="commitFrame">
        </label>
      </div>
      <div class="preview-box">
        <div class="preview-label">预览</div>
        <div
          class="preview-sprite"
          :style="previewStyle"
        />
        <div class="preview-meta">
          {{ sel.frame.w }} × {{ sel.frame.h }} px
        </div>
      </div>
    </div>
    <div v-else-if="store.selectedCount > 1" class="prop-empty">
      已选中 {{ store.selectedCount }} 个精灵。可在菜单「精灵」中使用复制、粘贴、删除，或使用
      Ctrl+C / Ctrl+V / Delete。
    </div>
    <div v-else class="prop-empty">
      未选中精灵。在左侧列表或画布中点选；在空白处拖出框可选中多个。
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();
const sel = computed(() => store.selected);

const name = ref("");
const fx = ref(0);
const fy = ref(0);
const fw = ref(32);
const fh = ref(32);

watch(
  sel,
  (s) => {
    if (!s) {
      name.value = "";
      return;
    }
    name.value = s.name;
    fx.value = s.frame.x;
    fy.value = s.frame.y;
    fw.value = s.frame.w;
    fh.value = s.frame.h;
  },
  { immediate: true }
);

function commitName() {
  store.updateSelected({ name: name.value });
}

function commitFrame() {
  store.updateSelected({
    frame: { x: fx.value, y: fy.value, w: fw.value, h: fh.value },
  });
}

const previewStyle = computed(() => {
  const s = sel.value;
  if (!s) return {};
  const max = 120;
  const w = s.frame.w;
  const h = s.frame.h;
  const k = Math.min(max / w, max / h, 1);
  return {
    width: `${Math.max(4, w * k)}px`,
    height: `${Math.max(4, h * k)}px`,
    background: `linear-gradient(135deg, #6b9bd1 0%, #4a7ab0 100%)`,
    border: "1px solid #2a5580",
  };
});
</script>

<style scoped>
.prop-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  flex: 1;
  min-height: 0;
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
}

.field input {
  height: 26px;
  padding: 0 8px;
  border: 1px solid #ababab;
  border-radius: 2px;
}

.grid4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field.sm span {
  font-size: 10px;
}

.preview-box {
  border: 1px solid var(--win-border, #d0d0d0);
  background: #fff;
  padding: 10px;
  border-radius: 2px;
}

.preview-label {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
}

.preview-sprite {
  margin: 0 auto 8px;
  box-sizing: content-box;
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
}
</style>
