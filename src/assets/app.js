import {
  DATA_AS_OF,
  EXCHANGES,
  INSTRUMENTS,
  bestMatch,
  getInstrument,
  searchInstruments,
} from "./instruments.js";
import { calculatePosition } from "./calculator.js";
import { fetchMainQuote } from "./quotes.js";
import { REFERENCE_PRICES, REFERENCE_PRICE_AS_OF } from "./reference-prices.js";
import { getTradingHours } from "./trading-hours.js";
import {
  FEE_DISCOUNT_LABEL,
  commissionForLot,
  feeForLot,
  getFeeRule,
} from "./fees.js";
import {
  EXCHANGE_FEE_AS_OF,
  exchangeFeeForLot,
  getExchangeFeeRule,
} from "./exchange-fees.js";
import {
  ACTIVITY_AS_OF,
  INACTIVE_PRODUCTS,
  activityLevel,
  getActivitySnapshot,
  tiedCapital,
} from "./activity.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dom = {
  form: $("#position-form"),
  search: $("#instrument-search"),
  clearSearch: $("#clear-search"),
  combo: $("#instrument-combobox"),
  searchExchange: $("#search-exchange"),
  results: $("#instrument-results"),
  selectionCode: $("#selected-code"),
  selectionExchange: $("#selected-exchange"),
  selectionName: $("#selected-name"),
  selectionNote: $("#selected-note"),
  selectionUnit: $("#selected-unit"),
  selectionQuote: $("#selected-quote"),
  activityCard: $("#activity-card"),
  activityBadge: $("#activity-badge"),
  activityVolume: $("#activity-volume"),
  activityOi: $("#activity-oi"),
  activityCapital: $("#activity-capital"),
  activityNote: $("#activity-note"),
  balance: $("#balance"),
  risk: $("#risk"),
  riskNumber: $("#risk-number"),
  clearRisk: $("#clear-risk"),
  margin: $("#margin-rate"),
  entry: $("#entry"),
  stop: $("#stop"),
  entryUnit: $("#entry-unit"),
  stopUnit: $("#stop-unit"),
  unitValue: $("#unit-value"),
  multiplierValue: $("#multiplier-value"),
  sessionHours: $("#session-hours"),
  sessionDuration: $("#session-duration"),
  sessionDay: $("#session-day"),
  sessionNight: $("#session-night"),
  sessionRisk: $("#session-risk"),
  sessionRiskFormula: $("#session-risk-formula"),
  applySessionRisk: $("#apply-session-risk"),
  quoteButton: $("#fetch-quote"),
  quoteStatus: $("#quote-status"),
  resultPanel: $("#result-panel"),
  resultLots: $("#result-lots"),
  resultUnit: $("#result-unit"),
  resultSummary: $("#result-summary"),
  resultTotalCost: $("#result-total-cost"),
  resultCostNote: $("#result-cost-note"),
  resultContractValue: $("#result-contract-value"),
  resultMarginPerLot: $("#result-margin-per-lot"),
  resultFeePerLot: $("#result-fee-per-lot"),
  resultFeeClose: $("#result-fee-close"),
  resultFeeCloseToday: $("#result-fee-close-today"),
  exchangeFeeOpen: $("#exchange-fee-open"),
  exchangeFeeClose: $("#exchange-fee-close"),
  exchangeFeeToday: $("#exchange-fee-today"),
  feeSource: $("#fee-source"),
  metricRiskBudget: $("#metric-risk-budget"),
  metricRiskPerLot: $("#metric-risk-per-lot"),
  metricContractValue: $("#metric-contract-value"),
  metricUsedMargin: $("#metric-used-margin"),
  exposureValue: $("#exposure-value"),
  exposureBar: $("#exposure-bar"),
  metricRemaining: $("#metric-remaining"),
  metricLimiter: $("#metric-limiter"),
  formulaRisk: $("#formula-risk"),
  formulaRiskLot: $("#formula-risk-lot"),
  formulaFinal: $("#formula-final"),
  warning: $("#result-warning"),
  metricMarginLots: $("#metric-margin-lots"),
  metricRiskLots: $("#metric-risk-lots"),
  copy: $("#copy-result"),
  mobileResultLots: $("#mobile-result-lots"),
  mobileResultMargin: $("#mobile-result-margin"),
  mobileResultView: $("#mobile-result-view"),
  libraryFilter: $("#library-filter"),
  exchangeFilters: $("#exchange-filters"),
  tbody: $("#instrument-tbody"),
  tableEmpty: $("#table-empty"),
  libraryCount: $("#library-count"),
  instrumentCount: $("#instrument-count"),
  toast: $("#toast"),
  year: $("#year"),
};

