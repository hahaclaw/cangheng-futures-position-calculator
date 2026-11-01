import assert from "node:assert/strict";
import test from "node:test";

import { INSTRUMENTS, getInstrument } from "../src/assets/instruments.js";
import {
  ACTIVITY_AS_OF,
  INACTIVE_PRODUCTS,
  activityLevel,
  getActivitySnapshot,
  tiedCapital,
} from "../src/assets/activity.js";

test("活动性快照覆盖全部品种", () => {
  assert.equal(ACTIVITY_AS_OF, "2026-11-02");
  assert.equal(INSTRUMENTS.length, 80);
  assert.equal(INACTIVE_PRODUCTS.size, 1);
  for (const instrument of INSTRUMENTS) {
    const snapshot = getActivitySnapshot(instrument);
    assert.ok(!snapshot.missing, `${instrument.code} 缺少活动性快照`);
    assert.ok(snapshot.openInterest >= 0, `${instrument.code} 持仓量无效`);
    assert.ok(snapshot.price >= 0, `${instrument.code} 参考价无效`);
  }
});

test("活跃度定性判断", () => {
  assert.equal(activityLevel(getInstrument("m"), { openInterest: 2_040_376 }), "active");
  assert.equal(activityLevel(getInstrument("sc"), { openInterest: 29_929 }), "watch");
  assert.equal(activityLevel(getInstrument("ec"), { openInterest: 15_349 }), "inactive");
  assert.equal(activityLevel(getInstrument("fb"), { openInterest: 0 }), "inactive");
  assert.equal(activityLevel(getInstrument("m"), { openInterest: 60_000, volume: 2_000 }), "watch");
  assert.equal(activityLevel(getInstrument("m"), { openInterest: 60_000, volume: 500 }), "inactive");
  assert.equal(
    activityLevel(getInstrument("m"), { openInterest: 2_000_000, capital: 100_000_000 }),
    "inactive",
  );
  assert.equal(
    activityLevel(getInstrument("m"), { openInterest: 2_000_000, capital: 500_000_000 }),
    "watch",
  );
  assert.equal(
    activityLevel(getInstrument("m"), { openInterest: 2_000_000, capital: 6_000_000_000 }),
    "active",
  );
});

test("沉淀资金计算", () => {
  assert.equal(tiedCapital(1_000, 10, 10, 0.1), 10_000);
  assert.equal(tiedCapital(0, 10, 10, 0.1), 0);
  assert.equal(tiedCapital(2_040_376, 3_250, 10, 0.1), 6_631_222_000);
});
