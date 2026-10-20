import assert from "node:assert/strict";
import test from "node:test";

import {
  DATA_AS_OF,
  EXCHANGES,
  EXCHANGE_ORDER,
  INSTRUMENTS,
  bestMatch,
  getInstrument,
  normalizeQuery,
  quoteSecId,
  quoteSymbol,
  searchInstruments,
} from "../src/assets/instruments.js";

test("品种库覆盖 88 个品种，且代码不重复", () => {
  assert.equal(INSTRUMENTS.length, 88);
  const codes = INSTRUMENTS.map((item) => item.code);
  assert.equal(new Set(codes).size, codes.length);
  assert.equal(new Set(INSTRUMENTS.map((item) => item.id)).size, INSTRUMENTS.length);
});

test("每个品种都有完整的合约与保证金字段", () => {
  for (const instrument of INSTRUMENTS) {
    assert.ok(instrument.name, `${instrument.code} 缺少名称`);
    assert.ok(EXCHANGE_ORDER.includes(instrument.exchange), `${instrument.code} 交易所无效`);
    assert.ok(Number.isFinite(instrument.multiplier) && instrument.multiplier > 0, `${instrument.code} 乘数无效`);
    assert.ok(instrument.unit.includes("/手") || instrument.unit.includes("元/点"), `${instrument.code} 交易单位异常`);
    assert.ok(instrument.quoteUnit, `${instrument.code} 缺少报价单位`);
    assert.ok(Number.isFinite(instrument.tick) && instrument.tick > 0, `${instrument.code} 最小变动无效`);
    assert.ok(
      Number.isFinite(instrument.marginRate) && instrument.marginRate > 0 && instrument.marginRate < 1,
      `${instrument.code} 保证金率无效`,
    );
    assert.ok(EXCHANGES[instrument.exchange], `${instrument.code} 缺少交易所映射`);
  }
});

test("关键品种的交易单位与乘数正确", () => {
  const cases = [
    ["M", "10 吨/手", 10],
    ["RB", "10 吨/手", 10],
    ["I", "100 吨/手", 100],
    ["AU", "1000 克/手", 1000],
    ["AG", "15 千克/手", 15],
    ["SC", "1000 桶/手", 1000],
    ["IF", "300 元/点", 300],
    ["IC", "200 元/点", 200],
    ["TS", "200 万元面值/手", 20_000],
    ["T", "100 万元面值/手", 10_000],
    ["EC", "50 元/点", 50],
    ["BZ", "30 吨/手", 30],
    ["PL", "20 吨/手", 20],
    ["PT", "1000 克/手", 1000],
  ];

  for (const [code, unit, multiplier] of cases) {
    const instrument = INSTRUMENTS.find((item) => item.code === code);
    assert.ok(instrument, `找不到 ${code}`);
    assert.equal(instrument.unit, unit, `${code} 交易单位错误`);
    assert.equal(instrument.multiplier, multiplier, `${code} 乘数错误`);
  }
});

test("名称、代码、别名、合约月份和主连后缀都能匹配", () => {
  const cases = [
    ["豆粕", "M"],
    ["豆粕2701", "M"],
    ["M2701", "M"],
    ["m2605", "M"],
    ["豆粕主连", "M"],
    ["螺纹", "RB"],
    ["RB2605", "RB"],
    ["菜粕", "RM"],
    ["RM605", "RM"],
    ["IF2601", "IF"],
    ["十年债", "T"],
    ["集运指数", "EC"],
    ["欧线", "EC"],
    ["纯苯", "BZ"],
    ["PL", "PL"],
    ["铂", "PT"],
  ];

  for (const [query, code] of cases) {
    assert.equal(bestMatch(query)?.code, code, `${query} 应匹配 ${code}`);
  }
});

test("无效查询返回空结果", () => {
  assert.equal(searchInstruments("不存在的品种", 5).length, 0);
  assert.equal(bestMatch(""), null);
});

test("归一化会去掉空格、标点、主连/指数等描述词", () => {
  assert.equal(normalizeQuery(" 豆粕 2701 "), "豆粕2701");
  assert.equal(normalizeQuery("M 主连"), "M");
  assert.equal(normalizeQuery("沪深300指数"), "沪深300");
  assert.equal(normalizeQuery("集运指数（欧线）"), "集运欧线");
});

test("行情代码映射到东方财富的交易所与主连代码", () => {
  assert.equal(quoteSymbol(getInstrument("m")), "mm");
  assert.equal(quoteSecId(getInstrument("m")), "114.mm");
  assert.equal(quoteSecId(getInstrument("cu")), "113.cum");
  assert.equal(quoteSecId(getInstrument("ma")), "115.MAM");
  assert.equal(quoteSecId(getInstrument("if")), "220.IFM");
  assert.equal(quoteSecId(getInstrument("sc")), "142.scm");
  assert.equal(quoteSecId(getInstrument("lc")), "225.lcm");
});

test("数据基准日有效", () => {
  assert.match(DATA_AS_OF, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(DATA_AS_OF)));
});
