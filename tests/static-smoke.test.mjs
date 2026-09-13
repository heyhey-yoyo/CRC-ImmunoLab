import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const expectedIds = ["app", "newStudyBtn", "startStudyBtn", "spatialCanvas", "exportAnalysisBtn"];

test("研究工作台入口、响应式样式与安全头保持完整", () => {
  assert.match(html, /<meta[^>]+name=["']viewport["']/i);
  assert.ok(existsSync(resolve(root, "_headers")));
  for (const id of expectedIds) assert.match(html, new RegExp(`id=["']${id}["']`));
  assert.match(html, /@media/i);
  assert.match(html, /worker-src[^;]*blob:/i);
});

test("静态页面不声明重复的固定 ID", () => {
  const ids = [...html.matchAll(/\bid=["']([A-Za-z][\w:-]*)["']/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

const normalizeSource = (source) => source.replace(/\r\n/g, "\n").trim();
const extracted = (name) => normalizeSource(readFileSync(resolve(root, "source-extracted", name), "utf8"));
const scripts = [...html.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map((match) => match[1]);

test("提取的应用脚本与权威单文件一致", () => {
  const app = scripts.find((source) => source.startsWith("var CRC3;"));
  assert.ok(app, "缺少应用脚本");
  assert.equal(extracted("app.js"), normalizeSource(app));
});

for (const [key, file] of [["BATCH", "batch.worker.js"], ["SPATIAL", "spatial.worker.js"]]) {
  test(`提取的 ${file} 与内嵌 Worker 一致`, () => {
    const match = html.match(new RegExp(`window\\.__CRC3_${key}_WORKER_SOURCE__=(.+);`));
    assert.ok(match, `缺少 ${key} Worker`);
    assert.equal(extracted(file), normalizeSource(JSON.parse(match[1])));
  });
}

test("提取的 CSS 与权威单文件一致", () => {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(match, "缺少页面样式");
  assert.equal(extracted("styles.css"), normalizeSource(match[1]));
});

test("导出研究报告使用产品名，版本来自研究记录", () => {
  assert.match(extracted("app.js"), /<h1>CRC ImmunoLab 研究报告<\/h1>/);
  assert.doesNotMatch(extracted("app.js"), /<h1>CRC ImmunoLab \d+ 研究报告<\/h1>/);
  assert.match(extracted("app.js"), /CRC3\.escapeHtml\(study\.modelVersion\)/);
  assert.match(extracted("app.js"), /# CRC ImmunoLab 模型卡/);
  assert.doesNotMatch(extracted("app.js"), /# CRC ImmunoLab \d+ 模型卡/);
});

function application(source = scripts.find((script) => script.startsWith("var CRC3;"))) {
  const context = { document: { addEventListener() {} }, crypto: webcrypto, console };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.CRC3;
}

function study(config, app) {
  const messages = [];
  const context = { self: { postMessage: (message) => messages.push(message) }, performance: { now: () => 0 } };
  vm.createContext(context);
  vm.runInContext(JSON.parse(html.match(/window\.__CRC3_BATCH_WORKER_SOURCE__=(.+);/)[1]), context);
  context.self.onmessage({ data: { type: 'RUN_STUDY', config, studyId: 'regression', createdAt: '2026-09-13', applicationVersion: app.VERSION, configFingerprint: app.fingerprint(config) } });
  assert.equal(messages.some((message) => message.type === 'ERROR'), false);
  return messages.find((message) => message.type === 'COMPLETE').result;
}

for (const parameter of ['pd1Dose', 'chemoDose', 'tgfbDose']) {
  test(`${parameter} 扫描与直接修改给药日程等价，保持配对种子和第零天基线`, () => {
    const app = application(), config = app.createDefaultConfig();
    config.arms.forEach((arm) => { arm.enabled = arm.id === 'triple' || arm.id === 'control'; });
    config.replicates = 2;
    config.scan = { enabled: true, parameter, min: 0, max: 100, steps: 3 };
    const before = JSON.stringify(config), scanned = study(config, app);
    assert.equal(JSON.stringify(config), before);
    for (const value of [0, 50, 100]) {
      const direct = JSON.parse(before);
      direct.scan.enabled = false;
      direct.arms.find((arm) => arm.id === 'triple')[parameter.replace('Dose', '')].dose = value;
      const result = study(direct, app);
      for (const run of result.runs) {
        const actual = scanned.runs.find((r) => r.armId === run.armId && r.replicate === run.replicate && r.scanValue === value);
        assert.equal(JSON.stringify(actual.timeSeries), JSON.stringify(run.timeSeries));
        assert.equal(actual.seed, run.seed);
        assert.equal(actual.timeSeries[0].day, 0);
        assert.equal(actual.timeSeries[0].tumor, 1);
        assert.equal(actual.timeSeries[0].drug, 0);
      }
    }
    const endpoints = scanned.runs.filter((r) => r.armId === 'triple' && r.replicate === 1).map((r) => r.endpointTumor);
    assert.equal(new Set(endpoints).size, 3);
  });
}

test('应用补丁与模型版本独立，研究导入保留旧溯源且不伪造未知版本', () => {
  const app = application(extracted('app.js').replace(/CRC3\.VERSION = '[^']+'/, "CRC3.VERSION = '9.9.9'"));
  const config = app.createDefaultConfig();
  config.replicates = 8;
  const result = study(config, app);
  assert.equal(result.applicationVersion, '9.9.9');
  assert.equal(result.modelVersion, app.BATCH_MODEL_VERSION);
  assert.notEqual(result.modelVersion, app.VERSION);
  assert.equal(result.configFingerprint, app.fingerprint(config));
  const imported = app.normalizeStudyResult(JSON.parse(JSON.stringify(result)));
  assert.equal(imported.applicationVersion, '9.9.9');
  assert.equal(imported.modelVersion, result.modelVersion);
  assert.equal(imported.configFingerprint, app.fingerprint(imported.config));
  assert.equal(imported.recordedConfigFingerprint, result.configFingerprint);
  const legacy = JSON.parse(JSON.stringify(result));
  delete legacy.applicationVersion;
  delete legacy.modelVersion;
  delete legacy.configFingerprint;
  const old = app.normalizeStudyResult(legacy);
  assert.equal(old.applicationVersion, 'unknown');
  assert.equal(old.modelVersion, 'unknown');
  assert.equal(old.recordedConfigFingerprint, '');
  assert.equal(old.configFingerprint, app.fingerprint(old.config));
});
