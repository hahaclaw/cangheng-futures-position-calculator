/**
 * 境内期货品种合约参数。
 *
 * multiplier：报价每变动 1 个价格单位，每手合约价值变动多少元。
 * unit：交易单位的中文展示。
 * marginPct：参考保证金率（百分数）。默认值取期货公司公示口径，
 *            通常高于交易所最低标准，实际以开户期货公司为准。
 *
 * 数据基准日：2026-10-12。合约规则与保证金会调整，页面允许手动修改保证金率。
 */

export const DATA_AS_OF = "2026-10-12";

export const EXCHANGES = {
  SHFE: { name: "上海期货交易所", short: "上期所", market: "113" },
  DCE: { name: "大连商品交易所", short: "大商所", market: "114" },
  CZCE: { name: "郑州商品交易所", short: "郑商所", market: "115" },
  CFFEX: { name: "中国金融期货交易所", short: "中金所", market: "220" },
  INE: { name: "上海国际能源交易中心", short: "上期能源", market: "142" },
  GFEX: { name: "广州期货交易所", short: "广期所", market: "225" },
};

export const EXCHANGE_ORDER = ["SHFE", "DCE", "CZCE", "CFFEX", "INE", "GFEX"];

/**
 * 元组字段：
 * [id, 名称, 代码, 交易所, 合约乘数, 交易单位, 报价单位, 最小变动, 参考保证金率%, 别名, 备注]
 */
