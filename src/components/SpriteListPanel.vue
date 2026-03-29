<template>
  <aside class="win-panel">
    <div class="win-panel-title">精灵对象</div>
    <div class="list-body">
      <table class="sprite-table">
        <thead>
          <tr>
            <th>名称</th>
            <th class="num">W</th>
            <th class="num">H</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in store.sprites"
            :key="s.id"
            :class="{ active: s.id === store.selectedId }"
            @click="store.select(s.id)"
          >
            <td class="name-cell">{{ s.name }}</td>
            <td class="num">{{ s.frame.w }}</td>
            <td class="num">{{ s.frame.h }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="store.sprites.length === 0" class="empty-hint">
        暂无精灵。使用工具栏「添加精灵」或菜单 编辑 → 添加精灵。
      </p>
    </div>
  </aside>
</template>

<script setup>
import { useProjectStore } from "../stores/project.js";

const store = useProjectStore();
</script>

<style scoped>
.list-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.sprite-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.sprite-table th,
.sprite-table td {
  border-bottom: 1px solid #e0e0e0;
  padding: 4px 8px;
  text-align: left;
}

.sprite-table th {
  background: #f5f5f5;
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
  width: 36px;
}

.name-cell {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  padding: 12px;
  color: #666;
  line-height: 1.5;
  user-select: text;
}
</style>
