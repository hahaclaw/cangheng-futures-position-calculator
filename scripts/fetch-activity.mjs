import { writeFile } from "node:fs/promises";
import { INSTRUMENTS } from "../src/assets/instruments.js";
import { REFERENCE_PRICES } from "../src/assets/reference-prices.js";

const SOURCE = "http://openctp.cn/fees.html";
const INACTIVE = ["fb"];

async function fetchHtml() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(SOURCE, {
        headers: { "user-agent": "Mozilla/5.0 cangheng-activity-refresh" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

const html = await fetchHtml();
const dateMatch = html.match(/期货交易手续费与保证金\s*-\s*(\d{8})/);
const asOf = dateMatch
  ? `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`
  : new Date().toISOString().slice(0, 10);

const table = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)][0]?.[0] || "";
const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((row) =>
  [...row[0].matchAll(/<t[dh][\s\S]*?<\/t[dh]>/gi)].map((cell) =>
    cell[0]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  ),
);

const best = new Map();
for (const row of rows) {
  if (row.length < 27) continue;
  const id = String(row[3] || "").toLowerCase();
  if (!id || id.endsWith("_f")) continue;
  const openInterest = Number(row[21]) || 0;
  const price = Number(row[19]) || REFERENCE_PRICES[id]?.price || 0;
  const previous = best.get(id);
  if (!previous || openInterest > previous.openInterest) {
    best.set(id, { openInterest, price });
  }
}

let covered = 0;
const entries = INSTRUMENTS.map((instrument) => {
  const snapshot = best.get(instrument.id);
  if (!snapshot) return `  ${instrument.id}: { missing: true },`;
  covered += 1;
  return `  ${instrument.id}: { openInterest: ${snapshot.openInterest}, price: ${snapshot.price} },`;
}).join("\n");

const body = `/**
 * 主力合约活动性参考快照。
 *
 * 数据来源：OpenCTP 期货交易手续费与保证金（${asOf}），
 * 取每个品种持仓量最大的合约作为主力参考，由 scripts/fetch-activity.mjs 自动生成。
 * 成交量为盘中字段，快照中可能为 0，页面优先使用实时行情；缺失时显示“—”。
 */

export const ACTIVITY_AS_OF = "${asOf}";

// 长期成交与持仓都很低的品种；即使快照缺失也按不活跃提示。
export const INACTIVE_PRODUCTS = new Set(${JSON.stringify(INACTIVE, null, 2)});

const SNAPSHOT = {
${entries}
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
`;

await writeFile(new URL("../src/assets/activity.js", import.meta.url), body, "utf8");
console.log(`saved ${covered}/${INSTRUMENTS.length} activity snapshots as of ${asOf}`);
