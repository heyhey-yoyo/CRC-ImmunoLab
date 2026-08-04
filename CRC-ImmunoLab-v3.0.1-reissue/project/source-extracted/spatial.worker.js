/* CRC ImmunoLab 3.0.1 spatial simulation worker
 * Educational, dimensionless, browser-only agent-based model.
 * It is not a clinical prediction model.
 */

const WORLD = { width: 1200, height: 720 };
const GRID = { cols: 72, rows: 44 };
const DT_DAYS = 0.075;
const MAX_CELLS = 3600;
const FIELD_SIZE = GRID.cols * GRID.rows;

const TYPE = Object.freeze({ TUMOR: 0, CD8: 1, NK: 2, TREG: 3, MACRO: 4, CAF: 5, DEAD: 6 });

let config = null;
let rng = Math.random;
let cells = [];
let day = 0;
let step = 0;
let baselineTumor = 1;
let cumulativeKills = 0;
let immuneKills = 0;
let chemoKills = 0;
let dailyKills = 0;
let lastKillResetDay = 0;
let levels = { chemo: 0, pd1: 0, tgfb: 0 };
let doseEvents = [];
let eventCursor = 0;
let history = [];
let messages = [];
let fields = {
  oxygen: new Float32Array(FIELD_SIZE),
  drug: new Float32Array(FIELD_SIZE),
  suppression: new Float32Array(FIELD_SIZE),
  chemokine: new Float32Array(FIELD_SIZE),
  stroma: new Float32Array(FIELD_SIZE),
  vessels: new Float32Array(FIELD_SIZE),
};
let previousTumorRatio = 1;
let lastResponseBand = 'pending';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function randn() {
  const u = Math.max(1e-9, rng());
  const v = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function sqr(v) { return v * v; }
function distanceSq(a, b) { return sqr(a.x - b.x) + sqr(a.y - b.y); }
function emit(message, kind = 'info') { messages.push({ day, message, kind }); }
function makeId() { return Math.floor(rng() * 0x7fffffff); }

function gridXY(x, y) {
  return {
    gx: clamp(Math.floor(x / WORLD.width * GRID.cols), 0, GRID.cols - 1),
    gy: clamp(Math.floor(y / WORLD.height * GRID.rows), 0, GRID.rows - 1),
  };
}
function fieldIndex(x, y) {
  const { gx, gy } = gridXY(x, y);
  return gy * GRID.cols + gx;
}
function sample(field, x, y) { return field[fieldIndex(x, y)] || 0; }
function sampleGradient(field, x, y) {
  const { gx, gy } = gridXY(x, y);
  const xl = Math.max(0, gx - 1), xr = Math.min(GRID.cols - 1, gx + 1);
  const yt = Math.max(0, gy - 1), yb = Math.min(GRID.rows - 1, gy + 1);
  const dx = field[gy * GRID.cols + xr] - field[gy * GRID.cols + xl];
  const dy = field[yb * GRID.cols + gx] - field[yt * GRID.cols + gx];
  return { dx, dy };
}

function makeCell(type, x, y, extra = {}) {
  const radii = [7.4, 5.1, 5.5, 5.0, 6.1, 6.4, 5.4];
  return {
    id: makeId(), type,
    x: clamp(x, 8, WORLD.width - 8), y: clamp(y, 8, WORLD.height - 8),
    px: x, py: y,
    radius: radii[type] + rng() * (type === TYPE.TUMOR ? 2.6 : 1.5),
    age: rng() * 8, hp: 1,
    activation: type === TYPE.CD8 ? .24 + rng() * .2 : type === TYPE.NK ? .35 + rng() * .2 : 0,
    exhaustion: (type === TYPE.CD8 || type === TYPE.NK) ? rng() * .12 : 0,
    polarization: type === TYPE.MACRO ? .22 + rng() * .35 : 0,
    damaged: 0, hypoxia: 0, resistant: type === TYPE.TUMOR && rng() < .11 ? .42 + rng() * .25 : 0,
    clearance: 0, ageSinceKill: 0, clone: type === TYPE.TUMOR ? (rng() < .16 ? 1 : 0) : 0,
    ...extra,
  };
}

function initializeVessels() {
  fields.vessels.fill(0);
  const paths = [
    { base: .07, amp: .018, phase: rng() * 6 },
    { base: .25, amp: .025, phase: rng() * 6 },
    { base: .75, amp: .022, phase: rng() * 6 },
    { base: .93, amp: .016, phase: rng() * 6 },
  ];
  for (let gy = 0; gy < GRID.rows; gy++) {
    const yn = gy / (GRID.rows - 1);
    for (let gx = 0; gx < GRID.cols; gx++) {
      const xn = gx / (GRID.cols - 1);
      let v = 0;
      for (const p of paths) {
        const vx = p.base + Math.sin(yn * 8 + p.phase) * p.amp;
        const d = Math.abs(xn - vx) * GRID.cols;
        v = Math.max(v, Math.exp(-d * d / 7));
      }
      const edge = Math.max(
        Math.exp(-sqr(gx) / 62), Math.exp(-sqr(GRID.cols - 1 - gx) / 62),
        Math.exp(-sqr(gy) / 94), Math.exp(-sqr(GRID.rows - 1 - gy) / 94),
      );
      fields.vessels[gy * GRID.cols + gx] = clamp(v * .90 + edge * .16);
    }
  }
}

function buildDoseEvents() {
  doseEvents = [];
  const add = (name, enabled, start, dose, interval, cycles) => {
    if (!enabled || dose <= 0 || cycles <= 0) return;
    for (let i = 0; i < cycles; i++) doseEvents.push({ type: name, day: start + i * interval, dose: dose / 100, cycle: i + 1 });
  };
  add('chemo', config.chemoEnabled, config.chemoStart, config.chemoDose, config.chemoInterval, config.chemoCycles);
  add('pd1', config.pd1Enabled, config.pd1Start, config.pd1Dose, config.pd1Interval, config.pd1Cycles);
  add('tgfb', config.tgfbEnabled, config.tgfbStart, config.tgfbDose, config.tgfbInterval, config.tgfbCycles);
  doseEvents.sort((a, b) => a.day - b.day || a.type.localeCompare(b.type));
  eventCursor = 0;
}

function seedCells() {
  cells = [];
  const cx = WORLD.width * .50;
  const cy = WORLD.height * .50;
  const tumorR = 112 + Math.sqrt(config.tumorCount) * 3.0;
  const shapeX = config.preset === 'suppressive' ? 1.15 : 1.06;
  const shapeY = config.preset === 'mss_cold' ? .72 : .82;

  for (let i = 0; i < config.tumorCount; i++) {
    const theta = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * tumorR * (.78 + rng() * .30);
    cells.push(makeCell(TYPE.TUMOR,
      cx + Math.cos(theta) * r * shapeX + randn() * 3.2,
      cy + Math.sin(theta) * r * shapeY + randn() * 3.2));
  }

  const seedImmune = (type, count, innerBias, spread = 1.5) => {
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2;
      const inside = rng() < innerBias;
      const r = inside ? tumorR * Math.sqrt(rng()) : tumorR * (1.08 + rng() * spread);
      cells.push(makeCell(type,
        cx + Math.cos(theta) * r * 1.15 + randn() * 11,
        cy + Math.sin(theta) * r * .91 + randn() * 11));
    }
  };

  seedImmune(TYPE.CD8, config.cd8Count, config.preset === 'msi_hot' ? .53 : .16);
  seedImmune(TYPE.NK, config.nkCount, config.preset === 'msi_hot' ? .34 : .15);
  seedImmune(TYPE.TREG, config.tregCount, config.preset === 'suppressive' ? .72 : .38);
  seedImmune(TYPE.MACRO, config.macroCount, .52);

  for (let i = 0; i < config.cafCount; i++) {
    const theta = rng() * Math.PI * 2;
    const ring = tumorR * (.80 + rng() * .55);
    cells.push(makeCell(TYPE.CAF,
      cx + Math.cos(theta) * ring * 1.18 + randn() * 8,
      cy + Math.sin(theta) * ring * .88 + randn() * 8,
      { activation: .45 + rng() * .35 }));
  }
}