const ROWS = [
  // 上海期货交易所
  ["cu", "沪铜", "CU", "SHFE", 5, "5 吨/手", "元/吨", 10, 13, ["铜", "阴极铜"]],
  ["al", "沪铝", "AL", "SHFE", 5, "5 吨/手", "元/吨", 5, 13, ["铝"]],
  ["zn", "沪锌", "ZN", "SHFE", 5, "5 吨/手", "元/吨", 5, 13, ["锌"]],
  ["pb", "沪铅", "PB", "SHFE", 5, "5 吨/手", "元/吨", 5, 13, ["铅"]],
  ["ni", "沪镍", "NI", "SHFE", 1, "1 吨/手", "元/吨", 10, 15, ["镍"]],
  ["sn", "沪锡", "SN", "SHFE", 1, "1 吨/手", "元/吨", 10, 18, ["锡"]],
  ["au", "沪金", "AU", "SHFE", 1000, "1000 克/手", "元/克", 0.02, 21, ["黄金", "金"]],
  ["ag", "沪银", "AG", "SHFE", 15, "15 千克/手", "元/千克", 1, 23, ["白银", "银"]],
  ["rb", "螺纹钢", "RB", "SHFE", 10, "10 吨/手", "元/吨", 1, 12, ["螺纹", "螺纹钢"]],
  ["wr", "线材", "WR", "SHFE", 10, "10 吨/手", "元/吨", 1, 16, ["高速线材"]],
  ["ru", "天然橡胶", "RU", "SHFE", 10, "10 吨/手", "元/吨", 5, 12, ["橡胶", "全乳胶"]],
  ["br", "丁二烯橡胶", "BR", "SHFE", 5, "5 吨/手", "元/吨", 5, 18, ["顺丁橡胶", "合成橡胶"]],
  ["hc", "热轧卷板", "HC", "SHFE", 10, "10 吨/手", "元/吨", 1, 12, ["热卷", "热轧板卷"]],
  ["sp", "纸浆", "SP", "SHFE", 10, "10 吨/手", "元/吨", 2, 10, ["木浆", "漂针浆"]],
  ["op", "胶版印刷纸", "OP", "SHFE", 40, "40 吨/手", "元/吨", 2, 10, ["双胶纸", "胶版纸"]],
  ["ss", "不锈钢", "SS", "SHFE", 5, "5 吨/手", "元/吨", 5, 11, ["不锈钢卷"]],
  ["bu", "石油沥青", "BU", "SHFE", 10, "10 吨/手", "元/吨", 1, 16, ["沥青"]],
  ["ao", "氧化铝", "AO", "SHFE", 20, "20 吨/手", "元/吨", 1, 13, ["氧化铝"]],
  ["ad", "铸造铝合金", "AD", "SHFE", 10, "10 吨/手", "元/吨", 5, 11, ["铸造铝", "铝合金"]],
  ["fu", "燃料油", "FU", "SHFE", 10, "10 吨/手", "元/吨", 1, 20, ["燃油", "保税燃料油"]],

  // 上海国际能源交易中心
  ["nr", "20号胶", "NR", "INE", 10, "10 吨/手", "元/吨", 5, 12, ["20号标准胶", "标胶"]],
  ["lu", "低硫燃料油", "LU", "INE", 10, "10 吨/手", "元/吨", 1, 20, ["低硫燃油"]],
  ["sc", "原油", "SC", "INE", 1000, "1000 桶/手", "元/桶", 0.1, 20, ["上海原油", "原油期货"]],
  ["bc", "国际铜", "BC", "INE", 5, "5 吨/手", "元/吨", 10, 13, ["国际铜"]],
  [
    "ec",
    "集运指数（欧线）",
    "EC",
    "INE",
    50,
    "50 元/点",
    "点",
    0.1,
    24,
    ["集运指数", "欧线", "集运欧线", "SCFIS", "集运"],
    "合约乘数为 50 元/点",
  ],

  // 大连商品交易所
  ["a", "豆一", "A", "DCE", 10, "10 吨/手", "元/吨", 1, 10, ["黄大豆1号", "大豆", "黄豆"]],
  ["b", "豆二", "B", "DCE", 10, "10 吨/手", "元/吨", 1, 10, ["黄大豆2号", "进口大豆"]],
  ["m", "豆粕", "M", "DCE", 10, "10 吨/手", "元/吨", 1, 10, ["豆粕"]],
  ["y", "豆油", "Y", "DCE", 10, "10 吨/手", "元/吨", 2, 10, ["大豆油"]],
  ["p", "棕榈油", "P", "DCE", 10, "10 吨/手", "元/吨", 2, 11, ["棕油", "棕榈"]],
  ["l", "聚乙烯", "L", "DCE", 5, "5 吨/手", "元/吨", 1, 10, ["塑料", "LLDPE"]],
  ["v", "聚氯乙烯", "V", "DCE", 5, "5 吨/手", "元/吨", 1, 10, ["PVC"]],
  ["pp", "聚丙烯", "PP", "DCE", 5, "5 吨/手", "元/吨", 1, 10, ["PP"]],
  ["c", "玉米", "C", "DCE", 10, "10 吨/手", "元/吨", 1, 10, ["玉蜀黍"]],
  ["cs", "玉米淀粉", "CS", "DCE", 10, "10 吨/手", "元/吨", 1, 9, ["淀粉"]],
  ["rr", "粳米", "RR", "DCE", 10, "10 吨/手", "元/吨", 1, 15, ["粳米"]],
  [
    "jd",
    "鸡蛋",
    "JD",
    "DCE",
    10,
    "5 吨/手",
    "元/500千克",
    1,
    10,
    ["鸡蛋"],
    "报价按 500 千克计，1 手 = 10 个报价单位",
  ],
  ["j", "焦炭", "J", "DCE", 100, "100 吨/手", "元/吨", 0.5, 16, ["焦炭"]],
  ["jm", "焦煤", "JM", "DCE", 60, "60 吨/手", "元/吨", 0.5, 16, ["焦煤"]],
  ["i", "铁矿石", "I", "DCE", 100, "100 吨/手", "元/吨", 0.5, 11, ["铁矿"]],
  ["fb", "纤维板", "FB", "DCE", 10, "10 立方米/手", "元/立方米", 0.5, 12, ["纤维板"]],
  ["bb", "胶合板", "BB", "DCE", 500, "500 张/手", "元/张", 0.05, 12, ["胶合板"]],
  ["bz", "纯苯", "BZ", "DCE", 30, "30 吨/手", "元/吨", 1, 10, ["纯苯"]],
  ["eb", "苯乙烯", "EB", "DCE", 5, "5 吨/手", "元/吨", 1, 10, ["苯乙烯"]],
  ["pg", "液化石油气", "PG", "DCE", 20, "20 吨/手", "元/吨", 1, 10, ["LPG", "液化气"]],
  ["eg", "乙二醇", "EG", "DCE", 10, "10 吨/手", "元/吨", 1, 10, ["乙二醇"]],
  ["lh", "生猪", "LH", "DCE", 16, "16 吨/手", "元/吨", 5, 11, ["生猪"]],
  ["lg", "原木", "LG", "DCE", 90, "90 立方米/手", "元/立方米", 0.5, 9, ["原木"]],

  // 郑州商品交易所
  ["ri", "早籼稻", "RI", "CZCE", 20, "20 吨/手", "元/吨", 1, 50, ["早稻"]],
  ["lr", "晚籼稻", "LR", "CZCE", 20, "20 吨/手", "元/吨", 1, 50, ["晚稻"]],
  ["jr", "粳稻", "JR", "CZCE", 20, "20 吨/手", "元/吨", 1, 50, ["粳稻"]],
  ["wh", "强麦", "WH", "CZCE", 20, "20 吨/手", "元/吨", 1, 50, ["强筋小麦", "小麦"]],
  ["pm", "普麦", "PM", "CZCE", 50, "50 吨/手", "元/吨", 1, 50, ["普通小麦"]],
  ["cf", "棉花", "CF", "CZCE", 5, "5 吨/手", "元/吨", 5, 10, ["郑棉", "棉"]],
  ["cy", "棉纱", "CY", "CZCE", 5, "5 吨/手", "元/吨", 5, 8, ["棉纱"]],
  ["sr", "白糖", "SR", "CZCE", 10, "10 吨/手", "元/吨", 1, 9, ["糖", "郑糖"]],
  ["rs", "油菜籽", "RS", "CZCE", 10, "10 吨/手", "元/吨", 1, 11, ["菜籽"]],
  ["rm", "菜籽粕", "RM", "CZCE", 10, "10 吨/手", "元/吨", 1, 10, ["菜粕"]],
  ["oi", "菜籽油", "OI", "CZCE", 10, "10 吨/手", "元/吨", 1, 10, ["菜油"]],
  ["ta", "PTA", "TA", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["精对苯二甲酸"]],
  ["sh", "烧碱", "SH", "CZCE", 30, "30 吨/手", "元/吨", 1, 11, ["烧碱"]],
  ["px", "对二甲苯", "PX", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["PX"]],
  ["pr", "瓶片", "PR", "CZCE", 15, "15 吨/手", "元/吨", 2, 10, ["PET瓶片", "瓶级PET"]],
  ["fg", "玻璃", "FG", "CZCE", 20, "20 吨/手", "元/吨", 1, 12, ["浮法玻璃"]],
  ["sa", "纯碱", "SA", "CZCE", 20, "20 吨/手", "元/吨", 1, 11, ["纯碱"]],
  ["sf", "硅铁", "SF", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["硅铁"]],
  ["sm", "锰硅", "SM", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["锰硅"]],
  ["ma", "甲醇", "MA", "CZCE", 10, "10 吨/手", "元/吨", 1, 10, ["甲醇"]],
  ["pl", "丙烯", "PL", "CZCE", 20, "20 吨/手", "元/吨", 1, 10, ["丙烯"]],
  ["ap", "苹果", "AP", "CZCE", 10, "10 吨/手", "元/吨", 1, 12, ["苹果"]],
  ["ur", "尿素", "UR", "CZCE", 20, "20 吨/手", "元/吨", 1, 11, ["尿素"]],
  ["pf", "短纤", "PF", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["涤纶短纤"]],
  ["cj", "红枣", "CJ", "CZCE", 5, "5 吨/手", "元/吨", 5, 11, ["红枣"]],
  ["pk", "花生", "PK", "CZCE", 5, "5 吨/手", "元/吨", 2, 10, ["花生"]],
  ["zc", "动力煤", "ZC", "CZCE", 100, "100 吨/手", "元/吨", 0.2, 53, ["郑煤", "电煤"]],

  // 中国金融期货交易所
  ["if", "沪深300", "IF", "CFFEX", 300, "300 元/点", "点", 0.2, 15, ["沪深300指数", "沪深"]],
  ["ih", "上证50", "IH", "CFFEX", 300, "300 元/点", "点", 0.2, 15, ["上证50指数"]],
  ["ic", "中证500", "IC", "CFFEX", 200, "200 元/点", "点", 0.2, 15, ["中证500指数"]],
  ["im", "中证1000", "IM", "CFFEX", 200, "200 元/点", "点", 0.2, 15, ["中证1000指数"]],
  [
    "ts",
    "2年期国债",
    "TS",
    "CFFEX",
    20000,
    "200 万元面值/手",
    "元/百元面值",
    0.005,
    3,
    ["2年国债", "两年国债", "两年债"],
    "价格按每百元面值报价，1 手 = 200 万元面值",
  ],
  [
    "tf",
    "5年期国债",
    "TF",
    "CFFEX",
    10000,
    "100 万元面值/手",
    "元/百元面值",
    0.005,
    5,
    ["5年国债", "五年国债", "五年债"],
    "价格按每百元面值报价，1 手 = 100 万元面值",
  ],
  [
    "t",
    "10年期国债",
    "T",
    "CFFEX",
    10000,
    "100 万元面值/手",
    "元/百元面值",
    0.005,
    15,
    ["10年国债", "十年国债", "十年债"],
    "价格按每百元面值报价，1 手 = 100 万元面值",
  ],
  [
    "tl",
    "30年期国债",
    "TL",
    "CFFEX",
    10000,
    "100 万元面值/手",
    "元/百元面值",
    0.01,
    26,
    ["30年国债", "三十年国债", "三十年债"],
    "价格按每百元面值报价，1 手 = 100 万元面值",
  ],

  // 广州期货交易所
  ["si", "工业硅", "SI", "GFEX", 5, "5 吨/手", "元/吨", 5, 14, ["工业硅"]],
  ["lc", "碳酸锂", "LC", "GFEX", 1, "1 吨/手", "元/吨", 20, 20, ["碳酸锂"]],
  ["ps", "多晶硅", "PS", "GFEX", 3, "3 吨/手", "元/吨", 5, 17, ["多晶硅"]],
  ["pt", "铂", "PT", "GFEX", 1000, "1000 克/手", "元/克", 0.02, 21, ["铂金", "白金"]],
  ["pd", "钯", "PD", "GFEX", 1000, "1000 克/手", "元/克", 0.02, 21, ["钯金", "钯"]],
];

