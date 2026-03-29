/**
 * 统一解析第三方与本工具的图集描述（JSON / XML），输出与旧版 parseAtlasJson 相同的结构。
 */

/**
 * @typedef {{ name: string, x: number, y: number, w: number, h: number, pivot?: object, inset?: object }} AtlasSpriteRow
 */

/**
 * @param {string} key
 */
function atlasErr(key) {
  const e = new Error(key);
  /** @type {any} */ (e).atlasKey = key;
  return e;
}

/**
 * @param {Record<string, unknown> | null | undefined} obj
 */
function readRect(obj) {
  if (!obj || typeof obj !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (obj);
  const x = Number(o.x ?? o.X ?? 0);
  const y = Number(o.y ?? o.Y ?? 0);
  const w = Number(o.w ?? o.width ?? o.W);
  const h = Number(o.h ?? o.height ?? o.H);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: Math.max(1, Math.round(w)),
    h: Math.max(1, Math.round(h)),
  };
}

/**
 * TexturePacker / Pixi 等：单帧对象
 * @param {Record<string, unknown>} fr
 */
function rectFromTexturePackerFrame(fr) {
  if (!fr || typeof fr !== "object") return null;
  const inner = fr.frame;
  if (inner && typeof inner === "object") {
    const r = readRect(/** @type {Record<string, unknown>} */ (inner));
    if (r) return r;
  }
  return readRect(fr);
}

/**
 * @param {unknown} s
 */
