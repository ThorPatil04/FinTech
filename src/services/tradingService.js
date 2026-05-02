// Real-time stock price simulation
const BASE_PRICES = {
  RELIANCE: 2847, TCS: 3892, INFY: 1724, HDFC: 1623, ICICI: 1089,
  WIPRO: 462, BAJFINANCE: 7210, AXISBANK: 1124, SBIN: 812, LT: 3541,
};

let prices = { ...BASE_PRICES };

export function getStockPrice(symbol) { return prices[symbol] || 1000; }
export function getAllPrices() { return { ...prices }; }
export function getAllSymbols() { return Object.keys(BASE_PRICES); }

// Simulate price movement ±0.5%
export function tickPrices() {
  Object.keys(prices).forEach(sym => {
    const delta = prices[sym] * (Math.random() * 0.01 - 0.005);
    prices[sym] = Math.max(1, +(prices[sym] + delta).toFixed(2));
  });
  return { ...prices };
}

// OHLC candlestick history (last 20 candles)
export function generateCandlestickData(symbol, candles = 20) {
  const data = [];
  let price = BASE_PRICES[symbol] || 1000;
  const now = Date.now();
  for (let i = candles; i >= 0; i--) {
    const open  = price;
    const high  = open * (1 + Math.random() * 0.015);
    const low   = open * (1 - Math.random() * 0.015);
    const close = low + Math.random() * (high - low);
    data.push({ time: new Date(now - i * 300000).toLocaleTimeString(), open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2), volume: Math.floor(Math.random() * 50000 + 10000) });
    price = close;
  }
  return data;
}