function initialize(nextConfig) {
  config = { ...nextConfig };
  rng = mulberry32(Number(config.seed) || 1);
  day = 0; step = 0; cumulativeKills = 0; immuneKills = 0; chemoKills = 0; dailyKills = 0; lastKillResetDay = 0;
  levels = { chemo: 0, pd1: 0, tgfb: 0 };
  history = []; messages = []; lastResponseBand = 'pending'; previousTumorRatio = 1;
  initializeVessels(); buildDoseEvents(); seedCells();
  baselineTumor = Math.max(1, config.tumorCount);
  recomputeFields(); recordHistory(true);
  emit(`模型已初始化：${config.presetLabel}`, 'system');
  emit(`终点设为第 ${config.horizonDays} 天；随机种子 ${config.seed}`, 'info');
  postSnapshot();
}

function buildBuckets(size = 25) {
  const cols = Math.ceil(WORLD.width / size);
  const map = new Map();
  for (const c of cells) {
    const bx = Math.floor(c.x / size), by = Math.floor(c.y / size), key = by * cols + bx;
    let list = map.get(key); if (!list) { list = []; map.set(key, list); }
    list.push(c);
  }
  return { map, size, cols };
}

function nearby(bucket, cell, radius, type = null, limit = Infinity) {
  const bx = Math.floor(cell.x / bucket.size), by = Math.floor(cell.y / bucket.size);
  const reach = Math.ceil(radius / bucket.size), r2 = radius * radius, out = [];
  for (let yy = by - reach; yy <= by + reach; yy++) {
    for (let xx = bx - reach; xx <= bx + reach; xx++) {
      const list = bucket.map.get(yy * bucket.cols + xx); if (!list) continue;
      for (const other of list) {
        if (other === cell || (type !== null && other.type !== type)) continue;
        const d2 = distanceSq(cell, other);
        if (d2 <= r2) { out.push({ cell: other, d2 }); if (out.length >= limit) return out; }
      }
    }
  }
  return out;
}