function decimalsFromTick(tick) {
  const text = String(tick);
  if (!text.includes(".")) return 0;
  return text.split(".")[1].length;
}

export const INSTRUMENTS = ROWS.map((row) => {
  const [id, name, code, exchange, multiplier, unit, quoteUnit, tick, marginPct, aliases, note] = row;
  return Object.freeze({
    id,
    name,
    code,
    exchange,
    multiplier,
    unit,
    quoteUnit,
    tick,
    decimals: decimalsFromTick(tick),
    marginPct,
    marginRate: marginPct / 100,
    aliases: aliases ?? [],
    note: note ?? "",
    searchTerms: [name, code, ...(aliases ?? [])],
  });
});

export const INSTRUMENT_BY_ID = new Map(INSTRUMENTS.map((item) => [item.id, item]));

export function getInstrument(id) {
  return INSTRUMENT_BY_ID.get(String(id).toLowerCase()) ?? null;
}

/** 东方财富期货主连代码：上期/大商/能源/广期为小写+m，郑商/中金为大写+M。 */
export function quoteSymbol(instrument) {
  if (!instrument) return "";
  if (instrument.exchange === "CZCE" || instrument.exchange === "CFFEX") {
    return `${instrument.code.toUpperCase()}M`;
  }
  return `${instrument.code.toLowerCase()}m`;
}

