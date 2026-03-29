# 接口设计（程序间）

本工具以**本地 GUI** 为主；对外的程序间接口体现为**导出/导入文件格式**（非 HTTP/RPC）。

## 打包图集 `atlas.json`（与 `atlas.png` 配套）

| 字段 | 类型 | 说明 |
|------|------|------|
| `version` | number | 格式版本，当前为 `1` |
| `image` | string | 图集文件名，如 `atlas.png` |
| `sprites` | array | 每项含 `name`, `x`, `y`, `w`, `h`（**打包后**图集内像素坐标）、`pivot`、`inset` |

坐标系：**左上角原点**，单位像素。与源精灵表上的 `frame` 为不同坐标系；详见物理阶段 `spec.md`。

## 第三方图集描述 JSON（`sprite2d-atlas-metadata`）

由菜单「导出第三方图集描述（JSON）」生成，**不含像素**。根字段示例：

| 字段 | 说明 |
|------|------|
| `format` | 固定 `sprite2d-atlas-metadata` |
| `version` | 数字，当前 `1` |
| `projectName` | 工程显示名 |
| `image.path` / `image.width` / `image.height` | 精灵表路径引用与尺寸 |
| `sprites[]` | `id`, `name`, `frame`, `pivot`, `inset`（**源图**坐标系） |
| `animations[]` | `id`, `name`, `frames[]`（`spriteId`, `durationMs`） |

XML 形态见 `exportAtlasMetadata.js` 生成的根元素 `atlas`。

## 第三方图集导入

支持多种 JSON/XML 描述（TexturePacker、Phaser、Starling XML、本工具格式等），由 `atlasImport.js` 解析；**不**在此罗列 GUI 快捷键（见产品/逻辑阶段文档）。

## 与引擎对接

消费方可使用 PNG + `atlas.json` 或自研管线消费元数据 JSON/XML；Y 轴朝向由引擎自行约定。
