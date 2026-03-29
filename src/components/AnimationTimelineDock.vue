<template>
  <div class="timeline-dock">
    <div class="timeline-head">
      <span class="head-title">{{ t("timeline.title") }}</span>
      <span class="head-anim" :title="anim?.name || ''">{{
        anim ? anim.name : t("timeline.noAnim")
      }}</span>
      <span class="head-meta">{{
        t("timeline.meta", { ms: totalMs, n: frameCount })
      }}</span>
      <div class="head-actions">
        <button
          type="button"
          class="play-btn"
          :disabled="!canPlay"
          @click="togglePlay"
        >
          {{ playing ? t("timeline.stop") : t("timeline.play") }}
        </button>
      </div>
    </div>

    <div v-if="anim && frameCount > 0" class="timeline-body">
      <div class="ruler">
        <span
          v-for="(tick, i) in rulerTicks"
          :key="i"
          class="ruler-tick"
          :style="{ left: `${tick.pct}%` }"
        >{{ tick.label }}</span>
      </div>
      <div class="track-wrap">
        <div
          class="track"
          role="slider"
          :aria-valuenow="playVisualIndex ?? 0"
          @click.self="store.clearTimelineFrameSelect()"
        >
          <button
            v-for="(fr, idx) in anim.frames"
            :key="idx"
            type="button"
            class="clip"
            :class="{
              active: store.selectedTimelineFrameIndex === idx,
              playing: playing && playVisualIndex === idx,
            }"
            :style="{ flex: Math.max(1, fr.durationMs) }"
            :title="`${spriteLabel(fr.spriteId)} · ${fr.durationMs} ms`"
            @click.stop="onClipClick(idx)"
          >
            <span class="clip-label">{{ idx + 1 }}</span>
            <span class="clip-name">{{ spriteLabel(fr.spriteId) }}</span>
            <span class="clip-ms">{{ fr.durationMs }}ms</span>
          </button>
        </div>
        <div
          v-if="playing && frameCount > 0"
          class="playhead"
          :style="{ left: `${playheadPct}%` }"
        />
      </div>
    </div>

    <p v-else class="timeline-empty">
      {{ t("timeline.empty") }}
    </p>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useProjectStore } from "../stores/project.js";

const { t } = useI18n();
const store = useProjectStore();
const { selectedAnimation: anim } = storeToRefs(store);

const playing = ref(false);
const playVisualIndex = ref(0);
let playTimer = null;

const frameCount = computed(() => anim.value?.frames.length ?? 0);

const totalMs = computed(() => {
  if (!anim.value?.frames.length) return 0;
  return anim.value.frames.reduce((s, f) => s + f.durationMs, 0);
});

const canPlay = computed(
  () => !!anim.value && anim.value.frames.length > 0
);

const rulerTicks = computed(() => {
  const total = totalMs.value;
  if (total <= 0) return [{ pct: 0, label: "0" }];
  const n = 5;
  const ticks = [];
  for (let i = 0; i <= n; i++) {
    const ms = Math.round((total * i) / n);
    ticks.push({ pct: (i / n) * 100, label: `${ms}ms` });
  }
  return ticks;
});

const playheadPct = computed(() => {
  if (!anim.value?.frames.length || totalMs.value <= 0) return 0;
  let acc = 0;
  const idx = playVisualIndex.value;
  for (let i = 0; i < idx && i < anim.value.frames.length; i++) {
    acc += anim.value.frames[i].durationMs;
  }
  const cur = anim.value.frames[idx]?.durationMs ?? 0;
  const half = playing.value ? cur * 0.5 : 0;
  return ((acc + half) / totalMs.value) * 100;
});

function spriteLabel(spriteId) {
  const s = store.sprites.find((x) => x.id === spriteId);
  return s?.name ?? "?";
}

function onClipClick(idx) {
  store.selectTimelineFrame(idx);
}

