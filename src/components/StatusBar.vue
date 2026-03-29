<template>
  <footer class="status-bar">
    <span class="status-msg">{{ store.statusMessage }}</span>
    <span class="status-right">
      <span v-if="store.selectedCount === 1 && store.selected" class="sel-tag">{{
        store.selected.name
      }}</span>
      <span v-else-if="store.selectedCount > 1" class="sel-tag">{{
        t("status.barSprites", { n: store.selectedCount })
      }}</span>
      <span
        v-else-if="store.selectedAnimationId && store.selectedAnimation"
        class="sel-tag"
      >{{ t("status.barAnim", { name: store.selectedAnimation.name }) }}</span>
      <span class="zoom-tag">{{ zoomPct }}%</span>
    </span>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";

const { t } = useI18n();
const store = useProjectStore();
const zoomPct = computed(() => Math.round(store.view.scale * 100));
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 22px;
  padding: 0 8px;
  font-size: 11px;
  background: linear-gradient(
    to bottom,
    var(--win-tool-from, #f7f7f7),
    var(--win-tool-to, #ececec)
  );
  border-top: 1px solid var(--win-border, #d0d0d0);
  color: var(--win-text, inherit);
}

.status-msg {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.sel-tag {
  color: var(--win-text, #333);
}

.zoom-tag {
  min-width: 40px;
  text-align: right;
  color: var(--win-text, #555);
  opacity: 0.85;
}
</style>
