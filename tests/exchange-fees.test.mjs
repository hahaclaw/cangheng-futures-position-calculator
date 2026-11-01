import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENTS, getInstrument } from "../src/assets/instruments.js";
import {
  EXCHANGE_FEE_AS_OF,
  exchangeFeeForLot,
  getExchangeFeeRule,
} from "../src/assets/exchange-fees.js";

test("交易所费用规则覆盖全部可交易品种", () => {
  assert.equal(EXCHANGE_FEE_AS_OF, "2026-11-02");
  assert.equal(INSTRUMENTS.length, 88);
  let covered = 0;
  for (const instrument of INSTRUMENTS) {
    const rule = getExchangeFeeRule(instrument);
    if (rule.missing) {
      assert.equal(instrument.id, "lr");
      continue;
    }
    covered += 1;
    assert.ok(rule.open, `${instrument.code} 开仓费用缺失`);
    assert.ok(rule.close, `${instrument.code} 平仓费用缺失`);
    assert.ok(rule.closeToday, `${instrument.code} 平今费用缺失`);
  }
  assert.equal(covered, 87);
});

test("固定交易所费用", () => {
  assert.deepEqual(getExchangeFeeRule(getInstrument("m")).open, { type: "fixed", value: 1.5 });
  assert.deepEqual(getExchangeFeeRule(getInstrument("t")).open, { type: "fixed", value: 3 });
  assert.deepEqual(getExchangeFeeRule(getInstrument("t")).closeToday, { type: "fixed", value: 0 });
  assert.deepEqual(getExchangeFeeRule(getInstrument("ap")).open, { type: "fixed", value: 5 });
  assert.deepEqual(getExchangeFeeRule(getInstrument("ap")).closeToday, { type: "fixed", value: 10 });
});

test("比例交易所费用", () => {
  const copper = getExchangeFeeRule(getInstrument("cu"));
  assert.equal(copper.open.type, "rate");
  assert.equal(copper.open.value, 0.00005);
  assert.equal(copper.closeToday.value, 0.0001);
  assert.ok(Math.abs(exchangeFeeForLot(copper, 100_000) - 5) < 1e-9);
  assert.ok(Math.abs(exchangeFeeForLot(copper, 100_000, "closeToday") - 10) < 1e-9);

  const index = getExchangeFeeRule(getInstrument("if"));
  assert.equal(index.open.value, 0.000023);
  assert.ok(Math.abs(exchangeFeeForLot(index, 1_200_000) - 27.6) < 1e-9);
});

test("未公布交易所费用的品种", () => {
  const rule = getExchangeFeeRule(getInstrument("lr"));
  assert.equal(rule.missing, true);
  assert.equal(exchangeFeeForLot(rule, 100_000), 0);
});
