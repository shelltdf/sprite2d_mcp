# 详细设计：UI 壳（Windows 风格）

## 菜单栏

- **文件**：新建工程、打开工程、保存工程、**另存工程**（`prompt` 输入名并下载）、**导入第三方图集**（描述 JSON/XML + 位图）、**导出第三方图集**（打包 PNG+JSON）、**导出第三方图集描述**（JSON / XML，无像素）。
- **精灵图 / 精灵 / 动画**：与画布、Dock、右键菜单共享命令（见 `appMenus.js`）。
- **视图**：适应窗口、放大、缩小。
- **主题**：跟随系统、浅色、深色；`document.documentElement[data-theme]` + `prefers-color-scheme`（系统模式）。
- **语言**：简体中文 / English；`vue-i18n`，文案在 `src/locales/*.json`，语言持久化 `localStorage` 键 `sprite2d-locale`。
- **帮助**：关于（状态栏简述）。

菜单项点击后调用 store 中对应 action；失败时在状态栏显示错误文案（经 i18n）。

## 工具栏

**仅图标**按钮（内联 SVG），与菜单共享同一套命令；`title` / `aria-label` 提供悬停提示与读屏文案。

## 状态栏

- 左侧：当前提示消息（如「已导出 atlas.png」）。
- 右侧：缩放百分比、选中精灵名称摘要。

## 布局约束

- 菜单栏高度固定；工具栏高度固定；状态栏高度固定。
- 中部区域 CSS Grid：左右 Dock 列宽见 `win-shell.css`（`minmax` 约束）；画布区域 `min-width:0` 避免溢出；画布内部平移/缩放由画布子系统处理。
