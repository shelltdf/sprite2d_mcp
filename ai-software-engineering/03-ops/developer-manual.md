# 开发维护说明书

## 仓库结构

- `ai-software-engineering/`：四阶段文档（勿放置实现代码）。
- 仓库根：`package.json`、`vite.config.js`、`index.html`、`src/`：Vue 3 + Vite 实现。

### 实现要点（与文档对齐）

| 区域 | 路径 |
|------|------|
| 入口 / 布局 | `src/main.js`、`src/App.vue` |
| 状态 | `src/stores/project.js`（工程、精灵、动画、视图、画布指针/视口、`buildProjectFilePayload` v2、`saveProjectFileAs`）；`src/stores/ui.js`（主题、画布显示开关） |
| 菜单 / 命令 | `src/menu/appMenus.js`、`src/menu/events.js` |
| 画布与面板 | `src/components/Canvas2D.vue`、`LeftDock.vue`、`PropertyPanel.vue`、`AnimationTimelineDock.vue`、`MenuBar.vue`、`ToolBar.vue`、`SpriteContextMenu.vue`、`StatusBar.vue` |
| 编译与互操作 | `src/lib/compileAtlas.js`、`atlasImport.js`、`atlasFormat.js`、`exportAtlasMetadata.js`、`spriteGeometry.js` |
| 主题 / i18n | `src/theme/themeManager.js`、`src/styles/theme.css`、`src/styles/win-shell.css`；`src/i18n/index.js`、`translate.js`；`src/locales/zh-CN.json`、`en-US.json` |

- 工程保存：`version: 2`，精灵表仅存路径与尺寸（无内嵌 `data:`）；第三方元数据导出见 `exportAtlasMetadata.js`（JSON/XML，无像素）。

## 依赖

- Node.js LTS；网络可用时执行 `npm install` 拉取依赖。

## 脚本入口（Python 封装）

在仓库根目录执行（需已安装 Python 3）：

| 脚本 | 说明 |
|------|------|
| `build.py` | `npm ci` 或 `npm install` 后 `npm run build` |
| `test.py` | 运行 `npm run build` 作为冒烟测试 |
| `run.py` | `npm run dev` 启动开发服务器 |
| `dev.py` | 同 `run.py`（Node 项目强制 dev 入口） |
| `publish.py` | 构建后将 `dist/` 打包为 zip（需 zip 命令；Windows 可用 PowerShell Compress-Archive 逻辑可后续增强） |

直接使用 npm：`npm run dev`、`npm run build`。

## 发布物

- `dist/`：静态资源，可部署到任意静态站点托管。

## 调试

- 浏览器开发者工具 → Vue / 网络面板。
- 画布与视口：检查 `Canvas2D.vue` 与 `project` store 中的 `view`、`sprites`、`canvasPointerOver`、指针世界坐标与视口尺寸同步。
- 菜单命令未生效：核对 `appMenus.js` 中 `action` 与 store 方法名是否一致。

## 文档同步

- 对外行为与字段以 `ai-software-engineering/02-physical/sprite-sheet-compiler-gui/spec.md` 为物理层单一事实来源；概念/逻辑/运维变更应与之交叉引用并保持一致。
