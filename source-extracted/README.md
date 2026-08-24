# 提取源码说明

本目录由仓库根目录的 `index.html`（CRC ImmunoLab 1.0.0 单文件构建产物）提取，用于代码阅读和二次审查：

- `app.js`：页面应用脚本；
- `batch.worker.js`：批量随机机制模型；
- `spatial.worker.js`：空间代理模型；
- `styles.css`：页面样式。

这些文件是从单文件构建产物中恢复的 JavaScript/CSS，不是原始 TypeScript 工程目录，也不包含原始构建配置、源映射或 Git 历史。可直接部署的权威文件是仓库根目录中的 `index.html`。