function isMetadataSpriteRow(s) {
  if (!s || typeof s !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (s);
  const f = o.frame;
  return (
    f &&
    typeof f === "object" &&
    Number.isFinite(Number((/** @type {Record<string, unknown>} */ (f)).w))
  );
}

/**
 * @param {unknown} s
 */
function isNativeSpriteRow(s) {
  if (!s || typeof s !== "object") return false;
  const o = /** @type {Record<string, unknown>} */ (s);
  return Number.isFinite(Number(o.w)) && Number.isFinite(Number(o.h));
}

/**
 * @param {Record<string, unknown>} raw
 * @param {number} i
 * @returns {AtlasSpriteRow}
 */
function rowFromNative(raw, i) {
  const row = {
    name: String(raw.name ?? `Sprite ${i + 1}`),
    x: Math.round(Number(raw.x) || 0),
    y: Math.round(Number(raw.y) || 0),
    w: Math.max(1, Math.round(Number(raw.w) || 1)),
    h: Math.max(1, Math.round(Number(raw.h) || 1)),
  };
  if (raw.pivot && typeof raw.pivot === "object") {
    const p = /** @type {Record<string, unknown>} */ (raw.pivot);
    row.pivot = {
      x: Number(p.x) || 0,
      y: Number(p.y) || 0,
    };
  }
  if (raw.inset && typeof raw.inset === "object") {
    const ins = /** @type {Record<string, unknown>} */ (raw.inset);
    row.inset = {
      top: Math.max(0, Number(ins.top) || 0),
      right: Math.max(0, Number(ins.right) || 0),
      bottom: Math.max(0, Number(ins.bottom) || 0),
      left: Math.max(0, Number(ins.left) || 0),
    };
  }
  return row;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {number} i
 * @returns {AtlasSpriteRow}
 */
function rowFromMetadataSprite(raw, i) {
  const f = /** @type {Record<string, unknown>} */ (raw.frame);
  const row = {
    name: String(raw.name ?? `Sprite ${i + 1}`),
    x: Math.round(Number(f.x) || 0),
    y: Math.round(Number(f.y) || 0),
    w: Math.max(1, Math.round(Number(f.w) || 1)),
    h: Math.max(1, Math.round(Number(f.h) || 1)),
  };
  if (raw.pivot && typeof raw.pivot === "object") {
    const p = /** @type {Record<string, unknown>} */ (raw.pivot);
    row.pivot = { x: Number(p.x) || 0, y: Number(p.y) || 0 };
  }
  if (raw.inset && typeof raw.inset === "object") {
    const ins = /** @type {Record<string, unknown>} */ (raw.inset);
    row.inset = {
      top: Math.max(0, Number(ins.top) || 0),
      right: Math.max(0, Number(ins.right) || 0),
      bottom: Math.max(0, Number(ins.bottom) || 0),
      left: Math.max(0, Number(ins.left) || 0),
    };
  }
  return row;
}

/**
 * @param {Record<string, unknown>} data
 */
function parseJsonRoot(data) {
  const imageFromMeta = () => {
    const meta = data.meta;
    if (meta && typeof meta === "object") {
      const m = /** @type {Record<string, unknown>} */ (meta);
      if (typeof m.image === "string") return m.image;
      if (typeof m.texture === "string") return m.texture;
    }
    if (typeof data.image === "string") return data.image;
    return "atlas.png";
  };

  // 本工具导出的元数据 JSON
  if (
    data.format === "sprite2d-atlas-metadata" &&
    Array.isArray(data.sprites)
  ) {
    const sprites = data.sprites.map((s, i) =>
      rowFromMetadataSprite(/** @type {Record<string, unknown>} */ (s), i)
    );
    const img = data.image;
    let imageHint = "atlas.png";
    if (img && typeof img === "object") {
      const im = /** @type {Record<string, unknown>} */ (img);
      if (typeof im.path === "string" && im.path) imageHint = im.path;
    }
    return {
      version: Number(data.version) || 1,
      imageHint,
      sprites,
      formatHint: "sprite2dMetadata",
    };
  }

  // sprites 数组：区分嵌套 frame（元数据行）与平面 x,y,w,h（本工具 atlas.json）
  if (Array.isArray(data.sprites) && data.sprites.length > 0) {
    const first = data.sprites[0];
    if (isMetadataSpriteRow(first)) {
      const sprites = data.sprites.map((s, i) =>
        rowFromMetadataSprite(/** @type {Record<string, unknown>} */ (s), i)
      );
      return {
        version: Number(data.version) || 1,
        imageHint: imageFromMeta(),
        sprites,
        formatHint: "spritesWithFrame",
      };
    }
    if (isNativeSpriteRow(first)) {
      const sprites = data.sprites.map((s, i) =>
        rowFromNative(/** @type {Record<string, unknown>} */ (s), i)
      );
      return {
        version: Number(data.version) || 1,
        imageHint: imageFromMeta(),
        sprites,
        formatHint: "nativeAtlasJson",
      };
    }
  }

  // TexturePacker Hash：frames 为 { "a.png": { frame: {x,y,w,h}, ... } }
  if (
    data.frames &&
    typeof data.frames === "object" &&
    !Array.isArray(data.frames)
  ) {
    const frames = /** @type {Record<string, unknown>} */ (data.frames);
    const sprites = [];
    let i = 0;
    for (const key of Object.keys(frames)) {
      const fr = frames[key];
      const r = rectFromTexturePackerFrame(
        /** @type {Record<string, unknown>} */ (fr)
      );
      if (!r) continue;
      const baseName = key.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || key;
      sprites.push({
        name: baseName || `Sprite ${i + 1}`,
        ...r,
      });
      i++;
    }
    if (!sprites.length) throw atlasErr("errors.atlasNoFrames");
    return {
      version: Number(data.version) || 1,
      imageHint: imageFromMeta(),
      sprites,
      formatHint: "texturePackerHash",
    };
  }

  // TexturePacker JSON Array：frames 为数组
  if (Array.isArray(data.frames)) {
    const sprites = [];
    for (let i = 0; i < data.frames.length; i++) {
      const item = data.frames[i];
      if (!item || typeof item !== "object") continue;
      const o = /** @type {Record<string, unknown>} */ (item);
      const name = String(
        o.filename ?? o.name ?? `Sprite ${i + 1}`
      ).replace(/^.*[/\\]/, "");
      const r = rectFromTexturePackerFrame(o);
      if (!r) continue;
      sprites.push({
        name: name.replace(/\.[^.]+$/, "") || name || `Sprite ${i + 1}`,
        ...r,
      });
    }
    if (!sprites.length) throw atlasErr("errors.atlasNoFrames");
    return {
      version: Number(data.version) || 1,
      imageHint: imageFromMeta(),
      sprites,
      formatHint: "texturePackerArray",
    };
  }

  // Phaser 3 / 部分工具：textures[0].sprites 或 textures[0].frames（哈希表）
  if (Array.isArray(data.textures) && data.textures[0]) {
    const tex = /** @type {Record<string, unknown>} */ (data.textures[0]);
    const sprs = tex.sprites;
    if (Array.isArray(sprs) && sprs.length) {
      const sprites = [];
      for (let i = 0; i < sprs.length; i++) {
        const s = sprs[i];
        if (!s || typeof s !== "object") continue;
        const o = /** @type {Record<string, unknown>} */ (s);
        const name = String(o.filename ?? o.name ?? `Sprite ${i + 1}`);
        const region = o.region;
        const r = readRect(
          region && typeof region === "object"
            ? /** @type {Record<string, unknown>} */ (region)
            : o
        );
        if (!r) continue;
        sprites.push({
          name: name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || name,
          ...r,
        });
      }
      if (!sprites.length) throw atlasErr("errors.atlasNoFrames");
      const imageHint =
        typeof tex.image === "string"
          ? tex.image
          : typeof data.image === "string"
            ? data.image
            : imageFromMeta();
      return {
        version: Number(data.version) || 1,
        imageHint,
        sprites,
        formatHint: "texturesArray",
      };
    }
    const texFrames = tex.frames;
    if (
      texFrames &&
      typeof texFrames === "object" &&
      !Array.isArray(texFrames)
    ) {
      const frames = /** @type {Record<string, unknown>} */ (texFrames);
      const sprites = [];
      let i = 0;
      for (const key of Object.keys(frames)) {
        const fr = frames[key];
        const r = rectFromTexturePackerFrame(
          /** @type {Record<string, unknown>} */ (fr)
        );
        if (!r) continue;
        const baseName = key.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || key;
        sprites.push({
          name: baseName || `Sprite ${i + 1}`,
          ...r,
        });
        i++;
      }
      if (!sprites.length) throw atlasErr("errors.atlasNoFrames");
      const imageHint =
        typeof tex.image === "string"
          ? tex.image
          : typeof data.image === "string"
            ? data.image
            : "atlas.png";
      return {
        version: Number(data.version) || 1,
        imageHint,
        sprites,
        formatHint: "phaser3TextureFrames",
      };
    }
  }

  throw atlasErr("errors.atlasUnrecognized");
}

/**
 * @param {string} text
 */
function parseAtlasXml(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw atlasErr("errors.atlasXmlInvalid");
  }

  const root = doc.documentElement;
  if (!root) throw atlasErr("errors.atlasXmlInvalid");

  const tag = root.localName.toLowerCase();
  /** @type {AtlasSpriteRow[]} */
  const sprites = [];
  let imageHint = "atlas.png";

  if (tag === "textureatlas") {
    imageHint =
      root.getAttribute("imagepath") ||
      root.getAttribute("imagePath") ||
      root.getAttribute("image") ||
      imageHint;
    root.querySelectorAll("SubTexture, subtexture").forEach((el, i) => {
      const name =
        el.getAttribute("name") || el.getAttribute("id") || `Sprite ${i + 1}`;
      const x = Math.round(Number(el.getAttribute("x") || 0));
      const y = Math.round(Number(el.getAttribute("y") || 0));
      const w = Math.max(
        1,
        Math.round(
          Number(
            el.getAttribute("width") ||
              el.getAttribute("w") ||
              el.getAttribute("frameWidth") ||
              1
          )
        )
      );
      const h = Math.max(
        1,
        Math.round(
          Number(
            el.getAttribute("height") ||
              el.getAttribute("h") ||
              el.getAttribute("frameHeight") ||
              1
          )
        )
      );
      sprites.push({
        name: String(name).replace(/\.[^.]+$/, "") || String(name),
        x,
        y,
        w,
        h,
      });
    });
  }

  if (!sprites.length) {
    doc.querySelectorAll("sprite").forEach((el, i) => {
      const name =
        el.getAttribute("name") ||
        el.getAttribute("id") ||
        `Sprite ${i + 1}`;
      const x = Math.round(Number(el.getAttribute("x") || 0));
      const y = Math.round(Number(el.getAttribute("y") || 0));
      const w = Math.max(
        1,
        Math.round(
          Number(el.getAttribute("width") || el.getAttribute("w") || 1)
        )
      );
      const h = Math.max(
        1,
        Math.round(
          Number(el.getAttribute("height") || el.getAttribute("h") || 1)
        )
      );
      sprites.push({
        name: String(name).replace(/\.[^.]+$/, "") || String(name),
        x,
        y,
        w,
        h,
      });
    });
  }

  if (!sprites.length) throw atlasErr("errors.atlasXmlNoSprites");

  return {
    version: 1,
    imageHint,
    sprites,
    formatHint: "xmlStarling",
  };
}

/**
 * 根据文件内容与扩展名自动选择 JSON / XML 解析，支持：
 * - 本工具 atlas.json（sprites 平面 x,y,w,h）
 * - 本工具「图集描述」JSON（format: sprite2d-atlas-metadata）
 * - TexturePacker Generic（frames 对象或数组）、Pixi spritesheet 等
 * - Phaser 3 常见 textures[].sprites + region
 * - Starling / TexturePacker XML（TextureAtlas + SubTexture）
 *
 * @param {string} text
 * @param {string} [filename] 用于判断 XML / JSON
 * @returns {{ version: number, imageHint: string, sprites: AtlasSpriteRow[], formatHint?: string }}
 */
export function parseAtlasDocument(text, filename = "") {
  const trimmed = text.trim();
  const lower = filename.toLowerCase();

  if (
    trimmed.startsWith("<") ||
    lower.endsWith(".xml") ||
    lower.endsWith(".plist")
  ) {
    if (lower.endsWith(".plist")) {
      throw atlasErr("errors.atlasPlistNotSupported");
    }
    return parseAtlasXml(text);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw atlasErr("errors.atlasInvalidJson");
  }
  if (!data || typeof data !== "object") {
    throw atlasErr("errors.atlasInvalidJson");
  }
  return parseJsonRoot(/** @type {Record<string, unknown>} */ (data));
}

/** @deprecated 使用 parseAtlasDocument；保留兼容旧调用 */
export function parseAtlasJson(text) {
  return parseAtlasDocument(text, ".json");
}
