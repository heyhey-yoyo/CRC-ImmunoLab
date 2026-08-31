# CRC ImmunoLab（结直肠癌肿瘤免疫空间计算研究工作台） — 项目说明（供 AI 编程代理阅读）

本文件为在本仓库工作的 AI 编码代理提供指引。修改代码前请先阅读本文件。

## 项目概览

**CRC ImmunoLab** 是一个纯前端、本地优先的肿瘤免疫空间计算研究工具，用于结直肠癌治疗方案的机制探索、批量实验设计与不确定性分析。v1.0.0 修正了随机种子配对、第 0 天给药时间轴、导入安全与项目恢复等问题。

- 零运行时依赖，单文件应用，可零构建静态部署（Cloudflare Pages 等）。
- 当前交付为单文件构建产物 `index.html`；`source-extracted/` 是从中提取的源码，仅供阅读与审查，不是独立可运行的工程。
- 页面主体采用 `ydchen-portfolio` 的米白 / 赤陶色视觉令牌；保持研究工作台结构、交互和可视化语义不变。修改 `index.html` 内联样式时必须同步 `source-extracted/styles.css`。
- 视觉验收需保持正文 15px、操作标签不小于 12px，提示框满足浅色背景对比度，并在 1440px 桌面与 390px 手机视口检查全局横向溢出。

### 科学边界（不可违反）

- 本项目是**机制探索、教学与定性假设比较工具**，不可用于临床预测、患者分层或治疗决策。任何输出、指标或文案都不得暗示临床用途。
- 模型为统计与空间代理近似，指标如"效应细胞不足指数"仅为模型内比例指标，不得暗示经过生物学验证。

## 技术栈与运行架构

- 纯 HTML + CSS + 原生 JavaScript（IIFE 命名空间 `CRC3`），无框架、无构建步骤、无运行时依赖。
- `CRC3.VERSION = '1.0.0'`，治疗臂配色定义在 `CRC3.ARM_COLORS`。
- 主线程：`app.js` 负责 UI、研究设计、分析展示、存储与导出。
- 批量 Worker（`batch.worker.js`）：批量随机机制模型，逐 replicate 运行、按 replicate ID 做配对比较，产出"优于对照概率"等统计。
- 空间 Worker（`spatial.worker.js`）：空间代理模型，模拟细胞扩散场、免疫浸润、治疗给药与肿瘤动态。
- 存储：OPFS 为主，LocalStorage 与内存会话三级回退；最近项目索引写入 OPFS，避免对 LocalStorage 的单点依赖。

## 项目结构

- 仓库根目录即站点根目录（`index.html`、`_headers` 直接在根目录，可零构建发布）。
- `index.html`：唯一可部署入口，包含全部内联 CSS/JS 与内嵌 Worker（通过 Blob URL 实例化）。
- `source-extracted/`：从 `index.html` 提取的 JavaScript/CSS，供代码阅读与二次审查，不参与部署。
- `_headers`：Cloudflare Pages 安全响应头（CSP、nosniff、权限策略等）。
- `tests/static-smoke.test.mjs`：零依赖静态验收（入口、关键控件、响应式样式、安全头、重复 ID）。
- `README.md`、`AGENTS.md`：项目说明与 AI 代理指南。

## 核心不变量（改动时保持）

- 配对随机种子：不同治疗臂的同一 replicate 使用相同基础种子，聚合按 replicate ID 显式匹配，不得混入全局计数。
- 时间轴：先记录未处理的第 0 天基线，再按半开区间 `[t, t+dt)` 处理给药；到达终点日不再额外更新。
- 确定性：随机数基于 `mulberry32` 固定种子；相同模型版本、配置与种子必须产生相同结果。
- 导入边界：导入项目须做结构归一化、字段白名单、文本长度与数值范围限制；动态文本输出必须编码，禁止将不可信数据写入 `innerHTML`；导入文件限制 25 MB。
- Worker 生命周期：离开空间页必须终止 Worker、释放 Blob URL、清理计时器与 resize 监听器；步进应等待上一批返回后再发送下一批。

## 常见改动场景与对应文件

- 界面文案或样式：`index.html` 内联 `<style>` 与模板；提取版见 `source-extracted/styles.css`。
- 治疗臂默认配置、时间轴、配对统计：`source-extracted/batch.worker.js`（`runOne`、`aggregate`）。
- 空间细胞模型、扩散场、给药事件：`source-extracted/spatial.worker.js`。
- 存储与导入导出：`source-extracted/app.js`。

> 注意：编辑权威文件 `index.html` 后，应同步更新 `source-extracted/` 中对应提取文件，避免阅读版本与部署版本脱节。

## 运行与验证

```bash
cd d:/AI/Github/CRC-ImmunoLab
python -m http.server 8080
```

打开 `http://localhost:8080`。可先运行 `node --test tests/static-smoke.test.mjs` 检查页面入口、固定控件、响应式样式与安全头；任何改动后仍建议手动验证：批量运行结果、配对比较、时间序列第 0 天基线、导入安全（恶意 JSON 应被拒绝）、CSV 导出往返、空间页重复进入无资源堆积、跨页面项目恢复。

## 部署约定

- Cloudflare Pages（零配置）：Framework preset 选 None，Build command 留空，Build output directory 留空，根目录即站点根目录。
- 安全响应头来自根目录 `_headers`；`index.html` 内置兼容离线模式的 meta CSP（`worker-src blob:` 已明确放行）。
- 不要引入需要后端的特性；若未来加入 Pages Functions 或 `_worker.js`，静态 `_headers` 不会自动覆盖函数响应，需要在函数代码中设置安全响应头。

## 版本管理约定

- **版本号以 GitHub Release 为准**（当前 v1.0.0）；页面不显示版本号。
- 代码内版本常量（`CRC3.VERSION`、Worker 的 `MODEL_VERSION`）必须与最新 Release 对齐。
- 发布新 Release 时无需修改页面；如需修改版本常量，同步更新本文件与 README 的"当前版本"说明。

## 工作约定

- 做小而增量的修改；保持单文件自包含结构；避免无必要的大规模重构。
- 编辑前先读相关源码；沿用现有风格（IIFE 命名空间、`Object.freeze` 风格常量、内联 Worker 字符串）。
- 在 Windows 上遇到编码问题，优先用 Python 或 Node 脚本处理文件操作；不要建议修改用户系统配置。
- 文档与交付物以中文为主；代码标识符保持英文。
- 提交前确认 `index.html` 可正常打开、无外部资源依赖（CSP 不允许外站脚本）。

## 标志维护约定

项目标志采用统一的深灰方章、米白线条与赤陶色识别点，页面标志与 favicon 共用同一 `project-mark.svg`。后续替换必须保持原标志容器宽高，不得借机改变页眉、网格或页面布局。

---

## AI 维护提醒

> **⚠️ 任何修改此项目的 AI 代理（包括未来的你自己）都必须遵守：**
>
> - 修改随机种子、时间轴或给药逻辑时，必须保持配对种子与第 0 天基线不变量，并同步更新 README 与 AGENTS
> - 修改 `index.html` 后必须同步更新 `source-extracted/` 提取源码
> - 动态渲染不可信文本时必须编码，禁止 `innerHTML` 直插