function addToField(field, x, y, amount, radiusCells = 1) {
  const { gx, gy } = gridXY(x, y);
  for (let oy = -radiusCells; oy <= radiusCells; oy++) {
    for (let ox = -radiusCells; ox <= radiusCells; ox++) {
      const nx = gx + ox, ny = gy + oy;
      if (nx < 0 || nx >= GRID.cols || ny < 0 || ny >= GRID.rows) continue;
      const falloff = 1 / (1 + ox * ox + oy * oy);
      field[ny * GRID.cols + nx] += amount * falloff;
    }
  }
}

function diffuse(field, rounds, blend, decay, max = 1.5) {
  let current = field;
  let next = new Float32Array(field.length);
  for (let round = 0; round < rounds; round++) {
    for (let y = 0; y < GRID.rows; y++) {
      for (let x = 0; x < GRID.cols; x++) {
        const i = y * GRID.cols + x;
        let sum = current[i] * 4, w = 4;
        if (x > 0) { sum += current[i - 1]; w++; }
        if (x + 1 < GRID.cols) { sum += current[i + 1]; w++; }
        if (y > 0) { sum += current[i - GRID.cols]; w++; }
        if (y + 1 < GRID.rows) { sum += current[i + GRID.cols]; w++; }
        next[i] = clamp((current[i] * (1 - blend) + sum / w * blend) * decay, 0, max);
      }
    }
    [current, next] = [next, current];
  }
  if (current !== field) field.set(current);
}

