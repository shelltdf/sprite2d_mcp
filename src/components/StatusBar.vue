<template>
  <footer class="status-bar">
    <span class="status-msg">{{ store.statusMessage }}</span>
    <span class="status-right">
      <span v-if="store.selectedCount === 1 && store.selected" class="sel-tag">{{
        store.selected.name
      }}</span>
      <span v-else-if="store.selectedCount > 1" class="sel-tag">{{ store.selectedCount }} 个精灵</span>
      <span class="zoom-tag">{{ zoomPct }}%</span>
    </span>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useProjectStore } from "../stores/project.js";

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
  background: linear-gradient(to bottom, #f7f7f7, #ececec);
  border-top: 1px solid var(--win-border, #d0d0d0);
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
  color: #333;
}

.zoom-tag {
  min-width: 40px;
  text-align: right;
  color: #555;
}
</style>
