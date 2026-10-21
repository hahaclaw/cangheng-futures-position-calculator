import assert from "node:assert/strict";
import test from "node:test";

import { REFERENCE_PRICES, REFERENCE_PRICE_AS_OF } from "../src/assets/reference-prices.js";
import { getInstrument } from "../src/assets/instruments.js";

test("主力参考价覆盖活跃品种且价格有效", () => {
  const entries = Object.entries(REFERENCE_PRICES);
  assert.ok(entries.length >= 80, `参考价仅覆盖 ${entries.length} 个品种`);
  for (const [id, item] of entries) {
    assert.ok(getInstrument(id), `参考价包含未知品种 ${id}`);
    assert.ok(Number.isFinite(item.price) && item.price > 0, `${id} 参考价无效`);
    assert.ok(item.quoteName.includes("主连"), `${id} 不是主力连续行情`);
  }
  assert.ok(!Number.isNaN(Date.parse(REFERENCE_PRICE_AS_OF)));
});

test("棕榈油主力参考价可用于一手保证金估算", () => {
  const palm = getInstrument("p");
  const reference = REFERENCE_PRICES.p;
  assert.ok(palm && reference);
  const margin = reference.price * palm.multiplier * palm.marginRate;
  assert.ok(margin > 0);
});
