# 模型元素 → 源码映射

| 元素 | 路径 |
|------|------|
| 应用入口 | `src/main.js` |
| 根布局壳 | `src/App.vue` |
| 左侧 Dock（精灵图 / 精灵对象表 / 动画序列） | `src/components/LeftDock.vue` |
| 菜单栏 | `src/components/MenuBar.vue` |
| 菜单项定义（精灵 / 动画 / 精灵图） | `src/menu/appMenus.js` |
| 自定义窗口事件名 | `src/menu/events.js`（如 `sprite2d-focus-sprite`、右键菜单） |
| 工具栏（仅图标） | `src/components/ToolBar.vue` |
| 精灵右键菜单 | `src/components/SpriteContextMenu.vue` |
| 2D 画布 | `src/components/Canvas2D.vue` |
| 动画时间线 Dock | `src/components/AnimationTimelineDock.vue` |
| 属性面板（精灵预览 / 动画列表与动画预览） | `src/components/PropertyPanel.vue` |
| 状态栏 | `src/components/StatusBar.vue` |
| 工程与精灵状态 | `src/stores/project.js` |
| 主题与画布显示开关 | `src/stores/ui.js` |
| 编译导出 / 底图切片 | `src/lib/compileAtlas.js` |
| 图集描述解析（本工具 + 第三方 JSON/XML） | `src/lib/atlasImport.js`（`atlasFormat.js` 再导出） |
| 第三方图集元数据导出（JSON/XML，无像素） | `src/lib/exportAtlasMetadata.js` |
| 精灵几何（取整、默认 pivot、ensure） | `src/lib/spriteGeometry.js` |
| Win 壳层布局与主题变量 | `src/styles/win-shell.css`、`src/styles/theme.css` |
| 国际化 | `src/i18n/index.js`、`src/locales/zh-CN.json`、`en-US.json` |

> 历史：`SpriteListPanel.vue` 已并入 `LeftDock.vue`，文档不再引用独立列表面板文件。