function recomputeFields() {
  const oxygen = new Float32Array(FIELD_SIZE);
  const drug = new Float32Array(FIELD_SIZE);
  const suppression = new Float32Array(FIELD_SIZE);
  const chemokine = new Float32Array(FIELD_SIZE);
  const stroma = new Float32Array(FIELD_SIZE);
  const supply = config.oxygenSupply / 100;
  const baseSuppress = config.suppression / 100;
  const baseStroma = config.stromaDensity / 100;
  const tgfbBlock = clamp(levels.tgfb * .52, 0, .68);

  for (let i = 0; i < FIELD_SIZE; i++) {
    oxygen[i] = clamp((.22 + fields.vessels[i] * .90) * supply, .02, 1);
    drug[i] = clamp(levels.chemo * (.24 + fields.vessels[i] * .95), 0, 1.35);
    suppression[i] = baseSuppress * .18 * (1 - tgfbBlock);
    stroma[i] = baseStroma * (.28 + (1 - fields.vessels[i]) * .18) * (1 - tgfbBlock * .45);
  }

  for (const c of cells) {
    if (c.type === TYPE.TUMOR) {
      addToField(oxygen, c.x, c.y, -.0042 - c.radius * .00008, 1);
      addToField(chemokine, c.x, c.y, .042 + c.hypoxia * .07 + c.damaged * .06, 1);
    } else if (c.type === TYPE.TREG) {
      addToField(suppression, c.x, c.y, .18 * (1 - tgfbBlock), 2);
    } else if (c.type === TYPE.MACRO) {
      addToField(suppression, c.x, c.y, .10 * c.polarization * (1 - tgfbBlock), 2);
    } else if (c.type === TYPE.CAF) {
      addToField(stroma, c.x, c.y, .19 * c.activation * (1 - tgfbBlock * .58), 2);
      addToField(suppression, c.x, c.y, .12 * c.activation * (1 - tgfbBlock), 2);
    } else if (c.type === TYPE.DEAD) {
      addToField(chemokine, c.x, c.y, .025 * (1 - c.clearance), 1);
    }
  }

  diffuse(oxygen, 5, .72, 1, 1);
  diffuse(drug, 5, .70, .996, 1.4);
  diffuse(suppression, 6, .74, .987, 1.35);
  diffuse(chemokine, 6, .76, .983, 1.25);
  diffuse(stroma, 4, .64, .995, 1.25);
  for (let i = 0; i < FIELD_SIZE; i++) oxygen[i] = clamp(oxygen[i], .01, 1);
  fields = { oxygen, drug, suppression, chemokine, stroma, vessels: fields.vessels };
}

function processDoses(previousDay) {
  while (eventCursor < doseEvents.length && doseEvents[eventCursor].day <= day + 1e-7) {
    const e = doseEvents[eventCursor];
    if (e.day >= previousDay - 1e-7) {
      levels[e.type] = clamp(levels[e.type] + e.dose, 0, 1.8);
      const labels = { chemo: '细胞毒治疗', pd1: '抗 PD-1', tgfb: '基质/抑制调节' };
      emit(`第 ${e.day.toFixed(0)} 天：${labels[e.type]}第 ${e.cycle} 周期，剂量 ${(e.dose * 100).toFixed(0)}`, e.type);
    }
    eventCursor++;
  }
  levels.chemo *= Math.exp(-Math.log(2) * DT_DAYS / 2.2);
  levels.pd1 *= Math.exp(-Math.log(2) * DT_DAYS / 8.8);
  levels.tgfb *= Math.exp(-Math.log(2) * DT_DAYS / 5.2);
}

function move(cell, dx, dy, speed = 1) {
  cell.px = cell.x; cell.py = cell.y;
  const mag = Math.hypot(dx, dy) || 1;
  cell.x = clamp(cell.x + dx / mag * speed, 7, WORLD.width - 7);
  cell.y = clamp(cell.y + dy / mag * speed, 7, WORLD.height - 7);
}

function wander(cell, speed) { move(cell, randn(), randn(), speed); }

function steerByField(cell, field, speed, randomWeight = .42) {
  const g = sampleGradient(field, cell.x, cell.y);
  move(cell, g.dx * 12 + randn() * randomWeight, g.dy * 12 + randn() * randomWeight, speed);
}

function separate(cell, bucket, strength = .26) {
  const neighbors = nearby(bucket, cell, cell.radius * 2.0 + 4, null, 8);
  let dx = 0, dy = 0, n = 0;
  for (const item of neighbors) {
    const other = item.cell;
    if (other.type === TYPE.DEAD) continue;
    const dist = Math.sqrt(item.d2) || .01;
    const desired = cell.radius + other.radius;
    if (dist < desired) {
      const overlap = (desired - dist) / desired;
      dx += (cell.x - other.x) / dist * overlap;
      dy += (cell.y - other.y) / dist * overlap;
      n++;
    }
  }
  if (n) move(cell, dx, dy, strength);
}

