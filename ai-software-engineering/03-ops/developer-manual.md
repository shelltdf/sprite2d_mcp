# 开发维护说明书

## 仓库结构

- `ai-software-engineering/`：四阶段文档（勿放置实现代码）。
- 仓库根：`package.json`、`vite.config.js`、`src/`：Vue 实现。

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
- 画布问题：检查 `Canvas2D.vue` 与 `project` store 中的 `view` 与 `sprites`。
