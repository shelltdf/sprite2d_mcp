# 模型元素 → 源码映射

| 元素 | 路径 |
|------|------|
| 应用入口 | `src/main.js` |
| 根布局壳 | `src/App.vue` |
| 左侧 Dock（精灵图 / 精灵对象表 / 动画序列） | `src/components/LeftDock.vue` |
| 菜单栏 | `src/components/MenuBar.vue` |
| 菜单项定义（精灵 / 动画 / 精灵图） | `src/menu/appMenus.js` |
| 精灵右键菜单 | `src/components/SpriteContextMenu.vue` + `src/menu/events.js` |
| 工具栏 | `src/components/ToolBar.vue` |
| 精灵列表 | `src/components/SpriteListPanel.vue` |
| 2D 画布 | `src/components/Canvas2D.vue` |
| 动画时间线 Dock | `src/components/AnimationTimelineDock.vue` |
| 属性面板 | `src/components/PropertyPanel.vue` |
| 状态栏 | `src/components/StatusBar.vue` |
| 全局状态 | `src/stores/project.js` |
| 编译导出 / 底图切片 | `src/lib/compileAtlas.js` |
| 图集 JSON 解析 | `src/lib/atlasFormat.js` |
| Win 风格主题 | `src/styles/win-shell.css` |