function killTumor(tumor, cause) {
  if (tumor.type !== TYPE.TUMOR || tumor.hp <= 0) return false;
  tumor.hp = 0;
  tumor.type = TYPE.DEAD;
  tumor.radius *= .82;
  tumor.clearance = 0;
  tumor.cause = cause;
  tumor.activation = 0;
  cumulativeKills++; dailyKills++;
  if (cause === 'immune') immuneKills++; else if (cause === 'chemo') chemoKills++;
  return true;
}

function updateTumor(c, bucket, newborns) {
  const o2 = sample(fields.oxygen, c.x, c.y);
  const drug = sample(fields.drug, c.x, c.y);
  const suppress = sample(fields.suppression, c.x, c.y);
  const localTumors = nearby(bucket, c, 22, TYPE.TUMOR, 18).length;
  c.age += DT_DAYS;
  c.hypoxia = clamp(c.hypoxia + (o2 < .11 ? .014 : -.025), 0, 1);

  const resistance = clamp(c.resistant + (c.clone ? .08 : 0), 0, .85);
  const cycling = clamp((o2 - .07) / .46, 0, 1) * clamp(1 - localTumors / 17, 0, 1);
  const drugDamage = drug * (.026 + config.growthRate / 100 * .018) * (1 - resistance);
  c.damaged = clamp(c.damaged + drugDamage - .0012 * (drug < .08 ? 1 : 0), 0, 1.3);

  const hypoxicDeath = c.hypoxia > .95 ? .0004 + (c.hypoxia - .95) * .006 : 0;
  const chemoDeath = c.damaged > .34 ? .006 + (c.damaged - .34) * .035 : 0;
  if (rng() < hypoxicDeath + chemoDeath) { killTumor(c, chemoDeath > hypoxicDeath ? 'chemo' : 'hypoxia'); return; }

  const growth = config.growthRate / 100;
  const divisionP = .0084 * growth * cycling * (1 - c.damaged * .72) * (1 - suppress * .05);
  if (cells.length + newborns.length < MAX_CELLS && c.age > 1.4 && rng() < divisionP) {
    const angle = rng() * Math.PI * 2;
    const d = c.radius * 1.55;
    newborns.push(makeCell(TYPE.TUMOR, c.x + Math.cos(angle) * d, c.y + Math.sin(angle) * d, {
      resistant: clamp(c.resistant + randn() * .025, 0, .9), clone: c.clone,
    }));
    c.age = 0; c.damaged *= .65;
  }

  const centerDx = WORLD.width * .5 - c.x, centerDy = WORLD.height * .5 - c.y;
  move(c, centerDx + randn() * 100, centerDy + randn() * 100, .045 + cycling * .035);
}

function updateCD8(c, bucket) {
  const sup = sample(fields.suppression, c.x, c.y);
  const stroma = sample(fields.stroma, c.x, c.y);
  const chem = sample(fields.chemokine, c.x, c.y);
  const pd1Effect = clamp(levels.pd1 * .58, 0, .72);
  const effectiveExhaustion = clamp(c.exhaustion * (1 - pd1Effect), 0, 1);
  const speed = (1.55 + config.immuneRecruitment / 100 * .40) * (1 - clamp(stroma * .52, 0, .58));
  steerByField(c, fields.chemokine, speed, .36);

  const targets = nearby(bucket, c, 15, TYPE.TUMOR, 4).sort((a,b) => a.d2 - b.d2);
  if (targets.length) {
    c.activation = clamp(c.activation + .026 * (1 - sup), 0, 1);
    const target = targets[0].cell;
    const antigen = config.antigenicity / 100;
    const potency = config.cd8Potency / 100;
    const killP = .0011 * potency * antigen * (.35 + c.activation * .75) * (1 - effectiveExhaustion * .86) * (1 - clamp(sup * .72, 0, .82)) * (1 + levels.pd1 * 1.6);
    if (rng() < killP) {
      if (killTumor(target, 'immune')) { c.activation = clamp(c.activation + .12, 0, 1); c.ageSinceKill = 0; }
    }
    c.exhaustion = clamp(c.exhaustion + .006 + sup * .004 - levels.pd1 * .0045, 0, 1);
  } else {
    c.activation = clamp(c.activation - .0025, .12, 1);
    c.exhaustion = clamp(c.exhaustion - .0022 - levels.pd1 * .0025, 0, 1);
  }
  c.ageSinceKill += DT_DAYS;
  if (chem < .02 && rng() < .06) wander(c, speed * .65);
}

