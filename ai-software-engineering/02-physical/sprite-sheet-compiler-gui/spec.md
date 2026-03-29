# 物理规格：sprite-sheet-compiler-gui

## 构建与运行

- Node.js LTS 推荐；依赖由 `package-lock.json` / `npm install` 管理。
- 开发：`npm run dev`（Vite，默认 `http://localhost:5173`）。
- 生产构建：`npm run build`，输出 `dist/`。

## 界面结构（必须）

1. 顶部 **菜单栏**（下拉项可折叠）。
2. 菜单栏正下方 **工具栏**（横向图标按钮组）。
3. 主体：**左侧** 精灵对象表；**中央** 2D 画布；**右侧** 精灵属性预览/编辑。
4. 底部 **状态栏**（双端对齐：消息 / 缩放与选中摘要）。

## 视觉

- 使用接近 Windows 11 的浅灰/chrome 色（`#f3f3f3` 类背景）、`Segoe UI` 优先字体。
- 1px 边框分隔面板（`#d0d0d0` 级）。

## 数据字段（精灵）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | UUID |
| `name` | string | 显示名 |
| `frame.x` | number | 整数像素 |
| `frame.y` | number | 整数像素 |
| `frame.w` | number | 宽度 > 0 |
| `frame.h` | number | 高度 > 0 |

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
  "sprites": [{ "name": "...", "x": 0, "y": 0, "w": 32, "h": 32 }]
}
```

坐标原点左上，单位像素。

## 重要过程：导出

1. 若 `sprites.length === 0`，在状态栏显示错误提示，**不**下载文件。
2. 否则按行打包算法计算每个精灵在导出画布上的位置，绘制 `atlas.png`，生成配套 `atlas.json`，依次触发浏览器下载。

## 退出码

本目标为 SPA，无 CLI 退出码；`npm run build` 失败时进程非零退出。
