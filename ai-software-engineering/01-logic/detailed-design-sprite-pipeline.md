# 详细设计：精灵与编译管线

## 精灵模型

- `id`：`crypto.randomUUID()`。
- `name`：显示名，默认 `Sprite N`（i18n）。
- `frame`：`{ x, y, w, h }` 世界坐标矩形，**全程整数**，`w,h ≥ 1`；有精灵表时钳制在表内。
- `pivot`：相对矩形左上角，**整数**；缺省为矩形中心 `floor(w/2), floor(h/2)`（无 pivot 字段时由 `ensureSpriteGeometry` 补全）。
- `inset`：四边内缩，非负，与对边之和小于宽/高。

## 列表与 Dock

- 单击行 / 画布点选 / 框选：维护 `selectedIds`（多选）；Shift/Ctrl 在列表与画布一致。
- **双击**精灵行：派发 `sprite2d-focus-sprite`，画布将精灵中心移到**视口中心**（不改 `scale`）。
- 列表区域在 Dock 内 **flex 占满** 中部可用高度。

## 画布交互

- **平移**：中键拖动，或 **空格 + 左键**拖动。
- **缩放**：滚轮以指针为中心 `zoomAt`，`scale ∈ [0.1, 8]`。
- **选中**：命中最上层精灵；右键打开菜单前若未选中则先选中目标。
- **拖动**：仅当 **按下时该精灵已在选中集** 才进入拖动；否则本次操作只做选中（防误拖）。
- **调整尺寸**：单选时角/边手柄拖动，结果取整并经 `clampSpriteFrameToSheet`。
- **添加精灵**：菜单/工具栏添加时，若指针在画布内则以指针世界坐标为**矩形中心**，否则以**视口中心**为世界坐标中心；无表时可在平面上放置。

## 编译（打包导出）

1. `layoutAtlas` 行布局计算导出画布上各块位置。
2. 有精灵表底图则从底图按源 `frame` **切片**绘制；否则色块占位。
3. 生成 `atlas.json`（version 1，含 pivot/inset）。
4. 触发下载 `atlas.png` 与 `atlas.json`。

无精灵时：状态栏错误，不下载。

## 第三方导入

- `atlasImport.js` 自动识别多种 JSON/XML（详见物理 `spec.md`）；`.plist` 不支持。
- 导入后设置底图并重建 `sprites` 列表，再 `clampSpriteFrameToSheet`。

## 第三方元数据导出

- `exportAtlasMetadata.js`：JSON/XML，含工程名、图路径、尺寸、全部精灵与动画，**无像素**。

## 工程持久化

- **保存 / 另存**：`buildProjectFilePayload()`，`version: 2`，无内嵌 `data:` 图；另存可改 `name` 与安全文件名。
- **打开**：兼容 v1 内嵌图；v2 仅路径时需用户重新「设置精灵表图片」。

## 错误与边界

- 极大缩放：已由 `view.scale` 限制。
- 解析失败：`errors.*` i18n 键经状态栏展示。