function updateNK(c, bucket) {
  const sup = sample(fields.suppression, c.x, c.y);
  const stroma = sample(fields.stroma, c.x, c.y);
  const speed = 1.75 * (1 - clamp(stroma * .46, 0, .52));
  steerByField(c, fields.chemokine, speed, .48);
  const targets = nearby(bucket, c, 14, TYPE.TUMOR, 3).sort((a,b) => a.d2 - b.d2);
  if (targets.length) {
    c.activation = clamp(c.activation + .018, 0, 1);
    const antigenFactor = .70 + (1 - config.antigenicity / 100) * .22;
    const killP = .00050 * antigenFactor * (.42 + c.activation * .65) * (1 - c.exhaustion * .72) * (1 - clamp(sup * .64, 0, .76));
    if (rng() < killP) killTumor(targets[0].cell, 'immune');
    c.exhaustion = clamp(c.exhaustion + .0035 + sup * .003, 0, 1);
  } else {
    c.activation = clamp(c.activation - .0018, .18, 1);
    c.exhaustion = clamp(c.exhaustion - .0016, 0, 1);
  }
}

function updateTreg(c, bucket) {
  const nearbyCd8 = nearby(bucket, c, 90, TYPE.CD8, 4);
  const targets = nearbyCd8.length ? nearbyCd8 : nearby(bucket, c, 130, TYPE.TUMOR, 4);
  if (targets.length) {
    const t = targets.sort((a,b) => a.d2 - b.d2)[0].cell;
    move(c, t.x - c.x + randn() * 12, t.y - c.y + randn() * 12, .72 * (1 - levels.tgfb * .20));
  } else wander(c, .45);
}

function updateMacro(c, bucket) {
  const dead = nearby(bucket, c, 100, TYPE.DEAD, 4);
  const tumors = nearby(bucket, c, 80, TYPE.TUMOR, 5);
  if (dead.length) {
    const t = dead.sort((a,b) => a.d2 - b.d2)[0].cell;
    move(c, t.x - c.x, t.y - c.y, .72);
    if (distanceSq(c, t) < 180 && rng() < .035) t.clearance = clamp(t.clearance + .25, 0, 1.2);
    c.polarization = clamp(c.polarization - .003, 0, 1);
  } else if (tumors.length) {
    const t = tumors[0].cell;
    move(c, t.x - c.x + randn() * 20, t.y - c.y + randn() * 20, .58);
    c.polarization = clamp(c.polarization + .0028 * (1 - levels.tgfb * .24), 0, 1);
  } else wander(c, .38);
}

function updateCAF(c) {
  c.activation = clamp(c.activation + sample(fields.suppression, c.x, c.y) * .0007 - levels.tgfb * .0018, .18, 1);
  const dx = WORLD.width * .5 - c.x, dy = WORLD.height * .5 - c.y;
  move(c, -dx + randn() * 180, -dy + randn() * 180, .025);
}

function updateDead(c) {
  c.clearance = clamp(c.clearance + .0024 + sample(fields.oxygen, c.x, c.y) * .0005, 0, 1.2);
  c.radius = Math.max(2.6, c.radius * .9993);
}

function recruitImmune(newborns) {
  const recruitment = config.immuneRecruitment / 100;
  const chemMean = fields.chemokine.reduce((a,b) => a + b, 0) / FIELD_SIZE;
  const coldPenalty = config.preset === 'mss_cold' ? .66 : 1;
  const stromaPenalty = 1 - config.stromaDensity / 100 * .42;
  const cd8P = .0062 * recruitment * coldPenalty * stromaPenalty * (0.5 + chemMean * 2.3);
  const nkP = .0032 * recruitment * stromaPenalty * (0.55 + chemMean * 1.6);
  if (cells.length + newborns.length < MAX_CELLS && rng() < cd8P) newborns.push(spawnFromVessel(TYPE.CD8));
  if (cells.length + newborns.length < MAX_CELLS && rng() < nkP) newborns.push(spawnFromVessel(TYPE.NK));
}

