import { defineStore } from "pinia";
import {
  buildAtlasBlob,
  buildAtlasJson,
  triggerDownload,
} from "../lib/compileAtlas.js";
import { parseAtlasJson } from "../lib/atlasFormat.js";
import {
  defaultInset,
  defaultPivot,
  ensureSpriteGeometry,
} from "../lib/spriteGeometry.js";
import { T } from "../i18n/translate.js";

/** @typedef {{ x: number, y: number, w: number, h: number }} Frame */
/** @typedef {{ id: string, name: string, frame: Frame, pivot: { x: number, y: number }, inset: { top: number, right: number, bottom: number, left: number } }} Sprite */
/** @typedef {{ name: string, frame: Frame, pivot: { x: number, y: number }, inset: { top: number, right: number, bottom: number, left: number } }} SpriteClipboardRow */
/** @typedef {{ spriteId: string, durationMs: number }} AnimFrame */
/** @typedef {{ id: string, name: string, frames: AnimFrame[] }} Animation */

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(/** @type {string} */ (r.result));
    r.onerror = () => reject(new Error(T("errors.readFileFailed")));
    r.readAsDataURL(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(/** @type {string} */ (r.result));
    r.onerror = () => reject(new Error(T("errors.readFileFailed")));
    r.readAsText(file);
  });
}

function newSprite(index, sheetW, sheetH) {
  if (sheetW > 0 && sheetH > 0) {
    const w = Math.min(64, sheetW);
    const h = Math.min(64, sheetH);
    const x = Math.max(0, Math.floor((sheetW - w) / 2));
    const y = Math.max(0, Math.floor((sheetH - h) / 2));
    const s = {
      id: crypto.randomUUID(),
      name: T("default.spriteName", { n: index + 1 }),
      frame: { x, y, w, h },
      pivot: defaultPivot(),
      inset: defaultInset(),
    };
    ensureSpriteGeometry(s);
    return s;
  }
  const n = 32 + (index % 5) * 16;
  const s = {
    id: crypto.randomUUID(),
    name: T("default.spriteName", { n: index + 1 }),
    frame: { x: 20 + (index % 4) * 40, y: 20 + (index % 3) * 36, w: n, h: n },
    pivot: defaultPivot(),
    inset: defaultInset(),
  };
  ensureSpriteGeometry(s);
  return s;
}

function newAnimation(index, defaultSpriteId) {
  /** @type {AnimFrame[]} */
  const frames = [];
  if (defaultSpriteId) {
    frames.push({ spriteId: defaultSpriteId, durationMs: 100 });
  }
  return {
    id: crypto.randomUUID(),
    name: T("default.animName", { n: index + 1 }),
    frames,
  };
}

function rectsIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function normalizeAnimations(raw, sprites) {
  const spriteIds = new Set(sprites.map((s) => s.id));
  if (!Array.isArray(raw)) return [];
  return raw.map((a, i) => {
    const id = a.id || crypto.randomUUID();
    const name = a.name || T("default.animName", { n: i + 1 });
    const frames = Array.isArray(a.frames)
      ? a.frames
          .map((f) => ({
            spriteId: String(f.spriteId || ""),
            durationMs: Math.max(1, Number(f.durationMs) || 100),
          }))
          .filter((f) => spriteIds.has(f.spriteId))
      : [];
    return { id, name, frames };
  });
}