function stopPlay() {
  playing.value = false;
  if (playTimer != null) {
    clearTimeout(playTimer);
    playTimer = null;
  }
}

function scheduleNextFrame() {
  if (!anim.value?.frames.length) {
    stopPlay();
    return;
  }
  const fr = anim.value.frames[playVisualIndex.value];
  if (!fr) {
    playVisualIndex.value = 0;
    scheduleNextFrame();
    return;
  }
  playTimer = setTimeout(() => {
    playTimer = null;
    if (!playing.value) return;
    const len = anim.value.frames.length;
    playVisualIndex.value = (playVisualIndex.value + 1) % len;
    scheduleNextFrame();
  }, fr.durationMs);
}

function togglePlay() {
  if (!canPlay.value) return;
  if (playing.value) {
    stopPlay();
    return;
  }
  playing.value = true;
  if (playVisualIndex.value >= frameCount.value) playVisualIndex.value = 0;
  scheduleNextFrame();
}

watch(anim, () => {
  stopPlay();
  playVisualIndex.value = 0;
});

watch(frameCount, (n) => {
  if (playVisualIndex.value >= n) playVisualIndex.value = Math.max(0, n - 1);
});

onUnmounted(() => stopPlay());
</script>

<style scoped>
.timeline-dock {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 112px;
  max-height: 140px;
  background: linear-gradient(
    to bottom,
    var(--win-tool-from, #f2f2f2),
    var(--win-tool-to, #ebebeb)
  );
  border-top: 1px solid var(--win-border, #d0d0d0);
  border-bottom: 1px solid var(--win-border, #d0d0d0);
}

.timeline-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px;
  border-bottom: 1px solid var(--win-border, #d8d8d8);
  flex-shrink: 0;
}

.head-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--win-text, #333);
}

.head-anim {
  font-size: 11px;
  font-weight: 600;
  color: #0078d4;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-meta {
  font-size: 10px;
  color: #666;
  flex: 1;
}

.head-actions {
  flex-shrink: 0;
}

.play-btn {
  height: 22px;
  padding: 0 10px;
  font: inherit;
  font-size: 11px;
  color: var(--win-text, inherit);
  border: 1px solid #b8b8b8;
  border-radius: 2px;
  background: linear-gradient(to bottom, #fff, #f0f0f0);
  cursor: default;
}

.play-btn:hover:not(:disabled) {
  border-color: #7eb4ea;
}

.play-btn:disabled {
  opacity: 0.45;
}

.timeline-body {
  flex: 1;
  min-height: 0;
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ruler {
  position: relative;
  height: 14px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 2px;
}

.ruler-tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 9px;
  color: #888;
  white-space: nowrap;
}

.track-wrap {
  position: relative;
  flex: 1;
  min-height: 44px;
}

.track {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 44px;
  gap: 2px;
  align-items: stretch;
}

.clip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 8px;
  padding: 2px 4px;
  border: 1px solid #a0a0a0;
  border-radius: 2px;
  background: linear-gradient(to bottom, #fff, #e8e8e8);
  font: inherit;
  color: var(--win-text, inherit);
  cursor: default;
  overflow: hidden;
}

.clip:hover {
  border-color: #0078d4;
  background: linear-gradient(to bottom, #fff, #e5f1fb);
}

.clip.active {
  border-color: #0078d4;
  box-shadow: inset 0 0 0 1px rgba(0, 120, 215, 0.35);
}

.clip.playing {
  background: linear-gradient(to bottom, #d9ecfc, #b8d9f5);
}

.clip-label {
  font-size: 10px;
  font-weight: 700;
  color: #555;
}

.clip-name {
  font-size: 9px;
  color: var(--win-text, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.clip-ms {
  font-size: 9px;
  color: #666;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: #c42b1c;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
}

.timeline-empty {
  margin: 0;
  padding: 12px 10px;
  font-size: 11px;
  color: #666;
  line-height: 1.4;
}
</style>