export function quoteSecId(instrument) {
  const exchange = EXCHANGES[instrument.exchange];
  return `${exchange.market}.${quoteSymbol(instrument)}`;
}

const DROP_WORDS = /(主连|连续|主力|指数|期货|合约|当月|次月|下月|季月)/g;
const EDGE_PUNCTUATION = /[\s\-_/\\·.，,、:：;；（）()【】[\]{}<>《》]/g;

export function normalizeQuery(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(EDGE_PUNCTUATION, "")
    .replace(DROP_WORDS, "");
}

function exactTerms(instrument) {
  return [instrument.name, instrument.code, ...instrument.aliases].map(normalizeQuery);
}

/**
 * 模糊匹配品种。支持：
 * 豆粕、豆粕2701、M、M2701、m2701、豆粕主连、菜粕、RM605、螺纹、RB2605
 */
export function searchInstruments(query, limit = 8) {
  const q = normalizeQuery(query);
  if (!q) return INSTRUMENTS.slice(0, limit);

  const scored = [];
  for (const instrument of INSTRUMENTS) {
    const terms = exactTerms(instrument);
    let best = 0;
    for (const term of terms) {
      if (!term) continue;
      if (q === term) {
        best = Math.max(best, 1000);
      } else if (q.startsWith(term) && /^\d{3,4}$/.test(q.slice(term.length))) {
        best = Math.max(best, 940);
      } else if (term.startsWith(q) && q.length >= 2) {
        best = Math.max(best, 820 - (term.length - q.length));
      } else if (q.startsWith(term) && term.length >= 2) {
        best = Math.max(best, 760 - (q.length - term.length));
      } else if (q.includes(term) && term.length >= 2) {
        best = Math.max(best, 640 - (q.length - term.length));
      } else if (term.includes(q) && q.length >= 2) {
        best = Math.max(best, 520 - (term.length - q.length));
      }
    }
    if (best > 0) scored.push({ instrument, score: best });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const exchangeDiff =
      EXCHANGE_ORDER.indexOf(a.instrument.exchange) - EXCHANGE_ORDER.indexOf(b.instrument.exchange);
    if (exchangeDiff !== 0) return exchangeDiff;
    return a.instrument.name.length - b.instrument.name.length;
  });

  return scored.slice(0, limit).map((entry) => entry.instrument);
}

export function bestMatch(query) {
  if (!normalizeQuery(query)) return null;
  return searchInstruments(query, 1)[0] ?? null;
}
