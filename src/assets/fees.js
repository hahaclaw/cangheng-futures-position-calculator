/**
 * 海证期货公司标准手续费（佣金）参考。
 *
 * 数据来源：海证期货官网《关于调整公司标准手续费的通知》，
 * 公司标准自 2024-04-22 交易起执行。
 * 官方说明：公司标准手续费中包含海证期货为客户代缴的交易所手续费。
 *
 * 手续费分两种：固定金额（元/手）或成交额比例（万分之几）。
 * 表中“平今免收”记为 0，页面显示“无”；“开平减半”按开仓标准的一半计算。
 * 页面按（公司标准 − 交易所费用）× 6 折计算实际佣金。
 * 实际佣金因客户协商、合约月份和交易所调整而异，页面仅作参考。
 */

export const FEE_PROVIDER = "海证期货";
export const FEE_AS_OF = "2024-04-22";
export const FEE_INCLUDES_EXCHANGE = true;
export const FEE_DISCOUNT = 0.6;
export const FEE_DISCOUNT_LABEL = "6折";

// 海证官网 2024 标准未单列这些新品种，页面显示“未公布”。
export const FEE_MISSING = new Set(["ad", "op", "pr", "pl", "lg", "bz", "ps", "pd", "pt"]);

const FIXED = {
  a: 10,
  al: 12,
  ap: 30,
  au: 12,
  b: 5,
  c: 4.8,
  cf: 25.8,
  cj: 18,
  cs: 6,
  cy: 12,
  eb: 15,
  eg: 18,
  fg: 36,
  jr: 9,
  l: 5,
  lr: 9,
  m: 7.5,
  ni: 18,
  oi: 10,
  p: 10,
  pf: 15,
  pg: 36,
  pk: 20,
  pm: 150,
  pp: 4,
  ri: 12.5,
  rm: 7.5,
  rr: 2,
  rs: 10,
  ru: 18,
  sc: 100,
  sf: 15,
  sm: 15,
  sn: 9,
  sr: 18,
  ss: 4,
  t: 15,
  ta: 18,
  tf: 15,
  tl: 15,
  ts: 15,
  v: 2,
  wh: 60,
  y: 10,
  zc: 150,
  zn: 9,
};

const RATE = {
  ag: 0.6,
  ao: 6,
  bb: 5,
  bc: 0.5,
  br: 5,
  bu: 6,
  cu: 2,
  ec: 3,
  fb: 2,
  fu: 0.6,
  hc: 4,
  i: 6,
  ic: 1.15,
  if: 1.15,
  ih: 1.15,
  im: 1.15,
  j: 6,
  jd: 9,
  jm: 6,
  lc: 4.8,
  lh: 6,
  lu: 0.5,
  ma: 6,
  nr: 0.8,
  pb: 1.2,
  px: 5,
  rb: 6,
  sa: 12,
  sh: 6,
  si: 6,
  sp: 1,
  ur: 6,
  wr: 0.8,
};

// 平今标准高于或低于开仓标准的品种。
const TODAY_OVERRIDES = {
  ap: 120,
  cu: 4,
  ic: 11.5,
  if: 11.5,
  ih: 11.5,
  im: 11.5,
  j: 8.4,
  jm: 18,
  lh: 12,
  sf: 7.5,
  sm: 7.5,
};

// 官方表明确写“平今免收”的品种。
const ZERO_TODAY = new Set([
  "au",
  "bc",
  "cf",
  "cy",
  "fu",
  "lc",
  "nr",
  "pb",
  "ru",
  "sc",
  "si",
  "sp",
  "sr",
  "ss",
  "t",
  "ta",
  "tf",
  "tl",
  "ts",
  "wr",
  "zn",
]);

export function getFeeRule(instrument) {
  if (FEE_MISSING.has(instrument.id)) {
    return {
      type: "fixed",
      open: 0,
      close: 0,
      closeToday: 0,
      missing: true,
      unit: "元/手",
      provider: FEE_PROVIDER,
      asOf: FEE_AS_OF,
    };
  }

  const fixed = FIXED[instrument.id];
  if (Number.isFinite(fixed)) {
    return {
      type: "fixed",
      open: fixed,
      close: fixed,
      closeToday: TODAY_OVERRIDES[instrument.id] ?? (ZERO_TODAY.has(instrument.id) ? 0 : fixed),
      unit: "元/手",
      provider: FEE_PROVIDER,
      asOf: FEE_AS_OF,
    };
  }

  const rate = RATE[instrument.id];
  if (Number.isFinite(rate)) {
    const today = TODAY_OVERRIDES[instrument.id] ?? (ZERO_TODAY.has(instrument.id) ? 0 : rate);
    return {
      type: "rate",
      open: rate / 10000,
      close: rate / 10000,
      closeToday: today / 10000,
      rateTenThousandths: rate,
      unit: "成交额比例",
      provider: FEE_PROVIDER,
      asOf: FEE_AS_OF,
    };
  }

  return {
    type: "fixed",
    open: 0,
    close: 0,
    closeToday: 0,
    missing: true,
    unit: "元/手",
    provider: FEE_PROVIDER,
    asOf: FEE_AS_OF,
  };
}

export function feeForLot(rule, contractValue, kind = "open") {
  if (!Number.isFinite(contractValue) || contractValue <= 0) return 0;
  const value = rule[kind] ?? 0;
  return rule.type === "rate" ? contractValue * value : value;
}

/** 海证公司标准扣除交易所费用后，按折扣计算实际佣金。 */
export function commissionForLot(companyFee, exchangeFee, discount = FEE_DISCOUNT) {
  const commission = Math.max(Number(companyFee) - Number(exchangeFee), 0);
  return commission * discount;
}
