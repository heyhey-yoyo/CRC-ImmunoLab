import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
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
