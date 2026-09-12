# 提取源码说明

本目录由仓库根目录的 `index.html`（当前可部署的权威单文件）提取，用于代码阅读和二次审查：

- `app.js`：页面应用脚本；
- `batch.worker.js`：批量随机机制模型；
- `spatial.worker.js`：空间代理模型；
- `styles.css`：页面样式。

这些文件是从单文件构建产物中恢复的 JavaScript/CSS，不是原始 TypeScript 工程目录，也不包含原始构建配置、源映射或 Git 历史。可直接部署的权威文件是仓库根目录中的 `index.html`。

## 同步维护

修改脚本、ARM_COLORS、画布尺寸或响应式样式时，必须同步根 index.html 与本目录对应内容。紧凑布局断点为 1120px，超窄屏表单单列；页面整页滚动，品牌页眉随页面滚走。根目录 node --test tests/static-smoke.test.mjs 检查源码一致性及静态入口。完整约定见 [AGENTS.md](../AGENTS.md)。
