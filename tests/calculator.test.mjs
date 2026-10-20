import assert from "node:assert/strict";
import test from "node:test";

import { calculatePosition } from "../src/assets/calculator.js";

const base = {
  balance: 50_000,
  riskPct: 2,
  entry: 3_250,
  stop: 3_230,
  multiplier: 10,
  marginRate: 0.1,
  direction: "long",
};

test("复现参考图：豆粕 50,000 元、2% 风险、3250 入场、3230 止损，得到 5 手", () => {
  const result = calculatePosition(base);

  assert.equal(result.isValid, true);
  assert.equal(result.riskBudget, 1_000);
  assert.equal(result.riskPerLot, 200);
  assert.equal(result.marginPerLot, 3_250);
  assert.equal(result.riskLots, 5);
  assert.equal(result.marginLots, 15);
  assert.equal(result.lots, 5);
  assert.equal(result.usedMargin, 16_250);
  assert.equal(result.remaining, 33_750);
  assert.equal(result.limitingFactor, "risk");
});

test("手数向下取整，不四舍五入", () => {
  const result = calculatePosition({
    ...base,
    balance: 50_999,
    entry: 3_250,
    stop: 3_230,
  });

  assert.equal(result.riskBudget, 1_019.98);
  assert.equal(result.riskLots, 5);
  assert.equal(result.lots, 5);
});

test("保证金不足时，由保证金上限限制手数", () => {
  const result = calculatePosition({
    ...base,
    balance: 10_000,
    riskPct: 10,
    entry: 600,
    stop: 580,
    marginRate: 0.5,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.riskLots, 5);
  assert.equal(result.marginLots, 3);
  assert.equal(result.lots, 3);
  assert.equal(result.limitingFactor, "margin");
  assert.equal(result.warnings.length, 1);
});

test("账户余额不足一手保证金时，建议 0 手并给出提示", () => {
  const result = calculatePosition({
    ...base,
    balance: 1_000,
    riskPct: 10,
    entry: 3_000,
    stop: 2_990,
    marginRate: 0.5,
  });

  assert.equal(result.isValid, true);
  assert.equal(result.marginLots, 0);
  assert.equal(result.lots, 0);
  assert.match(result.warnings[0], /保证金/);
});

test("风险预算不足一手时，建议 0 手并计算所需风险比例", () => {
  const result = calculatePosition({
    ...base,
    balance: 10_000,
    riskPct: 1,
    entry: 3_250,
    stop: 3_230,
    marginRate: 0.1,
  });

  assert.equal(result.riskBudget, 100);
  assert.equal(result.riskPerLot, 200);
  assert.equal(result.riskLots, 0);
  assert.equal(result.lots, 0);
  assert.equal(result.requiredRiskPctForOneLot, 2);
  assert.match(result.warnings[0], /2\.00%/);
});

test("做多时止损高于入场价会报错", () => {
  const result = calculatePosition({ ...base, stop: 3_260 });

  assert.equal(result.isValid, false);
  assert.equal(result.directionOk, false);
  assert.equal(result.lots, 0);
  assert.match(result.errors.join(""), /做多/);
});

test("做空方向使用相同的绝对价格距离", () => {
  const result = calculatePosition({
    ...base,
    entry: 3_230,
    stop: 3_250,
    direction: "short",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.riskPerLot, 200);
  assert.equal(result.lots, 5);
});

test("做空时止损低于入场价会报错", () => {
  const result = calculatePosition({ ...base, entry: 3_250, stop: 3_230, direction: "short" });

  assert.equal(result.isValid, false);
  assert.match(result.errors.join(""), /做空/);
});

test("零价格、零余额与非法保证金率会被拦截", () => {
  const result = calculatePosition({
    ...base,
    balance: 0,
    entry: 0,
    marginRate: 0,
  });

  assert.equal(result.isValid, false);
  assert.equal(result.lots, 0);
  assert.ok(result.errors.length >= 3);
});

test("国债按每百元面值报价，乘数 10000 的计算正确", () => {
  const result = calculatePosition({
    balance: 200_000,
    riskPct: 1,
    entry: 118.1,
    stop: 117.9,
    multiplier: 10_000,
    marginRate: 0.15,
  });

  assert.ok(Math.abs(result.contractValue - 1_181_000) < 1e-6);
  assert.ok(Math.abs(result.riskPerLot - 2_000) < 1e-6);
  assert.equal(result.riskBudget, 2_000);
  assert.equal(result.riskLots, 1);
  assert.equal(result.lots, 1);
});

test("止损等于入场价时不会产生无限手数", () => {
  const result = calculatePosition({ ...base, stop: 3_250 });

  assert.equal(result.isValid, false);
  assert.equal(result.riskPerLot, 0);
  assert.equal(result.riskLots, 0);
  assert.equal(result.lots, 0);
});

test("空字符串参数被当作无效值", () => {
  const result = calculatePosition({
    ...base,
    entry: "",
    stop: "",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.lots, 0);
  assert.equal(result.errors.length, 2);
});
