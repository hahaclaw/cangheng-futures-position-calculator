import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENTS, getInstrument } from "../src/assets/instruments.js";
import { getTradingHours, TRADING_HOURS_AS_OF } from "../src/assets/trading-hours.js";

test("每个品种都有日盘、夜盘与每日交易时长", () => {
  for (const instrument of INSTRUMENTS) {
    const hours = getTradingHours(instrument);
    assert.ok(hours.dayLabel, `${instrument.code} 缺少日盘时间`);
    assert.ok(hours.dayHours > 0, `${instrument.code} 日盘时长无效`);
    assert.ok(typeof hours.nightLabel === "string", `${instrument.code} 缺少夜盘说明`);
    assert.ok(hours.totalHours >= hours.dayHours, `${instrument.code} 总时长异常`);
    assert.ok(hours.suggestedRiskPct > 0 && hours.suggestedRiskPct < 2, `${instrument.code} 建议风险异常`);
  }
});

test("豆粕与棕榈油：日盘 3.75 小时 + 夜盘 2 小时 = 5.75 小时", () => {
  for (const id of ["m", "p"]) {
    const hours = getTradingHours(getInstrument(id));
    assert.equal(hours.dayHours, 3.75);
    assert.equal(hours.nightHours, 2);
    assert.equal(hours.totalHours, 5.75);
    assert.equal(hours.nightLabel, "21:00–23:00");
    assert.ok(Math.abs(hours.suggestedRiskPct - 0.347826) < 0.00001);
  }
});

test("沪铜夜盘到次日 01:00，总时长 7.75 小时", () => {
  const hours = getTradingHours(getInstrument("cu"));
  assert.equal(hours.totalHours, 7.75);
  assert.equal(hours.nightLabel, "21:00–次日 01:00");
  assert.ok(Math.abs(hours.suggestedRiskPct - 0.258064) < 0.00001);
});

test("沪金夜盘到次日 02:30，总时长 9.25 小时", () => {
  const hours = getTradingHours(getInstrument("au"));
  assert.equal(hours.totalHours, 9.25);
  assert.equal(hours.nightLabel, "21:00–次日 02:30");
  assert.ok(Math.abs(hours.suggestedRiskPct - 0.216216) < 0.00001);
});

test("股指日盘 4 小时，国债日盘 4.25 小时，均无夜盘", () => {
  const index = getTradingHours(getInstrument("if"));
  assert.equal(index.totalHours, 4);
  assert.equal(index.nightHours, 0);
  assert.equal(index.suggestedRiskPct, 0.5);

  const bond = getTradingHours(getInstrument("t"));
  assert.equal(bond.totalHours, 4.25);
  assert.equal(bond.nightHours, 0);
  assert.ok(Math.abs(bond.suggestedRiskPct - 0.470588) < 0.00001);
});

test("集运指数、广期所与部分农产品无夜盘", () => {
  for (const id of ["ec", "si", "lc", "ps", "pt", "pd", "ap", "ur", "jd"]) {
    const hours = getTradingHours(getInstrument(id));
    assert.equal(hours.nightHours, 0, `${id} 不应有夜盘`);
    assert.equal(hours.nightLabel, "无夜盘");
    assert.equal(hours.totalHours, 3.75);
  }
});

test("交易时段数据基准日有效", () => {
  assert.match(TRADING_HOURS_AS_OF, /^\d{4}-\d{2}-\d{2}$/);
});
