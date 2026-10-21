# 仓衡 · 期货仓位计算器

输入文华财经里的期货标的名称或代码，自动匹配交易单位，计算一手合约价值、一手保证金，并按固定比例风险法给出可交易手数。

**线上地址：** <https://hahaclaw.github.io/cangheng-futures-position-calculator/>

![示例](.github/social-preview.png)

## 功能

- **88 个境内期货品种**：上期所、大商所、郑商所、中金所、上期能源、广期所。
- **只算主力合约**：用户输入 `棕榈油2701`、`P2701` 或 `棕榈油主连` 时，统一匹配品种主力合约，页面明确标注“主力合约”。
- **智能匹配**：支持中文名、代码、别名、合约月份和主连后缀，如 `豆粕`、`M`、`M2601`、`豆粕主连`、`IF2601`。
- **一手成本**：选择品种后立即填入主力参考价，并突出显示“主力合约一手需要支付”的保证金；不需要先填止损价。随后展示交易单位、合约乘数与合约价值。
- **保证金率**：保证金占合约价值的比例，**不是手续费**。`合约价值 × 保证金率 = 一手保证金`，杠杆约等于 `1 ÷ 保证金率`；默认值为期货公司参考口径，可手动修改。
- **单笔风险**：支持 `0.01%–9.99%` 的精确输入和滑杆调节，严格限制为大于 0、小于 10%。
- **仓位计算**：严格按参考图的固定比例风险法计算手数；保证金上限单独核对并提示资金缺口。
- **主力行情**：选择品种后自动尝试读取东方财富主力（主连）最新价；接口不可用时自动使用最近一次主力参考价，并标注更新时间，仍可手动修改。
- **一键清空**：交易标的、账户余额、保证金率、风险、入场价和止损价输入框都带叉号，点击即可清空，不必逐字删除。
- **可复制明细**：一键复制完整的计算参数与结果，方便记录交易计划。
- **纯静态**：没有后端、没有数据库、没有构建依赖，可直接托管到 GitHub Pages / Cloudflare Pages。

## 算法

```text
风险预算   = 账户余额 × 单笔风险比例
价格区间   = 最高价 − 最低价
每手风险   = 价格区间 × 交易单位
公式手数   = ⌊风险预算 ÷ 每手风险⌋
保证金上限 = ⌊账户余额 ÷ 一手保证金⌋
```

“最高价 / 最低价”会自动取入场价与止损价中的较大值和较小值，所以无需区分谁高谁低。

参考图示例：

```text
50,000 × 2% = 1,000
(3,250 − 3,230) × 10 = 200
1,000 ÷ 200 = 5 手
```

主结果严格采用公式手数。保证金上限单独展示：如果公式手数超过保证金可覆盖的手数，页面会提示实际应降到几手，而不会悄悄改小公式结果。

## 本地运行

需要 Node.js 22+。

```bash
npm test
npm run build
npm run preview
```

打开 `http://127.0.0.1:4173`。`dist/` 是可直接部署的静态产物。

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库，将本目录推送到 `main` 分支。
2. 打开仓库 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
3. 推送后，`Deploy to GitHub Pages` 工作流会自动测试、构建并发布。
4. 站点地址通常是 `https://<用户名>.github.io/<仓库名>/`。

工作流文件：`.github/workflows/deploy.yml`。

## 部署到 Cloudflare Pages（备份站）

### 方式 A：连接 GitHub 仓库（推荐）

在 Cloudflare Dashboard 中进入 **Workers & Pages → Create → Pages → Connect to Git**：

- 选择同一个 GitHub 仓库。
- Framework preset：`None`
- Build command：`npm run build`
- Build output directory：`dist`

之后每次推送都会同时更新 GitHub Pages 与 Cloudflare Pages。`dist/_headers` 会为 Cloudflare 版本附加安全响应头。

### 方式 B：命令行直接上传

```bash
npm run build
npx wrangler pages deploy dist --project-name cangheng-futures-position-calculator
```

`wrangler.toml` 已声明 `pages_build_output_dir = "dist"`。

## 目录结构

```text
src/
  index.html
  assets/
    app.js            页面交互与渲染
    calculator.js     纯仓位计算逻辑
    instruments.js    88 个品种的合约参数
    reference-prices.js 主力参考价（自动生成）
    quotes.js         东方财富主力行情 JSONP
    styles.css
  _headers            Cloudflare Pages 安全头
scripts/
  build.mjs           复制静态资源到 dist
  fetch-reference-prices.mjs 更新主力参考价
  serve.mjs           本地静态预览
tests/
  calculator.test.mjs
  instruments.test.mjs
  reference-prices.test.mjs
.github/workflows/
  deploy.yml
wrangler.toml
```

## 数据说明

- 合约单位、报价单位、最小变动价位依据交易所合约规则整理。
- 参考保证金率取公开期货公司保证金公示口径（数据基准日 **2026-10-12**），通常高于交易所最低标准，且会随行情、合约月份和期货公司政策变化。保证金率不是手续费，计算公式为：`合约价值 × 保证金率 = 一手保证金`。
- 主力参考价由 `npm run prices` 从东方财富主力连续行情生成；页面优先取实时价，失败时使用参考价并标注更新时间。早籼稻、晚籼稻、粳稻、强麦、普麦、动力煤等无有效主力连续行情的品种需手动输入价格。
- 页面允许手动修改保证金率；实际交易前请以开户期货公司的实时标准为准。
- 手续费、滑点、交割规则未计入。
- 本项目是仓位规划工具，不构成投资建议。期货交易有杠杆，可能损失全部本金。
