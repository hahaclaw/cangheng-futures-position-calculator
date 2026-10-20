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

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const dom = {
  form: $("#position-form"),
  search: $("#instrument-search"),
  combo: $("#instrument-combobox"),
  results: $("#instrument-results"),
  selectionCode: $("#selected-code"),
  selectionExchange: $("#selected-exchange"),
  selectionName: $("#selected-name"),
  selectionNote: $("#selected-note"),
  selectionUnit: $("#selected-unit"),
  selectionQuote: $("#selected-quote"),
  balance: $("#balance"),
  risk: $("#risk"),
  riskOutput: $("#risk-output"),
  margin: $("#margin-rate"),
  entry: $("#entry"),
  stop: $("#stop"),
  entryUnit: $("#entry-unit"),
  stopUnit: $("#stop-unit"),
  unitValue: $("#unit-value"),
  multiplierValue: $("#multiplier-value"),
  quoteButton: $("#fetch-quote"),
  quoteStatus: $("#quote-status"),
  loadExample: $("#load-example"),
  resultPanel: $("#result-panel"),
  resultLots: $("#result-lots"),
  resultSummary: $("#result-summary"),
  resultMarginPerLot: $("#result-margin-per-lot"),
  resultMarginNote: $("#result-margin-note"),
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
  libraryFilter: $("#library-filter"),
  exchangeFilters: $("#exchange-filters"),
  tbody: $("#instrument-tbody"),
  tableEmpty: $("#table-empty"),
  libraryCount: $("#library-count"),
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
  libraryExchange: "all",
  libraryQuery: "",
  toastTimer: null,
  quoteRequestId: 0,
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
  dom.selectionNote.textContent =
    instrument.note ||
    `1 手 = ${instrument.unit.replace(" /手", "").replace("/手", "")}`;
  dom.selectionUnit.textContent = instrument.unit;
  dom.selectionQuote.textContent = `报价 ${instrument.quoteUnit}`;
  dom.entryUnit.textContent = instrument.quoteUnit;
  dom.stopUnit.textContent = instrument.quoteUnit;
  dom.unitValue.textContent = instrument.unit;
  dom.multiplierValue.textContent = number(instrument.multiplier);
  dom.search.placeholder = `已选 ${instrument.name} ${instrument.code} · 输入名称可更换`;
}

function setQuoteStatus(text, kind = "") {
  dom.quoteStatus.textContent = text;
  dom.quoteStatus.classList.toggle("is-live", kind === "live");
  dom.quoteStatus.classList.toggle("is-error", kind === "error");
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
  const matches = query.trim() ? searchInstruments(query, 8) : INSTRUMENTS.slice(0, 8);
  dom.results.replaceChildren();
  state.comboItems = [];
  state.activeComboIndex = -1;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "combo-empty";
    empty.textContent = "没有找到这个品种，试试名称、代码或去掉合约月份。";
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
          <small>${EXCHANGES[instrument.exchange].short} · ${instrument.quoteUnit}</small>
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
  dom.quoteButton.querySelector("span:last-child").textContent = "取主连价";
}

function selectInstrument(instrument, { resetPrices = true } = {}) {
  const changed = state.instrument?.id !== instrument.id;
  state.instrument = instrument;
  state.quote = null;
  state.priceMode = "empty";

  updateSelectionUI(instrument);

  if (changed) {
    cancelPendingQuote();
    dom.margin.value = String(instrument.marginPct);
    if (resetPrices) {
      dom.entry.value = "";
      dom.stop.value = "";
      setQuoteStatus("点击“取主连价”或手动输入");
    }
  } else if (!dom.entry.value) {
    setQuoteStatus("点击“取主连价”或手动输入");
  }

  dom.search.value = "";
  closeCombo();
  update();

  if (changed && resetPrices) {
    window.setTimeout(() => {
      if (state.instrument.id === instrument.id && !dom.entry.value && state.priceMode !== "manual") {
        getQuote({ auto: true, silent: true });
      }
    }, 260);
  }
}

