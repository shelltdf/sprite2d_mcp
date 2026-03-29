import { defineStore } from "pinia";
import {
  buildAtlasBlob,
  buildAtlasJson,
  triggerDownload,
} from "../lib/compileAtlas.js";

/** @typedef {{ x: number, y: number, w: number, h: number }} Frame */
/** @typedef {{ id: string, name: string, frame: Frame }} Sprite */

function newSprite(index) {
  const n = 32 + (index % 5) * 16;
  return {
    id: crypto.randomUUID(),
    name: `Sprite ${index + 1}`,
    frame: { x: 20 + (index % 4) * 40, y: 20 + (index % 3) * 36, w: n, h: n },
  };
}

export const useProjectStore = defineStore("project", {
  state: () => ({
    /** @type {string} */
    name: "Untitled",
    /** @type {Sprite[]} */
    sprites: [],
    /** @type {string | null} */
    selectedId: null,
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    statusMessage: "就绪",
  }),
  getters: {
    selected(state) {
      return state.sprites.find((s) => s.id === state.selectedId) || null;
    },
  },
  actions: {
    setStatus(msg) {
      this.statusMessage = msg;
    },
    newProject() {
      this.name = "Untitled";
      this.sprites = [];
      this.selectedId = null;
      this.view = { scale: 1, offsetX: 0, offsetY: 0 };
      this.setStatus("已新建工程");
    },
    addSprite() {
      const s = newSprite(this.sprites.length);
      this.sprites.push(s);
      this.selectedId = s.id;
      this.setStatus(`已添加 ${s.name}`);
    },
    select(id) {
      this.selectedId = id == null ? null : id;
      const s = this.sprites.find((x) => x.id === this.selectedId);
      this.setStatus(s ? `选中: ${s.name}` : "就绪");
    },
    updateSelected(patch) {
      const s = this.selected;
      if (!s) return;
      if (patch.name !== undefined) s.name = String(patch.name);
      if (patch.frame) {
        const f = s.frame;
        const q = patch.frame;
        if (q.x !== undefined) f.x = Number(q.x) || 0;
        if (q.y !== undefined) f.y = Number(q.y) || 0;
        if (q.w !== undefined) f.w = Math.max(1, Number(q.w) || 1);
        if (q.h !== undefined) f.h = Math.max(1, Number(q.h) || 1);
      }
    },
    nudgeSelected(dx, dy) {
      const s = this.selected;
      if (!s) return;
      s.frame.x += dx;
      s.frame.y += dy;
    },
    setView(partial) {
      this.view = { ...this.view, ...partial };
      const s = this.view.scale;
      this.view.scale = Math.min(8, Math.max(0.1, s));
    },
    zoomAt(canvasX, canvasY, factor) {
      const { scale, offsetX, offsetY } = this.view;
      const wx = (canvasX - offsetX) / scale;
      const wy = (canvasY - offsetY) / scale;
      const next = Math.min(8, Math.max(0.1, scale * factor));
      this.view.scale = next;
      this.view.offsetX = canvasX - wx * next;
      this.view.offsetY = canvasY - wy * next;
    },
    fitToRect(canvasW, canvasH) {
      if (this.sprites.length === 0) {
        this.view = { scale: 1, offsetX: 20, offsetY: 20 };
        return;
      }
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const s of this.sprites) {
        const { x, y, w, h } = s.frame;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
      const bw = maxX - minX || 64;
      const bh = maxY - minY || 64;
      const pad = 40;
      const sx = (canvasW - pad * 2) / bw;
      const sy = (canvasH - pad * 2) / bh;
      const sc = Math.min(sx, sy, 4);
      this.view.scale = Math.max(0.1, sc);
      this.view.offsetX = pad - minX * this.view.scale;
      this.view.offsetY = pad - minY * this.view.scale;
      this.setStatus("已适应窗口");
    },
    async exportAtlas() {
      if (this.sprites.length === 0) {
        this.setStatus("错误：没有可导出的精灵");
        return;
      }
      try {
        const { blob, placed } = await buildAtlasBlob(this.sprites);
        const json = buildAtlasJson(placed);
        triggerDownload("atlas.png", blob, "image/png");
        triggerDownload("atlas.json", json, "application/json");
        this.setStatus("已导出 atlas.png 与 atlas.json");
      } catch (e) {
        this.setStatus(`导出失败: ${e?.message || e}`);
      }
    },
    saveProjectFile() {
      const data = {
        version: 1,
        name: this.name,
        sprites: this.sprites,
        view: this.view,
      };
      const name = (this.name || "project").replace(/[^\w\-]+/g, "_");
      triggerDownload(
        `${name}.spriteproj.json`,
        JSON.stringify(data, null, 2),
        "application/json"
      );
      this.setStatus("已保存工程文件");
    },
    loadProjectFromText(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.sprites)) throw new Error("无效工程文件");
      this.name = data.name || "Imported";
      this.sprites = data.sprites.map((raw, i) => ({
        id: raw.id || crypto.randomUUID(),
        name: raw.name || `Sprite ${i + 1}`,
        frame: {
          x: Number(raw.frame?.x) || 0,
          y: Number(raw.frame?.y) || 0,
          w: Math.max(1, Number(raw.frame?.w) || 32),
          h: Math.max(1, Number(raw.frame?.h) || 32),
        },
      }));
      this.selectedId = this.sprites[0]?.id ?? null;
      if (data.view) {
        this.view = {
          scale: Math.min(8, Math.max(0.1, Number(data.view.scale) || 1)),
          offsetX: Number(data.view.offsetX) || 0,
          offsetY: Number(data.view.offsetY) || 0,
        };
      }
      this.setStatus(`已打开: ${this.name}`);
    },
  },
});
