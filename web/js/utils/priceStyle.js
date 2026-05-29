/**
 * Price Style Utilities
 * 漲跌停顏色邏輯 — 與 iOS TWStockHelpers.swift 同步
 * 計算 tick size → 漲跌停價 → 判斷是否觸及 → 回傳對應 Tailwind classes
 */

export function isETF(symbol) {
  if (!symbol) return false;
  const s = String(symbol).trim();
  if (s.startsWith('00') || s.startsWith('01')) return true;
  if (/[a-zA-Z]/.test(s)) return true;
  return false;
}

function getTickSize(price, etf) {
  if (etf) return price < 50 ? 0.01 : 0.05;
  if (price < 10) return 0.01;
  if (price < 50) return 0.05;
  if (price < 100) return 0.1;
  if (price < 500) return 0.5;
  if (price < 1000) return 1.0;
  return 5.0;
}

export function calculateLimitPrice(refPrice, etf = false) {
  if (!refPrice || refPrice <= 0) return { up: 0, down: 0 };
  const rawUp = refPrice * 1.10;
  const rawDown = refPrice * 0.90;
  const tickUp = getTickSize(rawUp, etf);
  const tickDown = getTickSize(rawDown, etf);
  const limitUp = Math.floor(rawUp / tickUp + 0.0001) * tickUp;
  const limitDown = Math.ceil(rawDown / tickDown - 0.0001) * tickDown;
  return { up: limitUp, down: limitDown };
}

/**
 * 回傳價格樣式 classes，與 iOS getPriceChangeStyle() 同步
 * @param {number} current - 當前價格
 * @param {number} reference - 參考價（前日收盤）
 * @param {string} [symbol=''] - 股票代號（用於判斷 ETF）
 * @returns {{ textClass: string, bgClass: string, isLimit: boolean }}
 */
export function getPriceChangeStyle(current, reference, symbol = '') {
  const p = parseFloat(current);
  const r = parseFloat(reference);
  if (isNaN(p) || isNaN(r) || r <= 0) {
    return { textClass: 'text-gray-900 dark:text-white', bgClass: '', isLimit: false };
  }

  const etf = isETF(symbol);
  const { up: limitUp, down: limitDown } = calculateLimitPrice(r, etf);

  const isLimitUp = p >= (limitUp - 0.001) && p > 0;
  const isLimitDown = p <= (limitDown + 0.001) && p > 0;

  if (isLimitUp) {
    return { textClass: 'text-white', bgClass: 'bg-red-500', isLimit: true };
  }
  if (isLimitDown) {
    return { textClass: 'text-white', bgClass: 'bg-green-500', isLimit: true };
  }

  const diff = p - r;
  if (diff > 0.0001) return { textClass: 'text-red-500', bgClass: '', isLimit: false };
  if (diff < -0.0001) return { textClass: 'text-green-500', bgClass: '', isLimit: false };
  return { textClass: 'text-gray-900 dark:text-white', bgClass: '', isLimit: false };
}

/**
 * 取得單一 CSS class string（向下相容，用於單純文字顏色場景）
 */
export function getPriceColor(current, reference, symbol = '') {
  const style = getPriceChangeStyle(current, reference, symbol);
  return style.bgClass ? `${style.textClass} ${style.bgClass}` : style.textClass;
}
