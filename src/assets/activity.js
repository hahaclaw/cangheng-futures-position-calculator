/**
 * 主力合约活动性参考快照。
 *
 * 数据来源：OpenCTP 期货交易手续费与保证金（2026-11-02），
 * 取每个品种持仓量最大的合约作为主力参考，由 scripts/fetch-activity.mjs 自动生成。
 * 成交量为盘中字段，快照中可能为 0，页面优先使用实时行情；缺失时显示“—”。
 */

export const ACTIVITY_AS_OF = "2026-11-02";

// 长期成交与持仓都很低的品种；即使快照缺失也按不活跃提示。
export const INACTIVE_PRODUCTS = new Set([
  "fb"
]);

const SNAPSHOT = {
  cu: { openInterest: 183943, price: 107730 },
  al: { openInterest: 245146, price: 23130 },
  zn: { openInterest: 113497, price: 25580 },
  pb: { openInterest: 62806, price: 16055 },
  ni: { openInterest: 135342, price: 116920 },
  sn: { openInterest: 46251, price: 366870 },
  au: { openInterest: 172365, price: 837.16 },
  ag: { openInterest: 224472, price: 11885 },
  rb: { openInterest: 1863468, price: 3008 },
  ru: { openInterest: 132908, price: 19280 },
  br: { openInterest: 50966, price: 16945 },
  hc: { openInterest: 1802405, price: 3155 },
  sp: { openInterest: 375695, price: 4592 },
  op: { openInterest: 18252, price: 3590 },
  ss: { openInterest: 95603, price: 13565 },
  bu: { openInterest: 227502, price: 5181 },
  ao: { openInterest: 239067, price: 2636 },
  ad: { openInterest: 16756, price: 22610 },
  fu: { openInterest: 213891, price: 5228 },
  nr: { openInterest: 69007, price: 16310 },
  lu: { openInterest: 70822, price: 6004 },
  sc: { openInterest: 26570, price: 728.9 },
  bc: { openInterest: 13854, price: 96270 },
  ec: { openInterest: 16455, price: 2556.5 },
  a: { openInterest: 363220, price: 5296 },
  b: { openInterest: 124576, price: 4006 },
  m: { openInterest: 2037011, price: 3197 },
  y: { openInterest: 529783, price: 9010 },
  p: { openInterest: 547145, price: 9288 },
  l: { openInterest: 450595, price: 9589 },
  v: { openInterest: 1041586, price: 5291 },
  pp: { openInterest: 612529, price: 10504 },
  c: { openInterest: 1283121, price: 2232 },
  cs: { openInterest: 269742, price: 2500 },
  rr: { openInterest: 22516, price: 3541 },
  jd: { openInterest: 227029, price: 3572 },
  j: { openInterest: 46972, price: 1855.5 },
  jm: { openInterest: 431188, price: 1391 },
  i: { openInterest: 559801, price: 674.5 },
  fb: { openInterest: 6083, price: 1224.5 },
  bz: { openInterest: 25668, price: 9141 },
  eb: { openInterest: 327176, price: 10460 },
  pg: { openInterest: 93117, price: 7764 },
  eg: { openInterest: 356080, price: 5354 },
  lh: { openInterest: 163196, price: 9500 },
  lg: { openInterest: 14949, price: 801 },
  cf: { openInterest: 648352, price: 15190 },
  cy: { openInterest: 14358, price: 21260 },
  sr: { openInterest: 593589, price: 5228 },
  rs: { openInterest: 14884, price: 5486 },
  rm: { openInterest: 625801, price: 2216 },
  oi: { openInterest: 361891, price: 10165 },
  ta: { openInterest: 1019724, price: 6568 },
  sh: { openInterest: 292404, price: 1471 },
  px: { openInterest: 77290, price: 9402 },
  pr: { openInterest: 38100, price: 8466 },
  fg: { openInterest: 1275518, price: 875 },
  sa: { openInterest: 1168507, price: 972 },
  sf: { openInterest: 214291, price: 5814 },
  sm: { openInterest: 322333, price: 5854 },
  ma: { openInterest: 916159, price: 3555 },
  pl: { openInterest: 16885, price: 10734 },
  ap: { openInterest: 170033, price: 5759 },
  ur: { openInterest: 289593, price: 1736 },
  pf: { openInterest: 155214, price: 8454 },
  cj: { openInterest: 216860, price: 6360 },
  pk: { openInterest: 155647, price: 7850 },
  if: { openInterest: 181193, price: 3973.4 },
  ih: { openInterest: 69170, price: 2723.8 },
  ic: { openInterest: 175335, price: 6356.2 },
  im: { openInterest: 297968, price: 6268.6 },
  ts: { openInterest: 96482, price: 102.67 },
  tf: { openInterest: 226656, price: 106.745 },
  t: { openInterest: 405731, price: 109.905 },
  tl: { openInterest: 205016, price: 117.77 },
  si: { openInterest: 217916, price: 8580 },
  lc: { openInterest: 445419, price: 91400 },
  ps: { openInterest: 62622, price: 34015 },
  pt: { openInterest: 12704, price: 347 },
  pd: { openInterest: 13480, price: 229.7 },
};

export function getActivitySnapshot(instrument) {
  return SNAPSHOT[instrument.id] ?? { missing: true };
}

export function activityLevel(instrument, { openInterest, volume = null, capital = null } = {}) {
  if (INACTIVE_PRODUCTS.has(instrument.id)) return "inactive";

  const oi = Number(openInterest) || 0;
  const vol = Number(volume) || 0;
  const cap = Number(capital) > 0 ? Number(capital) : null;

  if (oi < 20_000 || (cap !== null && cap < 200_000_000) || (vol > 0 && vol < 2_000)) {
    return "inactive";
  }
  if (oi < 100_000 || (cap !== null && cap < 1_000_000_000) || (vol > 0 && vol < 10_000)) {
    return "watch";
  }
  return "active";
}

export function tiedCapital(openInterest, price, multiplier, marginRate) {
  return (Number(openInterest) || 0) * (Number(price) || 0) * (Number(multiplier) || 0) * (Number(marginRate) || 0);
}
