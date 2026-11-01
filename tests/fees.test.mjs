import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENTS, getInstrument } from "../src/assets/instruments.js";
import { FEE_AS_OF, feeForLot, getFeeRule } from "../src/assets/fees.js";

test("每个品种都有可用的参考手续费规则", () => {
  assert.match(FEE_AS_OF, /^\d{4}-\d{2}-\d{2}$/);
  for (const instrument of INSTRUMENTS) {
    const rule = getFeeRule(instrument);
    assert.ok(rule.open > 0, `${instrument.code} 手续费无效`);
    assert.ok(rule.closeToday > 0, `${instrument.code} 平今手续费无效`);
  }
  assert.equal(INSTRUMENTS.length, 88);
});

test("固定手续费品种", () => {
  assert.equal(getFeeRule(getInstrument("m")).open, 9);
  assert.equal(getFeeRule(getInstrument("m")).close, 9);
  assert.equal(getFeeRule(getInstrument("m")).closeToday, 9);
  assert.equal(getFeeRule(getInstrument("p")).open, 15);
  assert.equal(getFeeRule(getInstrument("ap")).open, 30);
  assert.equal(getFeeRule(getInstrument("ap")).close, 30);
  assert.equal(getFeeRule(getInstrument("ap")).closeToday, 60);
  assert.equal(getFeeRule(getInstrument("t")).open, 18);
});

test("成交额比例手续费品种", () => {
  const copper = getFeeRule(getInstrument("cu"));
  assert.equal(copper.type, "rate");
  assert.equal(copper.open, 0.0003);
  assert.equal(copper.close, 0.0003);
  assert.equal(copper.closeToday, 0.0006);
  assert.ok(Math.abs(feeForLot(copper, 100_000) - 30) < 1e-9);
  assert.ok(Math.abs(feeForLot(copper, 100_000, "close") - 30) < 1e-9);
  assert.ok(Math.abs(feeForLot(copper, 100_000, "closeToday") - 60) < 1e-9);

  const index = getFeeRule(getInstrument("if"));
  assert.equal(index.open, 0.000138);
  assert.ok(Math.abs(feeForLot(index, 1_200_000) - 165.6) < 0.001);

  const ec = getFeeRule(getInstrument("ec"));
  assert.equal(ec.open, 0.0036);
  assert.equal(ec.closeToday, 0.0072);
});

test("零手续费返回 0，页面可显示为无", () => {
  const rule = { type: "fixed", open: 0, close: 0, closeToday: 0 };
  assert.equal(feeForLot(rule, 100_000, "open"), 0);
  assert.equal(feeForLot(rule, 100_000, "close"), 0);
  assert.equal(feeForLot(rule, 100_000, "closeToday"), 0);
});
