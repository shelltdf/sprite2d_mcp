# 物理规格：sprite-sheet-compiler-gui

## 构建与运行

- Node.js LTS 推荐；依赖由 `package-lock.json` / `npm install` 管理。
- 开发：`npm run dev`（Vite，默认 `http://localhost:5173`）。
- 生产构建：`npm run build`，输出 `dist/`。

## 界面结构（必须）

1. 顶部 **菜单栏**（下拉项可折叠）。
2. 菜单栏正下方 **工具栏**（横向图标按钮组）。
3. 主体：**左侧 Dock**（精灵图、精灵对象表、动画序列）；**中央**为上下结构：**上** 2D 画布，**下** **动画时间线 Dock**（按帧时长比例显示条带、标尺、可选播放）；**右侧** 属性（精灵或动画序列）；选中单个精灵且已设置精灵表位图时，**预览**为从底图按当前矩形裁剪并缩放的像素视图（无位图时仍为占位色块）。选中动画序列且帧非空时，属性区提供**动画预览**（按帧时长轮播当前帧精灵切片，与时间线播放相互独立）。
4. 底部 **状态栏**（双端对齐：消息 / 缩放与选中摘要）。

## 视觉

- 使用接近 Windows 11 的浅灰/chrome 色（`#f3f3f3` 类背景）、`Segoe UI` 优先字体；具体颜色由 CSS 变量 `--win-*` 提供（`src/styles/theme.css`），支持浅色 / 深色 / 跟随系统（`prefers-color-scheme`）。
- 1px 边框分隔面板（`#d0d0d0` 级，变量 `--win-border`）。

## 国际化与主题（实现约定）

- **i18n**：`vue-i18n`（Composition API），包 `zh-CN` / `en-US`；默认语言由已存 `sprite2d-locale` 或浏览器 `navigator.language`（`zh` 前缀 → 中文）决定。
- **主题**：Pinia `ui` store，`sprite2d-theme` 取值 `system` | `light` | `dark`，默认 `system`。

## 数据字段（精灵）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUID |
| `name` | string | 显示名 |
| `frame.x` | number | 整数像素 |
| `frame.y` | number | 整数像素 |
| `frame.w` | number | 宽度 > 0 |
| `frame.h` | number | 高度 > 0 |
| `pivot.x` / `pivot.y` | number | 整数像素；锚点相对精灵矩形左上角；钳制在 `[0, frame.w]` / `[0, frame.h]`；**缺省**（工程/导入无 `pivot` 字段）为矩形中心 `floor(w/2), floor(h/2)`；旧工程若 JSON 中显式写出 `{0,0}` 则保留 |
| `inset.top` / `right` / `bottom` / `left` | number | 内边界：从对应边向矩形内的留白（≥0）；与对边之和须小于宽/高 |

## 数据字段（动画序列）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUID |
| `name` | string | 显示名 |
| `frames[]` | array | 每项 `spriteId` + `durationMs`（≥1） |

## 视图变换

| 字段 | 范围 | 说明 |
|------|------|------|
| `view.scale` | 0.1–8 | 画布缩放 |
| `view.offsetX` | number | 世界平移像素 |
| `view.offsetY` | number | 世界平移像素 |

## 导出 `atlas.json`（version 1）

```json
{
  "version": 1,
  "image": "atlas.png",
  "sprites": [
    {
      "name": "...",
      "x": 0,
      "y": 0,
      "w": 32,
      "h": 32,
      "pivot": { "x": 16, "y": 16 },
      "inset": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
    }
  ]
}
```

坐标原点左上，单位像素。`pivot` / `inset` 为打包后图块坐标系下的元数据（与源精灵表上的 `frame` 独立存储于工程文件；导出 JSON 中随每个 sprite 写出）。

## 术语

- **精灵表**：编辑时使用的源图底图（spritesheet），对应菜单「设置精灵表图片」。
- **图集**：打包导出产物（atlas），对应菜单「导入第三方图集 / 导出第三方图集」及 `atlas.png` + `atlas.json`。

## 设置精灵表图片

- 菜单 **文件 → 设置精灵表图片…** 或工具栏同名按钮：选择 PNG / JPEG / WebP / GIF / BMP。
- 底图以 **左上角为原点** 绘制在世界坐标 `(0,0)`，尺寸为图片原始像素。
- 设置后**不会**自动创建精灵；仅替换底图尺寸与显示。已有精灵时保留其选区（仍受新底图边界钳制）。
- 导出第三方打包图集时若存在精灵表底图，按各精灵 `frame` 从底图 **切片**；无底图时仍使用色块占位。

