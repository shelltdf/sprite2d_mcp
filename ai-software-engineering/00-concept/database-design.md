# 数据库 / 存储设计

## 工程文件（扩展名 `.spriteproj.json`）

UTF-8 JSON。**当前写入版本为 `version: 2`**（见 `src/stores/project.js` 的 `buildProjectFilePayload()`）。

### version 2（当前保存）

- **不**包含 `sheetImageDataUrl`；精灵表仅 **`sheetImagePath`**（路径/文件名引用，浏览器内常为 `name`）、**`sheetFileName`**、**`sheetWidth`**、**`sheetHeight`**。
- 包含完整 **`sprites`**（`id`, `name`, `frame`, `pivot`, `inset`）、**`animations`**（`id`, `name`, `frames[]` 含 `spriteId`/`durationMs`）、**`selectedIds`**、**`selectedAnimationId`**、**`selectedTimelineFrameIndex`**、**`view`**。

```json
{
  "version": 2,
  "name": "string",
  "sprites": [
    {
      "id": "uuid",
      "name": "string",
      "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
      "pivot": { "x": 16, "y": 16 },
      "inset": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
    }
  ],
  "animations": [
    {
      "id": "uuid",
      "name": "Walk",
      "frames": [{ "spriteId": "uuid", "durationMs": 100 }]
    }
  ],
  "selectedIds": ["uuid"],
  "selectedAnimationId": null,
  "selectedTimelineFrameIndex": null,
  "view": { "scale": 1, "offsetX": 0, "offsetY": 0 },
  "sheetImagePath": "sheet.png",
  "sheetFileName": "sheet.png",
  "sheetWidth": 512,
  "sheetHeight": 512
}
```

### version 1（仅兼容读取）

若 `version < 2` 且存在 **`sheetImageDataUrl`**（`data:`），加载时仍解码内嵌位图；用户再次「保存工程」后文件升级为 v2，需重新关联精灵表文件以显示像素。

## 导出：打包图集 `atlas.json`（version 1）

与编译后的图集 PNG 配套；每项含 `name`, `x`, `y`, `w`, `h`, `pivot`, `inset`（图集内坐标）。详见 `02-physical/.../spec.md`。

## 导出：第三方元数据（无像素）

`format: "sprite2d-atlas-metadata"` 的 JSON/XML，见 `exportAtlasMetadata.js` 与 `interface-design.md`。

## 持久化策略

- **本地文件**：浏览器下载 / `FileReader` 打开，无服务端数据库。
- **另存工程**：`prompt` 输入显示名；下载文件名经 ASCII 安全化（`saveProjectFileAs`）。
