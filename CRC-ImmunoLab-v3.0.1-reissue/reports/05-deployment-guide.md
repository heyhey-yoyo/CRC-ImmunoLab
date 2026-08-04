# 部署说明

## 直接本地使用

打开：

`project/CRC-ImmunoLab-v3.0.1-standalone.html`

## 普通静态服务器

把 `project/index.html` 作为站点入口。由于它是完整单文件，不需要安装依赖或执行构建。

本地预览示例：

```bash
cd project
python3 -m http.server 8080
```

## Cloudflare Pages

1. 新建 Pages 项目并连接 GitHub 仓库，或使用直接上传。
2. 构建命令留空。
3. 输出目录设置为 `project`，或把 `project` 内文件复制到仓库发布目录。
4. 保留 `project/_headers`。
5. 部署后检查响应头、批量 Worker、空间 Worker、项目保存及跨页面恢复。

若以后加入 Pages Functions 或 `_worker.js`，静态 `_headers` 不会自动覆盖函数响应，需要在函数代码中设置安全响应头。