function readForm() {
  const marginPct = Number(dom.margin.value);
  return calculatePosition({
    balance: dom.balance.value,
    riskPct: dom.risk.value,
    entry: dom.entry.value,
    stop: dom.stop.value,
    multiplier: state.instrument.multiplier,
    marginRate: Number.isFinite(marginPct) ? marginPct / 100 : Number.NaN,
    direction: state.direction,
  });
}

function renderResult(data) {
  const instrument = state.instrument;
  const awaitingPrice = !dom.entry.value || !dom.stop.value;
  const invalid = !data.isValid && !awaitingPrice;
  dom.resultPanel.classList.toggle("is-error", invalid);
  dom.resultPanel.dataset.state = invalid
    ? "invalid"
    : awaitingPrice
      ? "waiting"
      : data.lots > 0
        ? "ready"
        : "empty";

  dom.resultLots.textContent = data.isValid ? String(data.lots) : "—";

  if (awaitingPrice) {
    dom.resultSummary.textContent =
      !dom.entry.value && !dom.stop.value
        ? "输入入场价与止损价，马上算出这单能开几手。"
        : !dom.entry.value
          ? "再输入入场价，就能算出这单能开几手。"
          : "再输入止损价，就能算出这单能开几手。";
  } else if (invalid) {
    dom.resultSummary.textContent = data.errors[0] || "请补全计算参数。";
  } else if (data.lots === 0) {
    dom.resultSummary.textContent =
      data.warnings[0] || "按当前风险预算，不足 1 手。";
  } else if (data.marginShortfall) {
    dom.resultSummary.textContent = `按风险公式可开 ${data.lots} 手；但保证金仅够 ${data.marginLots} 手。`;
  } else {
    dom.resultSummary.textContent = `按 ${number(data.riskPct, 1)}% 风险公式，${instrument.name}可开 ${data.lots} 手。`;
  }

  dom.resultMarginPerLot.textContent = data.marginPerLot > 0 ? money(data.marginPerLot) : "—";
  dom.resultMarginNote.textContent =
    data.contractValue > 0
      ? `合约价值 ${money(data.contractValue)} × ${number(data.marginRate * 100, 2)}% 保证金率`
      : "输入价格后自动计算";

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
    : awaitingPrice
      ? "待输入价格"
      : "待修正参数";

  const usage = data.isValid ? Math.max(0, data.marginUsagePct) : 0;
  const barWidth = Math.min(100, usage);
  dom.exposureValue.textContent = percent(usage);
  dom.exposureValue.classList.toggle("is-over", usage > 100);
  dom.exposureBar.style.width = `${barWidth}%`;
  dom.exposureBar.classList.toggle("is-high", usage >= 50);

  dom.formulaRisk.textContent = `${number(data.balance)} × ${number(data.riskPct, 1)}% = ${money(data.riskBudget)}`;
  const highPrice = Math.max(data.entry, data.stop);
  const lowPrice = Math.min(data.entry, data.stop);
  dom.formulaRiskLot.textContent =
    data.riskPerLot > 0
      ? `(${priceText(highPrice)} − ${priceText(lowPrice)}) × ${number(data.multiplier)} = ${money(data.riskPerLot)}`
      : "输入有效的入场价与止损价";
  dom.formulaFinal.textContent = data.isValid
    ? `${money(data.riskBudget)} ÷ ${money(data.riskPerLot)} = ${data.lots} 手`
    : awaitingPrice
      ? "输入价格后计算"
      : "—";

  const messages = invalid ? data.errors : data.warnings;
  dom.warning.hidden = messages.length === 0;
  dom.warning.classList.toggle("is-error", invalid);
  dom.warning.textContent = messages.join("；");
}

function update() {
  dom.riskOutput.textContent = percent(Number(dom.risk.value), 1);
  renderResult(readForm());
}

function loadExample() {
  cancelPendingQuote();
  state.instrument = getInstrument("m");
  state.direction = "long";
  state.quote = null;
  state.priceMode = "sample";
  dom.balance.value = "50000";
  dom.risk.value = "2";
  dom.margin.value = "10";
  dom.entry.value = "3250";
  dom.stop.value = "3230";
  dom.search.value = "";
  $("#direction-long").checked = true;
  updateSelectionUI(state.instrument);
  setQuoteStatus("示例价格，可手动修改");
  update();
  toast("已载入参考图示例");
}

