/**
 * 境内期货品种常规交易时段与每日交易时长。
 *
 * 以交易所公开交易时间整理，数据基准日 2026-09-07。
 * - 商品期货日盘：09:00–10:15、10:30–11:30、13:30–15:00（3.75 小时）
 * - 中金所股指：09:30–11:30、13:00–15:00（4 小时）
 * - 中金所国债：09:30–11:30、13:00–15:15（4.25 小时）
 * - 夜盘 21:00–23:00（2 小时）、21:00–次日 01:00（4 小时）、
 *   21:00–次日 02:30（5.5 小时）
 *
 * 集合竞价不计入交易时长；法定节假日前一个交易日可能没有夜盘。
 * 建议小时级风险 = 2% ÷ 每日交易时长。
 */

export const TRADING_HOURS_AS_OF = "2026-09-07";

const COMMODITY_DAY = {
  label: "09:00–10:15、10:30–11:30、13:30–15:00",
  hours: 3.75,
};

const INDEX_DAY = {
  label: "09:30–11:30、13:00–15:00",
  hours: 4,
};

const BOND_DAY = {
  label: "09:30–11:30、13:00–15:15",
  hours: 4.25,
};

const NIGHT_2 = new Set([
  // 上期所
  "ru", "rb", "hc", "bu", "fu", "sp", "br", "op",
  // 上期能源
  "nr", "lu",
  // 大商所
  "a", "b", "m", "y", "p", "c", "cs", "rr", "l", "v", "pp", "i", "j", "jm",
  "eg", "eb", "pg", "bz",
  // 郑商所
  "cf", "cy", "sr", "oi", "rm", "zc", "fg", "sa", "ma", "ta", "pf", "sh",
  "px", "pr", "pl",
]);

const NIGHT_4 = new Set([
  // 上期所
  "cu", "al", "zn", "pb", "ni", "sn", "ao", "ss", "ad",
  // 上期能源
  "bc",
]);

const NIGHT_55 = new Set([
  // 上期所
  "au", "ag",
  // 上期能源
  "sc",
]);

const CFFEX_INDEX = new Set(["if", "ih", "ic", "im"]);
const CFFEX_BOND = new Set(["ts", "tf", "t", "tl"]);

function nightProfile(instrument) {
  if (NIGHT_2.has(instrument.id)) {
    return { label: "21:00–23:00", hours: 2 };
  }
  if (NIGHT_4.has(instrument.id)) {
    return { label: "21:00–次日 01:00", hours: 4 };
  }
  if (NIGHT_55.has(instrument.id)) {
    return { label: "21:00–次日 02:30", hours: 5.5 };
  }
  return { label: "无夜盘", hours: 0 };
}

export function getTradingHours(instrument) {
  let day = COMMODITY_DAY;
  if (CFFEX_INDEX.has(instrument.id)) day = INDEX_DAY;
  if (CFFEX_BOND.has(instrument.id)) day = BOND_DAY;

  const night = nightProfile(instrument);
  const totalHours = day.hours + night.hours;
  return {
    dayLabel: day.label,
    dayHours: day.hours,
    nightLabel: night.label,
    nightHours: night.hours,
    totalHours,
    hasNight: night.hours > 0,
    dailyRiskPct: 2,
    suggestedRiskPct: totalHours > 0 ? 2 / totalHours : 0,
    asOf: TRADING_HOURS_AS_OF,
  };
}
