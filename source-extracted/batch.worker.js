const METRICS = ['tumor', 'cytotoxic', 'infiltration', 'exhaustion', 'hypoxia', 'suppression', 'drug'];
const MODEL_VERSION = '1.0.0';
const MAX_RUNS = 4500;
function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function normal(rng) { const u = Math.max(1e-9, rng()), v = Math.max(1e-9, rng()); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function quantile(values, q) { if (!values.length)
    return 0; const a = [...values].sort((x, y) => x - y), p = (a.length - 1) * q, b = Math.floor(p), r = p - b; return a[b] + (a[Math.min(a.length - 1, b + 1)] - a[b]) * r; }
function doseBetween(schedule, startDay, endDay) {
    if (!schedule.enabled || schedule.dose <= 0 || schedule.cycles <= 0)
        return 0;
    let dose = 0;
    for (let index = 0; index < schedule.cycles; index++) {
        const administrationDay = schedule.start + index * schedule.interval;
        if (administrationDay >= startDay - 1e-9 && administrationDay < endDay - 1e-9)
            dose += schedule.dose / 100;
    }
    return dose;
}
function applyScan(config, value) {
    const next = JSON.parse(JSON.stringify(config));
    if (value === null)
        return next;
    if (config.scan.parameter in next)
        next[config.scan.parameter] = value;
    else if (config.scan.parameter === 'pd1Dose')
        next.arms.forEach((arm) => { if (arm.pd1.enabled)
            arm.pd1.dose = value; });
    else if (config.scan.parameter === 'chemoDose')
        next.arms.forEach((arm) => { if (arm.chemo.enabled)
            arm.chemo.dose = value; });
    else if (config.scan.parameter === 'tgfbDose')
        next.arms.forEach((arm) => { if (arm.tgfb.enabled)
            arm.tgfb.dose = value; });
    return next;
}
function runOne(base, arm, replicate, seed, scanValue) {
    const config = applyScan(base, scanValue), rng = mulberry32(seed), uncertainty = config.uncertainty / 100;
    const variation = (scale = 1) => 1 + normal(rng) * uncertainty * scale;
    let tumor = 1, cd8 = (config.cd8Count / 100) * variation(.55), nk = (config.nkCount / 70) * variation(.6), treg = (config.tregCount / 70) * variation(.55), caf = (config.cafCount / 85) * variation(.45);
    let exhaustion = clamp((config.preset === 'mss_cold' ? .38 : config.preset === 'suppressive' ? .48 : .25) * variation(.35), 0, .8);
    let chemo = 0, pd1 = 0, tgfb = 0;
    const dt = .25, points = [];
    const growthBase = .033 * (config.growthRate / 100) * variation(.35), antigen = clamp(config.antigenicity / 100 * variation(.25), .05, 1.25), potency = clamp(config.cd8Potency / 100 * variation(.25), .15, 2);
    const recruitment = clamp(config.immuneRecruitment / 100 * variation(.28), .05, 1.8), baseSuppression = clamp(config.suppression / 100 * variation(.22), 0, 1), baseOxygen = clamp(config.oxygenSupply / 100 * variation(.16), .15, 1), baseStroma = clamp(config.stromaDensity / 100 * variation(.18), 0, 1);
    const derived = () => {
        const stroma = clamp(baseStroma * (1 - .52 * clamp(tgfb, 0, 1.5)) + .08 * caf, 0, 1);
        const suppression = clamp(baseSuppression + .18 * treg + .14 * caf + .06 * Math.min(2, tumor) - .50 * clamp(tgfb, 0, 1.4), 0, 1);
        const oxygen = clamp(baseOxygen - .19 * Math.max(0, tumor - 1) - .08 * caf + .05 * clamp(tgfb, 0, 1), .05, 1);
        const hypoxia = clamp((.36 - oxygen) * 2.2 + .12 * Math.max(0, tumor - 1), 0, 1);
        const chemokine = clamp(.12 + .30 * antigen + .18 * Math.min(1.5, tumor) + .10 * chemo, 0, 1);
        const infiltrationTarget = clamp(recruitment * chemokine * (1 - .68 * stroma) * (config.preset === 'mss_cold' ? .72 : 1), 0, 1);
        const infiltration = clamp((cd8 * .67 + nk * .33) / (1.4 + tumor) * (.55 + .55 * infiltrationTarget), 0, 1);
        const pd1Relief = clamp(pd1 * .55, 0, .72);
        const cytotoxic = clamp((cd8 * .72 + nk * .42) * antigen * potency * (1 - exhaustion * (1 - pd1Relief)) * (1 - .68 * suppression) * (.35 + .85 * infiltration), 0, 1.5);
        return { stroma, suppression, oxygen, hypoxia, infiltrationTarget, infiltration, pd1Relief, cytotoxic };
    };
    let currentDay = 0;
    while (currentDay <= config.horizonDays + 1e-9) {
        const observed = derived();
        if (Math.abs(currentDay - Math.round(currentDay)) < 1e-8) {
            points.push({ day: Math.round(currentDay), tumor, cytotoxic: clamp(observed.cytotoxic), infiltration: observed.infiltration, exhaustion, hypoxia: observed.hypoxia, suppression: observed.suppression, drug: clamp(chemo * .65 + pd1 * .22 + tgfb * .13, 0, 1.5) });
        }
        if (currentDay >= config.horizonDays - 1e-9)
            break;
        const nextDay = Math.min(config.horizonDays, currentDay + dt), stepDays = nextDay - currentDay;
        chemo += doseBetween(arm.chemo, currentDay, nextDay);
        pd1 += doseBetween(arm.pd1, currentDay, nextDay);
        tgfb += doseBetween(arm.tgfb, currentDay, nextDay);
        chemo *= Math.exp(-Math.log(2) * stepDays / 2.3);
        pd1 *= Math.exp(-Math.log(2) * stepDays / 9.2);
        tgfb *= Math.exp(-Math.log(2) * stepDays / 5.6);
        let state = derived();
        exhaustion = clamp(exhaustion + stepDays * (.012 * tumor + .035 * state.suppression - .020 * state.pd1Relief - .010 * (1 - state.suppression)), 0, .95);
        state = derived();
        const immunogenicSynergy = 1 + 1.15 * clamp(chemo, 0, 1) * clamp(pd1, 0, 1), immuneKill = .050 * state.cytotoxic * tumor * immunogenicSynergy;
        const chemoKill = .066 * chemo * tumor * (.45 + .55 * growthBase / .033) * (1 - .28 * state.hypoxia), carrying = Math.max(2.0, 3.1 - .45 * state.stroma), growth = growthBase * state.oxygen * tumor * (1 - tumor / carrying);
        const noise = normal(rng) * .006 * Math.sqrt(stepDays) * (1 + uncertainty);
        tumor = Math.max(.015, tumor + stepDays * (growth - immuneKill - chemoKill) + noise * tumor);
        const immuneToxicity = .012 * chemo;
        cd8 = Math.max(.01, cd8 + stepDays * (.020 * state.infiltrationTarget - .011 * exhaustion - .010 * state.suppression - immuneToxicity) + normal(rng) * .0025);
        nk = Math.max(.005, nk + stepDays * (.010 * state.infiltrationTarget - .007 * state.suppression - .007 * chemo) + normal(rng) * .0018);
        treg = Math.max(.005, treg + stepDays * (.006 * state.suppression - .012 * tgfb - .004) + normal(rng) * .0012);
        caf = Math.max(.005, caf + stepDays * (.005 * state.suppression - .015 * tgfb - .003) + normal(rng) * .0012);
        currentDay = nextDay;
    }
    const endpoint = tumor, response = endpoint < .72 ? 'responding' : endpoint < 1.18 ? 'stable' : 'progressing';
    return { id: `${arm.id}-${scanValue ?? 'base'}-${replicate}-${seed}`, armId: arm.id, armName: arm.name, color: arm.color, replicate, seed, scanValue, endpointTumor: endpoint, response, timeSeries: points };
}
function aggregate(runs, arms) {
    const control = runs.filter(run => run.armId === 'control' && run.scanValue === null), controlMedian = control.length ? quantile(control.map(run => run.endpointTumor), .5) : null;
    return arms.filter(arm => arm.enabled).map(arm => {
        const armRuns = runs.filter(run => run.armId === arm.id && run.scanValue === null), endpoints = armRuns.map(run => run.endpointTumor), days = armRuns[0]?.timeSeries.map(point => point.day) || [], series = {};
        for (const key of METRICS)
            series[key] = days.map((day, index) => { const values = armRuns.map(run => run.timeSeries[index]?.[key] ?? 0); return { day, q05: quantile(values, .05), q25: quantile(values, .25), median: quantile(values, .5), q75: quantile(values, .75), q95: quantile(values, .95) }; });
        let better = null;
        if (arm.id !== 'control' && control.length && armRuns.length) {
            const controlByReplicate = new Map(control.map(run => [run.replicate, run]));
            const pairs = armRuns.map(run => [controlByReplicate.get(run.replicate), run]).filter(pair => Boolean(pair[0]));
            if (pairs.length)
                better = pairs.filter(([controlRun, run]) => run.endpointTumor < controlRun.endpointTumor).length / pairs.length;
        }
        const count = Math.max(1, armRuns.length), response = armRuns.filter(run => run.response === 'responding').length / count, stable = armRuns.filter(run => run.response === 'stable').length / count, progress = armRuns.filter(run => run.response === 'progressing').length / count, median = quantile(endpoints, .5);
        return { armId: arm.id, armName: arm.name, color: arm.color, n: armRuns.length, median, q05: quantile(endpoints, .05), q95: quantile(endpoints, .95), q25: quantile(endpoints, .25), q75: quantile(endpoints, .75), responseRate: response, stableRate: stable, progressionRate: progress, effectVsControl: controlMedian !== null && arm.id !== 'control' ? (median / controlMedian - 1) : null, betterThanControl: better, series };
    });
}
self.onmessage = (event) => {
    const msg = event.data || {};
    if (msg.type !== 'RUN_STUDY')
        return;
    const started = performance.now(), config = msg.config, arms = config.arms.filter(arm => arm.enabled), scanValues = config.scan.enabled ? Array.from({ length: config.scan.steps }, (_, index) => config.scan.min + (config.scan.max - config.scan.min) * (config.scan.steps === 1 ? 0 : index / (config.scan.steps - 1))) : [null];
    const total = arms.length * config.replicates * scanValues.length;
    try {
        if (!arms.length)
            throw new Error('没有启用的治疗臂');
        if (!Number.isFinite(total) || total < 1 || total > MAX_RUNS)
            throw new Error(`运行规模无效或超过 ${MAX_RUNS} 次上限`);
        let completed = 0;
        const runs = [];
        for (const scanValue of scanValues) {
            for (const arm of arms) {
                for (let replicateIndex = 0; replicateIndex < config.replicates; replicateIndex++) {
                    const seed = (config.baseSeed + replicateIndex * 104729) >>> 0;
                    runs.push(runOne(config, arm, replicateIndex + 1, seed, scanValue));
                    completed++;
                    if (completed % 3 === 0 || completed === total)
                        self.postMessage({ type: 'PROGRESS', completed, total, armName: arm.name, replicate: replicateIndex + 1, elapsedMs: performance.now() - started });
                }
            }
        }
        const referenceScanValue = config.scan.enabled ? scanValues[Math.floor(scanValues.length / 2)] : null;
        const baseRuns = config.scan.enabled ? runs.filter(run => run.scanValue === referenceScanValue).map(run => ({ ...run, scanValue: null })) : runs;
        const result = {
            id: msg.studyId, name: config.name, createdAt: msg.createdAt, completedAt: new Date().toISOString(), modelVersion: MODEL_VERSION, config, runs,
            aggregates: aggregate(baseRuns, arms), durationMs: performance.now() - started,
            diagnostics: ['治疗臂与扫描点按 replicate index 使用共同随机种子', '时间序列从未处理的第 0 天基线开始', '第 0 天给药与后续计划均按半开时间区间处理', '所有概率与状态变量保持在定义范围内', '批量结果使用 5%–95% 分位区间', config.scan.enabled ? `参数扫描基准统计取中间扫描值 ${referenceScanValue}` : '未启用参数扫描']
        };
        self.postMessage({ type: 'COMPLETE', result });
    }
    catch (error) {
        self.postMessage({ type: 'ERROR', message: error?.message || String(error) });
    }
};
