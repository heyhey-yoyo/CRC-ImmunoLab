# CRC ImmunoLab 3.0.1｜结直肠癌肿瘤免疫空间计算研究工作台

纯前端、本地优先的肿瘤免疫空间计算研究工具，用于结直肠癌治疗方案的机制探索、批量实验设计与不确定性分析。单文件应用，可零构建部署到 Cloudflare Pages 或任意静态服务器。

> 科学边界：本项目用于机制探索、教学和定性假设比较，不用于临床预测、患者分层或治疗决策。

## 主要能力

- 治疗臂设计与配对随机种子比较，输出"优于对照概率"等统计摘要；
- 批量随机机制模型（批量 Worker）：多随机种子扫描、逐格进度与主导模式；
- 空间代理模型（空间 Worker）：细胞扩散场、免疫浸润与肿瘤动态模拟；
- 治疗日程错峰编辑、联合方案给药与时间轴一致性；
- 真实长格式 CSV 时间序列导出与单研究 JSON 导入导出往返；
- OPFS 本地项目保存、最近项目索引与跨页面恢复；
- Cloudflare Pages 安全响应头（`_headers`）与内置 CSP。

## 快速开始

直接打开仓库根目录的 `index.html` 即可使用，无需安装依赖或构建。

本地预览示例：

```bash
cd d:/AI/Github/CRC-ImmunoLab
python -m http.server 8080
```

打开 `http://localhost:8080`。

## 部署

站点文件位于仓库根目录，可零构建直接发布。Cloudflare Pages 连接 Git 仓库后：

- Framework preset：None
- Build command：留空（无构建）
- Build output directory：留空（默认即根目录）

无需设置 Root directory，无需构建步骤——仓库根目录就是完整站点。项目不需要环境变量、后端、数据库或自定义服务器响应头。Cloudflare Pages 会读取根目录的 `_headers` 并应用其中定义的安全响应头。

## 项目结构

```text
CRC-ImmunoLab/
├── index.html                     # 站点入口（单文件应用，含全部内联资源与 Worker）
├── _headers                       # Cloudflare Pages 安全响应头与 CSP
├── source-extracted/              # 从 index.html 提取的源码，仅供阅读与审查
│   ├── app.js                     # 页面应用脚本
│   ├── batch.worker.js            # 批量随机机制模型
│   ├── spatial.worker.js          # 空间代理模型
│   ├── styles.css                 # 页面样式
│   └── README.md                  # 提取源码说明
├── README.md                      # 项目说明
├── AGENTS.md                      # AI 代理指南
└── .gitignore                     # 忽略本地个人配置与临时文件
```

## 可复现性

批量与空间模型均基于固定随机种子（`mulberry32`）。相同模型版本、配置和随机种子会产生相同结果。不同治疗臂的同一 replicate 使用相同基础种子，配对比较按 replicate ID 显式匹配。每个运行记录应用版本、模型版本、随机种子与配置哈希。

## 数据与隐私

全部数据仅保存在浏览器本地（OPFS 与 LocalStorage 降级回退），无后端、无数据库、无网络请求、无 Cookie、无鉴权。项目不收集任何用户数据。

---

## AI 维护提醒

> **⚠️ 任何修改此项目的 AI 代理都必须同步更新本文件与 [AGENTS.md](./AGENTS.md)。**
>
> - 修改模型、时间轴或随机种子逻辑时，必须保持固定种子确定性与时间轴一致性
> - 修改 `index.html` 时，应同步更新 `source-extracted/` 中的提取源码与说明
