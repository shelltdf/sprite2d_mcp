# 数据库 / 存储设计

## 工程文件（建议扩展名 `.spriteproj.json`）

UTF-8 JSON，描述工程内精灵与画布视图（实现可渐进补齐字段）。

```json
{
  "version": 1,
  "name": "string",
  "sprites": [
    {
      "id": "uuid",
      "name": "string",
      "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
      "source": { "optional": "data-url-or-path-hint" }
    }
  ],
  "view": { "scale": 1, "offsetX": 0, "offsetY": 0 },
  "animations": [
    {
      "id": "uuid",
      "name": "Walk",
      "frames": [{ "spriteId": "uuid", "durationMs": 100 }]
    }
  ],
  "selectedAnimationId": null,
  "selectedTimelineFrameIndex": null,
  "selectedIds": ["uuid"],
  "sheetImageDataUrl": "data:image/png;base64,...",
  "sheetFileName": "atlas_source.png",
  "sheetWidth": 512,
  "sheetHeight": 512
}
```

可选字段 `sheetImageDataUrl` 等为已导入精灵表底图；缺失表示无色块底图工程。

## 导出元数据 `atlas.json`

与编译后的图集 PNG 配套，记录每个精灵在图集中的像素矩形与原始名称。

## 持久化策略

- 当前阶段：**本地文件**通过浏览器下载上传（`FileReader` / `a[download]`），无服务端数据库。