function spawnFromVessel(type) {
  const side = rng();
  let x, y;
  if (side < .45) { x = rng() < .5 ? 18 : WORLD.width - 18; y = 20 + rng() * (WORLD.height - 40); }
  else { x = 25 + rng() * (WORLD.width - 50); y = rng() < .5 ? 18 : WORLD.height - 18; }
  return makeCell(type, x, y, { activation: type === TYPE.CD8 ? .28 : .40 });
}

function updateCells() {
  const bucket = buildBuckets();
  const newborns = [];
  for (const c of cells) {
    if (c.type === TYPE.TUMOR) updateTumor(c, bucket, newborns);
    else if (c.type === TYPE.CD8) updateCD8(c, bucket);
    else if (c.type === TYPE.NK) updateNK(c, bucket);
    else if (c.type === TYPE.TREG) updateTreg(c, bucket);
    else if (c.type === TYPE.MACRO) updateMacro(c, bucket);
    else if (c.type === TYPE.CAF) updateCAF(c);
    else updateDead(c);
    if (c.type !== TYPE.DEAD && c.type !== TYPE.CAF) separate(c, bucket, c.type === TYPE.TUMOR ? .08 : .17);
  }
  recruitImmune(newborns);
  if (newborns.length) cells.push(...newborns.slice(0, MAX_CELLS - cells.length));
  cells = cells.filter(c => c.type !== TYPE.DEAD || c.clearance < 1);
}

function computeMetrics() {
  const counts = { tumor: 0, cd8: 0, nk: 0, treg: 0, macro: 0, caf: 0, dead: 0 };
  let cd8Activation = 0, nkActivation = 0, exhaustionSum = 0, exhaustionN = 0;
  let infiltrating = 0, effectorN = 0, hypoxicTumor = 0, tumorO2 = 0, tumorSuppress = 0;
  const cx = WORLD.width * .5, cy = WORLD.height * .5;
  const infiltrationR2 = sqr(235);
  for (const c of cells) {
    if (c.type === TYPE.TUMOR) {
      counts.tumor++; const o = sample(fields.oxygen, c.x, c.y); tumorO2 += o; tumorSuppress += sample(fields.suppression, c.x, c.y); if (o < .13 || c.hypoxia > .55) hypoxicTumor++;
    } else if (c.type === TYPE.CD8) {
      counts.cd8++; cd8Activation += c.activation; exhaustionSum += c.exhaustion; exhaustionN++; effectorN++; if (sqr(c.x-cx)+sqr(c.y-cy) < infiltrationR2) infiltrating++;
    } else if (c.type === TYPE.NK) {
      counts.nk++; nkActivation += c.activation; exhaustionSum += c.exhaustion * .65; exhaustionN++; effectorN++; if (sqr(c.x-cx)+sqr(c.y-cy) < infiltrationR2) infiltrating++;
    } else if (c.type === TYPE.TREG) counts.treg++;
    else if (c.type === TYPE.MACRO) counts.macro++;
    else if (c.type === TYPE.CAF) counts.caf++;
    else counts.dead++;
  }
  const tumorBurden = counts.tumor / baselineTumor;
  const cd8Mean = counts.cd8 ? cd8Activation / counts.cd8 : 0;
  const nkMean = counts.nk ? nkActivation / counts.nk : 0;
  const exhaustion = exhaustionN ? exhaustionSum / exhaustionN : 0;
  const suppressMean = counts.tumor ? tumorSuppress / counts.tumor : config.suppression / 100;
  const cytotoxic = clamp((cd8Mean * counts.cd8 + nkMean * counts.nk * .75) / Math.max(1, counts.cd8 + counts.nk) * (1 - exhaustion * .56) * (1 - suppressMean * .38), 0, 1);
  const infiltration = effectorN ? infiltrating / effectorN : 0;
  const hypoxia = counts.tumor ? hypoxicTumor / counts.tumor : 0;
  const meanOxygen = counts.tumor ? tumorO2 / counts.tumor : 0;
  const combinedDrug = clamp(levels.chemo * .70 + levels.pd1 * .18 + levels.tgfb * .12, 0, 1.5);
  return {
    ...counts, total: cells.length, tumorBurden,
    cytotoxicActivity: cytotoxic, infiltration, exhaustion, hypoxia,
    suppressionIndex: clamp(suppressMean, 0, 1), meanTumorOxygen: meanOxygen,
    cumulativeKills, dailyKills, immuneKills, chemoKills,
    chemoLevel: levels.chemo, pd1Level: levels.pd1, tgfbLevel: levels.tgfb, drugLevel: combinedDrug,
  };
}

