import { defineStore } from "pinia";
import {
  buildAtlasBlob,
  buildAtlasJson,
  triggerDownload,
} from "../lib/compileAtlas.js";
import { parseAtlasJson } from "../lib/atlasFormat.js";

/** @typedef {{ x: number, y: number, w: number, h: number }} Frame */
/** @typedef {{ id: string, name: string, frame: Frame }} Sprite */
/** @typedef {{ name: string, frame: Frame }} SpriteClipboardRow */

function baseName(filename) {
  const s = filename.replace(/[/\\]/g, "/").split("/").pop() || "Sheet";
  return s.replace(/\.[^.]+$/, "") || "Sheet";
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(/** @type {string} */ (r.result));
    r.onerror = () => reject(new Error("读取文件失败"));
    r.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(/** @type {string} */ (r.result));
    r.onerror = () => reject(new Error("读取文件失败"));
    r.readAsText(file);
  });
}

function newSprite(index, sheetW, sheetH) {
  if (sheetW > 0 && sheetH > 0) {
    const w = Math.min(64, sheetW);
    const h = Math.min(64, sheetH);
    const x = Math.max(0, Math.floor((sheetW - w) / 2));
    const y = Math.max(0, Math.floor((sheetH - h) / 2));
    return {
      id: crypto.randomUUID(),
      name: `Sprite ${index + 1}`,
      frame: { x, y, w, h },
    };
  }
  const n = 32 + (index % 5) * 16;
  return {
    id: crypto.randomUUID(),
    name: `Sprite ${index + 1}`,
    frame: { x: 20 + (index % 4) * 40, y: 20 + (index % 3) * 36, w: n, h: n },
  };
}

