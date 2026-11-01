/**
 * 交易所费用参考。
 *
 * 数据来源：OpenCTP 期货交易手续费与保证金（2026-11-02）。
 * OpenCTP 的“交易所+1分”口径已扣除 0.01 元/手或 0.01‱ 的基础佣金，
 * 得到交易所费用；实际交易所费率会随合约月份和公告调整。
 */

export const EXCHANGE_FEE_AS_OF = "2026-11-02";
export const EXCHANGE_FEE_SOURCE = "OpenCTP";

const RULES = {
  ad: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "fixed", value: 0 } },
  ag: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "rate", value: 0.00005 } },
  al: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  ao: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  au: { open: { type: "fixed", value: 20 }, close: { type: "fixed", value: 20 }, closeToday: { type: "fixed", value: 0 } },
  br: { open: { type: "rate", value: 0.00002 }, close: { type: "rate", value: 0.00002 }, closeToday: { type: "rate", value: 0.00002 } },
  bu: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "fixed", value: 0 } },
  cu: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "rate", value: 0.0001 } },
  fu: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "fixed", value: 0 } },
  hc: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  ni: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  op: { open: { type: "rate", value: 0.00002 }, close: { type: "rate", value: 0.00002 }, closeToday: { type: "fixed", value: 0 } },
  pb: { open: { type: "rate", value: 0.00004 }, close: { type: "rate", value: 0.00004 }, closeToday: { type: "fixed", value: 0 } },
  rb: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  ru: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  sn: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  sp: { open: { type: "rate", value: 0.00002 }, close: { type: "rate", value: 0.00002 }, closeToday: { type: "fixed", value: 0 } },
  ss: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  wr: { open: { type: "rate", value: 0.00004 }, close: { type: "rate", value: 0.00004 }, closeToday: { type: "fixed", value: 0 } },
  zn: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  a: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 2 } },
  b: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  bb: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "rate", value: 0.00005 } },
  bz: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  c: { open: { type: "fixed", value: 1.2 }, close: { type: "fixed", value: 1.2 }, closeToday: { type: "fixed", value: 1.2 } },
  cs: { open: { type: "fixed", value: 1.5 }, close: { type: "fixed", value: 1.5 }, closeToday: { type: "fixed", value: 1.5 } },
  eb: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  eg: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  fb: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "rate", value: 0.00005 } },
  i: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  j: { open: { type: "rate", value: 0.00014 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.00014 } },
  jd: { open: { type: "rate", value: 0.00015 }, close: { type: "rate", value: 0.00015 }, closeToday: { type: "rate", value: 0.00015 } },
  jm: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  l: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  lg: { open: { type: "rate", value: 0.00003 }, close: { type: "rate", value: 0.00003 }, closeToday: { type: "rate", value: 0.00003 } },
  lh: { open: { type: "rate", value: 0.0002 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0002 } },
  m: { open: { type: "fixed", value: 1.5 }, close: { type: "fixed", value: 1.5 }, closeToday: { type: "fixed", value: 1.5 } },
  p: { open: { type: "fixed", value: 2.5 }, close: { type: "fixed", value: 2.5 }, closeToday: { type: "fixed", value: 2.5 } },
  pg: { open: { type: "fixed", value: 6 }, close: { type: "fixed", value: 6 }, closeToday: { type: "fixed", value: 6 } },
  pp: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  rr: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  v: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 1 } },
  y: { open: { type: "fixed", value: 2.5 }, close: { type: "fixed", value: 2.5 }, closeToday: { type: "fixed", value: 2.5 } },
  ap: { open: { type: "fixed", value: 5 }, close: { type: "fixed", value: 5 }, closeToday: { type: "fixed", value: 10 } },
  cf: { open: { type: "fixed", value: 4.3 }, close: { type: "fixed", value: 4.3 }, closeToday: { type: "fixed", value: 0 } },
  cj: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  cy: { open: { type: "fixed", value: 1 }, close: { type: "fixed", value: 1 }, closeToday: { type: "fixed", value: 0 } },
  fg: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 2 } },
  jr: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 3 } },
  lr: { missing: true },
  ma: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  oi: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 2 } },
  pf: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  pk: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 2 } },
  pl: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  pm: { open: { type: "fixed", value: 30 }, close: { type: "fixed", value: 30 }, closeToday: { type: "fixed", value: 30 } },
  pr: { open: { type: "rate", value: 0.00005 }, close: { type: "rate", value: 0.00005 }, closeToday: { type: "fixed", value: 0 } },
  px: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "fixed", value: 0 } },
  ri: { open: { type: "fixed", value: 2.5 }, close: { type: "fixed", value: 2.5 }, closeToday: { type: "fixed", value: 2.5 } },
  rm: { open: { type: "fixed", value: 1.5 }, close: { type: "fixed", value: 1.5 }, closeToday: { type: "fixed", value: 0 } },
  rs: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  sa: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  sf: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  sh: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "fixed", value: 0 } },
  sm: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  sr: { open: { type: "fixed", value: 2 }, close: { type: "fixed", value: 2 }, closeToday: { type: "fixed", value: 0 } },
  ta: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  ur: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.0001 } },
  wh: { open: { type: "fixed", value: 30 }, close: { type: "fixed", value: 30 }, closeToday: { type: "fixed", value: 30 } },
  zc: { open: { type: "fixed", value: 150 }, close: { type: "fixed", value: 150 }, closeToday: { type: "fixed", value: 150 } },
  ic: { open: { type: "rate", value: 0.000023 }, close: { type: "rate", value: 0.000023 }, closeToday: { type: "rate", value: 0.00023 } },
  if: { open: { type: "rate", value: 0.000023 }, close: { type: "rate", value: 0.000023 }, closeToday: { type: "rate", value: 0.00023 } },
  ih: { open: { type: "rate", value: 0.000023 }, close: { type: "rate", value: 0.000023 }, closeToday: { type: "rate", value: 0.00023 } },
  im: { open: { type: "rate", value: 0.000023 }, close: { type: "rate", value: 0.000023 }, closeToday: { type: "rate", value: 0.00023 } },
  t: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  tf: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  tl: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  ts: { open: { type: "fixed", value: 3 }, close: { type: "fixed", value: 3 }, closeToday: { type: "fixed", value: 0 } },
  bc: { open: { type: "rate", value: 0.00001 }, close: { type: "rate", value: 0.00001 }, closeToday: { type: "fixed", value: 0 } },
  ec: { open: { type: "rate", value: 0.0006 }, close: { type: "rate", value: 0.0006 }, closeToday: { type: "rate", value: 0.0012 } },
  lu: { open: { type: "rate", value: 0.00001 }, close: { type: "rate", value: 0.00001 }, closeToday: { type: "rate", value: 0.00001 } },
  nr: { open: { type: "rate", value: 0.00002 }, close: { type: "rate", value: 0.00002 }, closeToday: { type: "fixed", value: 0 } },
  sc: { open: { type: "fixed", value: 20 }, close: { type: "fixed", value: 20 }, closeToday: { type: "fixed", value: 0 } },
  lc: { open: { type: "rate", value: 0.00008 }, close: { type: "rate", value: 0.00008 }, closeToday: { type: "rate", value: 0.00008 } },
  pd: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "fixed", value: 0 } },
  ps: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "rate", value: 0.00025 } },
  pt: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "fixed", value: 0 } },
  si: { open: { type: "rate", value: 0.0001 }, close: { type: "rate", value: 0.0001 }, closeToday: { type: "fixed", value: 0 } },
};

export function getExchangeFeeRule(instrument) {
  return RULES[instrument.id] ?? { missing: true };
}

export function exchangeFeeForLot(rule, contractValue, kind = "open") {
  if (!Number.isFinite(contractValue) || contractValue <= 0) return 0;
  const spec = rule[kind];
  if (!spec) return 0;
  return spec.type === "rate" ? contractValue * spec.value : spec.value;
}