function responseBand(metrics) {
  if (day < 5) return 'pending';
  if (metrics.tumorBurden < .72 || (metrics.tumorBurden < .92 && metrics.cytotoxicActivity > .52)) return 'responding';
  if (metrics.tumorBurden > 1.18 && previousTumorRatio > 1.02) return 'progressing';
  return 'stable';
}

function recordHistory(force = false) {
  if (!force && history.length && day - history[history.length - 1].day < .36) return;
  const m = computeMetrics();
  history.push({
    day: Number(day.toFixed(3)), tumor: m.tumorBurden, cytotoxic: m.cytotoxicActivity,
    infiltration: m.infiltration, exhaustion: m.exhaustion, hypoxia: m.hypoxia,
    suppression: m.suppressionIndex, drug: m.drugLevel,
    chemo: m.chemoLevel, pd1: m.pd1Level, tgfb: m.tgfbLevel,
    kills: m.cumulativeKills, total: m.total,
  });
  if (history.length > 360) history.shift();
  previousTumorRatio = m.tumorBurden;
  const band = responseBand(m);
  if (band !== lastResponseBand && band !== 'pending') {
    const label = band === 'responding' ? '响应趋势' : band === 'progressing' ? '进展趋势' : '稳定趋势';
    emit(`模型轨迹进入“${label}”区间`, band === 'progressing' ? 'warning' : 'info');
    lastResponseBand = band;
  }
}

function packCells() {
  const packed = new Float32Array(cells.length * 11);
  let i = 0;
  for (const c of cells) {
    packed[i++] = c.x; packed[i++] = c.y; packed[i++] = c.type; packed[i++] = c.radius;
    packed[i++] = c.type === TYPE.TUMOR ? c.damaged : c.type === TYPE.CD8 || c.type === TYPE.NK ? c.exhaustion : c.type === TYPE.MACRO ? c.polarization : c.type === TYPE.CAF ? c.activation : c.clearance;
    packed[i++] = c.activation || 0; packed[i++] = c.hp; packed[i++] = c.hypoxia || 0;
    packed[i++] = c.type === TYPE.TUMOR ? c.resistant : 0; packed[i++] = c.px; packed[i++] = c.py;
  }
  return packed;
}

function postSnapshot() {
  const metrics = computeMetrics();
  const cellData = packCells();
  const fieldPayload = {
    cols: GRID.cols, rows: GRID.rows,
    oxygen: fields.oxygen, drug: fields.drug, suppression: fields.suppression,
    chemokine: fields.chemokine, stroma: fields.stroma, vessels: fields.vessels,
  };
  const payload = {
    type: 'SNAPSHOT', day, step, metrics, cells: cellData, fields: fieldPayload,
    history: history.slice(), events: messages.splice(0), doseEvents,
    complete: day >= config.horizonDays,
  };
  postMessage(payload, [cellData.buffer]);
}

function advance(count = 1) {
  for (let n = 0; n < count; n++) {
    if (day >= config.horizonDays) break;
    const previousDay = day;
    day = Math.min(config.horizonDays, day + DT_DAYS);
    step++;
    processDoses(previousDay);
    if (step % 2 === 0) recomputeFields();
    updateCells();
    if (day - lastKillResetDay >= 1) { dailyKills = 0; lastKillResetDay = day; }
    recordHistory();
  }
  postSnapshot();
}

onmessage = event => {
  const msg = event.data || {};
  if (msg.type === 'INIT') initialize(msg.config);
  else if (msg.type === 'STEP') advance(Math.max(1, Math.min(32, Number(msg.count) || 1)));
  else if (msg.type === 'GET_SNAPSHOT') postSnapshot();
};
