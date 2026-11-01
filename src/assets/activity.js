/**
 * 主力合约活动性参考快照。
 *
 * 数据来源：OpenCTP 期货交易手续费与保证金（2026-11-02），
 * 取每个品种持仓量最大的合约作为主力参考。
 * 成交量为盘中字段，快照中可能为 0，页面优先使用实时行情；缺失时显示“—”。
 */

export const ACTIVITY_AS_OF = "2026-11-02";

// 长期成交与持仓都很低的品种；即使快照缺失也按不活跃提示。
export const INACTIVE_PRODUCTS = new Set([
  "jr",
  "lr",
  "pm",
  "ri",
  "wh",
  "zc",
  "wr",
  "bb",
  "fb",
]);

const SNAPSHOT = {
  ad: { openInterest: 16183, price: 22745 },
  ag: { openInterest: 236445, price: 11532 },
  al: { openInterest: 246201, price: 23280 },
  ao: { openInterest: 250434, price: 2618 },
  au: { openInterest: 181475, price: 831.68 },
  br: { openInterest: 55255, price: 17155 },
  bu: { openInterest: 230747, price: 5304 },
  cu: { openInterest: 186145, price: 107250 },
  fu: { openInterest: 216139, price: 5434 },
  hc: { openInterest: 1779530, price: 3166 },
  ni: { openInterest: 141747, price: 115380 },
  op: { openInterest: 17652, price: 3588 },
  pb: { openInterest: 63611, price: 16080 },
  rb: { openInterest: 1806755, price: 3023 },
  ru: { openInterest: 132646, price: 19260 },
  sn: { openInterest: 48309, price: 362880 },
  sp: { openInterest: 374432, price: 4596 },
  ss: { openInterest: 97933, price: 13465 },
  wr: { openInterest: 56, price: 3283 },
  zn: { openInterest: 114317, price: 25590 },
  a: { openInterest: 361184, price: 5304 },
  b: { openInterest: 120564, price: 4004 },
  bb: { openInterest: 129, price: 145.6 },
  bz: { openInterest: 25368, price: 9323 },
  c: { openInterest: 1257386, price: 2221 },
  cs: { openInterest: 269390, price: 2493 },
  eb: { openInterest: 334351, price: 10675 },
  eg: { openInterest: 350357, price: 5423 },
  fb: { openInterest: 6094, price: 1228.5 },
  i: { openInterest: 570172, price: 673.5 },
  j: { openInterest: 44552, price: 1884 },
  jd: { openInterest: 210404, price: 3478 },
  jm: { openInterest: 422040, price: 1408 },
  l: { openInterest: 471109, price: 9840 },
  lg: { openInterest: 14182, price: 800 },
  lh: { openInterest: 161040, price: 9510 },
  m: { openInterest: 2040376, price: 3179 },
  p: { openInterest: 547627, price: 9321 },
  pg: { openInterest: 101927, price: 8074 },
  pp: { openInterest: 654513, price: 10815 },
  rr: { openInterest: 22649, price: 3509 },
  v: { openInterest: 1050617, price: 5287 },
  y: { openInterest: 544508, price: 9073 },
  ap: { openInterest: 171692, price: 5887 },
  cf: { openInterest: 643753, price: 15275 },
  cj: { openInterest: 210803, price: 6175 },
  cy: { openInterest: 14106, price: 21345 },
  fg: { openInterest: 1333109, price: 855 },
  jr: { openInterest: 0, price: 2662 },
  lr: { missing: true },
  ma: { openInterest: 941749, price: 3613 },
  oi: { openInterest: 377283, price: 10317 },
  pf: { openInterest: 166058, price: 8712 },
  pk: { openInterest: 161332, price: 7886 },
  pl: { openInterest: 19882, price: 11098 },
  pm: { openInterest: 0, price: 3122 },
  pr: { openInterest: 42020, price: 8818 },
  px: { openInterest: 83853, price: 10054 },
  ri: { openInterest: 0, price: 2479 },
  rm: { openInterest: 610624, price: 2225 },
  rs: { openInterest: 14620, price: 5478 },
  sa: { openInterest: 1151914, price: 972 },
  sf: { openInterest: 204643, price: 5858 },
  sh: { openInterest: 299120, price: 1469 },
  sm: { openInterest: 316373, price: 5890 },
  sr: { openInterest: 586679, price: 5245 },
  ta: { openInterest: 1065752, price: 6820 },
  ur: { openInterest: 293487, price: 1736 },
  wh: { openInterest: 0, price: 3198 },
  zc: { openInterest: 0, price: 801.4 },
  ic: { openInterest: 187660, price: 0 },
  if: { openInterest: 182758, price: 0 },
  ih: { openInterest: 75788, price: 0 },
  im: { openInterest: 304720, price: 0 },
  t: { openInterest: 415383, price: 0 },
  tf: { openInterest: 232055, price: 0 },
  tl: { openInterest: 203757, price: 0 },
  ts: { openInterest: 98915, price: 0 },
  bc: { openInterest: 13969, price: 95840 },
  ec: { openInterest: 15349, price: 2625 },
  lu: { openInterest: 75274, price: 6280 },
  nr: { openInterest: 69236, price: 16320 },
  sc: { openInterest: 29929, price: 758.5 },
  lc: { openInterest: 443073, price: 0 },
  pd: { openInterest: 14035, price: 0 },
  ps: { openInterest: 62802, price: 0 },
  pt: { openInterest: 14011, price: 0 },
  si: { openInterest: 237633, price: 0 },
};

export function getActivitySnapshot(instrument) {
  return SNAPSHOT[instrument.id] ?? { missing: true };
}

export function activityLevel(instrument, { openInterest, volume = null } = {}) {
  if (INACTIVE_PRODUCTS.has(instrument.id)) return "inactive";

  const oi = Number(openInterest) || 0;
  const vol = Number(volume) || 0;

  if (oi < 10_000 || (vol > 0 && vol < 1_000)) return "inactive";
  if (oi < 50_000 || (vol > 0 && vol < 5_000)) return "watch";
  return "active";
}

export function tiedCapital(openInterest, price, multiplier, marginRate) {
  return (Number(openInterest) || 0) * (Number(price) || 0) * (Number(multiplier) || 0) * (Number(marginRate) || 0);
}