export const useProjectStore = defineStore("project", {
  state: () => ({
    name: "Untitled",
    /** @type {Sprite[]} */
    sprites: [],
    /** @type {string[]} */
    selectedIds: [],
    /** @type {Animation[]} */
    animations: [],
    /** @type {string | null} */
    selectedAnimationId: null,
    /** 时间线 / 属性面板当前高亮的动画帧下标 */
    selectedTimelineFrameIndex: /** @type {number | null} */ (null),
    view: { scale: 1, offsetX: 0, offsetY: 0 },
    statusMessage: T("status.ready"),
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
    selected(state) {
      const id = state.selectedIds[0];
      if (!id) return null;
      return state.sprites.find((s) => s.id === id) || null;
    },
    selectedCount(state) {
      return state.selectedIds.length;
    },
    selectedSprites(state) {
      const set = new Set(state.selectedIds);
      return state.sprites.filter((s) => set.has(s.id));
    },
    selectedAnimation(state) {
      if (!state.selectedAnimationId) return null;
      return (
        state.animations.find((a) => a.id === state.selectedAnimationId) || null
      );
    },
  },
  actions: {
    blurAnimationSelection() {
      this.selectedAnimationId = null;
    },
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
    setStatus(msg) {
      this.statusMessage = msg;
    },
    syncSelectionStatus() {
      const n = this.selectedIds.length;
      if (n > 0) {
        if (n === 1) {
          const s = this.selected;
          this.setStatus(
            s ? T("status.selectedSprite", { name: s.name }) : T("status.ready")
          );
        } else this.setStatus(T("status.selectedSprites", { n }));
        return;
      }
      if (this.selectedAnimationId) {
        const a = this.animations.find(
          (x) => x.id === this.selectedAnimationId
        );
        this.setStatus(
          a ? T("status.selectedAnim", { name: a.name }) : T("status.ready")
        );
        return;
      }
      this.setStatus(T("status.ready"));
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
      if (next.length > 0) {
        this.selectedAnimationId = null;
        this.selectedTimelineFrameIndex = null;
      }
      this.syncSelectionStatus();
    },
    /** 仅清除精灵选中（不取消当前选中的动画序列） */
    clearSelection() {
      this.selectedIds = [];
      this.syncSelectionStatus();
    },
    addToSelection(ids) {
      this.selectedAnimationId = null;
      this.selectedTimelineFrameIndex = null;
      const set = new Set(this.selectedIds);
      for (const id of ids) {
        if (this.sprites.some((s) => s.id === id)) set.add(id);
      }
      this.selectedIds = [...set];
      this.syncSelectionStatus();
    },
    toggleSelection(id) {
      this.selectedAnimationId = null;
      this.selectedTimelineFrameIndex = null;
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
      this.selectedAnimationId = null;
      this.selectedTimelineFrameIndex = null;
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
    /** @param {string | null} id */
    selectAnimation(id) {
      this.selectedIds = [];
      this.selectedAnimationId = id;
      this.selectedTimelineFrameIndex = null;
      this.syncSelectionStatus();
    },
    /** @param {number} index */
    selectTimelineFrame(index) {
      const a = this.selectedAnimation;
      if (!a || index < 0 || index >= a.frames.length) return;
      this.selectedTimelineFrameIndex = index;
    },
    clearTimelineFrameSelect() {
      this.selectedTimelineFrameIndex = null;
    },
    addAnimation() {
      const def =
        this.selectedIds.length === 1 ? this.selectedIds[0] : this.sprites[0]?.id;
      const a = newAnimation(this.animations.length, def || null);
      this.animations.push(a);
      this.selectAnimation(a.id);
      this.setStatus(T("status.newAnim", { name: a.name }));
    },
    deleteSelectedAnimation() {
      if (!this.selectedAnimationId) return;
      const id = this.selectedAnimationId;
      this.animations = this.animations.filter((a) => a.id !== id);
      this.selectedAnimationId = null;
      this.selectedTimelineFrameIndex = null;
      this.syncSelectionStatus();
      this.setStatus(T("status.animDeleted"));
    },
    updateAnimationName(name) {
      const a = this.selectedAnimation;
      if (!a) return;
      a.name = String(name);
      this.syncSelectionStatus();
    },
    /** @param {string} spriteId */
    addAnimFrame(spriteId) {
      const a = this.selectedAnimation;
      if (!a || !this.sprites.some((s) => s.id === spriteId)) return;
      a.frames.push({ spriteId, durationMs: 100 });
    },
    /** @param {number} index */
    removeAnimFrame(index) {
      const a = this.selectedAnimation;
      if (!a) return;
      a.frames.splice(index, 1);
      const ti = this.selectedTimelineFrameIndex;
      if (ti != null) {
        if (ti === index) this.selectedTimelineFrameIndex = null;
        else if (ti > index) this.selectedTimelineFrameIndex = ti - 1;
      }
    },
    /** @param {number} index */
    moveAnimFrame(index, delta) {
      const a = this.selectedAnimation;
      if (!a) return;
      const j = index + delta;
      if (j < 0 || j >= a.frames.length) return;
      const t = a.frames[index];
      a.frames[index] = a.frames[j];
      a.frames[j] = t;
      this.selectedTimelineFrameIndex = null;
    },
    /** @param {number} index @param {number} ms */
    setAnimFrameDuration(index, ms) {
      const a = this.selectedAnimation;
      if (!a || !a.frames[index]) return;
      a.frames[index].durationMs = Math.max(1, Number(ms) || 100);
    },
    /** @param {number} index @param {string} spriteId */
    setAnimFrameSprite(index, spriteId) {
      const a = this.selectedAnimation;
      if (!a || !a.frames[index]) return;
      if (!this.sprites.some((s) => s.id === spriteId)) return;
      a.frames[index].spriteId = spriteId;
    },
    removeSpriteRefsFromAnimations(removedIds) {
      const set = new Set(removedIds);
      for (const a of this.animations) {
        a.frames = a.frames.filter((f) => !set.has(f.spriteId));
      }
    },
    newProject() {
      this.name = "Untitled";
      this.sprites = [];
      this.selectedIds = [];
      this.animations = [];
      this.selectedAnimationId = null;
      this.selectedTimelineFrameIndex = null;
      this.view = { scale: 1, offsetX: 0, offsetY: 0 };
      this.sheetImageDataUrl = null;
      this.sheetFileName = null;
      this.sheetWidth = 0;
      this.sheetHeight = 0;
      this.spriteClipboard = [];
      this.setStatus(T("status.newProject"));
    },
    addSprite() {
      const s = newSprite(
        this.sprites.length,
        this.sheetWidth,
        this.sheetHeight
      );
      this.sprites.push(s);
      this.setSelection([s.id]);
      this.setStatus(T("status.addedSprite", { name: s.name }));
    },
    selectAllSprites() {
      this.setSelection(this.sprites.map((s) => s.id));
    },
    copySelection() {
      const list = this.selectedSprites;
      if (!list.length) {
        this.setStatus(T("status.noCopy"));
        return;
      }
      for (const s of list) ensureSpriteGeometry(s);
      this.spriteClipboard = list.map((s) => ({
        name: s.name,
        frame: {
          x: s.frame.x,
          y: s.frame.y,
          w: s.frame.w,
          h: s.frame.h,
        },
        pivot: { x: s.pivot.x, y: s.pivot.y },
        inset: {
          top: s.inset.top,
          right: s.inset.right,
          bottom: s.inset.bottom,
          left: s.inset.left,
        },
      }));
      this.setStatus(T("status.copied", { n: list.length }));
    },
    pasteSprites() {
      if (!this.spriteClipboard.length) {
        this.setStatus(T("status.clipboardEmpty"));
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
          pivot: row.pivot
            ? { x: row.pivot.x, y: row.pivot.y }
            : defaultPivot(),
          inset: row.inset
            ? {
                top: row.inset.top,
                right: row.inset.right,
                bottom: row.inset.bottom,
                left: row.inset.left,
              }
            : defaultInset(),
        };
        this.sprites.push(spr);
        this.clampSpriteFrameToSheet(spr);
      }
      this.setSelection(newIds);
      this.setStatus(T("status.pasted", { n: newIds.length }));
    },
    deleteSelection() {
      const set = new Set(this.selectedIds);
      if (!set.size) {
        this.setStatus(T("status.noDelete"));
        return;
      }
      const n = set.size;
      this.removeSpriteRefsFromAnimations([...set]);
      this.sprites = this.sprites.filter((s) => !set.has(s.id));
      this.clearSelection();
      this.setStatus(T("status.deleted", { n }));
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
          reject(new Error(T("errors.sheetImageDecodeFailed")));
        };
        img.src = this.sheetImageDataUrl;
      });
    },
    async setSpriteSheetImage(file) {
      try {
        const url = await readFileAsDataURL(file);
        this.sheetImageDataUrl = url;
        this.sheetFileName = file.name;
        await this.refreshSheetDimensionsFromUrl();
        this.setStatus(T("status.sheetSet", { file: file.name }));
      } catch (e) {
        this.setStatus(T("status.sheetFailed", { msg: e?.message || e }));
      }
    },
    async importAtlas(jsonFile, imageFile) {
      try {
        const text = await readFileAsText(jsonFile);
        const parsed = parseAtlasJson(text);
        const url = await readFileAsDataURL(imageFile);
        this.sheetImageDataUrl = url;
        this.sheetFileName = imageFile.name;
        await this.refreshSheetDimensionsFromUrl();
        this.animations = [];
        this.selectedAnimationId = null;
        this.selectedTimelineFrameIndex = null;
        this.sprites = parsed.sprites.map((r, i) => {
          const spr = {
            id: crypto.randomUUID(),
            name: r.name || `Sprite ${i + 1}`,
            frame: { x: r.x, y: r.y, w: r.w, h: r.h },
            pivot: r.pivot
              ? { x: r.pivot.x, y: r.pivot.y }
              : defaultPivot(),
            inset: r.inset
              ? {
                  top: r.inset.top,
                  right: r.inset.right,
                  bottom: r.inset.bottom,
                  left: r.inset.left,
                }
              : defaultInset(),
          };
          this.clampSpriteFrameToSheet(spr);
          return spr;
        });
        this.setSelection(this.sprites.map((s) => s.id));
        this.setStatus(
          T("status.importAtlasDone", {
            count: parsed.sprites.length,
            hint: parsed.imageHint,
          })
        );
      } catch (e) {
        this.setStatus(T("status.importAtlasFailed", { msg: e?.message || e }));
      }
    },
    clampSpriteFrameToSheet(s) {
      if (!(this.sheetWidth > 0 && this.sheetHeight > 0)) {
        ensureSpriteGeometry(s);
        return;
      }
      const f = s.frame;
      f.w = Math.max(1, Math.min(f.w, this.sheetWidth));
      f.h = Math.max(1, Math.min(f.h, this.sheetHeight));
      f.x = Math.max(0, Math.min(f.x, this.sheetWidth - f.w));
      f.y = Math.max(0, Math.min(f.y, this.sheetHeight - f.h));
      ensureSpriteGeometry(s);
    },
    updateSelected(patch) {
      const s = this.selected;
      if (!s || this.selectedIds.length !== 1) return;
      if (!s.pivot) s.pivot = defaultPivot();
      if (!s.inset) s.inset = defaultInset();
      if (patch.name !== undefined) s.name = String(patch.name);
      if (patch.frame) {
        const f = s.frame;
        const q = patch.frame;
        if (q.x !== undefined) f.x = Number(q.x) || 0;
        if (q.y !== undefined) f.y = Number(q.y) || 0;
        if (q.w !== undefined) f.w = Math.max(1, Number(q.w) || 1);
        if (q.h !== undefined) f.h = Math.max(1, Number(q.h) || 1);
      }
      if (patch.pivot && typeof patch.pivot === "object") {
        const q = patch.pivot;
        if (q.x !== undefined) s.pivot.x = Number(q.x) || 0;
        if (q.y !== undefined) s.pivot.y = Number(q.y) || 0;
      }
      if (patch.inset && typeof patch.inset === "object") {
        const q = patch.inset;
        const ins = s.inset;
        if (q.top !== undefined) ins.top = Math.max(0, Number(q.top) || 0);
        if (q.right !== undefined) ins.right = Math.max(0, Number(q.right) || 0);
        if (q.bottom !== undefined)
          ins.bottom = Math.max(0, Number(q.bottom) || 0);
        if (q.left !== undefined) ins.left = Math.max(0, Number(q.left) || 0);
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
        this.setStatus(T("status.fitView"));
    },
    async exportAtlas() {
      if (this.sprites.length === 0) {
        this.setStatus(T("status.exportNoSprites"));
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
        this.setStatus(T("status.exportDone"));
      } catch (e) {
        this.setStatus(T("status.exportFailed", { msg: e?.message || e }));
      }
    },
    saveProjectFile() {
      const data = {
        version: 1,
        name: this.name,
        sprites: this.sprites,
        animations: this.animations,
        selectedIds: this.selectedIds,
        selectedAnimationId: this.selectedAnimationId,
        selectedTimelineFrameIndex: this.selectedTimelineFrameIndex,
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
      this.setStatus(T("status.projectSaved"));
    },
    loadProjectFromText(text) {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.sprites))
        throw new Error(T("errors.invalidProjectFile"));
      this.name = data.name || "Imported";
      this.sprites = data.sprites.map((raw, i) => {
        const spr = {
          id: raw.id || crypto.randomUUID(),
          name: raw.name || T("default.spriteName", { n: i + 1 }),
          frame: {
            x: Number(raw.frame?.x) || 0,
            y: Number(raw.frame?.y) || 0,
            w: Math.max(1, Number(raw.frame?.w) || 32),
            h: Math.max(1, Number(raw.frame?.h) || 32),
          },
          pivot: raw.pivot
            ? {
                x: Number(raw.pivot.x) || 0,
                y: Number(raw.pivot.y) || 0,
              }
            : defaultPivot(),
          inset: raw.inset
            ? {
                top: Math.max(0, Number(raw.inset.top) || 0),
                right: Math.max(0, Number(raw.inset.right) || 0),
                bottom: Math.max(0, Number(raw.inset.bottom) || 0),
                left: Math.max(0, Number(raw.inset.left) || 0),
              }
            : defaultInset(),
        };
        ensureSpriteGeometry(spr);
        return spr;
      });
      this.animations = normalizeAnimations(data.animations, this.sprites);
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
      const animId = data.selectedAnimationId;
      if (
        animId &&
        this.animations.some((a) => a.id === animId) &&
        !this.selectedIds.length
      ) {
        this.selectedAnimationId = animId;
        const cur = this.animations.find((a) => a.id === animId);
        const tfi = data.selectedTimelineFrameIndex;
        if (
          cur &&
          typeof tfi === "number" &&
          tfi >= 0 &&
          tfi < cur.frames.length
        ) {
          this.selectedTimelineFrameIndex = tfi;
        } else {
          this.selectedTimelineFrameIndex = null;
        }
      } else {
        this.selectedAnimationId = null;
        this.selectedTimelineFrameIndex = null;
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
      this.setStatus(T("status.projectOpened", { name: this.name }));
    },
  },
});