## 导入第三方图集

- 菜单 **文件 → 导入第三方图集…** 或工具栏 **导入第三方图集**：先选**描述文件**（`JSON` 或 `XML`），再选**精灵表位图**（PNG / JPEG / WebP 等）。
- 描述格式自动识别，包括但不限于：**本工具** `atlas.json` 与「图集描述」元数据 JSON；**TexturePacker** Generic（`frames` 对象或数组）、**Pixi** 同类结构；**Phaser 3** `textures[].sprites` 或 `textures[].frames`；**Starling / TexturePacker XML**（`TextureAtlas` + `SubTexture`）；以及根下带 `sprite` 矩形节点的简易 XML。
- **不支持** TexturePacker 的 `.plist`（请改导出为 JSON 或 Starling XML）。
- 导入后将位图设为当前精灵表，并按描述中的矩形重建精灵列表与选区（第三方格式中的 `pivot`/`inset` 若存在则一并读取）。

## 选择与编辑

- **左侧精灵列表**：中部 Dock 块在垂直方向 **flex 占满** 可用高度，表体区域可滚动。
- **双击列表行**：选中该精灵，并向画布派发 `sprite2d-focus-sprite`；画布将精灵 **中心** 平移到视口中心，**不改变** `view.scale`，仅更新 `offsetX` / `offsetY`。
- **frame 取整**：`x,y,w,h` 在钳制、属性提交、画布拖动/缩放边结束后均 **取整**（`w,h ≥ 1`）。
- **属性预览**：提供 **辅助线** 复选框（默认开），可隐藏内边界虚线框与锚点圆点叠加。
- **多选**：列表行 **Shift** 追加、**Ctrl** 切换；画布上 **Shift/Ctrl** 点选规则相同。
- **框选**：在画布空白处按下左键拖动，松开后与矩形相交的精灵被选中；**Shift** 框选为追加。单击空白（无拖动）清除选择。
- **成组移动**：多选时拖动其中一个，全体同步平移（仍受精灵表边界钳制）。**仅当指针按下时，被点的精灵已在选中集中**才会开始拖动；首次点选未选中的精灵只会改变选中，避免误拖。
- **精灵** 菜单：添加精灵、全选、复制、粘贴、删除；快捷键 Ctrl+C / Ctrl+V / Ctrl+A、Delete。
- **添加精灵**：若指针当前在画布区域内，新精灵矩形**中心**落在指针世界坐标处；否则落在**当前视口中心**的世界坐标处（无精灵表时仍可在无限平面上放置；有精灵表时矩形钳制在图内）。

## 工程文件（`.spriteproj.json`）

- **文件菜单**：除「保存工程」外提供 **「另存工程」**：浏览器内通过 `prompt` 输入工程显示名并下载 JSON；**下载文件名**为非字母数字字符替换为下划线的 ASCII 安全主干；`name` 字段与输入一致。
- **version 2（当前）**：保存工程名、`sprites`（完整属性）、`animations`（完整帧列表与时长）、视图状态与选择状态；精灵表仅保存 **`sheetImagePath` / `sheetFileName` 与 `sheetWidth` / `sheetHeight`**，**不**内嵌 `data:` 像素。浏览器选单文件时 `sheetImagePath` 多为文件名；若自文件夹选择器导入可为相对路径（`webkitRelativePath`）。
- **version 1（兼容读取）**：若存在 `sheetImageDataUrl`（`data:`）且 `version < 2`，仍按内嵌位图加载；再次「保存工程」后升级为 v2 路径引用模式（需用户重新关联精灵表文件方可显示像素）。
- 打开仅含路径的 v2 工程时，状态栏提示用户通过「精灵图 → 设置精灵表图片」重新选择文件。

## 第三方图集描述导出（无像素）

- 菜单 **文件 → 导出第三方图集描述（JSON/XML）…**：下载仅含元数据的文件（精灵表 **路径**、尺寸、全部精灵 `frame`/`pivot`/`inset`、全部动画与帧引用），**不含**任何位图或 Base64。
- JSON 根字段含 `format: "sprite2d-atlas-metadata"`、`projectName`、`image.path`、`image.width`/`height`、`sprites[]`、`animations[]`。

## 重要过程：导出第三方图集（打包像素）

1. 若 `sprites.length === 0`，在状态栏显示错误提示，**不**下载文件。
2. 否则按行打包算法计算每个精灵在导出画布上的位置，绘制 `atlas.png`，生成配套 `atlas.json`，依次触发浏览器下载。

## 退出码

本目标为 SPA，无 CLI 退出码；`npm run build` 失败时进程非零退出。