const state = {
  instrument: getInstrument("m"),
  direction: "long",
  priceMode: "sample",
  quote: null,
  comboItems: [],
  activeComboIndex: -1,
  searchExchange: "all",
  libraryExchange: "all",
  libraryQuery: "",
  toastTimer: null,
  quoteRequestId: 0,
  suggestedRiskPct: 0,
};

const integerFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 0,
});

function money(value) {
  if (!Number.isFinite(value)) return "—";
  const absolute = Math.abs(value);
  const hasCents = Math.abs(absolute - Math.round(absolute)) > 0.005;
  const formatted = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absolute);
  return `${value < 0 ? "-" : ""}¥${formatted}`;
}

function number(value, decimals = 0) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function priceText(value) {
  if (!Number.isFinite(value)) return "—";
  return number(value, state.instrument?.decimals ?? 2);
}

function inputPrice(value) {
  const decimals = state.instrument?.decimals ?? 2;
  return Number(value)
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function percent(value, decimals = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}%`;
}

function referenceTimeLabel() {
  const date = new Date(REFERENCE_PRICE_AS_OF);
  if (Number.isNaN(date.getTime())) return "最近更新";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function referenceFor(instrument) {
  return REFERENCE_PRICES[instrument.id] || null;
}

function formatHours(hours) {
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return minutes > 0 ? `${whole}小时${minutes}分` : `${whole}小时`;
}

function updateSessionUI(instrument) {
  const session = getTradingHours(instrument);
  state.suggestedRiskPct = session.suggestedRiskPct;
  dom.sessionHours.textContent = number(session.totalHours, 2);
  dom.sessionDuration.textContent = formatHours(session.totalHours);
  dom.sessionDay.textContent = session.dayLabel;
  dom.sessionNight.textContent = session.nightLabel;
  dom.sessionRisk.textContent = percent(session.suggestedRiskPct, 2);
  dom.sessionRiskFormula.textContent = `2% ÷ ${number(session.totalHours, 2)} 小时 = ${percent(
    session.suggestedRiskPct,
    2,
  )}`;
}

function refreshClearButtons() {
  $$(".input-shell").forEach((shell) => {
    const input = shell.querySelector("input");
    const button = shell.querySelector(".input-clear");
    if (input && button) button.hidden = !input.value;
  });
  if (dom.clearSearch) dom.clearSearch.hidden = false;
  if (dom.clearRisk) dom.clearRisk.hidden = !dom.riskNumber.value;
}

function initClearButtons() {
  $$(".input-shell").forEach((shell) => {
    const input = shell.querySelector("input");
    if (!input || shell.querySelector(".input-clear")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "input-clear";
    button.textContent = "×";
    button.title = "清空";
    button.setAttribute("aria-label", "清空输入");
    button.hidden = !input.value;
    button.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
      refreshClearButtons();
    });
    const suffix = shell.querySelector(".input-suffix");
    shell.insertBefore(button, suffix || null);
  });

  dom.clearSearch.addEventListener("click", () => {
    dom.search.value = "";
    dom.clearSearch.hidden = false;
    openCombo();
    dom.search.focus();
  });

  dom.clearRisk.addEventListener("click", () => {
    dom.riskNumber.value = "";
    dom.clearRisk.hidden = true;
    update();
    dom.riskNumber.focus();
  });

  refreshClearButtons();
}

function toast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => {
    dom.toast.classList.remove("is-visible");
  }, 2400);
}

function directionLabel() {
  return state.direction === "long" ? "做多" : "做空";
}

function updateSelectionUI(instrument) {
  const exchange = EXCHANGES[instrument.exchange];
  dom.selectionCode.textContent = instrument.code;
  dom.selectionExchange.textContent = exchange.short;
  dom.selectionName.textContent = instrument.name;
  dom.selectionNote.textContent = `主力合约 · ${
    instrument.note ||
    `1 手 = ${instrument.unit.replace(" /手", "").replace("/手", "")}`
  }`;
  dom.selectionUnit.textContent = instrument.unit;
  dom.selectionQuote.textContent = `报价 ${instrument.quoteUnit}`;
  dom.entryUnit.textContent = instrument.quoteUnit;
  dom.stopUnit.textContent = instrument.quoteUnit;
  dom.unitValue.textContent = instrument.unit;
  dom.multiplierValue.textContent = number(instrument.multiplier);
  dom.search.placeholder = `已选 ${instrument.name} ${instrument.code} 主力 · 输入名称可更换`;
  updateSessionUI(instrument);
}

function setQuoteStatus(text, kind = "") {
  dom.quoteStatus.textContent = text;
  dom.quoteStatus.classList.toggle("is-live", kind === "live");
  dom.quoteStatus.classList.toggle("is-error", kind === "error");
  dom.quoteStatus.classList.toggle("is-reference", kind === "reference");
}

function closeCombo() {
  dom.results.hidden = true;
  dom.search.setAttribute("aria-expanded", "false");
  dom.search.setAttribute("aria-activedescendant", "");
  state.activeComboIndex = -1;
  state.comboItems = [];
}

function setActiveCombo(index) {
  if (!state.comboItems.length) return;
  const next = Math.max(0, Math.min(index, state.comboItems.length - 1));
  state.comboItems.forEach((item, itemIndex) => {
    const active = itemIndex === next;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", active ? "true" : "false");
    if (active) {
      dom.search.setAttribute("aria-activedescendant", item.id);
      item.scrollIntoView({ block: "nearest" });
    }
  });
  state.activeComboIndex = next;
}

function renderCombo(query) {
  let matches = query.trim() ? searchInstruments(query, 200) : INSTRUMENTS;
  if (state.searchExchange !== "all") {
    matches = matches.filter((instrument) => instrument.exchange === state.searchExchange);
  }
  matches = matches.slice(0, 8);
  dom.results.replaceChildren();
  state.comboItems = [];
  state.activeComboIndex = -1;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "combo-empty";
    empty.textContent =
      state.searchExchange === "all"
        ? "没有找到这个品种，试试名称、代码或去掉合约月份。"
        : `当前${EXCHANGES[state.searchExchange].short}筛选下没有找到，试试其他交易所或清除筛选。`;
    dom.results.append(empty);
  } else {
    matches.forEach((instrument, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "combo-option";
      option.id = `combo-option-${instrument.id}`;
      option.dataset.id = instrument.id;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.innerHTML = `
        <span class="combo-code">${instrument.code}</span>
        <span class="combo-name">
          <strong>${instrument.name}</strong>
          <small>${EXCHANGES[instrument.exchange].short} · ${instrument.quoteUnit} · 主力</small>
        </span>
        <span class="combo-unit">${instrument.unit}</span>
      `;
      option.addEventListener("mousedown", (event) => event.preventDefault());
      option.addEventListener("mouseenter", () => setActiveCombo(index));
      option.addEventListener("click", () => selectInstrument(instrument));
      dom.results.append(option);
      state.comboItems.push(option);
    });
  }

  dom.results.hidden = false;
  dom.search.setAttribute("aria-expanded", "true");
}

function openCombo() {
  renderCombo(dom.search.value);
}

function cancelPendingQuote() {
  state.quoteRequestId += 1;
  dom.quoteButton.disabled = false;
  dom.quoteButton.classList.remove("is-loading");
  dom.quoteButton.querySelector("span:last-child").textContent = "取主力价";
}

function selectInstrument(instrument, { resetPrices = true } = {}) {
  const changed = state.instrument?.id !== instrument.id;
  const reference = referenceFor(instrument);
  state.instrument = instrument;
  state.quote = null;
  state.priceMode = "empty";

  updateSelectionUI(instrument);

  if (changed) {
    cancelPendingQuote();
    dom.margin.value = String(instrument.marginPct);
    if (resetPrices) {
      dom.stop.value = "";
      if (reference) {
        dom.entry.value = inputPrice(reference.price);
        state.priceMode = "reference";
        setQuoteStatus(`参考价 ${referenceTimeLabel()} · 可手动修改`, "reference");
      } else {
        dom.entry.value = "";
        setQuoteStatus("点击“取主力价”或手动输入");
      }
    }
  } else if (!dom.entry.value) {
    if (reference) {
      dom.entry.value = inputPrice(reference.price);
      state.priceMode = "reference";
      setQuoteStatus(`参考价 ${referenceTimeLabel()} · 可手动修改`, "reference");
    } else {
      setQuoteStatus("点击“取主力价”或手动输入");
    }
  }

  dom.search.value = "";
  closeCombo();
  update();

  if (changed && resetPrices) {
    window.setTimeout(() => {
      const shouldFetch =
        state.instrument.id === instrument.id &&
        state.priceMode !== "manual" &&
        (state.priceMode === "reference" || !dom.entry.value);
      if (shouldFetch) getQuote({ auto: true, silent: true });
    }, 260);
  }
}

function readForm() {
  const marginPct = Number(dom.margin.value);
  const position = calculatePosition({
    balance: dom.balance.value,
    riskPct: dom.riskNumber.value,
    entry: dom.entry.value,
    stop: dom.stop.value,
    multiplier: state.instrument.multiplier,
    marginRate: Number.isFinite(marginPct) ? marginPct / 100 : Number.NaN,
    direction: state.direction,
  });
  const feeRule = getFeeRule(state.instrument);
  const exchangeRule = getExchangeFeeRule(state.instrument);
  const feePerLot = feeForLot(feeRule, position.contractValue, "open");
  const feeClosePerLot = feeForLot(feeRule, position.contractValue, "close");
  const feeCloseTodayPerLot = feeForLot(feeRule, position.contractValue, "closeToday");
  const exchangeOpen = exchangeFeeForLot(exchangeRule, position.contractValue, "open");
  const exchangeClose = exchangeFeeForLot(exchangeRule, position.contractValue, "close");
  const exchangeToday = exchangeFeeForLot(exchangeRule, position.contractValue, "closeToday");
  const commissionOpen = feeRule.missing
    ? null
    : exchangeRule.missing
      ? feePerLot
      : commissionForLot(feePerLot, exchangeOpen);
  const commissionClose = feeRule.missing
    ? null
    : exchangeRule.missing
      ? feeClosePerLot
      : commissionForLot(feeClosePerLot, exchangeClose);
  const commissionToday = feeRule.missing
    ? null
    : exchangeRule.missing
      ? feeCloseTodayPerLot
      : commissionForLot(feeCloseTodayPerLot, exchangeToday);
  return {
    ...position,
    feeRule,
    exchangeRule,
    feePerLot,
    feeClosePerLot,
    feeCloseTodayPerLot,
    exchangeOpen,
    exchangeClose,
    exchangeToday,
    commissionOpen,
    commissionClose,
    commissionToday,
    totalCost: position.marginPerLot + exchangeOpen + (commissionOpen ?? 0),
  };
}

function renderResult(data) {
  const instrument = state.instrument;
  const awaitingPrice = !dom.entry.value || !dom.stop.value;
  const onlyPriceMissing = data.errors.every(
    (error) => error.includes("入场价格") || error.includes("止损价格"),
  );
  const waitingForPrice = awaitingPrice && onlyPriceMissing;
  const invalid = !data.isValid && !waitingForPrice;
  dom.resultPanel.classList.toggle("is-error", invalid);
  dom.resultPanel.dataset.state = invalid
    ? "invalid"
    : waitingForPrice
      ? "waiting"
      : data.lots > 0
        ? "ready"
        : "empty";

  dom.resultLots.textContent = data.isValid ? String(data.lots) : "待";
  dom.resultUnit.hidden = !data.isValid;
  dom.resultLots.classList.toggle("is-placeholder", !data.isValid);

  if (waitingForPrice) {
    dom.resultSummary.textContent =
      !dom.entry.value && !dom.stop.value
        ? "输入主力合约价格与止损价，立即显示一手保证金和可开手数。"
        : !dom.entry.value
          ? "再输入主力合约价格，就能显示一手保证金和可开手数。"
          : "再输入止损价，就能算出这单能开几手。";
  } else if (invalid) {
    dom.resultSummary.textContent = data.errors[0] || "请补全计算参数。";
  } else if (data.lots === 0) {
    dom.resultSummary.textContent =
      data.warnings[0] || "按当前风险预算，不足 1 手。";
  } else if (data.marginShortfall) {
    dom.resultSummary.textContent = `按风险公式可开 ${data.lots} 手；但${instrument.name}主力保证金仅够 ${data.marginLots} 手。`;
  } else {
    dom.resultSummary.textContent = `按 ${number(data.riskPct, 2)}% 风险公式，${instrument.name}主力可开 ${data.lots} 手。`;
  }

  const hasPrice = data.contractValue > 0;
  dom.resultTotalCost.textContent = hasPrice ? money(data.totalCost) : "待取价";
  dom.resultTotalCost.classList.toggle("is-placeholder", !hasPrice);
  dom.resultContractValue.textContent = hasPrice ? money(data.contractValue) : "—";
  dom.resultMarginPerLot.textContent = data.marginPerLot > 0 ? money(data.marginPerLot) : "—";
  const feeMissing = Boolean(data.feeRule.missing);
  const exchangeMissing = Boolean(data.exchangeRule.missing);
  const writeFee = (element, value, missing) => {
    const display = !hasPrice
      ? "待取价"
      : missing
        ? "未公布"
        : value > 0
          ? money(value)
          : "无";
    element.textContent = display;
    element.classList.toggle("is-none", hasPrice && !missing && !(value > 0));
    element.classList.toggle("is-missing", missing);
  };
  writeFee(dom.exchangeFeeOpen, data.exchangeOpen, exchangeMissing);
  writeFee(dom.exchangeFeeClose, data.exchangeClose, exchangeMissing);
  writeFee(dom.exchangeFeeToday, data.exchangeToday, exchangeMissing);
  writeFee(dom.resultFeePerLot, data.commissionOpen, feeMissing);
  writeFee(dom.resultFeeClose, data.commissionClose, feeMissing);
  writeFee(dom.resultFeeCloseToday, data.commissionToday, feeMissing);
  dom.feeSource.textContent = `交易所费用 ${EXCHANGE_FEE_AS_OF} · 海证佣金 ${FEE_DISCOUNT_LABEL}（${data.feeRule.asOf} 标准）`;
  dom.resultCostNote.textContent = hasPrice
    ? feeMissing
      ? `保证金 ${money(data.marginPerLot)} + 交易所费用 ${money(data.exchangeOpen)} + 海证佣金未公布`
      : exchangeMissing
        ? `保证金 ${money(data.marginPerLot)} + 海证佣金 ${money(data.feePerLot)}（含交易所费用）`
        : `保证金 ${money(data.marginPerLot)} + 交易所费用 ${money(data.exchangeOpen)} + 海证佣金（${FEE_DISCOUNT_LABEL}）${money(data.commissionOpen)}`
    : "输入主力合约价格后自动计算";
  dom.mobileResultLots.textContent = data.isValid
    ? `${data.lots} 手`
    : waitingForPrice
      ? "待止损"
      : "待输入";
  dom.mobileResultMargin.textContent = hasPrice ? money(data.totalCost) : "待取价";

  dom.metricRiskBudget.textContent = data.riskBudget > 0 ? money(data.riskBudget) : "—";
  dom.metricRiskPerLot.textContent = data.riskPerLot > 0 ? money(data.riskPerLot) : "—";
  dom.metricContractValue.textContent = data.contractValue > 0 ? money(data.contractValue) : "—";
  dom.metricUsedMargin.textContent = data.marginPerLot > 0 ? money(data.usedMargin) : "—";
  dom.metricRemaining.textContent = data.isValid ? money(data.remaining) : "—";
  dom.metricMarginLots.textContent = data.marginPerLot > 0 ? `${data.marginLots} 手` : "—";
  dom.metricRiskLots.textContent = data.riskPerLot > 0 ? `${data.riskLots} 手` : "—";

  dom.metricLimiter.textContent = data.isValid
    ? data.marginShortfall
      ? "保证金不足，需降手数"
      : "保证金充足"
    : waitingForPrice
      ? "待输入价格"
      : "待修正参数";

  const usage = data.isValid ? Math.max(0, data.marginUsagePct) : 0;
  const barWidth = Math.min(100, usage);
  dom.exposureValue.textContent = percent(usage);
  dom.exposureValue.classList.toggle("is-over", usage > 100);
  dom.exposureBar.style.width = `${barWidth}%`;
  dom.exposureBar.classList.toggle("is-high", usage >= 50);

  dom.formulaRisk.textContent = `${number(data.balance)} × ${number(data.riskPct, 2)}% = ${money(data.riskBudget)}`;
  const highPrice = Math.max(data.entry, data.stop);
  const lowPrice = Math.min(data.entry, data.stop);
  dom.formulaRiskLot.textContent =
    data.riskPerLot > 0
      ? `(${priceText(highPrice)} − ${priceText(lowPrice)}) × ${number(data.multiplier)} = ${money(data.riskPerLot)}`
      : "输入有效的入场价与止损价";
  dom.formulaFinal.textContent = data.isValid
    ? `${money(data.riskBudget)} ÷ ${money(data.riskPerLot)} = ${data.lots} 手`
    : waitingForPrice
      ? "输入价格后计算"
      : "—";

  const messages = invalid ? data.errors : data.warnings;
  dom.warning.hidden = messages.length === 0;
  dom.warning.classList.toggle("is-error", invalid);
  dom.warning.textContent = messages.join("；");
}

function formatLots(value) {
  if (!(value > 0)) return "—";
  return `${new Intl.NumberFormat("zh-CN").format(Math.round(value))} 手`;
}

function formatCompactMoney(value) {
  if (!(value > 0)) return "无";
  if (value >= 100_000_000) return `¥${(value / 100_000_000).toFixed(1)}亿`;
  if (value >= 10_000) return `¥${(value / 10_000).toFixed(1)}万`;
  return money(value);
}

function renderActivity() {
  const instrument = state.instrument;
  const snapshot = getActivitySnapshot(instrument);
  const liveVolume = state.quote?.volume > 0 ? state.quote.volume : null;
  const liveOpenInterest = state.quote?.openInterest > 0 ? state.quote.openInterest : null;
  const openInterest = liveOpenInterest ?? snapshot.openInterest ?? 0;
  const reference = referenceFor(instrument);
  const price = state.quote?.price ?? (snapshot.price > 0 ? snapshot.price : reference?.price ?? 0);
  const marginValue = Number(dom.margin.value);
  const marginRate = Number.isFinite(marginValue) ? marginValue / 100 : instrument.marginRate;
  const capital = tiedCapital(openInterest, price, instrument.multiplier, marginRate);
  const amount = state.quote?.amount > 0 ? state.quote.amount : null;
  const estimatedVolume =
    !liveVolume && amount && price > 0 ? amount / (price * instrument.multiplier) : null;
  const volume = liveVolume ?? estimatedVolume;
  const unknown = snapshot.missing && !(openInterest > 0) && !INACTIVE_PRODUCTS.has(instrument.id);
  const level = unknown ? "unknown" : activityLevel(instrument, { openInterest, volume, capital });

  dom.activityCard.dataset.level = level;
  dom.activityBadge.textContent =
    level === "inactive"
      ? "不活跃 · 建议不参与"
      : level === "watch"
        ? "一般 · 谨慎参与"
        : level === "active"
          ? "活跃 · 可参与"
          : "数据不足";
  dom.activityVolume.textContent = volume ? formatLots(volume) : "—";
  dom.activityOi.textContent = formatLots(openInterest);
  dom.activityCapital.textContent = formatCompactMoney(capital);
  const volumeHint = estimatedVolume ? "成交量按成交额估算。" : "";

  if (level === "inactive") {
    dom.activityNote.textContent = `交易不活跃，建议不参与。${volumeHint}活动性参考 ${ACTIVITY_AS_OF}。`;
  } else if (level === "watch") {
    dom.activityNote.textContent = `活跃度一般，注意滑点和成交速度。${volumeHint}活动性参考 ${ACTIVITY_AS_OF}。`;
  } else if (level === "active") {
    dom.activityNote.textContent = volume
      ? `成交、持仓与沉淀资金达到活跃门槛。${volumeHint}参考 ${ACTIVITY_AS_OF}。`
      : `持仓与沉淀资金达到活跃门槛；成交量暂缺，按持仓判断。参考 ${ACTIVITY_AS_OF}。`;
  } else {
    dom.activityNote.textContent = "活动性数据不足，请谨慎参与。";
  }
}

function update() {
  const riskValue = Number(dom.riskNumber.value);
  if (Number.isFinite(riskValue)) {
    dom.risk.value = String(Math.min(9.99, Math.max(0.01, riskValue)));
  }
  refreshClearButtons();
  renderResult(readForm());
  renderActivity();
}

async function getQuote({ auto = false, silent = false } = {}) {
  const instrument = state.instrument;
  const requestId = ++state.quoteRequestId;
  state.priceMode = "fetching";
  dom.quoteButton.disabled = true;
  dom.quoteButton.classList.add("is-loading");
  dom.quoteButton.querySelector("span:last-child").textContent = "取价中";
  setQuoteStatus(`正在读取 ${instrument.name} 主力行情…${auto ? "（自动）" : ""}`);

  try {
    const quote = await fetchMainQuote(instrument);
    if (requestId !== state.quoteRequestId || instrument.id !== state.instrument.id) return;
    if (state.priceMode !== "fetching") return;
    state.quote = quote;
    state.priceMode = "live";
    dom.entry.value = inputPrice(quote.price);
    setQuoteStatus(
      `${quote.source} · ${quote.name} · ${quote.fetchedAt.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      "live",
    );
    update();
  } catch (error) {
    if (requestId !== state.quoteRequestId || instrument.id !== state.instrument.id) return;
    if (state.priceMode !== "fetching") return;
    const reference = referenceFor(instrument);
    if (reference) {
      state.priceMode = "reference";
      if (!dom.entry.value) dom.entry.value = inputPrice(reference.price);
      setQuoteStatus(
        `实时更新失败，使用 ${referenceTimeLabel()} 参考价 · 可手动修改`,
        "reference",
      );
      update();
      if (!silent) toast("实时行情不可用，继续使用参考价");
    } else {
      setQuoteStatus(`取价失败：${error.message}。请手动输入`, "error");
      if (!silent) toast("主力行情暂时不可用，请手动输入价格");
    }
  } finally {
    if (requestId === state.quoteRequestId) {
      dom.quoteButton.disabled = false;
      dom.quoteButton.classList.remove("is-loading");
      dom.quoteButton.querySelector("span:last-child").textContent = "取主力价";
    }
  }
}

