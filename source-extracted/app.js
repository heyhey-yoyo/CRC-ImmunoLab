
var CRC3;
(function (CRC3) {
    CRC3.VERSION = '3.0.1';
    CRC3.ARM_COLORS = {
        control: '#8eabb0', chemo: '#f2a65a', pd1: '#758cff', combo: '#45dbc1', triple: '#e98dc4'
    };
    const schedule = (enabled, start, dose, interval, cycles) => ({ enabled, start, dose, interval, cycles });
    function defaultArms() {
        return [
            { id: 'control', name: '无治疗对照', description: '自然进程基线', enabled: true, color: CRC3.ARM_COLORS.control, chemo: schedule(false, 0, 0, 14, 1), pd1: schedule(false, 0, 0, 14, 1), tgfb: schedule(false, 0, 0, 14, 1) },
            { id: 'chemo', name: '细胞毒治疗', description: '增殖依赖性损伤', enabled: true, color: CRC3.ARM_COLORS.chemo, chemo: schedule(true, 3, 72, 14, 3), pd1: schedule(false, 0, 0, 14, 1), tgfb: schedule(false, 0, 0, 14, 1) },
            { id: 'pd1', name: '抗 PD-1', description: '缓解效应细胞耗竭', enabled: true, color: CRC3.ARM_COLORS.pd1, chemo: schedule(false, 0, 0, 14, 1), pd1: schedule(true, 3, 70, 14, 3), tgfb: schedule(false, 0, 0, 14, 1) },
            { id: 'combo', name: '化疗 + 抗 PD-1', description: '联合治疗研究臂', enabled: true, color: CRC3.ARM_COLORS.combo, chemo: schedule(true, 3, 68, 14, 3), pd1: schedule(true, 5, 72, 14, 3), tgfb: schedule(false, 0, 0, 14, 1) },
            { id: 'triple', name: '三联调节方案', description: '加入基质/抑制调节', enabled: false, color: CRC3.ARM_COLORS.triple, chemo: schedule(true, 3, 65, 14, 3), pd1: schedule(true, 5, 72, 14, 3), tgfb: schedule(true, 0, 62, 10, 5) }
        ];
    }
    CRC3.defaultArms = defaultArms;
    CRC3.PRESET_LABELS = { msi_hot: 'MSI-H / 免疫热型', mss_cold: 'MSS / 免疫冷型', suppressive: 'TGF-β high / 基质抑制型' };
    CRC3.PRESET_DESCRIPTIONS = {
        msi_hot: '较高抗原可见性与免疫浸润，适合研究检查点抑制和联合治疗。',
        mss_cold: '较低抗原可见性和免疫募集，强调免疫冷环境下的治疗局限。',
        suppressive: '较高 CAF、Treg、基质屏障与免疫抑制，适合研究排斥型空间表型。'
    };
    function createDefaultConfig() {
        return {
            name: 'MSI-H 多治疗臂比较研究', preset: 'msi_hot', horizonDays: 42, replicates: 20, baseSeed: 20260804,
            tumorCount: 520, cd8Count: 115, nkCount: 45, tregCount: 28, macroCount: 42, cafCount: 44,
            growthRate: 100, antigenicity: 82, cd8Potency: 105, immuneRecruitment: 88, suppression: 26, oxygenSupply: 72, stromaDensity: 28,
            uncertainty: 14, arms: defaultArms(), scan: { enabled: false, parameter: 'suppression', min: 15, max: 75, steps: 5 }
        };
    }
    CRC3.createDefaultConfig = createDefaultConfig;
    function applyPreset(config, preset) {
        const next = JSON.parse(JSON.stringify(config));
        next.preset = preset;
        if (preset === 'msi_hot')
            Object.assign(next, { tumorCount: 520, cd8Count: 115, nkCount: 45, tregCount: 28, macroCount: 42, cafCount: 44, growthRate: 100, antigenicity: 82, cd8Potency: 105, immuneRecruitment: 88, suppression: 26, oxygenSupply: 72, stromaDensity: 28 });
        if (preset === 'mss_cold')
            Object.assign(next, { tumorCount: 580, cd8Count: 38, nkCount: 25, tregCount: 25, macroCount: 52, cafCount: 70, growthRate: 112, antigenicity: 34, cd8Potency: 88, immuneRecruitment: 45, suppression: 42, oxygenSupply: 65, stromaDensity: 48 });
        if (preset === 'suppressive')
            Object.assign(next, { tumorCount: 560, cd8Count: 58, nkCount: 26, tregCount: 72, macroCount: 70, cafCount: 122, growthRate: 106, antigenicity: 56, cd8Potency: 92, immuneRecruitment: 58, suppression: 76, oxygenSupply: 54, stromaDensity: 82 });
        return next;
    }
    CRC3.applyPreset = applyPreset;
    CRC3.PARAMETER_EVIDENCE = [
        { id: 'growthRate', label: '肿瘤增殖强度', meaning: '控制肿瘤净增长和空间拥挤速度。', defaultValue: '1.00×', range: '0.45–1.85×', unit: '归一化倍数', sourceType: 'calibrated', confidence: '中', sensitivity: '高' },
        { id: 'antigenicity', label: '抗原可见性', meaning: '影响 CD8/NK 对肿瘤细胞的识别与杀伤。', defaultValue: '82%', range: '10–100%', unit: '归一化比例', sourceType: 'assumption', confidence: '中', sensitivity: '高' },
        { id: 'cd8Potency', label: 'CD8 杀伤效力', meaning: '接触后形成有效杀伤的相对能力。', defaultValue: '1.05×', range: '0.30–1.90×', unit: '归一化倍数', sourceType: 'calibrated', confidence: '中', sensitivity: '高' },
        { id: 'immuneRecruitment', label: '免疫募集', meaning: '决定效应免疫细胞从血管边界进入组织的速度。', defaultValue: '88%', range: '15–160%', unit: '相对募集强度', sourceType: 'assumption', confidence: '低', sensitivity: '高' },
        { id: 'suppression', label: '基础免疫抑制', meaning: '综合表示 Treg、抑制性髓系与细胞因子对效应功能的限制。', defaultValue: '26%', range: '0–100%', unit: '归一化比例', sourceType: 'assumption', confidence: '低', sensitivity: '高' },
        { id: 'oxygenSupply', label: '组织灌注/氧供', meaning: '影响缺氧、增殖、药物到达和细胞活性。', defaultValue: '72%', range: '20–100%', unit: '归一化比例', sourceType: 'calibrated', confidence: '中', sensitivity: '中' },
        { id: 'stromaDensity', label: '基质屏障', meaning: '限制免疫浸润和药物扩散，并提高排斥型空间表型。', defaultValue: '28%', range: '0–100%', unit: '归一化比例', sourceType: 'assumption', confidence: '低', sensitivity: '高' },
        { id: 'chemoDose', label: '细胞毒暴露强度', meaning: '代表相对峰值暴露，不映射真实临床剂量。', defaultValue: '68%', range: '0–100%', unit: '归一化暴露', sourceType: 'assumption', confidence: '低', sensitivity: '中' },
        { id: 'pd1Dose', label: '检查点解除强度', meaning: '降低有效耗竭并延长细胞毒效应。', defaultValue: '72%', range: '0–100%', unit: '归一化作用', sourceType: 'assumption', confidence: '低', sensitivity: '高' },
        { id: 'tgfbDose', label: '基质/抑制调节强度', meaning: '降低抑制与基质屏障的综合机制示意。', defaultValue: '62%', range: '0–100%', unit: '归一化作用', sourceType: 'assumption', confidence: '低', sensitivity: '中' }
    ];
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    function uid(prefix = 'id') {
        const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID().slice(0, 8)
            : Math.random().toString(36).slice(2, 10);
        return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
    }
    CRC3.uid = uid;
    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    CRC3.clone = clone;
    function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
    CRC3.clamp = clamp;
    function formatPct(v, digits = 0) { return (v * 100).toFixed(digits) + '%'; }
    CRC3.formatPct = formatPct;
    function formatRatio(v, digits = 2) { return v.toFixed(digits) + '×'; }
    CRC3.formatRatio = formatRatio;
    function formatDate(iso) {
        const date = new Date(iso);
        return Number.isFinite(date.getTime())
            ? date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            : String(iso || '—');
    }
    CRC3.formatDate = formatDate;
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[character]));
    }
    CRC3.escapeHtml = escapeHtml;
    function downloadText(name, text, type = 'text/plain;charset=utf-8') {
        const blob = new Blob([text], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    CRC3.downloadText = downloadText;
    function csvEscape(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
    CRC3.csvEscape = csvEscape;
    function quantile(values, q) {
        if (!values.length)
            return 0;
        const sorted = [...values].sort((a, b) => a - b), position = (sorted.length - 1) * clamp(q), base = Math.floor(position), rest = position - base;
        return sorted[base] + (sorted[Math.min(sorted.length - 1, base + 1)] - sorted[base]) * rest;
    }
    CRC3.quantile = quantile;
    function fingerprint(config) {
        const text = JSON.stringify(config);
        let h = 2166136261;
        for (let i = 0; i < text.length; i++) {
            h ^= text.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
    }
    CRC3.fingerprint = fingerprint;
    function aggregateRuns(runs, arms) {
        const metrics = ['tumor', 'cytotoxic', 'infiltration', 'exhaustion', 'hypoxia', 'suppression', 'drug'];
        const control = runs.filter(run => run.armId === 'control' && run.scanValue === null);
        const controlMedian = control.length ? quantile(control.map(run => run.endpointTumor), .5) : null;
        return arms.filter(arm => arm.enabled).map(arm => {
            const armRuns = runs.filter(run => run.armId === arm.id && run.scanValue === null);
            const endpoints = armRuns.map(run => run.endpointTumor);
            const days = armRuns[0]?.timeSeries.map(point => point.day) || [];
            const series = {};
            for (const key of metrics) {
                series[key] = days.map((day, index) => {
                    const values = armRuns.map(run => run.timeSeries[index]?.[key] ?? 0);
                    return { day, q05: quantile(values, .05), q25: quantile(values, .25), median: quantile(values, .5), q75: quantile(values, .75), q95: quantile(values, .95) };
                });
            }
            let betterThanControl = null;
            if (arm.id !== 'control' && control.length && armRuns.length) {
                const controlByReplicate = new Map(control.map(run => [run.replicate, run]));
                const pairs = armRuns.map(run => [controlByReplicate.get(run.replicate), run]).filter(pair => Boolean(pair[0]));
                if (pairs.length)
                    betterThanControl = pairs.filter(([controlRun, run]) => run.endpointTumor < controlRun.endpointTumor).length / pairs.length;
            }
            const count = Math.max(1, armRuns.length), median = quantile(endpoints, .5);
            return {
                armId: arm.id, armName: arm.name, color: arm.color, n: armRuns.length, median,
                q05: quantile(endpoints, .05), q95: quantile(endpoints, .95), q25: quantile(endpoints, .25), q75: quantile(endpoints, .75),
                responseRate: armRuns.filter(run => run.response === 'responding').length / count,
                stableRate: armRuns.filter(run => run.response === 'stable').length / count,
                progressionRate: armRuns.filter(run => run.response === 'progressing').length / count,
                effectVsControl: controlMedian !== null && arm.id !== 'control' ? (median / controlMedian - 1) : null,
                betterThanControl, series
            };
        });
    }
    CRC3.aggregateRuns = aggregateRuns;
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    CRC3.MAX_IMPORT_BYTES = 25 * 1024 * 1024;
    CRC3.MAX_BATCH_RUNS = 4500;
    const PRESETS = ['msi_hot', 'mss_cold', 'suppressive'];
    const ARM_IDS = ['control', 'chemo', 'pd1', 'combo', 'triple'];
    const SCAN_PARAMETERS = ['suppression', 'stromaDensity', 'antigenicity', 'pd1Dose', 'chemoDose', 'tgfbDose'];
    const HORIZONS = [28, 42, 56, 84], REPLICATES = [8, 20, 50, 100], SCAN_STEPS = [3, 5, 7, 9];
    function record(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    function number(value, fallback, min, max) { const parsed = Number(value); return Number.isFinite(parsed) ? CRC3.clamp(parsed, min, max) : fallback; }
    function integer(value, fallback, min, max) { return Math.round(number(value, fallback, min, max)); }
    function choice(value, allowed, fallback) { return allowed.includes(value) ? value : fallback; }
    function nearest(value, allowed, fallback) { const parsed = Number(value); return Number.isFinite(parsed) ? allowed.reduce((best, current) => Math.abs(current - parsed) < Math.abs(best - parsed) ? current : best, allowed[0]) : fallback; }
    function text(value, fallback, maxLength) { const output = typeof value === 'string' ? value : fallback; return output.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength) || fallback; }
    function identifier(value, prefix) { const output = text(value, '', 100).replace(/[^A-Za-z0-9_.-]/g, '-').replace(/-+/g, '-').replace(/^[.-]+|[.-]+$/g, ''); return output || CRC3.uid(prefix); }
    function color(value, fallback) { return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback; }
    function schedule(value, fallback, horizon) {
        const raw = record(value);
        return {
            enabled: Boolean(raw.enabled), start: number(raw.start, fallback.start, 0, horizon), dose: number(raw.dose, fallback.dose, 0, 100),
            interval: number(raw.interval, fallback.interval, .25, 365), cycles: integer(raw.cycles, fallback.cycles, 0, 100)
        };
    }
    function normalizeStudyConfig(value) {
        const raw = record(value), defaults = CRC3.createDefaultConfig();
        const preset = choice(raw.preset, PRESETS, defaults.preset);
        const base = CRC3.applyPreset(defaults, preset);
        const horizonDays = nearest(raw.horizonDays, HORIZONS, base.horizonDays);
        const incomingArms = Array.isArray(raw.arms) ? raw.arms : [];
        const arms = CRC3.defaultArms().map(fallback => {
            const incoming = record(incomingArms.find((candidate) => candidate?.id === fallback.id));
            return {
                id: fallback.id,
                name: text(incoming.name, fallback.name, 60), description: text(incoming.description, fallback.description, 120),
                enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : fallback.enabled, color: color(incoming.color, fallback.color),
                chemo: schedule(incoming.chemo, fallback.chemo, horizonDays), pd1: schedule(incoming.pd1, fallback.pd1, horizonDays), tgfb: schedule(incoming.tgfb, fallback.tgfb, horizonDays)
            };
        });
        if (!arms.some(arm => arm.enabled))
            arms[0].enabled = true;
        const config = {
            name: text(raw.name, base.name, 80), preset, horizonDays, replicates: nearest(raw.replicates, REPLICATES, base.replicates),
            baseSeed: integer(raw.baseSeed, base.baseSeed, 1, 0xffffffff),
            tumorCount: integer(raw.tumorCount, base.tumorCount, 1, 1800), cd8Count: integer(raw.cd8Count, base.cd8Count, 0, 600),
            nkCount: integer(raw.nkCount, base.nkCount, 0, 400), tregCount: integer(raw.tregCount, base.tregCount, 0, 500),
            macroCount: integer(raw.macroCount, base.macroCount, 0, 500), cafCount: integer(raw.cafCount, base.cafCount, 0, 700),
            growthRate: number(raw.growthRate, base.growthRate, 45, 185), antigenicity: number(raw.antigenicity, base.antigenicity, 10, 100),
            cd8Potency: number(raw.cd8Potency, base.cd8Potency, 30, 190), immuneRecruitment: number(raw.immuneRecruitment, base.immuneRecruitment, 15, 160),
            suppression: number(raw.suppression, base.suppression, 0, 100), oxygenSupply: number(raw.oxygenSupply, base.oxygenSupply, 20, 100),
            stromaDensity: number(raw.stromaDensity, base.stromaDensity, 0, 100), uncertainty: number(raw.uncertainty, base.uncertainty, 0, 35),
            arms, scan: {
                enabled: Boolean(raw.scan?.enabled), parameter: choice(raw.scan?.parameter, SCAN_PARAMETERS, base.scan.parameter),
                min: number(raw.scan?.min, base.scan.min, 0, 100), max: number(raw.scan?.max, base.scan.max, 0, 100),
                steps: nearest(raw.scan?.steps, SCAN_STEPS, base.scan.steps)
            }
        };
        if (config.scan.min > config.scan.max)
            [config.scan.min, config.scan.max] = [config.scan.max, config.scan.min];
        const totalCells = config.tumorCount + config.cd8Count + config.nkCount + config.tregCount + config.macroCount + config.cafCount;
        if (totalCells > 3400) {
            const scale = 3400 / totalCells;
            config.tumorCount = Math.max(1, Math.round(config.tumorCount * scale));
            config.cd8Count = Math.round(config.cd8Count * scale);
            config.nkCount = Math.round(config.nkCount * scale);
            config.tregCount = Math.round(config.tregCount * scale);
            config.macroCount = Math.round(config.macroCount * scale);
            config.cafCount = Math.round(config.cafCount * scale);
        }
        return config;
    }
    CRC3.normalizeStudyConfig = normalizeStudyConfig;
    function normalizeTimePoint(value, index) {
        const raw = record(value);
        return {
            day: number(raw.day, index, 0, 365), tumor: number(raw.tumor, 1, 0, 1000), cytotoxic: number(raw.cytotoxic, 0, 0, 2),
            infiltration: number(raw.infiltration, 0, 0, 1), exhaustion: number(raw.exhaustion, 0, 0, 1), hypoxia: number(raw.hypoxia, 0, 0, 1),
            suppression: number(raw.suppression, 0, 0, 1), drug: number(raw.drug, 0, 0, 2)
        };
    }
    function normalizeRun(value, config, index) {
        const raw = record(value), armId = choice(raw.armId, ARM_IDS, 'control'), arm = config.arms.find(candidate => candidate.id === armId) || config.arms[0];
        const endpointTumor = number(raw.endpointTumor, 1, 0, 1000);
        return {
            id: identifier(raw.id, 'run'), armId, armName: arm.name, color: arm.color, replicate: integer(raw.replicate, index + 1, 1, 100),
            seed: integer(raw.seed, config.baseSeed, 0, 0xffffffff), scanValue: raw.scanValue === null || raw.scanValue === undefined ? null : number(raw.scanValue, 0, 0, 100),
            endpointTumor, response: endpointTumor < .72 ? 'responding' : endpointTumor < 1.18 ? 'stable' : 'progressing',
            timeSeries: (Array.isArray(raw.timeSeries) ? raw.timeSeries : []).slice(0, 366).map(normalizeTimePoint)
        };
    }
    function normalizeStudyResult(value) {
        const raw = record(value), config = normalizeStudyConfig(raw.config);
        const maximum = Math.min(CRC3.MAX_BATCH_RUNS, config.arms.filter(arm => arm.enabled).length * config.replicates * (config.scan.enabled ? config.scan.steps : 1));
        const runs = (Array.isArray(raw.runs) ? raw.runs : []).slice(0, maximum).map((run, index) => normalizeRun(run, config, index));
        if (!runs.length)
            throw new Error('研究结果中没有可用运行记录');
        let aggregateInput = runs;
        if (config.scan.enabled) {
            const values = [...new Set(runs.map(run => run.scanValue).filter((value) => value !== null))].sort((a, b) => a - b);
            const reference = values[Math.floor(values.length / 2)];
            aggregateInput = runs.filter(run => run.scanValue === reference).map(run => ({ ...run, scanValue: null }));
        }
        return {
            id: identifier(raw.id, 'study'), name: text(raw.name, config.name, 80), createdAt: text(raw.createdAt, new Date().toISOString(), 40),
            completedAt: text(raw.completedAt, new Date().toISOString(), 40), modelVersion: text(raw.modelVersion, CRC3.VERSION, 20), config, runs,
            aggregates: CRC3.aggregateRuns(aggregateInput, config.arms), durationMs: number(raw.durationMs, 0, 0, 86400000),
            diagnostics: (Array.isArray(raw.diagnostics) ? raw.diagnostics : []).slice(0, 30).map((item) => text(item, '诊断记录', 240))
        };
    }
    CRC3.normalizeStudyResult = normalizeStudyResult;
    function normalizeProjectPayload(value) {
        const rawRoot = record(value), payload = record(rawRoot.project || rawRoot);
        if (payload.config && payload.runs && payload.aggregates && !payload.studies) {
            const study = normalizeStudyResult(payload), now = new Date().toISOString();
            return { id: CRC3.uid('project'), name: `${study.name} 项目`, description: '从单项研究结果导入', createdAt: now, updatedAt: now, modelVersion: CRC3.VERSION, config: study.config, studies: [study] };
        }
        if (payload.preset && payload.arms && !payload.config) {
            const now = new Date().toISOString(), config = normalizeStudyConfig(payload);
            return { id: CRC3.uid('project'), name: text(payload.name, '导入研究项目', 80), description: '从研究配置创建', createdAt: now, updatedAt: now, modelVersion: CRC3.VERSION, config, studies: [] };
        }
        if (!payload.config || !Array.isArray(payload.studies))
            throw new Error('文件不是有效的 CRC ImmunoLab 项目、研究包、研究结果或研究配置');
        const now = new Date().toISOString();
        return {
            id: identifier(payload.id, 'project'), name: text(payload.name, '导入研究项目', 80), description: text(payload.description, '本地导入项目', 500),
            createdAt: text(payload.createdAt, now, 40), updatedAt: now, modelVersion: text(payload.modelVersion, CRC3.VERSION, 20),
            config: normalizeStudyConfig(payload.config), studies: payload.studies.slice(0, 50).map(normalizeStudyResult)
        };
    }
    CRC3.normalizeProjectPayload = normalizeProjectPayload;
    function validateStudyConfig(config) {
        const errors = [], warnings = [];
        const active = config.arms.filter(arm => arm.enabled), total = active.length * config.replicates * (config.scan.enabled ? config.scan.steps : 1);
        if (!active.length)
            errors.push('至少启用一个治疗臂。');
        if (total > CRC3.MAX_BATCH_RUNS)
            errors.push(`运行规模超过安全上限 ${CRC3.MAX_BATCH_RUNS}。`);
        if (config.scan.enabled && config.scan.min === config.scan.max)
            warnings.push('扫描最小值与最大值相同，不会形成响应面。');
        if (!active.some(arm => arm.id === 'control'))
            warnings.push('未启用无治疗对照，无法计算对照校正效应。');
        for (const arm of active) {
            for (const therapy of [arm.chemo, arm.pd1, arm.tgfb])
                if (therapy.enabled && therapy.start > config.horizonDays)
                    warnings.push(`${arm.name} 有治疗起始日在模型终点之后。`);
        }
        return { errors, warnings, total };
    }
    CRC3.validateStudyConfig = validateStudyConfig;
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    class ProjectStore {
        constructor() {
            this.root = null;
            this.mode = 'memory';
            this.memory = {};
        }
        safeGet(key) {
            if (this.memory[key] !== undefined)
                return this.memory[key];
            try {
                return localStorage.getItem(key);
            }
            catch (_error) {
                return null;
            }
        }
        saveFallbackProject(project) {
            const projectKey = `crc3:project-${project.id}.json`, lastKey = 'crc3:lastProject', payload = JSON.stringify(project);
            if (this.mode === 'localStorage') {
                try {
                    localStorage.setItem(projectKey, payload);
                    localStorage.setItem(lastKey, project.id);
                    return;
                }
                catch (_error) {
                    try {
                        localStorage.removeItem(projectKey);
                        localStorage.removeItem(lastKey);
                    }
                    catch (_cleanupError) { }
                    this.mode = 'memory';
                }
            }
            this.memory[projectKey] = payload;
            this.memory[lastKey] = project.id;
        }
        async writeOpfs(name, data) {
            const handle = await this.root.getFileHandle(name, { create: true });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data));
            await writable.close();
        }
        async readOpfs(name) {
            try {
                const handle = await this.root.getFileHandle(name);
                const file = await handle.getFile();
                return JSON.parse(await file.text());
            }
            catch (_error) {
                return null;
            }
        }
        fallbackFromOpfs() {
            this.root = null;
            try {
                const probe = 'crc3:probe';
                localStorage.setItem(probe, '1');
                localStorage.removeItem(probe);
                this.mode = 'localStorage';
            }
            catch (_error) {
                this.mode = 'memory';
            }
        }
        async init() {
            try {
                const nav = navigator;
                if (nav.storage?.getDirectory) {
                    const base = await nav.storage.getDirectory();
                    this.root = await base.getDirectoryHandle('crc-immunolab-v3', { create: true });
                    this.mode = 'opfs';
                    return this.mode;
                }
            }
            catch (_error) { }
            this.fallbackFromOpfs();
            return this.mode;
        }
        getMode() { return this.mode; }
        async saveProject(project) {
            if (this.mode === 'opfs' && this.root) {
                try {
                    await this.writeOpfs(`project-${project.id}.json`, project);
                    await this.writeOpfs('index.json', { lastProject: project.id, updatedAt: project.updatedAt });
                    return;
                }
                catch (_error) {
                    this.fallbackFromOpfs();
                }
            }
            this.saveFallbackProject(project);
        }
        async loadProject(id) {
            if (this.mode === 'opfs' && this.root) {
                const project = await this.readOpfs(`project-${id}.json`);
                if (project)
                    return project;
            }
            const raw = this.safeGet(`crc3:project-${id}.json`);
            try {
                return raw ? JSON.parse(raw) : null;
            }
            catch (_error) {
                return null;
            }
        }
        async loadLastProject() {
            let id = null;
            if (this.mode === 'opfs' && this.root) {
                const index = await this.readOpfs('index.json');
                id = typeof index?.lastProject === 'string' ? index.lastProject : null;
            }
            if (!id)
                id = this.safeGet('crc3:lastProject');
            return id ? await this.loadProject(id) : null;
        }
        async exportIndex() {
            let lastProject = this.safeGet('crc3:lastProject');
            if (this.mode === 'opfs' && this.root) {
                const index = await this.readOpfs('index.json');
                if (typeof index?.lastProject === 'string')
                    lastProject = index.lastProject;
            }
            return { mode: this.mode, lastProject };
        }
    }
    CRC3.ProjectStore = ProjectStore;
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    class Charts {
        static resize(canvas) {
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            const r = canvas.getBoundingClientRect();
            const w = Math.max(320, Math.round(r.width * dpr)), h = Math.max(180, Math.round(r.height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            return { ctx: canvas.getContext('2d'), w, h, dpr };
        }
        static line(canvas, aggregates, metric = 'tumor') {
            const { ctx, w, h, dpr } = this.resize(canvas);
            ctx.clearRect(0, 0, w, h);
            const pad = { l: 48 * dpr, r: 18 * dpr, t: 18 * dpr, b: 34 * dpr };
            const series = aggregates.filter(a => a.series && a.series[metric]?.length);
            if (!series.length) {
                this.empty(ctx, w, h, '暂无批量结果');
                return;
            }
            let ymax = metric === 'tumor' ? Math.max(1.4, ...series.flatMap(a => a.series[metric].map(p => p.q95))) : 1;
            let ymin = 0;
            if (metric === 'tumor')
                ymin = Math.min(0.15, ...series.flatMap(a => a.series[metric].map(p => p.q05)));
            const days = series[0].series[metric];
            const xmax = Math.max(...days.map(p => p.day));
            const x = (v) => pad.l + (v / xmax) * (w - pad.l - pad.r);
            const y = (v) => h - pad.b - ((v - ymin) / (ymax - ymin || 1)) * (h - pad.t - pad.b);
            ctx.strokeStyle = '#203842';
            ctx.lineWidth = 1 * dpr;
            ctx.font = `${9 * dpr}px sans-serif`;
            ctx.fillStyle = '#66868e';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= 4; i++) {
                const val = ymin + (ymax - ymin) * i / 4;
                const yy = y(val);
                ctx.beginPath();
                ctx.moveTo(pad.l, yy);
                ctx.lineTo(w - pad.r, yy);
                ctx.stroke();
                ctx.fillText(metric === 'tumor' ? val.toFixed(1) : Math.round(val * 100) + '%', pad.l - 8 * dpr, yy);
            }
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            for (let i = 0; i <= 5; i++) {
                const val = xmax * i / 5;
                const xx = x(val);
                ctx.fillText(Math.round(val) + 'd', xx, h - pad.b + 9 * dpr);
            }
            for (const arm of series) {
                const arr = arm.series[metric];
                ctx.save();
                ctx.globalAlpha = .12;
                ctx.fillStyle = arm.color;
                ctx.beginPath();
                arr.forEach((p, i) => { const xx = x(p.day), yy = y(p.q95); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
                for (let i = arr.length - 1; i >= 0; i--) {
                    const p = arr[i];
                    ctx.lineTo(x(p.day), y(p.q05));
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                ctx.strokeStyle = arm.color;
                ctx.lineWidth = 2 * dpr;
                ctx.beginPath();
                arr.forEach((p, i) => { const xx = x(p.day), yy = y(p.median); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); });
                ctx.stroke();
            }
            ctx.strokeStyle = '#3c5660';
            ctx.strokeRect(pad.l, pad.t, w - pad.l - pad.r, h - pad.t - pad.b);
        }
        static distribution(canvas, aggregates) {
            const { ctx, w, h, dpr } = this.resize(canvas);
            ctx.clearRect(0, 0, w, h);
            if (!aggregates.length) {
                this.empty(ctx, w, h, '暂无终点分布');
                return;
            }
            const pad = { l: 48 * dpr, r: 16 * dpr, t: 17 * dpr, b: 42 * dpr };
            const ymax = Math.max(1.4, ...aggregates.map(a => a.q95)) * 1.08;
            const y = (v) => h - pad.b - (v / ymax) * (h - pad.t - pad.b);
            ctx.font = `${9 * dpr}px sans-serif`;
            ctx.fillStyle = '#66868e';
            ctx.strokeStyle = '#203842';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            for (let i = 0; i <= 4; i++) {
                const v = ymax * i / 4, yy = y(v);
                ctx.beginPath();
                ctx.moveTo(pad.l, yy);
                ctx.lineTo(w - pad.r, yy);
                ctx.stroke();
                ctx.fillText(v.toFixed(1) + '×', pad.l - 7 * dpr, yy);
            }
            const slot = (w - pad.l - pad.r) / aggregates.length;
            aggregates.forEach((a, i) => { const cx = pad.l + slot * (i + .5), boxW = Math.min(32 * dpr, slot * .42); ctx.strokeStyle = a.color; ctx.fillStyle = a.color + '30'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.moveTo(cx, y(a.q05)); ctx.lineTo(cx, y(a.q95)); ctx.stroke(); ctx.fillRect(cx - boxW / 2, y(a.q75), boxW, y(a.q25) - y(a.q75)); ctx.strokeRect(cx - boxW / 2, y(a.q75), boxW, y(a.q25) - y(a.q75)); ctx.beginPath(); ctx.moveTo(cx - boxW / 2, y(a.median)); ctx.lineTo(cx + boxW / 2, y(a.median)); ctx.stroke(); ctx.fillStyle = '#8eabb0'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(a.armName.length > 8 ? a.armName.slice(0, 7) + '…' : a.armName, cx, h - pad.b + 10 * dpr); });
        }
        static heatmap(canvas, result) {
            const { ctx, w, h, dpr } = this.resize(canvas);
            ctx.clearRect(0, 0, w, h);
            if (!result || !result.config.scan.enabled) {
                this.empty(ctx, w, h, '启用参数扫描后显示响应面');
                return;
            }
            const values = [...new Set(result.runs.map(r => r.scanValue).filter(v => v !== null))].sort((a, b) => a - b);
            const arms = result.aggregates.map(a => a.armId);
            if (!values.length || !arms.length) {
                this.empty(ctx, w, h, '暂无扫描结果');
                return;
            }
            const pad = { l: 70 * dpr, r: 20 * dpr, t: 20 * dpr, b: 42 * dpr };
            const cw = (w - pad.l - pad.r) / values.length, ch = (h - pad.t - pad.b) / arms.length;
            const all = [];
            const matrix = arms.map(arm => values.map(v => { const endpoints = result.runs.filter(r => r.armId === arm && r.scanValue === v).map(r => r.endpointTumor); const median = CRC3.quantile(endpoints, .5); all.push(median); return median; }));
            const lo = Math.min(...all), hi = Math.max(...all);
            matrix.forEach((row, iy) => row.forEach((v, ix) => { const t = (v - lo) / (hi - lo || 1); const r = Math.round(38 + 190 * t), g = Math.round(199 - 105 * t), b = Math.round(173 - 60 * t); ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(pad.l + ix * cw, pad.t + iy * ch, cw - 2 * dpr, ch - 2 * dpr); ctx.fillStyle = t > .55 ? '#fff' : '#061615'; ctx.font = `${9 * dpr}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(v.toFixed(2), pad.l + (ix + .5) * cw, pad.t + (iy + .5) * ch); }));
            ctx.fillStyle = '#8eabb0';
            ctx.font = `${9 * dpr}px sans-serif`;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'right';
            arms.forEach((a, i) => { const name = result.aggregates.find(x => x.armId === a)?.armName || a; ctx.fillText(name, pad.l - 8 * dpr, pad.t + (i + .5) * ch); });
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            values.forEach((v, i) => ctx.fillText(String(v.toFixed(0)), pad.l + (i + .5) * cw, h - pad.b + 8 * dpr));
        }
        static empty(ctx, w, h, text) { ctx.fillStyle = '#66868e'; ctx.font = `12px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2); }
    }
    CRC3.Charts = Charts;
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    const CELL_COLORS = ['#f1777a', '#45dbc1', '#758cff', '#e9cf70', '#f2a65a', '#b18cff', '#6c767b'];
    class SpatialWorkbench {
        constructor(canvas) {
            this.worker = null;
            this.snapshot = null;
            this.running = false;
            this.layer = 'cells';
            this.timer = null;
            this.selection = null;
            this.dragStart = null;
            this.onMetrics = () => { };
            this.onStatus = () => { };
            this.workerUrl = null;
            this.stepPending = false;
            this.fieldCanvas = document.createElement('canvas');
            this.fieldImage = null;
            this.resizeHandler = () => this.render();
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.bindPointer();
            window.addEventListener('resize', this.resizeHandler);
        }
        createWorker() {
            const w = window, embedded = w.__CRC3_SPATIAL_WORKER_SOURCE__;
            if (embedded) {
                this.workerUrl = URL.createObjectURL(new Blob([embedded], { type: 'text/javascript' }));
                return new Worker(this.workerUrl);
            }
            return new Worker((w.__CRC3_ASSET_BASE__ || './dist/') + 'spatial.worker.js');
        }
        disposeWorker() {
            this.worker?.terminate();
            this.worker = null;
            this.stepPending = false;
            if (this.workerUrl) {
                URL.revokeObjectURL(this.workerUrl);
                this.workerUrl = null;
            }
        }
        init(config, arm, seed) {
            this.stop(false);
            this.disposeWorker();
            this.snapshot = null;
            this.worker = this.createWorker();
            this.worker.onmessage = (event) => {
                if (event.data?.type !== 'SNAPSHOT')
                    return;
                this.stepPending = false;
                this.snapshot = event.data;
                this.render();
                this.updateSelectionMetrics();
                if (event.data.complete) {
                    this.stop(false);
                    this.onStatus('代表性空间模拟已到达终点');
                }
                else if (this.running)
                    this.queueStep();
            };
            this.worker.onerror = () => { this.stepPending = false; this.stop(false); this.onStatus('空间计算线程异常'); };
            const next = CRC3.clone(config);
            next.seed = seed;
            next.presetLabel = CRC3.PRESET_LABELS[next.preset];
            for (const key of ['chemo', 'pd1', 'tgfb']) {
                const schedule = arm[key];
                next[key + 'Enabled'] = schedule.enabled;
                next[key + 'Start'] = schedule.start;
                next[key + 'Dose'] = schedule.dose;
                next[key + 'Interval'] = schedule.interval;
                next[key + 'Cycles'] = schedule.cycles;
            }
            this.worker.postMessage({ type: 'INIT', config: next });
            this.onStatus('代表性组织正在初始化');
        }
        queueStep(delay = 70) {
            if (!this.running || !this.worker || this.stepPending)
                return;
            if (this.timer !== null)
                clearTimeout(this.timer);
            this.timer = window.setTimeout(() => {
                this.timer = null;
                if (!this.running || !this.worker || this.stepPending)
                    return;
                this.stepPending = true;
                this.worker.postMessage({ type: 'STEP', count: 8 });
            }, delay);
        }
        start() { if (!this.worker || this.running)
            return; this.running = true; this.onStatus('空间模拟运行中'); this.queueStep(0); }
        stop(notify = true) { const wasRunning = this.running; this.running = false; if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        } if (notify && wasRunning)
            this.onStatus('空间模拟已暂停'); }
        step() { if (!this.worker || this.stepPending)
            return; this.stepPending = true; this.worker.postMessage({ type: 'STEP', count: 2 }); }
        destroy() { this.stop(false); this.disposeWorker(); window.removeEventListener('resize', this.resizeHandler); this.onMetrics = () => { }; this.onStatus = () => { }; }
        setLayer(layer) { this.layer = layer; this.render(); }
        size() { const dpr = Math.min(2, devicePixelRatio || 1), rect = this.canvas.getBoundingClientRect(), w = Math.max(500, Math.round(rect.width * dpr)), h = Math.max(320, Math.round(rect.height * dpr)); if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        } return { w, h, dpr }; }
        render() {
            const { w, h, dpr } = this.size(), ctx = this.ctx;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#061017';
            ctx.fillRect(0, 0, w, h);
            const snapshot = this.snapshot;
            if (!snapshot) {
                ctx.fillStyle = '#66868e';
                ctx.font = `${12 * dpr}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('选择治疗臂并初始化代表性组织', w / 2, h / 2);
                return;
            }
            if (this.layer !== 'cells')
                this.drawField(snapshot.fields[this.layer], snapshot.fields.cols, snapshot.fields.rows, w, h, this.layer);
            else
                this.drawCells(snapshot.cells, w, h, dpr);
            if (this.layer === 'cells')
                this.drawVessels(snapshot.fields.vessels, snapshot.fields.cols, snapshot.fields.rows, w, h);
            ctx.fillStyle = 'rgba(5,15,19,.78)';
            ctx.fillRect(12 * dpr, 12 * dpr, 145 * dpr, 43 * dpr);
            ctx.fillStyle = '#e9f4f3';
            ctx.font = `600 ${12 * dpr}px sans-serif`;
            ctx.textAlign = 'left';
            ctx.fillText(`Day ${snapshot.day.toFixed(1)}`, 23 * dpr, 31 * dpr);
            ctx.fillStyle = '#8eabb0';
            ctx.font = `${9 * dpr}px sans-serif`;
            ctx.fillText(`${snapshot.metrics.tumor} tumor · ${snapshot.metrics.cd8} CD8 · ${snapshot.metrics.nk} NK`, 23 * dpr, 46 * dpr);
            if (this.selection) {
                const selection = this.normSelection(w, h);
                ctx.strokeStyle = '#71c9ef';
                ctx.setLineDash([5 * dpr, 4 * dpr]);
                ctx.lineWidth = 1.5 * dpr;
                ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
                ctx.fillStyle = 'rgba(113,201,239,.07)';
                ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
                ctx.setLineDash([]);
            }
        }
        drawCells(data, w, h, dpr) { const sx = w / 1200, sy = h / 720; for (let index = 0; index < data.length; index += 11) {
            const x = data[index] * sx, y = data[index + 1] * sy, type = Math.round(data[index + 2]), radius = Math.max(1.5, data[index + 3] * Math.min(sx, sy)), state = data[index + 4], activation = data[index + 5];
            this.ctx.globalAlpha = type === 6 ? .42 : .88;
            this.ctx.fillStyle = CELL_COLORS[type] || '#fff';
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            if (type === 0 && state > .35) {
                this.ctx.strokeStyle = '#ffd6d7';
                this.ctx.globalAlpha = .55;
                this.ctx.lineWidth = .8 * dpr;
                this.ctx.stroke();
            }
            if ((type === 1 || type === 2) && activation > .55) {
                this.ctx.strokeStyle = '#e7fffb';
                this.ctx.globalAlpha = .65;
                this.ctx.lineWidth = 1 * dpr;
                this.ctx.stroke();
            }
        } this.ctx.globalAlpha = 1; }
        drawField(field, cols, rows, w, h, layer) {
            if (!field)
                return;
            if (this.fieldCanvas.width !== cols || this.fieldCanvas.height !== rows) {
                this.fieldCanvas.width = cols;
                this.fieldCanvas.height = rows;
                this.fieldImage = null;
            }
            const context = this.fieldCanvas.getContext('2d');
            if (!this.fieldImage)
                this.fieldImage = context.createImageData(cols, rows);
            const image = this.fieldImage;
            for (let index = 0; index < field.length; index++) {
                const value = CRC3.clamp(field[index], 0, 1);
                let rgb = [20, 50, 55];
                if (layer === 'oxygen')
                    rgb = [20 + Math.round(45 * value), 40 + Math.round(170 * value), 70 + Math.round(170 * value)];
                if (layer === 'drug')
                    rgb = [35 + Math.round(205 * value), 20 + Math.round(80 * value), 55 + Math.round(150 * value)];
                if (layer === 'suppression')
                    rgb = [35 + Math.round(210 * value), 40 + Math.round(115 * value), 25 + Math.round(45 * value)];
                if (layer === 'chemokine')
                    rgb = [15 + Math.round(80 * value), 30 + Math.round(110 * value), 55 + Math.round(200 * value)];
                if (layer === 'stroma')
                    rgb = [25 + Math.round(165 * value), 35 + Math.round(125 * value), 25 + Math.round(70 * value)];
                image.data[index * 4] = rgb[0];
                image.data[index * 4 + 1] = rgb[1];
                image.data[index * 4 + 2] = rgb[2];
                image.data[index * 4 + 3] = 255;
            }
            context.putImageData(image, 0, 0);
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.drawImage(this.fieldCanvas, 0, 0, w, h);
        }
        drawVessels(field, cols, rows, w, h) { if (!field)
            return; const cellWidth = w / cols, cellHeight = h / rows; this.ctx.fillStyle = 'rgba(113,201,239,.16)'; for (let y = 0; y < rows; y += 2)
            for (let x = 0; x < cols; x += 2) {
                const value = field[y * cols + x];
                if (value > .45)
                    this.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth * 2, cellHeight * 2);
            } }
        bindPointer() {
            this.canvas.addEventListener('pointerdown', event => { const rect = this.canvas.getBoundingClientRect(); this.dragStart = { x: CRC3.clamp((event.clientX - rect.left) / rect.width), y: CRC3.clamp((event.clientY - rect.top) / rect.height) }; this.selection = { x1: this.dragStart.x, y1: this.dragStart.y, x2: this.dragStart.x, y2: this.dragStart.y }; this.canvas.setPointerCapture(event.pointerId); });
            this.canvas.addEventListener('pointermove', event => { if (!this.dragStart || !this.selection)
                return; const rect = this.canvas.getBoundingClientRect(); this.selection.x2 = CRC3.clamp((event.clientX - rect.left) / rect.width); this.selection.y2 = CRC3.clamp((event.clientY - rect.top) / rect.height); this.render(); });
            const finish = () => { if (!this.dragStart)
                return; this.dragStart = null; this.updateSelectionMetrics(); };
            this.canvas.addEventListener('pointerup', finish);
            this.canvas.addEventListener('pointercancel', finish);
        }
        normSelection(w, h) { const selection = this.selection, x = Math.min(selection.x1, selection.x2) * w, y = Math.min(selection.y1, selection.y2) * h; return { x, y, w: Math.abs(selection.x2 - selection.x1) * w, h: Math.abs(selection.y2 - selection.y1) * h }; }
        clearSelection() { this.selection = null; this.render(); this.updateSelectionMetrics(); }
        updateSelectionMetrics() {
            const snapshot = this.snapshot;
            if (!snapshot) {
                this.onMetrics('<p class="text-muted">尚无空间快照。</p>');
                return;
            }
            const counts = [0, 0, 0, 0, 0, 0, 0];
            let total = 0;
            const data = snapshot.cells;
            for (let index = 0; index < data.length; index += 11) {
                const x = data[index] / 1200, y = data[index + 1] / 720;
                if (this.selection) {
                    const minX = Math.min(this.selection.x1, this.selection.x2), maxX = Math.max(this.selection.x1, this.selection.x2), minY = Math.min(this.selection.y1, this.selection.y2), maxY = Math.max(this.selection.y1, this.selection.y2);
                    if (x < minX || x > maxX || y < minY || y > maxY)
                        continue;
                }
                counts[Math.round(data[index + 2])]++;
                total++;
            }
            const tumor = counts[0], effectors = counts[1] + counts[2], immune = effectors + counts[3] + counts[4], effectorDeficit = tumor ? CRC3.clamp(1 - effectors / Math.max(1, tumor * .24)) : 0;
            this.onMetrics(`<div class="inspect-grid"><div class="inspect-metric"><span>区域细胞</span><strong>${total}</strong></div><div class="inspect-metric"><span>肿瘤细胞</span><strong>${tumor}</strong></div><div class="inspect-metric"><span>效应细胞</span><strong>${effectors}</strong></div><div class="inspect-metric"><span>效应细胞不足指数</span><strong>${Math.round(effectorDeficit * 100)}%</strong></div><div class="inspect-metric"><span>效应/肿瘤</span><strong>${(effectors / Math.max(1, tumor)).toFixed(2)}</strong></div><div class="inspect-metric"><span>全部免疫</span><strong>${immune}</strong></div></div><p class="field-help mt-14">拖拽框选组织区域；“不足指数”是模型内比例指标，不等同于临床免疫排斥评分。</p>`);
        }
    }
    CRC3.SpatialWorkbench = SpatialWorkbench;
})(CRC3 || (CRC3 = {}));
var CRC3;
(function (CRC3) {
    class App {
        constructor(root) {
            this.store = new CRC3.ProjectStore();
            this.view = 'design';
            this.batchWorker = null;
            this.runProgress = null;
            this.runStatus = 'idle';
            this.runError = '';
            this.selectedStudyId = null;
            this.analysisMetric = 'tumor';
            this.spatial = null;
            this.spatialArmId = 'combo';
            this.spatialSeed = 20260804;
            this.storageMode = 'localStorage';
            this.batchWorkerUrl = null;
            this.persistTimer = null;
            this.persistChain = Promise.resolve();
            this.startupWarning = '';
this.root = root;
        }
        async init() {
            this.storageMode = await this.store.init();
            const loaded = await this.store.loadLastProject();
            try {
                this.project = loaded ? CRC3.normalizeProjectPayload(loaded) : this.newProject();
            }
            catch (_error) {
                this.project = this.newProject();
                this.startupWarning = '已忽略损坏或不兼容的本地项目，并创建了新项目。';
            }
            this.selectedStudyId = this.project.studies[0]?.id || null;
            await this.store.saveProject(this.project);
            this.storageMode = this.store.getMode();
            this.renderShell();
            this.navigate('design');
            if (this.startupWarning)
                this.toast('本地项目恢复失败', this.startupWarning, true);
            window.addEventListener('beforeunload', () => { this.batchWorker?.terminate(); this.spatial?.destroy(); }, { once: true });
        }
        newProject() { const now = new Date().toISOString(); return { id: CRC3.uid('project'), name: 'CRC 空间免疫研究项目', description: '多治疗臂、批量重复与空间表型研究', createdAt: now, updatedAt: now, modelVersion: CRC3.VERSION, config: CRC3.createDefaultConfig(), studies: [] }; }
        activeStudy() { return this.project.studies.find(s => s.id === this.selectedStudyId) || this.project.studies[0] || null; }
        renderShell() {
            this.root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="brand"><div class="brand-mark"><svg viewBox="0 0 40 40"><circle cx="12" cy="12" r="5"/><circle cx="27" cy="11" r="4"/><circle cx="27" cy="27" r="6"/><path d="M16 14l7-1M16 17l7 7"/></svg></div><div><h1>CRC ImmunoLab <span class="version">${CRC3.VERSION}</span></h1><p>Spatial Study Workbench</p></div></div><nav class="topnav"><button class="nav-button" data-view="projects">项目</button><button class="nav-button active" data-view="design">研究设计</button><button class="nav-button" data-view="runs">运行中心</button><button class="nav-button" data-view="analysis">分析</button><button class="nav-button" data-view="spatial">空间工作区</button><button class="nav-button" data-view="provenance">模型与溯源</button></nav><div class="top-actions"><div class="model-pill">Model ${CRC3.VERSION} · dimensionless</div><div class="storage-pill"><i></i><span>${this.storageMode === 'opfs' ? 'OPFS 本地项目库' : this.storageMode === 'memory' ? '会话内存模式' : '浏览器本地存储'}</span></div><button class="quiet-btn" id="importProjectBtn">导入</button><button class="primary-btn" id="exportBundleBtn">导出研究包</button></div></header><div class="main"><aside class="sidebar"><div class="project-card"><span class="eyebrow">Current project</span><h2 id="sideProjectName"></h2><p id="sideProjectMeta"></p><div class="project-health"><span class="health-dot"></span><span class="eyebrow">本地保存 · 模型可重复</span></div></div><div class="side-section-title">研究流程</div><nav class="side-nav"><button class="side-item" data-view="design"><span class="side-icon">◇</span>研究设计</button><button class="side-item" data-view="runs"><span class="side-icon">▶</span>运行中心<span class="side-count" id="sideRunCount">0</span></button><button class="side-item" data-view="analysis"><span class="side-icon">⌁</span>统计分析</button><button class="side-item" data-view="spatial"><span class="side-icon">◎</span>空间表型</button><button class="side-item" data-view="provenance"><span class="side-icon">≡</span>模型溯源</button></nav><div class="side-section-title">项目</div><nav class="side-nav"><button class="side-item" data-view="projects"><span class="side-icon">▦</span>研究记录<span class="side-count" id="sideStudyCount">0</span></button></nav><div class="sidebar-bottom"><div class="progress-mini"><span id="sideProgressText">准备就绪</span><div class="progress-track"><div class="progress-fill" id="sideProgressFill"></div></div></div><small>所有计算在当前浏览器内执行。结果不用于临床决策。</small></div></aside><main class="content"><section class="view" id="view-projects"></section><section class="view" id="view-design"></section><section class="view" id="view-runs"></section><section class="view" id="view-analysis"></section><section class="view" id="view-spatial"></section><section class="view" id="view-provenance"></section></main></div><div class="toast-stack" id="toastStack" role="status" aria-live="polite" aria-atomic="true"></div><input type="file" id="projectFileInput" accept=".json,.crcstudy" class="hidden"/></div>`;
            this.root.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', () => this.navigate(el.dataset.view)));
            this.byId('importProjectBtn').onclick = () => this.byId('projectFileInput').click();
            this.byId('projectFileInput').onchange = e => this.importProject(e);
            this.byId('exportBundleBtn').onclick = () => this.exportResearchBundle();
            this.updateChrome();
        }
        byId(id) { return document.getElementById(id); }
        navigate(view) { if (this.view === 'spatial' && view !== 'spatial') {
            this.spatial?.destroy();
            this.spatial = null;
        } this.view = view; document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); this.byId('view-' + view).classList.add('active'); document.querySelectorAll('[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === view)); this.renderView(view); }
        renderView(view) { if (view === 'projects')
            this.renderProjects(); if (view === 'design')
            this.renderDesign(); if (view === 'runs')
            this.renderRuns(); if (view === 'analysis')
            this.renderAnalysis(); if (view === 'spatial')
            this.renderSpatial(); if (view === 'provenance')
            this.renderProvenance(); this.updateChrome(); }
        updateChrome() { const cfg = this.project.config; const active = cfg.arms.filter(a => a.enabled).length; const total = active * cfg.replicates * (cfg.scan.enabled ? cfg.scan.steps : 1); const name = this.byId('sideProjectName'); if (name)
            name.textContent = this.project.name; const meta = this.byId('sideProjectMeta'); if (meta)
            meta.textContent = `${this.project.studies.length} 项已完成研究 · ${CRC3.fingerprint(cfg)}`; const rc = this.byId('sideRunCount'); if (rc)
            rc.textContent = String(total); const sc = this.byId('sideStudyCount'); if (sc)
            sc.textContent = String(this.project.studies.length); }
        toast(title, message = '', error = false) { const stack = this.byId('toastStack'), el = document.createElement('div'), heading = document.createElement('strong'); el.className = 'toast' + (error ? ' error' : ''); heading.textContent = title; el.appendChild(heading); if (message) {
            const body = document.createElement('span');
            body.textContent = message;
            el.appendChild(body);
        } stack.appendChild(el); setTimeout(() => el.remove(), 3600); }
        async persist() { if (this.persistTimer !== null) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        } this.project.updatedAt = new Date().toISOString(); const snapshot = CRC3.clone(this.project); this.persistChain = this.persistChain.catch(() => { }).then(() => this.store.saveProject(snapshot)); try {
            await this.persistChain;
            this.storageMode = this.store.getMode();
            this.updateChrome();
        }
        catch (error) {
            this.toast('保存失败', error?.message || '无法写入本地项目存储', true);
        } }
        schedulePersist() { if (this.persistTimer !== null)
            clearTimeout(this.persistTimer); this.persistTimer = window.setTimeout(() => { this.persistTimer = null; void this.persist(); }, 300); }
        renderProjects() {
            const el = this.byId('view-projects');
            const studies = this.project.studies;
            el.innerHTML = `<div class="page-head"><div><h2>项目与研究记录</h2><p>本地优先的项目容器，保存配置、重复运行、统计摘要和空间快照引用。</p></div><div class="page-actions"><button class="quiet-btn" id="renameProjectBtn">编辑项目</button><button class="primary-btn" id="newStudyBtn">新建研究</button></div></div><div class="grid-3 mb-14"><div class="panel kpi-card"><div class="kpi-label">已完成研究</div><div class="kpi-value">${studies.length}</div><div class="kpi-sub">项目内批量研究记录</div></div><div class="panel kpi-card"><div class="kpi-label">累计随机运行</div><div class="kpi-value">${studies.reduce((n, s) => n + s.runs.length, 0)}</div><div class="kpi-sub">含参数扫描运行</div></div><div class="panel kpi-card"><div class="kpi-label">本地数据层</div><div class="kpi-value" style="font-size:18px">${this.storageMode === 'opfs' ? 'OPFS' : this.storageMode === 'memory' ? 'Memory' : 'LocalStorage'}</div><div class="kpi-sub">无需上传研究数据</div></div></div><div class="project-grid">${studies.length ? studies.map(s => this.studyTile(s)).join('') : `<div class="panel empty-state" style="grid-column:1/-1"><div><div class="empty-icon">⌁</div><h3>还没有完成的批量研究</h3><p>完成研究设计后进入运行中心。每个治疗臂将按随机种子重复运行，并生成分位区间与响应概率。</p><button class="primary-btn" id="emptyDesignBtn">开始设计研究</button></div></div>`}</div>`;
            this.byId('newStudyBtn').onclick = () => { this.project.config = CRC3.createDefaultConfig(); this.persist(); this.navigate('design'); };
            if (document.getElementById('emptyDesignBtn'))
                this.byId('emptyDesignBtn').onclick = () => this.navigate('design');
            this.byId('renameProjectBtn').onclick = () => this.showProjectModal();
            el.querySelectorAll('[data-study-open]').forEach(b => b.addEventListener('click', () => { this.selectedStudyId = b.dataset.studyOpen; this.navigate('analysis'); }));
            el.querySelectorAll('[data-study-export]').forEach(b => b.addEventListener('click', () => this.exportStudy(b.dataset.studyExport)));
        }
        studyTile(s) { const best = [...s.aggregates].filter(a => a.armId !== 'control').sort((a, b) => a.median - b.median)[0] || [...s.aggregates].sort((a, b) => a.median - b.median)[0]; return `<article class="panel project-tile"><span class="eyebrow">${CRC3.escapeHtml(CRC3.formatDate(s.completedAt))} · ${s.runs.length} runs</span><h3>${CRC3.escapeHtml(s.name)}</h3><p>${CRC3.escapeHtml(CRC3.PRESET_LABELS[s.config.preset])} · ${s.config.replicates} 次重复 · ${s.config.horizonDays} 天终点${s.config.scan.enabled ? ' · 参数扫描' : ''}</p><div class="study-summary"><div class="summary-chip"><span>最佳治疗臂</span><strong>${CRC3.escapeHtml(best?.armName || '—')}</strong></div><div class="summary-chip"><span>终点中位数</span><strong>${best ? CRC3.formatRatio(best.median) : '—'}</strong></div><div class="summary-chip"><span>响应概率</span><strong>${best ? CRC3.formatPct(best.responseRate) : '—'}</strong></div></div><div class="project-tile-footer"><span>Model ${CRC3.escapeHtml(s.modelVersion)}</span><button class="quiet-btn" data-study-export="${CRC3.escapeHtml(s.id)}">导出</button><button class="primary-btn" data-study-open="${CRC3.escapeHtml(s.id)}">查看分析</button></div></article>`; }
        renderDesign() {
            const el = this.byId('view-design'), c = this.project.config;
            const activeArms = c.arms.filter(a => a.enabled).length, total = activeArms * c.replicates * (c.scan.enabled ? c.scan.steps : 1);
            el.innerHTML = `<div class="page-head"><div><h2>研究设计</h2><p>定义研究问题、治疗臂、重复种子和参数扫描。所有变更自动保存到本地项目。</p></div><div class="page-actions"><button class="quiet-btn" id="resetDesignBtn">恢复默认</button><button class="primary-btn" id="goRunBtn">检查并运行</button></div></div><div class="design-layout"><div class="panel"><div class="panel-head"><div><h3>研究方案</h3><p>Study protocol · ${CRC3.fingerprint(c)}</p></div></div><div class="section-block"><div class="form-grid"><div class="field"><label for="studyName">研究名称</label><input class="control" id="studyName" value="${this.escape(c.name)}" maxlength="80"></div><div class="field"><label for="horizonDays">模型终点</label><select class="control" id="horizonDays"><option value="28">28 天</option><option value="42">42 天</option><option value="56">56 天</option><option value="84">84 天</option></select></div></div></div><div class="section-block"><h4>肿瘤免疫微环境预设</h4><div class="preset-row">${['msi_hot', 'mss_cold', 'suppressive'].map(p => `<button class="preset-btn ${c.preset === p ? 'active' : ''}" data-preset="${p}"><strong>${CRC3.PRESET_LABELS[p].split(' / ')[0]}</strong><small>${CRC3.PRESET_LABELS[p].split(' / ')[1]}</small></button>`).join('')}</div><div class="callout mt-14">${CRC3.PRESET_DESCRIPTIONS[c.preset]}</div></div><div class="section-block"><div class="flex items-center"><h4 style="margin:0">模型参数</h4><span class="field-help ml-auto">归一化机制值 · 专家模式</span></div><div class="grid-2 mt-14">${this.rangeControl('growthRate', '肿瘤增殖', 45, 185, 5, c.growthRate, v => (v / 100).toFixed(2) + '×')}${this.rangeControl('antigenicity', '抗原可见性', 10, 100, 1, c.antigenicity, v => v + '%')}${this.rangeControl('cd8Potency', 'CD8 杀伤效力', 30, 190, 5, c.cd8Potency, v => (v / 100).toFixed(2) + '×')}${this.rangeControl('immuneRecruitment', '免疫募集', 15, 160, 5, c.immuneRecruitment, v => v + '%')}${this.rangeControl('suppression', '基础免疫抑制', 0, 100, 1, c.suppression, v => v + '%')}${this.rangeControl('oxygenSupply', '组织灌注/氧供', 20, 100, 1, c.oxygenSupply, v => v + '%')}${this.rangeControl('stromaDensity', '基质屏障', 0, 100, 1, c.stromaDensity, v => v + '%')}${this.rangeControl('uncertainty', '个体/随机不确定性', 0, 35, 1, c.uncertainty, v => '±' + v + '%')}</div></div><div class="section-block"><div class="flex items-center"><h4 style="margin:0">治疗臂与给药计划</h4><span class="field-help ml-auto">治疗均为抽象机制模块</span></div><div class="arm-list mt-14">${c.arms.map(a => this.armCard(a)).join('')}</div></div></div><aside><div class="panel"><div class="panel-head"><div><h3>批量实验设置</h3><p>Reproducibility & uncertainty</p></div></div><div class="panel-body"><div class="form-grid"><div class="field"><label for="replicates">每臂重复次数</label><select class="control" id="replicates"><option value="8">8 · 快速</option><option value="20">20 · 标准</option><option value="50">50 · 稳健</option><option value="100">100 · 高精度</option></select></div><div class="field"><label for="baseSeed">基础随机种子</label><input class="control mono" id="baseSeed" type="number" value="${c.baseSeed}"></div></div><div class="study-summary"><div class="summary-chip"><span>治疗臂</span><strong>${activeArms}</strong></div><div class="summary-chip"><span>总运行数</span><strong>${total}</strong></div><div class="summary-chip"><span>预计数据点</span><strong>${(total * (c.horizonDays + 1)).toLocaleString()}</strong></div></div><div class="callout success mt-14">配对种子会用于治疗臂比较；统计结果显示中位数、5%–95% 区间和模型响应概率。</div></div></div><div class="panel mt-14"><div class="panel-head"><div><h3>参数扫描</h3><p>One-factor response surface</p></div><label class="ml-auto"><input type="checkbox" id="scanEnabled" ${c.scan.enabled ? 'checked' : ''}> 启用</label></div><div class="panel-body"><div class="field"><label for="scanParameter">扫描参数</label><select class="control" id="scanParameter"><option value="suppression">基础免疫抑制</option><option value="stromaDensity">基质屏障</option><option value="antigenicity">抗原可见性</option><option value="pd1Dose">抗 PD-1 强度</option><option value="chemoDose">细胞毒暴露</option><option value="tgfbDose">基质调节强度</option></select></div><div class="form-grid mt-14"><div class="field"><label for="scanMin">最小值</label><input class="control" type="number" id="scanMin" value="${c.scan.min}"></div><div class="field"><label for="scanMax">最大值</label><input class="control" type="number" id="scanMax" value="${c.scan.max}"></div></div><div class="field mt-14"><label for="scanSteps">扫描步数</label><select class="control" id="scanSteps"><option value="3">3</option><option value="5">5</option><option value="7">7</option><option value="9">9</option></select></div><div class="callout warning mt-14">开启扫描后，总运行数将乘以扫描步数。基准统计取扫描中点，完整响应面保留在研究记录中。</div></div></div><div class="panel mt-14"><div class="panel-head"><div><h3>研究检查</h3><p>Preflight diagnostics</p></div></div><div class="panel-body" id="preflightBox">${this.preflightHtml()}</div></div></aside></div>`;
            this.byId('horizonDays').value = String(c.horizonDays);
            this.byId('replicates').value = String(c.replicates);
            this.byId('scanParameter').value = c.scan.parameter;
            this.byId('scanSteps').value = String(c.scan.steps);
            this.bindDesign();
        }
        rangeControl(id, label, min, max, step, value, fmt) { return `<div class="range-row"><label for="${CRC3.escapeHtml(id)}">${CRC3.escapeHtml(label)}</label><span class="range-value" id="${CRC3.escapeHtml(id)}Out">${CRC3.escapeHtml(fmt(value))}</span><input id="${CRC3.escapeHtml(id)}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`; }
        armCard(a) { const enabledSchedules = [a.chemo, a.pd1, a.tgfb].filter(schedule => schedule.enabled), firstStart = enabledSchedules.length ? Math.min(...enabledSchedules.map(schedule => schedule.start)) : 0; const sched = (key, schedule) => `<div><label class="schedule-label" for="${a.id}-${key}-dose">${key === 'chemo' ? '细胞毒' : key === 'pd1' ? 'PD-1' : '基质'}剂量</label><input class="control arm-input" id="${a.id}-${key}-dose" data-arm="${CRC3.escapeHtml(a.id)}" data-key="${key}.dose" type="number" min="0" max="100" value="${schedule.dose}" ${!schedule.enabled ? 'disabled' : ''}></div>`; return `<article class="arm-card"><div class="arm-top"><span class="arm-color" style="background:${CRC3.escapeHtml(a.color)}"></span><strong>${CRC3.escapeHtml(a.name)}</strong><small>${CRC3.escapeHtml(a.description)}</small><input class="arm-toggle" aria-label="启用${CRC3.escapeHtml(a.name)}" type="checkbox" data-arm-enable="${CRC3.escapeHtml(a.id)}" ${a.enabled ? 'checked' : ''}></div><div class="arm-schedule">${sched('chemo', a.chemo)}${sched('pd1', a.pd1)}${sched('tgfb', a.tgfb)}<div><label class="schedule-label" for="${a.id}-start">首次给药日</label><input class="control arm-input" id="${a.id}-start" data-arm="${CRC3.escapeHtml(a.id)}" data-key="start" type="number" min="0" max="84" value="${firstStart}" ${a.id === 'control' ? 'disabled' : ''}></div></div></article>`; }
        preflightHtml() { const validation = CRC3.validateStudyConfig(this.project.config), items = [...validation.errors.map(message => ({ message, error: true })), ...validation.warnings.map(message => ({ message, error: false }))]; if (!items.length)
            return `<div class="diagnostic-item"><div class="diag-icon">✓</div><div><strong>方案检查通过</strong><p>治疗臂、终点、随机种子和参数范围均可执行。</p></div></div><div class="diagnostic-item"><div class="diag-icon">✓</div><div><strong>可重复性已记录</strong><p>治疗臂和扫描点按 replicate index 使用共同随机种子。</p></div></div>`; return items.map(item => `<div class="diagnostic-item"><div class="diag-icon" style="color:${item.error ? 'var(--red)' : 'var(--orange)'};background:rgba(242,166,90,.08)">!</div><div><strong>${item.error ? '必须修复' : '需要注意'}</strong><p>${CRC3.escapeHtml(item.message)}</p></div></div>`).join(''); }
        bindDesign() {
            const c = this.project.config;
            const save = () => { this.schedulePersist(); this.updateDesignSummary(); };
            this.byId('studyName').oninput = e => { c.name = e.target.value; save(); };
            this.byId('horizonDays').onchange = e => { c.horizonDays = Number(e.target.value); save(); };
            this.byId('replicates').onchange = e => { c.replicates = Number(e.target.value); save(); };
            this.byId('baseSeed').onchange = e => { c.baseSeed = Number(e.target.value) || 1; save(); };
            this.byId('resetDesignBtn').onclick = () => { this.project.config = CRC3.createDefaultConfig(); this.persist(); this.renderDesign(); this.toast('已恢复默认研究方案'); };
            this.byId('goRunBtn').onclick = () => this.navigate('runs');
            document.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { this.project.config = CRC3.applyPreset(this.project.config, b.dataset.preset); this.persist(); this.renderDesign(); }));
            const rangeFmt = { growthRate: (v) => (v / 100).toFixed(2) + '×', antigenicity: (v) => v + '%', cd8Potency: (v) => (v / 100).toFixed(2) + '×', immuneRecruitment: (v) => v + '%', suppression: (v) => v + '%', oxygenSupply: (v) => v + '%', stromaDensity: (v) => v + '%', uncertainty: (v) => '±' + v + '%' };
            ['growthRate', 'antigenicity', 'cd8Potency', 'immuneRecruitment', 'suppression', 'oxygenSupply', 'stromaDensity', 'uncertainty'].forEach(id => { const input = this.byId(id); input.oninput = () => { c[id] = Number(input.value); this.byId(id + 'Out').textContent = rangeFmt[id](Number(input.value)); save(); }; });
            document.querySelectorAll('[data-arm-enable]').forEach(x => x.onchange = () => { const id = x.dataset.armEnable; const a = c.arms.find(v => v.id === id); a.enabled = x.checked; save(); this.renderDesign(); });
            document.querySelectorAll('.arm-input').forEach(x => x.onchange = () => { const input = x, arm = c.arms.find(value => value.id === input.dataset.arm); const key = input.dataset.key, numeric = Number(input.value); if (!Number.isFinite(numeric))
                return; if (key === 'start') {
                const schedules = [arm.chemo, arm.pd1, arm.tgfb].filter(schedule => schedule.enabled);
                const current = schedules.length ? Math.min(...schedules.map(schedule => schedule.start)) : 0, delta = numeric - current;
                schedules.forEach(schedule => schedule.start = CRC3.clamp(schedule.start + delta, 0, c.horizonDays));
            }
            else {
                const [therapy, property] = key.split('.');
                arm[therapy][property] = CRC3.clamp(numeric, 0, 100);
            } save(); this.renderDesign(); });
            this.byId('scanEnabled').onchange = e => { c.scan.enabled = e.target.checked; save(); this.renderDesign(); };
            this.byId('scanParameter').onchange = e => { c.scan.parameter = e.target.value; save(); };
            this.byId('scanMin').onchange = e => { c.scan.min = Number(e.target.value); save(); };
            this.byId('scanMax').onchange = e => { c.scan.max = Number(e.target.value); save(); };
            this.byId('scanSteps').onchange = e => { c.scan.steps = Number(e.target.value); save(); };
        }
        updateDesignSummary() { this.updateChrome(); const box = document.getElementById('preflightBox'); if (box)
            box.innerHTML = this.preflightHtml(); }
        renderRuns() {
            const el = this.byId('view-runs'), c = this.project.config;
            const arms = c.arms.filter(a => a.enabled), mult = c.scan.enabled ? c.scan.steps : 1, total = arms.length * c.replicates * mult, p = this.runProgress, progress = p ? Math.round(p.completed / p.total * 100) : this.runStatus === 'done' ? 100 : 0;
            el.innerHTML = `<div class="page-head"><div><h2>运行中心</h2><p>批量工作线程按治疗臂、随机种子和扫描点执行计算。可离开本页面继续浏览其他工作区。</p></div><div class="page-actions"><button class="quiet-btn" id="backDesignBtn">返回设计</button><button class="primary-btn" id="startStudyBtn" ${this.runStatus === 'running' ? 'disabled' : ''}>${this.runStatus === 'running' ? '运行中…' : '启动批量研究'}</button></div></div><div class="run-hero"><section class="panel run-status-card"><div class="run-title"><div class="run-orb">${this.runStatus === 'running' ? '↻' : this.runStatus === 'done' ? '✓' : '▶'}</div><div><h3>${this.runStatus === 'running' ? '批量研究正在执行' : this.runStatus === 'done' ? '上一项研究已完成' : '准备执行研究方案'}</h3><p>${CRC3.escapeHtml(c.name)} · ${arms.length} 个治疗臂 · ${c.replicates} 次重复${c.scan.enabled ? ' · ' + c.scan.steps + ' 个扫描点' : ''}</p></div></div><div class="big-progress"><div style="width:${progress}%"></div></div><div class="run-meta"><span>${p ? `${p.completed} / ${p.total} · ${CRC3.escapeHtml(p.armName)} · replicate ${p.replicate}` : `共 ${total} 次独立运行`}</span><span>${progress}%</span></div><div class="run-buttons"><button class="primary-btn" id="startStudyInlineBtn" ${this.runStatus === 'running' ? 'disabled' : ''}>${this.runStatus === 'done' ? '再次运行' : '开始计算'}</button><button class="quiet-btn" id="openAnalysisBtn" ${!this.activeStudy() ? 'disabled' : ''}>打开最新分析</button>${this.runStatus === 'running' ? '<button class="danger-btn" id="cancelRunBtn">取消</button>' : ''}</div>${this.runError ? `<div class="callout warning mt-14">${CRC3.escapeHtml(this.runError)}</div>` : ''}</section><aside class="panel resource-card"><span class="eyebrow">Local compute profile</span><h3 style="font-size:13px;margin:7px 0 0">浏览器内批量计算</h3><div class="resource-meter"><div><span>运行规模</span><strong>${total} runs</strong></div><div class="meter"><i style="width:${Math.min(100, total / 8)}%"></i></div></div><div class="resource-meter"><div><span>时间序列点</span><strong>${(total * (c.horizonDays + 1)).toLocaleString()}</strong></div><div class="meter"><i style="width:${Math.min(100, total * (c.horizonDays + 1) / 800)}%;background:var(--violet)"></i></div></div><div class="resource-meter"><div><span>持久化</span><strong>${this.storageMode === 'opfs' ? 'OPFS' : this.storageMode === 'memory' ? 'Memory' : 'LocalStorage'}</strong></div><div class="meter"><i style="width:76%;background:var(--green)"></i></div></div><p class="field-help">批量模型是为参数探索优化的随机机制模型；代表性空间轨迹在空间工作区单独运行。</p></aside></div><section class="panel mt-14"><div class="panel-head"><div><h3>任务矩阵</h3><p>治疗臂 × 扫描点 × 重复种子</p></div></div><table class="queue-table"><thead><tr><th>治疗臂</th><th>机制</th><th>重复</th><th>扫描点</th><th>状态</th></tr></thead><tbody>${arms.map(a => `<tr><td><span class="arm-name"><i class="arm-dot" style="background:${CRC3.escapeHtml(a.color)}"></i>${CRC3.escapeHtml(a.name)}</span></td><td>${CRC3.escapeHtml(a.description)}</td><td>${c.replicates}</td><td>${mult}</td><td><span class="status-badge ${this.runStatus === 'running' ? 'running' : this.runStatus === 'done' ? 'done' : ''}">${this.runStatus === 'running' ? '计算中' : this.runStatus === 'done' ? '最近已完成' : '待执行'}</span></td></tr>`).join('')}</tbody></table></section><section class="panel mt-14"><div class="panel-head"><div><h3>最近完成的研究</h3><p>结果保存在当前项目中</p></div></div>${this.project.studies.length ? `<table class="data-table"><thead><tr><th>研究</th><th>完成时间</th><th>运行数</th><th>耗时</th><th>操作</th></tr></thead><tbody>${this.project.studies.slice(0, 6).map(s => `<tr><td>${CRC3.escapeHtml(s.name)}</td><td>${CRC3.formatDate(s.completedAt)}</td><td>${s.runs.length}</td><td>${(s.durationMs / 1000).toFixed(2)} s</td><td><button class="quiet-btn" data-open-run="${CRC3.escapeHtml(s.id)}">分析</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty-state"><div><div class="empty-icon">▦</div><h3>尚无运行记录</h3><p>启动批量研究后，此处会显示研究记录及计算诊断。</p></div></div>`}</section>`;
            this.byId('backDesignBtn').onclick = () => this.navigate('design');
            this.byId('startStudyBtn').onclick = () => this.startStudy();
            this.byId('startStudyInlineBtn').onclick = () => this.startStudy();
            this.byId('openAnalysisBtn').onclick = () => this.navigate('analysis');
            if (document.getElementById('cancelRunBtn'))
                this.byId('cancelRunBtn').onclick = () => this.cancelStudy();
            el.querySelectorAll('[data-open-run]').forEach(b => b.addEventListener('click', () => { this.selectedStudyId = b.dataset.openRun; this.navigate('analysis'); }));
        }
        createBatchWorker() { const w = window, embedded = w.__CRC3_BATCH_WORKER_SOURCE__; if (embedded) {
            this.batchWorkerUrl = URL.createObjectURL(new Blob([embedded], { type: 'text/javascript' }));
            return new Worker(this.batchWorkerUrl);
        } return new Worker((w.__CRC3_ASSET_BASE__ || './dist/') + 'batch.worker.js'); }
        cleanupBatchWorker() { this.batchWorker?.terminate(); this.batchWorker = null; if (this.batchWorkerUrl) {
            URL.revokeObjectURL(this.batchWorkerUrl);
            this.batchWorkerUrl = null;
        } }
        startStudy() { if (this.runStatus === 'running')
            return; const cfg = CRC3.normalizeStudyConfig(CRC3.clone(this.project.config)), validation = CRC3.validateStudyConfig(cfg); if (validation.errors.length) {
            this.toast('无法启动', validation.errors.join(' '), true);
            this.navigate('design');
            return;
        } this.project.config = cfg; this.runStatus = 'running'; this.runError = ''; this.runProgress = { completed: 0, total: validation.total, armName: '准备', replicate: 0, elapsedMs: 0 }; this.renderRuns(); this.cleanupBatchWorker(); this.batchWorker = this.createBatchWorker(); const studyId = CRC3.uid('study'), createdAt = new Date().toISOString(); this.batchWorker.onmessage = async (event) => { const message = event.data || {}; if (message.type === 'PROGRESS') {
            this.runProgress = message;
            this.updateRunProgressUi();
        }
        else if (message.type === 'COMPLETE') {
            this.runStatus = 'done';
            this.runProgress = { completed: message.result.runs.length, total: message.result.runs.length, armName: '完成', replicate: 0, elapsedMs: message.result.durationMs };
            this.project.studies.unshift(message.result);
            this.selectedStudyId = message.result.id;
            await this.persist();
            this.cleanupBatchWorker();
            this.toast('批量研究已完成', `${message.result.runs.length} 次运行，耗时 ${(message.result.durationMs / 1000).toFixed(2)} 秒。`);
            if (this.view === 'runs')
                this.renderRuns();
        }
        else if (message.type === 'ERROR') {
            this.runStatus = 'error';
            this.runError = String(message.message || '计算线程异常');
            this.cleanupBatchWorker();
            if (this.view === 'runs')
                this.renderRuns();
            this.toast('运行失败', this.runError, true);
        } }; this.batchWorker.onerror = event => { this.runStatus = 'error'; this.runError = event.message || '计算线程异常'; this.cleanupBatchWorker(); if (this.view === 'runs')
            this.renderRuns(); this.toast('运行失败', this.runError, true); }; this.batchWorker.postMessage({ type: 'RUN_STUDY', studyId, createdAt, config: cfg }); }
        cancelStudy() { this.cleanupBatchWorker(); this.runStatus = 'idle'; this.runProgress = null; this.toast('已取消批量研究'); this.renderRuns(); }
        updateRunProgressUi() { const p = this.runProgress; if (!p)
            return; const pct = Math.round(p.completed / p.total * 100), fill = document.querySelector('.big-progress>div'); if (fill)
            fill.style.width = pct + '%'; const side = this.byId('sideProgressFill'); if (side)
            side.style.width = pct + '%'; const txt = this.byId('sideProgressText'); if (txt)
            txt.textContent = `批量运行 ${p.completed}/${p.total}`; if (this.view === 'runs') {
            const metas = document.querySelectorAll('.run-meta span');
            if (metas[0])
                metas[0].textContent = `${p.completed} / ${p.total} · ${p.armName} · replicate ${p.replicate}`;
            if (metas[1])
                metas[1].textContent = pct + '%';
        } }
        renderAnalysis() {
            const el = this.byId('view-analysis'), study = this.activeStudy();
            if (!study) {
                el.innerHTML = `<div class="page-head"><div><h2>统计分析</h2><p>比较治疗臂的重复运行、不确定性区间与响应概率。</p></div></div><div class="panel empty-state"><div><div class="empty-icon">⌁</div><h3>需要先完成一项批量研究</h3><p>进入运行中心启动研究。分析页不会用单次随机轨迹代替统计结论。</p><button class="primary-btn" id="emptyRunBtn">前往运行中心</button></div></div>`;
                this.byId('emptyRunBtn').onclick = () => this.navigate('runs');
                return;
            }
            const bestOverall = [...study.aggregates].sort((a, b) => a.median - b.median)[0];
            const bestTreatment = [...study.aggregates].filter(aggregate => aggregate.armId !== 'control').sort((a, b) => a.median - b.median)[0] || bestOverall;
            el.innerHTML = `<div class="page-head"><div><h2>统计分析</h2><p>${CRC3.escapeHtml(study.name)} · ${CRC3.escapeHtml(CRC3.formatDate(study.completedAt))} · ${study.runs.length} 次运行</p></div><div class="page-actions"><select class="control" id="studySelect" aria-label="选择研究" style="width:260px">${this.project.studies.map(item => `<option value="${CRC3.escapeHtml(item.id)}">${CRC3.escapeHtml(item.name)}</option>`).join('')}</select><button class="quiet-btn" id="exportAnalysisBtn">导出 JSON</button><button class="quiet-btn" id="exportCsvBtn">导出 CSV</button><button class="primary-btn" id="reportBtn">生成报告</button></div></div><div class="grid-4 mb-14"><div class="panel kpi-card"><div class="kpi-label">最佳模型治疗臂</div><div class="kpi-value" style="font-size:18px;color:${CRC3.escapeHtml(bestTreatment.color)}">${CRC3.escapeHtml(bestTreatment.armName)}</div><div class="kpi-sub">终点肿瘤负荷中位数 ${CRC3.formatRatio(bestTreatment.median)}</div></div><div class="panel kpi-card"><div class="kpi-label">响应概率</div><div class="kpi-value">${CRC3.formatPct(bestTreatment.responseRate)}</div><div class="kpi-sub">模型定义：终点负荷 &lt; 0.72×</div></div><div class="panel kpi-card"><div class="kpi-label">优于对照概率</div><div class="kpi-value">${bestTreatment.betterThanControl === null ? '—' : CRC3.formatPct(bestTreatment.betterThanControl)}</div><div class="kpi-sub">按 replicate index 配对比较</div></div><div class="panel kpi-card"><div class="kpi-label">不确定性区间</div><div class="kpi-value" style="font-size:18px">${bestTreatment.q05.toFixed(2)}–${bestTreatment.q95.toFixed(2)}×</div><div class="kpi-sub">终点 5%–95% 分位</div></div></div><div class="analysis-grid"><div><section class="panel"><div class="panel-head"><div><h3>治疗轨迹与不确定性</h3><p>实线为中位数，阴影为 5%–95% 分位区间</p></div><div class="chart-tabs">${['tumor', 'cytotoxic', 'infiltration', 'exhaustion'].map(metric => `<button class="chart-tab ${this.analysisMetric === metric ? 'active' : ''}" data-metric="${metric}">${CRC3.escapeHtml(this.metricLabel(metric))}</button>`).join('')}</div></div><div class="chart-wrap"><canvas id="trajectoryChart" role="img" aria-label="治疗轨迹与不确定性曲线"></canvas></div><div class="panel-body" style="padding-top:0"><div class="chart-legend">${study.aggregates.map(aggregate => `<span class="legend-item"><i class="legend-swatch" style="background:${CRC3.escapeHtml(aggregate.color)}"></i>${CRC3.escapeHtml(aggregate.armName)}</span>`).join('')}</div></div></section><section class="panel mt-14"><div class="panel-head"><div><h3>治疗臂统计表</h3><p>终点负荷、响应概率和对照校正效应</p></div></div><div style="overflow:auto"><table class="data-table"><thead><tr><th>治疗臂</th><th>n</th><th>终点中位数</th><th>5%–95%</th><th>响应/稳定/进展</th><th>相对对照</th></tr></thead><tbody>${study.aggregates.map(aggregate => `<tr><td><span class="arm-name"><i class="arm-dot" style="background:${CRC3.escapeHtml(aggregate.color)}"></i>${CRC3.escapeHtml(aggregate.armName)}</span></td><td>${aggregate.n}</td><td class="${aggregate.median < 1 ? 'number-good' : aggregate.median > 1.18 ? 'number-bad' : ''}">${aggregate.median.toFixed(2)}×</td><td>${aggregate.q05.toFixed(2)}–${aggregate.q95.toFixed(2)}</td><td><div class="response-bar" title="响应 ${CRC3.formatPct(aggregate.responseRate)} · 稳定 ${CRC3.formatPct(aggregate.stableRate)} · 进展 ${CRC3.formatPct(aggregate.progressionRate)}"><i class="response-good" style="width:${aggregate.responseRate * 100}%"></i><i class="response-stable" style="width:${aggregate.stableRate * 100}%"></i><i class="response-bad" style="width:${aggregate.progressionRate * 100}%"></i></div><span class="field-help">${CRC3.formatPct(aggregate.responseRate)} / ${CRC3.formatPct(aggregate.stableRate)} / ${CRC3.formatPct(aggregate.progressionRate)}</span></td><td>${aggregate.effectVsControl === null ? '基准' : `${aggregate.effectVsControl < 0 ? '' : '+'}${CRC3.formatPct(aggregate.effectVsControl, 1)}`}</td></tr>`).join('')}</tbody></table></div></section></div><aside><section class="panel"><div class="panel-head"><div><h3>终点分布</h3><p>箱体为 25%–75% 分位</p></div></div><div class="chart-wrap small"><canvas id="distributionChart" role="img" aria-label="治疗臂终点分布箱线图"></canvas></div></section><section class="panel mt-14"><div class="panel-head"><div><h3>参数响应面</h3><p>${CRC3.escapeHtml(study.config.scan.enabled ? this.scanLabel(study.config.scan.parameter) : '当前研究未启用扫描')}</p></div></div><div class="chart-wrap small"><canvas id="heatmapChart" role="img" aria-label="参数扫描响应热图"></canvas></div></section><section class="panel mt-14"><div class="panel-head"><div><h3>模型诊断</h3><p>Study-level checks</p></div></div><div class="panel-body diagnostic-list">${study.diagnostics.map(diagnostic => `<div class="diagnostic-item"><div class="diag-icon">✓</div><div><strong>${CRC3.escapeHtml(diagnostic)}</strong><p>记录于研究结果与导出包。</p></div></div>`).join('')}</div></section></aside></div><div class="callout warning mt-14">“响应、稳定、进展”均为本模型的归一化终点分层，不等同于 RECIST、病理缓解或患者临床结局。</div>`;
            const select = this.byId('studySelect');
            select.value = study.id;
            select.onchange = event => { this.selectedStudyId = event.target.value; this.renderAnalysis(); };
            this.byId('exportAnalysisBtn').onclick = () => this.exportStudy(study.id);
            this.byId('exportCsvBtn').onclick = () => this.exportStudyCsv(study);
            this.byId('reportBtn').onclick = () => this.exportReport(study);
            el.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => { this.analysisMetric = button.dataset.metric; this.renderAnalysis(); }));
            requestAnimationFrame(() => { CRC3.Charts.line(this.byId('trajectoryChart'), study.aggregates, this.analysisMetric); CRC3.Charts.distribution(this.byId('distributionChart'), study.aggregates); CRC3.Charts.heatmap(this.byId('heatmapChart'), study); });
        }
        metricLabel(m) { return { tumor: '肿瘤负荷', cytotoxic: '细胞毒活性', infiltration: '免疫浸润', exhaustion: '耗竭', hypoxia: '缺氧', suppression: '抑制', drug: '药物' }[m]; }
        scanLabel(p) { return { suppression: '基础免疫抑制', stromaDensity: '基质屏障', antigenicity: '抗原可见性', pd1Dose: '抗 PD-1 强度', chemoDose: '细胞毒暴露', tgfbDose: '基质调节强度' }[p] || p; }
        renderSpatial() {
            const el = this.byId('view-spatial'), study = this.activeStudy(), config = study?.config || this.project.config, arms = config.arms.filter(arm => arm.enabled);
            if (!arms.find(arm => arm.id === this.spatialArmId))
                this.spatialArmId = arms[0]?.id || 'control';
            this.spatial?.destroy();
            this.spatial = null;
            el.innerHTML = `<div class="page-head"><div><h2>空间工作区</h2><p>运行一个代表性代理模型，检查细胞浸润、缺氧、药物暴露、基质与区域空间表型。</p></div><div class="page-actions"><select class="control" id="spatialArmSelect" aria-label="空间模型治疗臂" style="width:220px">${arms.map(arm => `<option value="${CRC3.escapeHtml(arm.id)}">${CRC3.escapeHtml(arm.name)}</option>`).join('')}</select><input class="control mono" id="spatialSeed" aria-label="空间模型随机种子" type="number" value="${this.spatialSeed}" style="width:140px"><button class="primary-btn" id="initSpatialBtn">初始化组织</button></div></div><div class="spatial-grid"><section class="panel"><div class="panel-head"><div><h3>代表性组织切面</h3><p id="spatialStatus" role="status" aria-live="polite">等待初始化 · 拖拽可框选区域</p></div><div class="panel-actions spatial-toolbar"><button class="quiet-btn" id="spatialPlayBtn">▶ 运行</button><button class="quiet-btn" id="spatialStepBtn">单步</button><button class="quiet-btn" id="clearRegionBtn">清除框选</button></div></div><div class="spatial-stage"><canvas id="spatialCanvas" role="img" aria-label="代表性肿瘤免疫组织切面，可拖拽框选区域"></canvas><div class="canvas-overlay"></div></div></section><aside><section class="panel inspect-card"><span class="eyebrow">Region inspector</span><h3 style="font-size:13px;margin:7px 0 0">区域空间指标</h3><div id="regionMetrics"><p class="text-muted">初始化组织后显示指标。</p></div></section><section class="panel mt-14"><div class="panel-head"><div><h3>可视图层</h3><p>Cells & continuous fields</p></div></div><div class="panel-body layer-list"><button class="layer-btn active" data-layer="cells">细胞组成<span class="ml-auto">●</span></button><button class="layer-btn" data-layer="oxygen">氧浓度<i class="layer-gradient grad-oxygen"></i></button><button class="layer-btn" data-layer="drug">药物暴露<i class="layer-gradient grad-drug"></i></button><button class="layer-btn" data-layer="chemokine">趋化因子<i class="layer-gradient grad-chemokine"></i></button><button class="layer-btn" data-layer="suppression">免疫抑制<i class="layer-gradient grad-suppression"></i></button><button class="layer-btn" data-layer="stroma">基质密度<i class="layer-gradient grad-stroma"></i></button></div></section><section class="panel mt-14 inspect-card"><span class="eyebrow">Cell legend</span><div class="cell-legend"><span class="cell-key"><i style="background:#f1777a"></i>肿瘤</span><span class="cell-key"><i style="background:#45dbc1"></i>CD8</span><span class="cell-key"><i style="background:#758cff"></i>NK</span><span class="cell-key"><i style="background:#e9cf70"></i>Treg</span><span class="cell-key"><i style="background:#f2a65a"></i>巨噬</span><span class="cell-key"><i style="background:#b18cff"></i>CAF</span></div></section><div class="callout warning mt-14">空间工作区展示单个随机种子的代表性组织轨迹。正式比较应以批量分析中的重复运行分布为准。</div></aside></div>`;
            const armSelect = this.byId('spatialArmSelect');
            armSelect.value = this.spatialArmId;
            armSelect.onchange = event => this.spatialArmId = event.target.value;
            this.byId('spatialSeed').onchange = event => this.spatialSeed = Number(event.target.value) || 1;
            const canvas = this.byId('spatialCanvas'), playButton = this.byId('spatialPlayBtn');
            this.spatial = new CRC3.SpatialWorkbench(canvas);
            this.spatial.onMetrics = html => this.byId('regionMetrics').innerHTML = html;
            this.spatial.onStatus = text => { this.byId('spatialStatus').textContent = text; if (text.includes('终点'))
                playButton.textContent = '▶ 运行'; };
            this.byId('initSpatialBtn').onclick = () => { const arm = config.arms.find(candidate => candidate.id === this.spatialArmId); if (!arm) {
                this.toast('无法初始化', '未找到启用的治疗臂', true);
                return;
            } this.spatial.init(config, arm, this.spatialSeed); playButton.textContent = '▶ 运行'; };
            playButton.onclick = () => { if (!this.spatial.snapshot)
                this.byId('initSpatialBtn').click(); if (this.spatial.running) {
                this.spatial.stop();
                playButton.textContent = '▶ 运行';
            }
            else {
                this.spatial.start();
                playButton.textContent = 'Ⅱ 暂停';
            } };
            this.byId('spatialStepBtn').onclick = () => this.spatial.step();
            this.byId('clearRegionBtn').onclick = () => this.spatial.clearSelection();
            el.querySelectorAll('[data-layer]').forEach(button => button.addEventListener('click', () => { el.querySelectorAll('[data-layer]').forEach(item => item.classList.remove('active')); button.classList.add('active'); this.spatial.setLayer(button.dataset.layer); }));
        }
        renderProvenance() { const el = this.byId('view-provenance'); el.innerHTML = `<div class="page-head"><div><h2>模型、参数证据与溯源</h2><p>明确区分文献支持、校准值与机制假设，并记录版本、范围和敏感性。</p></div><div class="page-actions"><button class="quiet-btn" id="exportModelCardBtn">导出模型卡</button><button class="primary-btn" id="exportProtocolBtn">导出研究协议</button></div></div><div class="grid-3 mb-14"><div class="panel kpi-card"><div class="kpi-label">模型版本</div><div class="kpi-value" style="font-size:20px">${CRC3.VERSION}</div><div class="kpi-sub">Batch stochastic + spatial ABM</div></div><div class="panel kpi-card"><div class="kpi-label">当前配置指纹</div><div class="kpi-value mono" style="font-size:20px">${CRC3.fingerprint(this.project.config)}</div><div class="kpi-sub">配置变更会生成新指纹</div></div><div class="panel kpi-card"><div class="kpi-label">参数证据覆盖</div><div class="kpi-value">${CRC3.PARAMETER_EVIDENCE.length}</div><div class="kpi-sub">个已登记核心参数</div></div></div><div class="grid-2"><section class="panel"><div class="panel-head"><div><h3>参数证据库</h3><p>Parameter registry</p></div></div><div style="overflow:auto"><table class="data-table evidence-table"><thead><tr><th>参数</th><th>含义</th><th>默认/范围</th><th>证据类型</th><th>置信</th><th>敏感性</th></tr></thead><tbody>${CRC3.PARAMETER_EVIDENCE.map(p => `<tr><td><strong>${p.label}</strong><br><span class="mono text-muted">${p.id}</span></td><td>${p.meaning}</td><td>${p.defaultValue}<br><span class="text-muted">${p.range} · ${p.unit}</span></td><td><span class="evidence-level ${p.sourceType}">${p.sourceType === 'literature' ? '文献' : p.sourceType === 'calibrated' ? '模型校准' : '机制假设'}</span></td><td>${p.confidence}</td><td>${p.sensitivity}</td></tr>`).join('')}</tbody></table></div></section><div><section class="panel"><div class="panel-head"><div><h3>模型结构</h3><p>Two-tier compute architecture</p></div></div><div class="panel-body diagnostic-list"><div class="diagnostic-item"><div class="diag-icon">1</div><div><strong>批量随机机制模型</strong><p>用于 8–100 次重复、治疗臂比较、置信区间和参数扫描。状态变量以 0.25 天步长更新。</p></div></div><div class="diagnostic-item"><div class="diag-icon">2</div><div><strong>代表性空间代理模型</strong><p>用于细胞级迁移、接触杀伤、扩散场、组织切面和区域空间分析。</p></div></div><div class="diagnostic-item"><div class="diag-icon">3</div><div><strong>本地项目与研究包</strong><p>优先使用 OPFS 保存项目；导出包含配置、种子、时间序列、聚合统计、诊断和模型卡。</p></div></div></div></section><section class="panel mt-14"><div class="panel-head"><div><h3>自动诊断规则</h3><p>Guardrails</p></div></div><div class="panel-body diagnostic-list"><div class="diagnostic-item"><div class="diag-icon">✓</div><div><strong>状态范围检查</strong><p>概率、抑制、耗竭、氧和浸润均限制在定义域。</p></div></div><div class="diagnostic-item"><div class="diag-icon">✓</div><div><strong>配对种子比较</strong><p>相同 replicate index 共享可追溯种子生成规则，降低比较噪声。</p></div></div><div class="diagnostic-item"><div class="diag-icon">!</div><div><strong>模型边界提示</strong><p>所有药物强度均为无量纲抽象作用，不映射真实剂量、毒性或患者疗效。</p></div></div></div></section></div></div><div class="callout warning mt-14">本版本是研究与教学用机制模型。它不是患者数字孪生，不执行诊断、患者分层、真实药代动力学、毒性预测或治疗推荐。</div>`; this.byId('exportModelCardBtn').onclick = () => CRC3.downloadText('CRC-ImmunoLab-v3-model-card.md', this.modelCard(), 'text/markdown;charset=utf-8'); this.byId('exportProtocolBtn').onclick = () => CRC3.downloadText('CRC-ImmunoLab-v3-protocol.json', JSON.stringify({ modelVersion: CRC3.VERSION, config: this.project.config, parameterRegistry: CRC3.PARAMETER_EVIDENCE }, null, 2), 'application/json'); }
        showProjectModal() {
            const wrap = document.createElement('div');
            wrap.className = 'modal-backdrop';
            wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="projectModalTitle"><div class="modal-head"><h3 id="projectModalTitle">编辑项目</h3><button class="icon-btn ml-auto" aria-label="关闭" data-close>×</button></div><div class="modal-body"><div class="field"><label for="modalProjectName">项目名称</label><input class="control" id="modalProjectName" maxlength="80" value="${CRC3.escapeHtml(this.project.name)}"></div><div class="field mt-14"><label for="modalProjectDesc">项目描述</label><textarea class="control" id="modalProjectDesc" maxlength="500" rows="4">${CRC3.escapeHtml(this.project.description)}</textarea></div></div><div class="modal-foot"><button class="quiet-btn" data-close>取消</button><button class="primary-btn" id="saveProjectModal">保存</button></div></div>`;
            const close = () => { document.removeEventListener('keydown', onKey); wrap.remove(); }, onKey = (event) => { if (event.key === 'Escape')
                close(); };
            document.body.appendChild(wrap);
            document.addEventListener('keydown', onKey);
            wrap.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
            wrap.addEventListener('click', event => { if (event.target === wrap)
                close(); });
            const nameInput = wrap.querySelector('#modalProjectName'), descriptionInput = wrap.querySelector('#modalProjectDesc');
            nameInput.focus();
            wrap.querySelector('#saveProjectModal').onclick = () => { this.project.name = nameInput.value.trim().slice(0, 80) || 'CRC 空间免疫研究项目'; this.project.description = descriptionInput.value.trim().slice(0, 500); void this.persist(); close(); this.renderProjects(); this.toast('项目已更新'); };
        }
        escape(s) { return CRC3.escapeHtml(s); }
        exportStudy(id) { const s = this.project.studies.find(x => x.id === id); if (!s)
            return; CRC3.downloadText(`${this.safeName(s.name)}.crcstudy.json`, JSON.stringify(s, null, 2), 'application/json'); }
        exportResearchBundle() { const bundle = { format: 'CRC-ImmunoLab Research Bundle', formatVersion: '1.0', exportedAt: new Date().toISOString(), project: this.project, modelCard: this.modelCard(), parameterRegistry: CRC3.PARAMETER_EVIDENCE, provenance: { application: 'CRC ImmunoLab 3', modelVersion: CRC3.VERSION, configFingerprint: CRC3.fingerprint(this.project.config), storageMode: this.storageMode, notice: 'Research and educational mechanism model; not for clinical decision-making.' } }; CRC3.downloadText(`${this.safeName(this.project.name)}-research-bundle.crcstudy`, JSON.stringify(bundle, null, 2), 'application/json'); this.toast('研究包已导出', '包含项目、运行、种子、统计、参数证据与模型卡。'); }
        exportStudyCsv(study) {
            const header = ['study_id', 'study_name', 'model_version', 'arm_id', 'arm_name', 'replicate', 'seed', 'scan_value', 'response', 'endpoint_tumor', 'day', 'tumor', 'cytotoxic', 'infiltration', 'exhaustion', 'hypoxia', 'suppression', 'drug'];
            const rows = [header.join(',')];
            for (const run of study.runs) {
                for (const point of run.timeSeries) {
                    rows.push([study.id, study.name, study.modelVersion, run.armId, run.armName, run.replicate, run.seed, run.scanValue ?? '', run.response, run.endpointTumor, point.day, point.tumor, point.cytotoxic, point.infiltration, point.exhaustion, point.hypoxia, point.suppression, point.drug].map(CRC3.csvEscape).join(','));
                }
            }
            CRC3.downloadText(`${this.safeName(study.name)}-timeseries.csv`, rows.join('\n'), 'text/csv;charset=utf-8');
        }
        exportReport(study) {
            const best = [...study.aggregates].filter(aggregate => aggregate.armId !== 'control').sort((a, b) => a.median - b.median)[0] || [...study.aggregates].sort((a, b) => a.median - b.median)[0];
            const rows = study.aggregates.map(aggregate => `<tr><td>${CRC3.escapeHtml(aggregate.armName)}</td><td>${aggregate.n}</td><td>${aggregate.median.toFixed(3)}</td><td>${aggregate.q05.toFixed(3)}–${aggregate.q95.toFixed(3)}</td><td>${CRC3.formatPct(aggregate.responseRate)}</td><td>${aggregate.betterThanControl === null ? '—' : CRC3.formatPct(aggregate.betterThanControl)}</td></tr>`).join('');
            const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${CRC3.escapeHtml(study.name)} — 报告</title><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;max-width:980px;margin:42px auto;color:#172126;line-height:1.55;padding:0 18px}h1{font-size:25px}h2{margin-top:28px;border-bottom:1px solid #ccd6d8;padding-bottom:6px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd6d8;padding:8px;text-align:left;font-size:13px}.note{background:#f3f6f6;padding:12px;border-left:4px solid #2aa896}.warning{background:#fff5e9;padding:12px;border-left:4px solid #e89d50}code{background:#edf2f3;padding:2px 4px}@media(max-width:720px){table{display:block;overflow:auto}}</style></head><body><h1>CRC ImmunoLab 3 研究报告</h1><p><strong>${CRC3.escapeHtml(study.name)}</strong></p><div class="note">完成时间：${CRC3.escapeHtml(CRC3.formatDate(study.completedAt))} · 模型版本：${CRC3.escapeHtml(study.modelVersion)} · 配置指纹：<code>${CRC3.fingerprint(study.config)}</code> · 总运行：${study.runs.length}</div><h2>研究设计</h2><p>预设：${CRC3.escapeHtml(CRC3.PRESET_LABELS[study.config.preset])}；终点：${study.config.horizonDays} 天；每臂重复：${study.config.replicates}；不确定性：±${study.config.uncertainty}%${study.config.scan.enabled ? `；扫描：${CRC3.escapeHtml(this.scanLabel(study.config.scan.parameter))} ${study.config.scan.min}–${study.config.scan.max}` : ''}。</p><h2>主要结果</h2><p>模型内终点负荷最低的非对照治疗臂为 <strong>${CRC3.escapeHtml(best.armName)}</strong>，中位数 ${best.median.toFixed(3)}×，5%–95% 区间 ${best.q05.toFixed(3)}–${best.q95.toFixed(3)}×，响应概率 ${CRC3.formatPct(best.responseRate)}。</p><table><thead><tr><th>治疗臂</th><th>n</th><th>终点中位数</th><th>5%–95%</th><th>响应概率</th><th>优于对照概率</th></tr></thead><tbody>${rows}</tbody></table><h2>诊断与可重复性</h2><ul>${study.diagnostics.map(diagnostic => `<li>${CRC3.escapeHtml(diagnostic)}</li>`).join('')}</ul><h2>模型边界</h2><div class="warning">本报告描述归一化机制模型的计算结果，不代表真实患者疗效、RECIST、病理缓解、临床剂量或治疗建议。</div></body></html>`;
            CRC3.downloadText(`${this.safeName(study.name)}-report.html`, html, 'text/html;charset=utf-8');
        }
        modelCard() { return `# CRC ImmunoLab 3 模型卡\n\n- 版本：${CRC3.VERSION}\n- 类型：浏览器内批量随机机制模型 + 空间代理模型\n- 领域：结直肠癌肿瘤免疫微环境与抽象联合治疗\n- 状态变量：肿瘤负荷、CD8/NK 活性、Treg/CAF 抑制、耗竭、氧、药物暴露与空间扩散场\n- 输出：重复运行分布、5%–95% 分位区间、模型响应概率、空间表型和区域指标\n- 可重复性：记录研究配置、模型版本、配置指纹和每次运行种子\n- 参数性质：归一化机制值；文献、校准和机制假设必须区分\n- 不适用范围：患者诊断、治疗推荐、真实剂量换算、毒性预测或临床结局预测\n`; }
        safeName(s) { const name = s.replace(/[\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 80); return name || 'crc-study'; }
        async importProject(event) {
            const input = event.target, file = input.files?.[0];
            if (!file)
                return;
            try {
                if (file.size > CRC3.MAX_IMPORT_BYTES)
                    throw new Error(`文件超过 ${(CRC3.MAX_IMPORT_BYTES / 1024 / 1024).toFixed(0)} MB 导入上限`);
                const data = JSON.parse(await file.text());
                this.project = CRC3.normalizeProjectPayload(data);
                this.selectedStudyId = this.project.studies[0]?.id || null;
                await this.persist();
                this.toast('项目已导入', `${this.project.studies.length} 项研究记录。`);
                this.navigate('projects');
            }
            catch (error) {
                this.toast('导入失败', String(error?.message || error), true);
            }
            finally {
                input.value = '';
            }
        }
    }
    CRC3.App = App;
    document.addEventListener('DOMContentLoaded', () => new App(document.getElementById('app')).init());
})(CRC3 || (CRC3 = {}));

  