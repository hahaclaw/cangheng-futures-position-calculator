import { quoteSecId } from "./instruments.js";

/**
 * 通过东方财富的 JSONP 接口读取期货主连最新价。
 *
 * 静态站点没有后端，JSONP 可以避开浏览器跨域限制；接口异常时只 reject，
 * 不会影响用户手动输入价格。返回值中的 price 已按 f59 小数位还原。
 */
export function fetchMainQuote(instrument, { timeout = 7000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      reject(new Error("当前环境不支持行情请求"));
      return;
    }

    const callbackName = `__quote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const script = document.createElement("script");
    let settled = false;
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }
      script.remove();
    };

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };

    window[callbackName] = (payload) => {
      const data = payload && payload.data;
      if (!data || data.f43 === null || data.f43 === undefined || data.f43 === "-") {
        finish(reject, new Error("行情接口没有返回有效价格"));
        return;
      }

      const raw = Number(data.f43);
      const scale = Number(data.f59);
      const price = raw / 10 ** (Number.isFinite(scale) ? scale : instrument.decimals);
      if (!Number.isFinite(price) || price <= 0) {
        finish(reject, new Error("行情价格无效"));
        return;
      }

      finish(resolve, {
        price,
        code: data.f57 || instrument.code,
        name: data.f58 || instrument.name,
        fetchedAt: new Date(),
        source: "东方财富",
        secid: quoteSecId(instrument),
      });
    };

    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.onerror = () => finish(reject, new Error("行情接口连接失败"));
    const query = new URLSearchParams({
      secid: quoteSecId(instrument),
      fields: "f43,f57,f58,f59",
      cb: callbackName,
      _: String(Date.now()),
    });
    script.src = `https://push2.eastmoney.com/api/qt/stock/get?${query.toString()}`;
    document.head.appendChild(script);

    timer = setTimeout(() => finish(reject, new Error("行情请求超时")), timeout);
  });
}