function copyResult() {
  const data = readForm();
  if (!data.isValid) {
    toast("参数还不完整，暂时没有可复制的计算结果");
    return;
  }

  const instrument = state.instrument;
  const session = getTradingHours(instrument);
  const exchangeText = (value) =>
    data.exchangeRule.missing ? "未公布" : value > 0 ? money(value) : "无";
  const commissionText = (value) =>
    data.feeRule.missing || value === null ? "未公布" : value > 0 ? money(value) : "无";
  const text = [
    "仓衡 · 期货仓位计算",
    `标的：${instrument.name} ${instrument.code} 主力合约（${EXCHANGES[instrument.exchange].short}）`,
    `交易时间：日盘 ${session.dayLabel}；夜盘 ${session.nightLabel}；每日 ${number(
      session.totalHours,
      2,
    )} 小时`,
    `小时级最佳单笔风险：${percent(session.suggestedRiskPct, 2)}（2% ÷ ${number(
      session.totalHours,
      2,
    )} 小时）`,
    `方向：${directionLabel()}`,
    `账户余额：${money(data.balance)}`,
    `单笔风险：${number(data.riskPct, 2)}%（${money(data.riskBudget)}）`,
    `入场 / 止损：${priceText(data.entry)} / ${priceText(data.stop)} ${instrument.quoteUnit}`,
    `交易单位：${instrument.unit}；合约乘数：${number(data.multiplier)}`,
    `一手标的价值：${money(data.contractValue)}`,
    `保证金率：${number(data.marginRate * 100, 2)}%；一手保证金：${money(data.marginPerLot)}`,
    `交易所费用——开仓：${exchangeText(data.exchangeOpen)}；平仓：${exchangeText(data.exchangeClose)}；平今：${exchangeText(data.exchangeToday)}`,
    `海证期货佣金（${FEE_DISCOUNT_LABEL}）——开仓：${commissionText(data.commissionOpen)}；平仓：${commissionText(data.commissionClose)}；平今：${commissionText(data.commissionToday)}`,
    `一手开仓费用：${money(data.totalCost)}（保证金 + 交易所开仓费用 + 海证开仓佣金 ${FEE_DISCOUNT_LABEL}；平仓另计）`,
    `每手风险：${money(data.riskPerLot)}；按图公式手数：${data.riskLots}；保证金可覆盖：${data.marginLots} 手`,
    data.marginShortfall
      ? `公式结果：${data.lots} 手；但保证金不足，实际应降至 ${data.marginLots} 手或增加保证金。`
      : `公式结果：${data.lots} 手；占用保证金：${money(data.usedMargin)}；剩余可用：${money(data.remaining)}`,
    "",
    `参数基准：${DATA_AS_OF}；交易所费用参考：${EXCHANGE_FEE_AS_OF}；海证佣金按 ${data.feeRule.asOf} 标准 ${FEE_DISCOUNT_LABEL}。实际费用以交易所和开户期货公司为准。`,
  ].join("\n");

  const finish = () => toast("计算明细已复制");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(finish).catch(() => fallbackCopy(text, finish));
  } else {
    fallbackCopy(text, finish);
  }
}

