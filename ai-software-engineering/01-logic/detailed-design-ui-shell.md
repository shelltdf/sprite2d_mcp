# 详细设计：UI 壳（Windows 风格）

## 菜单栏

- **文件**：新建工程、打开工程、保存工程、导入/导出图集…
- **精灵图 / 精灵 / 动画**：与画布、Dock、右键菜单共享命令（见 `appMenus.js`）。
- **视图**：适应窗口、放大、缩小。
- **主题**：跟随系统、浅色、深色；`document.documentElement[data-theme]` + `prefers-color-scheme`（系统模式）。
- **语言**：简体中文 / English；`vue-i18n`，文案在 `src/locales/*.json`，语言持久化 `localStorage` 键 `sprite2d-locale`。
- **帮助**：关于（状态栏简述）。

菜单项点击后调用 store 中对应 action；失败时在状态栏显示错误文案（经 i18n）。

## 工具栏

图标按钮与菜单共享同一套命令（避免重复逻辑，提取为 `useProjectCommands()` 或 store actions）。

## 状态栏

- 左侧：当前提示消息（如「已导出 atlas.png」）。
- 右侧：缩放百分比、选中精灵名称摘要。

## 布局约束

- 菜单栏高度固定；工具栏高度固定；状态栏高度固定。
- 中部区域 `flex:1` 或 CSS Grid 占满剩余视口，避免整页滚动；画布区域内部可滚动或平移由画布子系统处理。