function rectsIntersect(
  ax,
  ay,
  aw,
  ah,
  bx,
  by,
  bw,
  bh
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export const useProjectStore = defineStore("project", {
  state: () => ({
    name: "Untitled",
    /** @type {Sprite[]} */
    sprites: [],
    /** @type {string[]} */
    selectedIds: [],
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    statusMessage: "就绪",
    /** 精灵表底图（data URL） */
    sheetImageDataUrl: /** @type {string | null} */ (null),
    sheetFileName: null,
    sheetWidth: 0,
    sheetHeight: 0,
    /** @type {SpriteClipboardRow[]} */
    spriteClipboard: [],
  }),
  getters: {
    selectedIdsSet(state) {
      return new Set(state.selectedIds);
    },
    /** 主选（属性面板） */
    selected(state) {
      const id = state.selectedIds[0];
      if (!id) return null;
      return state.sprites.find((s) => s.id === id) || null;
    },
    selectedCount(state) {
      return state.selectedIds.length;
    },
    /** @returns {Sprite[]} */
    selectedSprites(state) {
      const set = new Set(state.selectedIds);
      return state.sprites.filter((s) => set.has(s.id));
    },
  },
  actions: {
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
    setStatus(msg) {
      this.statusMessage = msg;
    },
    setSelection(ids) {
      const seen = new Set();
      const next = [];
      for (const id of ids) {
        if (!id || seen.has(id)) continue;
        if (!this.sprites.some((s) => s.id === id)) continue;
        seen.add(id);
        next.push(id);
      }
      this.selectedIds = next;
      this.syncSelectionStatus();
    },
    clearSelection() {
      this.selectedIds = [];
      this.syncSelectionStatus();
    },
    syncSelectionStatus() {
      const n = this.selectedIds.length;
      if (n === 0) this.setStatus("就绪");
      else if (n === 1) {
        const s = this.selected;
        this.setStatus(s ? `选中: ${s.name}` : "就绪");
      } else this.setStatus(`已选中 ${n} 个精灵`);
    },
    addToSelection(ids) {
      const set = new Set(this.selectedIds);
      for (const id of ids) {
        if (this.sprites.some((s) => s.id === id)) set.add(id);
      }
      this.selectedIds = [...set];
      this.syncSelectionStatus();
    },
    toggleSelection(id) {
      if (!this.sprites.some((s) => s.id === id)) return;
      const i = this.selectedIds.indexOf(id);
      if (i >= 0) {
        this.selectedIds = this.selectedIds.filter((x) => x !== id);
      } else {
        this.selectedIds = [...this.selectedIds, id];
      }
      this.syncSelectionStatus();
    },
    selectByMarquee(x0, y0, x1, y1, additive) {
      const minX = Math.min(x0, x1);
      const minY = Math.min(y0, y1);
      const maxX = Math.max(x0, x1);
      const maxY = Math.max(y0, y1);
      const w = maxX - minX;
      const h = maxY - minY;
      if (w < 1 || h < 1) return;
      const picked = [];
      for (const s of this.sprites) {
        const f = s.frame;
        if (rectsIntersect(minX, minY, w, h, f.x, f.y, f.w, f.h)) {
          picked.push(s.id);
        }
      }
      if (additive) this.addToSelection(picked);
      else this.setSelection(picked);
    },
    newProject() {
      this.name = "Untitled";
      this.sprites = [];
      this.selectedIds = [];
      this.view = { scale: 1, offsetX: 0, offsetY: 0 };
      this.sheetImageDataUrl = null;
      this.sheetFileName = null;
      this.sheetWidth = 0;
      this.sheetHeight = 0;
      this.spriteClipboard = [];
      this.setStatus("已新建工程");
    },
    addSprite() {
      const s = newSprite(
        this.sprites.length,
        this.sheetWidth,
        this.sheetHeight
      );
      this.sprites.push(s);
      this.setSelection([s.id]);
      this.setStatus(`已添加 ${s.name}`);
    },
    selectAllSprites() {
      this.setSelection(this.sprites.map((s) => s.id));
    },
    copySelection() {
      const list = this.selectedSprites;
      if (!list.length) {
        this.setStatus("没有选中的精灵可复制");
        return;
      }
      this.spriteClipboard = list.map((s) => ({
        name: s.name,
        frame: {
          x: s.frame.x,
          y: s.frame.y,
          w: s.frame.w,
          h: s.frame.h,
        },
      }));
      this.setStatus(`已复制 ${list.length} 个精灵`);
    },
    pasteSprites() {
      if (!this.spriteClipboard.length) {
        this.setStatus("剪贴板为空");
        return;
      }
      const dx = 16;
      const dy = 16;
      const newIds = [];
      for (const row of this.spriteClipboard) {
        const id = crypto.randomUUID();
        newIds.push(id);
        const spr = {
          id,
          name: row.name,
          frame: {
            x: row.frame.x + dx,
            y: row.frame.y + dy,
            w: row.frame.w,
            h: row.frame.h,
          },
        };
        this.sprites.push(spr);
        this.clampSpriteFrameToSheet(spr);
      }
      this.setSelection(newIds);
      this.setStatus(`已粘贴 ${newIds.length} 个精灵`);
    },
    deleteSelection() {
      const set = new Set(this.selectedIds);
      if (!set.size) {
        this.setStatus("没有选中的精灵可删除");
        return;
      }
      const n = set.size;
      this.sprites = this.sprites.filter((s) => !set.has(s.id));
      this.clearSelection();
      this.setStatus(`已删除 ${n} 个精灵`);
    },
    refreshSheetDimensionsFromUrl() {
      if (!this.sheetImageDataUrl) {
        this.sheetWidth = 0;
        this.sheetHeight = 0;
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.sheetWidth = img.naturalWidth;
          this.sheetHeight = img.naturalHeight;
          resolve();
        };
        img.onerror = () => {
          this.sheetWidth = 0;
          this.sheetHeight = 0;
          reject(new Error("精灵表图片解码失败"));
        };
        img.src = this.sheetImageDataUrl;
      });
    },
    /** 设置精灵表图片（底图） */
    async setSpriteSheetImage(file) {
      try {
        const url = await readFileAsDataURL(file);
        this.sheetImageDataUrl = url;
        this.sheetFileName = file.name;
        await this.refreshSheetDimensionsFromUrl();
        if (
          this.sprites.length === 0 &&
          this.sheetWidth > 0 &&
          this.sheetHeight > 0
        ) {
          const id = crypto.randomUUID();
          const nm = baseName(file.name);
          this.sprites.push({
            id,
            name: nm,
            frame: {
              x: 0,
              y: 0,
              w: this.sheetWidth,
              h: this.sheetHeight,
            },
          });
          this.setSelection([id]);
        }
        this.setStatus(`已设置精灵表图片: ${file.name}`);
      } catch (e) {
        this.setStatus(`设置失败: ${e?.message || e}`);
      }
    },
    /**
     * 导入图集：图集 JSON + 图集 PNG（与导出相对）
     * @param {File} jsonFile
     * @param {File} imageFile
     */
    async importAtlas(jsonFile, imageFile) {
      try {
        const text = await readFileAsText(jsonFile);
        const parsed = parseAtlasJson(text);
        const url = await readFileAsDataURL(imageFile);
        this.sheetImageDataUrl = url;
        this.sheetFileName = imageFile.name;
        await this.refreshSheetDimensionsFromUrl();
        this.sprites = parsed.sprites.map((r, i) => {
          const spr = {
            id: crypto.randomUUID(),
            name: r.name || `Sprite ${i + 1}`,
            frame: { x: r.x, y: r.y, w: r.w, h: r.h },
          };
          this.clampSpriteFrameToSheet(spr);
          return spr;
        });
        this.setSelection(this.sprites.map((s) => s.id));
        this.setStatus(
          `已导入图集：${parsed.sprites.length} 个切片（${parsed.imageHint}）`
        );
      } catch (e) {
        this.setStatus(`导入图集失败: ${e?.message || e}`);
      }
    },
    clampSpriteFrameToSheet(s) {
      if (!(this.sheetWidth > 0 && this.sheetHeight > 0)) return;
      const f = s.frame;
      f.w = Math.max(1, Math.min(f.w, this.sheetWidth));
      f.h = Math.max(1, Math.min(f.h, this.sheetHeight));
      f.x = Math.max(0, Math.min(f.x, this.sheetWidth - f.w));
      f.y = Math.max(0, Math.min(f.y, this.sheetHeight - f.h));
    },
    updateSelected(patch) {
      const s = this.selected;
      if (!s || this.selectedIds.length !== 1) return;
      if (patch.name !== undefined) s.name = String(patch.name);
      if (patch.frame) {
        const f = s.frame;
        const q = patch.frame;
        if (q.x !== undefined) f.x = Number(q.x) || 0;
        if (q.y !== undefined) f.y = Number(q.y) || 0;
        if (q.w !== undefined) f.w = Math.max(1, Number(q.w) || 1);
        if (q.h !== undefined) f.h = Math.max(1, Number(q.h) || 1);
      }
      this.clampSpriteFrameToSheet(s);
    },
    nudgeSelected(dx, dy) {
      const set = new Set(this.selectedIds);
      for (const s of this.sprites) {
        if (!set.has(s.id)) continue;
        s.frame.x += dx;
        s.frame.y += dy;
        this.clampSpriteFrameToSheet(s);
      }
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
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      if (this.sheetWidth > 0 && this.sheetHeight > 0) {
        minX = Math.min(minX, 0);
        minY = Math.min(minY, 0);
        maxX = Math.max(maxX, this.sheetWidth);
        maxY = Math.max(maxY, this.sheetHeight);
      }
      for (const s of this.sprites) {
        const { x, y, w, h } = s.frame;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
      if (
        !Number.isFinite(minX) ||
        (this.sprites.length === 0 &&
          !(this.sheetWidth > 0 && this.sheetHeight > 0))
      ) {
        this.view = { scale: 1, offsetX: 20, offsetY: 20 };
        return;
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
        const { blob, placed } = await buildAtlasBlob(
          this.sprites,
          this.sheetImageDataUrl
        );
        const json = buildAtlasJson(placed);
        triggerDownload("atlas.png", blob, "image/png");
        triggerDownload("atlas.json", json, "application/json");
        this.setStatus("已导出图集（atlas.png / atlas.json）");
      } catch (e) {
        this.setStatus(`导出图集失败: ${e?.message || e}`);
      }
    },
    saveProjectFile() {
      const data = {
        version: 1,
        name: this.name,
        sprites: this.sprites,
        selectedIds: this.selectedIds,
        view: this.view,
        sheetImageDataUrl: this.sheetImageDataUrl,
        sheetFileName: this.sheetFileName,
        sheetWidth: this.sheetWidth,
        sheetHeight: this.sheetHeight,
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
      if (Array.isArray(data.selectedIds)) {
        const valid = data.selectedIds.filter((id) =>
          this.sprites.some((s) => s.id === id)
        );
        this.selectedIds = valid.length ? valid : [];
      } else if (data.selectedId) {
        this.selectedIds = this.sprites.some((s) => s.id === data.selectedId)
          ? [data.selectedId]
          : [];
      } else {
        this.selectedIds = this.sprites[0]?.id ? [this.sprites[0].id] : [];
      }
      if (data.view) {
        this.view = {
          scale: Math.min(8, Math.max(0.1, Number(data.view.scale) || 1)),
          offsetX: Number(data.view.offsetX) || 0,
          offsetY: Number(data.view.offsetY) || 0,
        };
      }
      if (data.sheetImageDataUrl) {
        this.sheetImageDataUrl = data.sheetImageDataUrl;
        this.sheetFileName = data.sheetFileName || null;
        this.sheetWidth = Number(data.sheetWidth) || 0;
        this.sheetHeight = Number(data.sheetHeight) || 0;
        if (!this.sheetWidth || !this.sheetHeight) {
          this.refreshSheetDimensionsFromUrl().catch(() => {});
        }
      } else {
        this.sheetImageDataUrl = null;
        this.sheetFileName = null;
        this.sheetWidth = 0;
        this.sheetHeight = 0;
      }
      this.syncSelectionStatus();
      this.setStatus(`已打开: ${this.name}`);
    },
  },
});