function fallbackCopy(text, done) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  try {
    document.execCommand("copy");
    done();
  } catch {
    toast("复制失败，请手动选择结果");
  } finally {
    area.remove();
  }
}

function renderLibrary() {
  let items = INSTRUMENTS;
  if (state.libraryQuery.trim()) {
    items = searchInstruments(state.libraryQuery, 200);
  }
  if (state.libraryExchange !== "all") {
    items = items.filter((instrument) => instrument.exchange === state.libraryExchange);
  }

  dom.tbody.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const instrument of items) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="cell-name"><span class="instrument-name">${instrument.name}</span></td>
      <td class="cell-code"><span class="instrument-code">${instrument.code}</span></td>
      <td class="cell-exchange table-exchange" data-label="交易所">${EXCHANGES[instrument.exchange].short}</td>
      <td class="cell-unit" data-label="交易单位">${instrument.unit}</td>
      <td class="cell-quote" data-label="报价">${instrument.quoteUnit}</td>
      <td class="cell-margin num-col" data-label="保证金">${integerFormatter.format(instrument.marginPct)}%</td>
      <td class="cell-action"><button class="table-use" type="button" data-id="${instrument.id}">带入</button></td>
    `;
    fragment.append(row);
  }
  dom.tbody.append(fragment);
  dom.tableEmpty.hidden = items.length > 0;
  dom.libraryCount.textContent = `共 ${items.length} 个品种`;
}

function handleSubmit(event) {
  event.preventDefault();
  const query = dom.search.value.trim();
  if (query) {
    const match = bestMatch(query);
    if (!match) {
      toast("没有找到这个品种，请从下拉列表中选择");
      dom.search.focus();
      return;
    }
    selectInstrument(match);
    update();
  }

  if (window.matchMedia("(max-width: 1040px)").matches) {
    dom.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    dom.resultPanel.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-4px)" },
        { transform: "translateY(0)" },
      ],
      { duration: 240, easing: "ease-out" },
    );
  }
}

function bindEvents() {
  $$(".exchange-chip", dom.searchExchange).forEach((chip) => {
    chip.setAttribute("aria-pressed", chip.classList.contains("is-active") ? "true" : "false");
  });

  dom.search.addEventListener("focus", () => {
    openCombo();
  });

  dom.search.addEventListener("click", () => {
    openCombo();
  });

  dom.search.addEventListener("input", () => {
    renderCombo(dom.search.value);
    refreshClearButtons();
    state.activeComboIndex = -1;
  });

  dom.searchExchange.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-exchange]");
    if (!button) return;
    state.searchExchange = button.dataset.exchange;
    $$(".exchange-chip", dom.searchExchange).forEach((chip) => {
      chip.classList.toggle("is-active", chip === button);
      chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
    });
    renderCombo(dom.search.value);
    dom.search.focus();
  });

  dom.search.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (dom.results.hidden) openCombo();
      setActiveCombo(state.activeComboIndex < 0 ? 0 : state.activeComboIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (dom.results.hidden) openCombo();
      setActiveCombo(state.activeComboIndex <= 0 ? state.comboItems.length - 1 : state.activeComboIndex - 1);
    } else if (event.key === "Enter") {
      if (!dom.results.hidden && state.activeComboIndex >= 0) {
        event.preventDefault();
        const item = state.comboItems[state.activeComboIndex];
        const instrument = getInstrument(item.dataset.id);
        if (instrument) selectInstrument(instrument);
      } else if (dom.search.value.trim()) {
        event.preventDefault();
        const match =
          state.searchExchange === "all"
            ? bestMatch(dom.search.value)
            : searchInstruments(dom.search.value, 200).find(
                (instrument) => instrument.exchange === state.searchExchange,
              );
        if (match) selectInstrument(match);
        else
          toast(
            state.searchExchange === "all"
              ? "没有找到这个品种，试试其他名称或代码"
              : `当前${EXCHANGES[state.searchExchange].short}筛选下没有找到这个品种`,
          );
      }
    } else if (event.key === "Escape") {
      closeCombo();
      dom.search.blur();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!dom.combo.contains(event.target)) closeCombo();
  });

  dom.search.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (!dom.combo.contains(document.activeElement)) closeCombo();
    }, 120);
  });

  dom.form.addEventListener("submit", handleSubmit);

  [dom.balance, dom.margin, dom.entry, dom.stop].forEach((input) => {
    input.addEventListener("input", () => {
      if (input === dom.entry) {
        state.priceMode = "manual";
        setQuoteStatus("手动输入价格");
      }
      update();
    });
  });

  dom.risk.addEventListener("input", () => {
    dom.riskNumber.value = Number(dom.risk.value).toFixed(2);
    update();
  });
  dom.riskNumber.addEventListener("input", update);

  $$('input[name="direction"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.direction = input.value;
      update();
    });
  });

  dom.quoteButton.addEventListener("click", getQuote);
  dom.applySessionRisk.addEventListener("click", () => {
    const value = Number(state.suggestedRiskPct);
    if (!(value > 0)) return;
    dom.riskNumber.value = value.toFixed(2);
    update();
    toast(`已套用小时级最佳单笔风险 ${value.toFixed(2)}%`);
  });
  dom.copy.addEventListener("click", copyResult);
  dom.mobileResultView.addEventListener("click", () => {
    dom.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  dom.libraryFilter.addEventListener("input", () => {
    state.libraryQuery = dom.libraryFilter.value;
    renderLibrary();
  });

  dom.exchangeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-exchange]");
    if (!button) return;
    state.libraryExchange = button.dataset.exchange;
    $$(".filter-chip", dom.exchangeFilters).forEach((chip) => {
      chip.classList.toggle("is-active", chip === button);
    });
    renderLibrary();
  });

  dom.tbody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    const instrument = getInstrument(button.dataset.id);
    if (!instrument) return;
    selectInstrument(instrument);
    document.querySelector("#calculator").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => dom.entry.focus({ preventScroll: true }), 450);
  });
}

function init() {
  if (!state.instrument) throw new Error("默认品种数据缺失");
  updateSelectionUI(state.instrument);
  dom.instrumentCount.textContent = String(INSTRUMENTS.length);
  dom.year.textContent = String(new Date().getFullYear());
  bindEvents();
  initClearButtons();
  renderLibrary();
  update();
  document.documentElement.dataset.appReady = "true";
}

init();
