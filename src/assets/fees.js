/**
 * 期货品种参考手续费。
 *
 * 数据来源：公开期货公司代理手续费标准（数据基准日 2026-11-02）。
 * 手续费分两种：固定金额（元/手）或成交额比例。
 * rate 字段使用“万分之几”表示，例如 1.2 表示成交额的万分之 1.2。
 * 实际手续费因期货公司、合约月份、平今/平昨而异，页面仅作参考。
 */

export const FEE_AS_OF = "2026-11-02";

const FIXED = {
  al: 18,
  ap: 30,
  au: 60,
  ni: 18,
  ru: 18,
  sn: 18,
  ss: 12,
  zn: 18,
  a: 12,
  b: 6,
  bz: 18,
  c: 7.2,
  cs: 9,
  eb: 6,
  eg: 18,
  l: 6,
  m: 9,
  p: 15,
  pg: 36,
  pp: 6,
  rr: 6,
  v: 6,
  y: 15,
  cf: 25.8,
  cj: 18,
  cy: 6,
  fg: 12,
  jr: 18,
  lr: 18,
  oi: 12,
  pf: 12,
  pk: 12,
  pl: 18,
  pm: 180,
  ri: 15,
  rm: 9,
  rs: 12,
  sf: 12,
  sm: 12,
  sr: 12,
  ta: 18,
  wh: 180,
  zc: 900,
  tl: 18,
  t: 18,
  tf: 18,
  ts: 18,
  sc: 120,
};

const RATE = {
  ad: 3,
  ag: 0.6,
  ao: 6,
  br: 1.2,
  bu: 3,
  cu: 3,
  fu: 0.6,
  hc: 1.2,
  op: 1.2,
  pb: 2.4,
  rb: 1.2,
  sp: 1.2,
  wr: 2.4,
  bb: 3,
  fb: 3,
  i: 6,
  j: 6,
  jd: 9,
  jm: 6,
  lg: 1.8,
  lh: 6,
  ma: 6,
  pr: 3,
  px: 6,
  sa: 6,
  sh: 6,
  ur: 6,
  ic: 1.38,
  if: 1.38,
  ih: 1.38,
  im: 1.38,
  bc: 0.6,
  ec: 36,
  lu: 0.6,
  nr: 1.2,
  lc: 4.8,
  pd: 6,
  pt: 6,
  si: 6,
  ps: 6,
};

const CLOSE_OVERRIDES = {
  ap: 60,
  cu: 6,
  j: 8.4,
  lh: 12,
  ic: 3.45,
  if: 3.45,
  ih: 3.45,
  im: 3.45,
  ec: 72,
  ps: 15,
};

export function getFeeRule(instrument) {
  const fixed = FIXED[instrument.id];
  if (Number.isFinite(fixed)) {
    return {
      type: "fixed",
      open: fixed,
      closeToday: CLOSE_OVERRIDES[instrument.id] ?? fixed,
      unit: "元/手",
      asOf: FEE_AS_OF,
    };
  }

  const rate = RATE[instrument.id];
  if (Number.isFinite(rate)) {
    return {
      type: "rate",
      open: rate / 10000,
      closeToday: (CLOSE_OVERRIDES[instrument.id] ?? rate) / 10000,
      rateTenThousandths: rate,
      unit: "成交额比例",
      asOf: FEE_AS_OF,
    };
  }

  return { type: "fixed", open: 0, closeToday: 0, unit: "元/手", asOf: FEE_AS_OF };
}

export function feeForLot(rule, contractValue) {
  if (!Number.isFinite(contractValue) || contractValue <= 0) return 0;
  return rule.type === "rate" ? contractValue * rule.open : rule.open;
}
