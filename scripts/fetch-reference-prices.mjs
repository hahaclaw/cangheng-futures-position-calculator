import { writeFile } from "node:fs/promises";
import { INSTRUMENTS, EXCHANGES, quoteSymbol } from "../src/assets/instruments.js";

const MARKET_IDS = ["113", "114", "115", "220", "142", "225"];
const rows = [];

for (const market of MARKET_IDS) {
  let page = 1;
  let total = Infinity;
  let fetched = 0;

  while ((page - 1) * 100 < total) {
    const url = new URL("https://push2.eastmoney.com/api/qt/clist/get");
    Object.entries({
      pn: String(page),
      pz: "100",
      po: "1",
      np: "1",
      fltt: "2",
      invt: "2",
      fid: "f3",
      fs: `m:${market}`,
      fields: "f12,f13,f14,f2,f3",
    }).forEach(([key, value]) => url.searchParams.set(key, value));

    let payload = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: { "user-agent": "Mozilla/5.0 cangheng-price-refresh" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        payload = await response.json();
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
      }
    }

    total = Number(payload?.data?.total) || 0;
    const list = payload?.data?.diff || [];
    rows.push(...list);
    fetched += list.length;
    if (!list.length) break;
    page += 1;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`market ${market}: ${fetched}/${total} quotes`);
}

const bySymbol = new Map(rows.map((row) => [String(row.f12).toUpperCase(), row]));
const prices = {};
const missing = [];

for (const instrument of INSTRUMENTS) {
  const symbol = quoteSymbol(instrument).toUpperCase();
  const row = bySymbol.get(symbol);
  const price = Number(row?.f2);
  if (Number.isFinite(price) && price > 0) {
    prices[instrument.id] = {
      price,
      quoteName: row.f14,
      quoteCode: row.f12,
      exchange: instrument.exchange,
    };
  } else {
    missing.push(`${instrument.name} ${instrument.code} (${symbol})`);
  }
}

const now = new Date();
const asOf = now.toISOString();
const body = `/**
 * 主力合约参考价，用于实时行情不可用时立即展示“一手保证金”。
 * 由 scripts/fetch-reference-prices.mjs 自动生成，请勿手工修改。
 * 数据源：东方财富主力连续行情；每手参数仍来自 instruments.js。
 */
export const REFERENCE_PRICE_AS_OF = ${JSON.stringify(asOf)};

export const REFERENCE_PRICES = ${JSON.stringify(prices, null, 2)};
`;

await writeFile(new URL("../src/assets/reference-prices.js", import.meta.url), body, "utf8");

console.log(`saved ${Object.keys(prices).length}/${INSTRUMENTS.length} reference prices`);
if (missing.length) console.log("missing:", missing.join(", "));
console.log(`asOf: ${asOf}`);
