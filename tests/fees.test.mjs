import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENTS, getInstrument } from "../src/assets/instruments.js";
import {
  FEE_AS_OF,
  FEE_DISCOUNT,
  FEE_INCLUDES_EXCHANGE,
  FEE_MISSING,
  FEE_PROVIDER,
  commissionForLot,
  feeForLot,
  getFeeRule,
} from "../src/assets/fees.js";

test("海证期货佣金规则覆盖全部品种，未公布的单独标记", () => {
  assert.equal(FEE_AS_OF, "2024-04-22");
  assert.equal(FEE_PROVIDER, "海证期货");
  assert.equal(FEE_INCLUDES_EXCHANGE, true);
  assert.equal(INSTRUMENTS.length, 80);
  assert.equal(FEE_MISSING.size, 9);

  for (const instrument of INSTRUMENTS) {
    const rule = getFeeRule(instrument);
    if (rule.missing) {
      assert.ok(FEE_MISSING.has(instrument.id), `${instrument.code} 未公布标记异常`);
      continue;
    }
    assert.ok(rule.open > 0, `${instrument.code} 开仓佣金无效`);
    assert.ok(rule.close > 0, `${instrument.code} 平仓佣金无效`);
    assert.ok(rule.closeToday >= 0, `${instrument.code} 平今佣金无效`);
    assert.equal(rule.provider, "海证期货");
  }
});

test("固定佣金品种", () => {
  const m = getFeeRule(getInstrument("m"));
  assert.equal(m.open, 7.5);
  assert.equal(m.close, 7.5);
  assert.equal(m.closeToday, 7.5);

  const p = getFeeRule(getInstrument("p"));
  assert.equal(p.open, 10);

  const ap = getFeeRule(getInstrument("ap"));
  assert.equal(ap.open, 30);
  assert.equal(ap.close, 30);
  assert.equal(ap.closeToday, 120);

  const sf = getFeeRule(getInstrument("sf"));
  assert.equal(sf.open, 15);
  assert.equal(sf.closeToday, 7.5);
});

test("平今免收显示为零", () => {
  assert.equal(getFeeRule(getInstrument("t")).open, 15);
  assert.equal(getFeeRule(getInstrument("t")).closeToday, 0);
  assert.equal(getFeeRule(getInstrument("au")).open, 12);
  assert.equal(getFeeRule(getInstrument("au")).closeToday, 0);
  assert.equal(feeForLot(getFeeRule(getInstrument("t")), 1_000_000, "closeToday"), 0);
});

test("成交额比例佣金品种", () => {
  const copper = getFeeRule(getInstrument("cu"));
  assert.equal(copper.type, "rate");
  assert.equal(copper.open, 0.0002);
  assert.equal(copper.close, 0.0002);
  assert.equal(copper.closeToday, 0.0004);
  assert.ok(Math.abs(feeForLot(copper, 100_000) - 20) < 1e-9);
  assert.ok(Math.abs(feeForLot(copper, 100_000, "close") - 20) < 1e-9);
  assert.ok(Math.abs(feeForLot(copper, 100_000, "closeToday") - 40) < 1e-9);

  const index = getFeeRule(getInstrument("if"));
  assert.ok(Math.abs(index.open - 0.000115) < 1e-12);
  assert.ok(Math.abs(index.closeToday - 0.00115) < 1e-12);
  assert.ok(Math.abs(feeForLot(index, 1_200_000) - 138) < 1e-9);
  assert.ok(Math.abs(feeForLot(index, 1_200_000, "closeToday") - 1380) < 1e-9);

  const ec = getFeeRule(getInstrument("ec"));
  assert.equal(ec.open, 0.0003);
  assert.equal(ec.closeToday, 0.0003);
});

test("官网未公布的新品种显示未公布", () => {
  for (const code of ["ad", "op", "pr", "pl", "lg", "bz", "ps", "pd", "pt"]) {
    const rule = getFeeRule(getInstrument(code));
    assert.equal(rule.missing, true);
    assert.equal(feeForLot(rule, 100_000, "open"), 0);
    assert.equal(feeForLot(rule, 100_000, "close"), 0);
    assert.equal(feeForLot(rule, 100_000, "closeToday"), 0);
  }
});

test("海证佣金按 6 折计算", () => {
  assert.equal(FEE_DISCOUNT, 0.6);
  assert.ok(Math.abs(commissionForLot(7.5, 1.5) - 3.6) < 1e-9);
  assert.ok(Math.abs(commissionForLot(30, 5) - 15) < 1e-9);
  assert.equal(commissionForLot(5, 10), 0);
});
