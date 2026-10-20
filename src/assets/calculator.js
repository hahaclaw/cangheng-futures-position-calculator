/**
 * 仓位计算核心。保持为纯函数，便于 Node 测试，也可在浏览器中直接复用。
 *
 * 计算顺序与参考图一致：
 * 1. 风险预算 = 账户余额 × 单笔风险比例
 * 2. 每手风险 = |入场价 − 止损价| × 合约乘数
 * 3. 风险手数 = ⌊风险预算 ÷ 每手风险⌋
 * 4. 再叠加保证金约束：保证金手数 = ⌊余额 ÷ 一手保证金⌋
 * 5. 建议手数 = min(风险手数, 保证金手数)
 */

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return Number.NaN;
  return Number(String(value).replaceAll(",", "").trim());
}

function positive(value) {
  return Number.isFinite(value) && value > 0;
}

/** 先抹掉浮点误差再向下取整，避免 2000 / 1999.9999999 被算成 0 手。 */
function floorRatio(numerator, denominator) {
  if (!(denominator > 0)) return 0;
  const ratio = Number((numerator / denominator).toFixed(10));
  return Math.max(0, Math.floor(ratio));
}

export function calculatePosition({
  balance,
  riskPct,
  entry,
  stop,
  multiplier,
  marginRate,
  direction = "long",
}) {
  const accountBalance = toNumber(balance);
  const riskPercent = toNumber(riskPct);
  const entryPrice = toNumber(entry);
  const stopPrice = toNumber(stop);
  const contractMultiplier = toNumber(multiplier);
  const margin = toNumber(marginRate);

  const errors = [];
  const warnings = [];

  if (!positive(accountBalance)) errors.push("请输入大于 0 的账户余额");
  if (!positive(riskPercent) || riskPercent > 100) errors.push("单笔风险应在 0–100% 之间");
  if (!positive(entryPrice)) errors.push("请输入大于 0 的入场价格");
  if (!positive(stopPrice)) errors.push("请输入大于 0 的止损价格");
  if (!positive(contractMultiplier)) errors.push("合约乘数无效");
  if (!Number.isFinite(margin) || margin <= 0 || margin >= 1) {
    errors.push("保证金率应在 0–100% 之间");
  }

  const isLong = direction !== "short";
  let directionOk = true;
  if (positive(entryPrice) && positive(stopPrice)) {
    if (isLong && stopPrice >= entryPrice) {
      directionOk = false;
      errors.push("做多时，止损价应低于入场价");
    }
    if (!isLong && stopPrice <= entryPrice) {
      directionOk = false;
      errors.push("做空时，止损价应高于入场价");
    }
  }

  const stopDistance =
    Number.isFinite(entryPrice) && Number.isFinite(stopPrice)
      ? Math.abs(entryPrice - stopPrice)
      : 0;
  if (directionOk && stopDistance === 0 && positive(entryPrice) && positive(stopPrice)) {
    errors.push("止损价不能等于入场价");
  }

  const riskBudget = positive(accountBalance) && positive(riskPercent)
    ? (accountBalance * riskPercent) / 100
    : 0;
  const riskPerLot = stopDistance * (positive(contractMultiplier) ? contractMultiplier : 0);
  const contractValue = positive(entryPrice) && positive(contractMultiplier)
    ? entryPrice * contractMultiplier
    : 0;
  const marginPerLot =
    contractValue > 0 && Number.isFinite(margin) && margin > 0 ? contractValue * margin : 0;

  const riskLots = floorRatio(riskBudget, riskPerLot);
  const marginLots = floorRatio(accountBalance, marginPerLot);
  const isValid = errors.length === 0;
  const rawLots = Math.max(0, Math.min(riskLots, marginLots));
  const lots = isValid ? rawLots : 0;
  const usedMargin = marginPerLot * lots;
  const actualRisk = riskPerLot * lots;
  const remaining = positive(accountBalance) ? accountBalance - usedMargin : 0;
  const requiredRiskPctForOneLot =
    positive(accountBalance) && riskPerLot > 0 ? (riskPerLot / accountBalance) * 100 : 0;

  let limitingFactor = "none";
  if (riskLots < marginLots) limitingFactor = "risk";
  else if (marginLots < riskLots) limitingFactor = "margin";
  else if (riskLots > 0) limitingFactor = "both";

  if (isValid && riskLots === 0 && marginLots > 0) {
    warnings.push(
      requiredRiskPctForOneLot > 0
        ? `风险预算不足以覆盖 1 手；按当前余额，需把单笔风险提高到约 ${requiredRiskPctForOneLot.toFixed(2)}%。`
        : "风险预算不足以覆盖 1 手。",
    );
  }
  if (isValid && marginLots === 0 && marginPerLot > 0) {
    warnings.push("账户余额不足以覆盖 1 手保证金。");
  }
  if (isValid && marginLots > 0 && riskLots > 0 && marginLots < riskLots) {
    warnings.push("当前由保证金上限约束手数，实际风险占用会低于风险预算。");
  }

  return {
    isValid,
    errors,
    warnings,
    direction: isLong ? "long" : "short",
    directionOk,
    balance: accountBalance,
    riskPct: riskPercent,
    entry: entryPrice,
    stop: stopPrice,
    multiplier: contractMultiplier,
    marginRate: margin,
    stopDistance,
    riskBudget,
    riskPerLot,
    contractValue,
    marginPerLot,
    riskLots,
    marginLots,
    lots,
    usedMargin,
    actualRisk,
    remaining,
    actualRiskPct: positive(accountBalance) ? (actualRisk / accountBalance) * 100 : 0,
    marginUsagePct: positive(accountBalance) ? (usedMargin / accountBalance) * 100 : 0,
    riskUtilizationPct: riskBudget > 0 ? (actualRisk / riskBudget) * 100 : 0,
    requiredRiskPctForOneLot,
    limitingFactor,
  };
}
