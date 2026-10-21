/**
 * 仓位计算核心。保持为纯函数，便于 Node 测试，也可在浏览器中直接复用。
 *
 * 计算顺序与参考图一致：
 * 1. 风险预算 = 账户余额 × 单笔风险比例
 * 2. 价格区间 = 最高价 − 最低价（自动取入场价/止损价中的高低值）
 * 3. 每手风险 = 价格区间 × 合约乘数
 * 4. 公式手数 = ⌊风险预算 ÷ 每手风险⌋
 * 5. 保证金手数 = ⌊余额 ÷ 一手保证金⌋，仅用于核对是否开得起
 *
 * 主结果 lots 始终等于公式手数；保证金不足时通过 marginShortfall 和
 * affordableLots 单独提示，不改变公式结果。
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
  if (!positive(riskPercent) || riskPercent >= 10) {
    errors.push("单笔风险应大于 0 且小于 10%");
  }
  if (!positive(entryPrice)) errors.push("请输入大于 0 的入场价格");
  if (!positive(stopPrice)) errors.push("请输入大于 0 的止损价格");
  if (!positive(contractMultiplier)) errors.push("合约乘数无效");
  if (!Number.isFinite(margin) || margin <= 0 || margin >= 1) {
    errors.push("保证金率应在 0–100% 之间");
  }

  const isLong = direction !== "short";
  let directionOk = true;
  if (positive(entryPrice) && positive(stopPrice)) {
    if (isLong && stopPrice > entryPrice) directionOk = false;
    if (!isLong && stopPrice < entryPrice) directionOk = false;
  }

  const stopDistance =
    Number.isFinite(entryPrice) && Number.isFinite(stopPrice)
      ? Math.abs(entryPrice - stopPrice)
      : 0;
  if (stopDistance === 0 && positive(entryPrice) && positive(stopPrice)) {
    errors.push("止损价不能等于入场价");
  }

  if (!directionOk && stopDistance > 0) {
    warnings.push("当前方向与止损位置不一致，已按“高价 − 低价”的绝对值计算，请确认交易方向。");
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
  const lots = isValid ? riskLots : 0;
  const affordableLots = Math.max(0, Math.min(riskLots, marginLots));
  const marginShortfall = isValid && riskLots > marginLots;
  const usedMargin = marginPerLot * lots;
  const actualRisk = riskPerLot * lots;
  const remaining = positive(accountBalance) ? accountBalance - usedMargin : 0;
  const requiredRiskPctForOneLot =
    positive(accountBalance) && riskPerLot > 0 ? (riskPerLot / accountBalance) * 100 : 0;

  let limitingFactor = "none";
  if (marginShortfall) limitingFactor = "margin";
  else if (riskLots < marginLots) limitingFactor = "risk";
  else if (riskLots > 0) limitingFactor = "both";

  if (isValid && riskLots === 0 && marginLots > 0) {
    warnings.push(
      requiredRiskPctForOneLot > 0
        ? `风险预算不足以覆盖 1 手；按当前余额，需把单笔风险提高到约 ${requiredRiskPctForOneLot.toFixed(2)}%。`
        : "风险预算不足以覆盖 1 手。",
    );
  }
  if (isValid && marginLots === 0 && marginPerLot > 0 && riskLots > 0) {
    warnings.push(
      `按风险公式可开 ${riskLots} 手，但账户余额不足以覆盖 1 手保证金；请增加保证金或降低交易手数。`,
    );
  }
  if (isValid && marginLots > 0 && marginLots < riskLots) {
    warnings.push(
      `按风险公式可开 ${riskLots} 手，但保证金仅够 ${marginLots} 手；实际下单应降至 ${marginLots} 手或增加保证金。`,
    );
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
    affordableLots,
    marginShortfall,
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