async function getQuote({ auto = false, silent = false } = {}) {
  const instrument = state.instrument;
  const requestId = ++state.quoteRequestId;
  state.priceMode = "fetching";
  dom.quoteButton.disabled = true;
  dom.quoteButton.classList.add("is-loading");
  dom.quoteButton.querySelector("span:last-child").textContent = "取价中";
  setQuoteStatus(`正在读取 ${instrument.name} 主连行情…${auto ? "（自动）" : ""}`);

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
    setQuoteStatus(`取价失败：${error.message}。请手动输入`, "error");
    if (!silent) toast("主连行情暂时不可用，请手动输入价格");
  } finally {
    if (requestId === state.quoteRequestId) {
      dom.quoteButton.disabled = false;
      dom.quoteButton.classList.remove("is-loading");
      dom.quoteButton.querySelector("span:last-child").textContent = "取主连价";
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
  const text = [
    "仓衡 · 期货仓位计算",
    `标的：${instrument.name} ${instrument.code}（${EXCHANGES[instrument.exchange].short}）`,
    `方向：${directionLabel()}`,
    `账户余额：${money(data.balance)}`,
    `单笔风险：${number(data.riskPct, 1)}%（${money(data.riskBudget)}）`,
    `入场 / 止损：${priceText(data.entry)} / ${priceText(data.stop)} ${instrument.quoteUnit}`,
    `交易单位：${instrument.unit}；合约乘数：${number(data.multiplier)}`,
    `合约价值 / 手：${money(data.contractValue)}`,
    `保证金率：${number(data.marginRate * 100, 2)}%；一手保证金：${money(data.marginPerLot)}`,
    `每手风险：${money(data.riskPerLot)}；按图公式手数：${data.riskLots}；保证金可覆盖：${data.marginLots} 手`,
    data.marginShortfall
      ? `公式结果：${data.lots} 手；但保证金不足，实际应降至 ${data.marginLots} 手或增加保证金。`
      : `公式结果：${data.lots} 手；占用保证金：${money(data.usedMargin)}；剩余可用：${money(data.remaining)}`,
    "",
    `参数基准：${DATA_AS_OF}，保证金请以期货公司实际标准为准。`,
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
      <td><span class="instrument-name">${instrument.name}</span></td>
      <td><span class="instrument-code">${instrument.code}</span></td>
      <td class="table-exchange">${EXCHANGES[instrument.exchange].short}</td>
      <td>${instrument.unit}</td>
      <td>${instrument.quoteUnit}</td>
      <td class="num-col">${integerFormatter.format(instrument.marginPct)}%</td>
      <td><button class="table-use" type="button" data-id="${instrument.id}">带入</button></td>
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
  dom.search.addEventListener("focus", () => {
    openCombo();
  });

  dom.search.addEventListener("click", () => {
    openCombo();
  });

  dom.search.addEventListener("input", () => {
    renderCombo(dom.search.value);
    state.activeComboIndex = -1;
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
        const match = bestMatch(dom.search.value);
        if (match) selectInstrument(match);
        else toast("没有找到这个品种，试试其他名称或代码");
      }
    } else if (event.key === "Escape") {
      closeCombo();
      dom.search.blur();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!dom.combobox.contains(event.target)) closeCombo();
  });

  dom.search.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (!dom.combobox.contains(document.activeElement)) closeCombo();
    }, 120);
  });

  dom.form.addEventListener("submit", handleSubmit);

  [dom.balance, dom.margin, dom.entry, dom.stop].forEach((input) => {
    input.addEventListener("input", () => {
      if (input === dom.entry || input === dom.stop) {
        state.priceMode = "manual";
        setQuoteStatus("手动输入价格");
      }
      update();
    });
  });

  dom.risk.addEventListener("input", update);

  $$('input[name="direction"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.direction = input.value;
      update();
    });
  });

  dom.quoteButton.addEventListener("click", getQuote);
  dom.loadExample.addEventListener("click", loadExample);
  dom.copy.addEventListener("click", copyResult);

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
  dom.year.textContent = String(new Date().getFullYear());
  bindEvents();
  renderLibrary();
  update();
  document.documentElement.dataset.appReady = "true";
}

init();
