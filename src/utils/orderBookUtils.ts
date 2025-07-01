import type { Quote } from "../types/orderbook";

// Type

type QuoteWithTotal = Quote & { total: number };
type DisplayQuote = QuoteWithTotal & { depth: number };
type AnimationMap = { [price: string]: string };
type QuoteMap = Map<string, string>;

// Helper Func

/**
 * 計算累計交易量
 * @param quotes - 報價列表
 * @returns 帶有累計交易量的報價列表
 */
const addCumulativeTotals = (quotes: Quote[]): QuoteWithTotal[] => {
  let cumulativeSize = 0;
  return quotes.map((quote) => {
    cumulativeSize += parseFloat(quote.size);
    return { ...quote, total: cumulativeSize };
  });
};

/**
 * 計算買賣報價列表中最大的總交易量
 * @param buysWithTotals - 帶有累計交易量的買入報價
 * @param sellsWithTotals - 帶有累計交易量的賣出報價
 * @returns 最大的總交易量
 */
const calculateMaxTotal = (
  buysWithTotals: QuoteWithTotal[],
  sellsWithTotals: QuoteWithTotal[]
): number => {
  return Math.max(
    buysWithTotals[buysWithTotals.length - 1]?.total || 0,
    sellsWithTotals[sellsWithTotals.length - 1]?.total || 0
  );
};

/**
 * 計算每個報價的量百分比
 * @param quotes - 帶有累計交易量的報價列表
 * @param maxTotal - 最大的總交易量
 * @returns 量百分比的報價列表
 */
const addDepthToQuotes = (
  quotes: QuoteWithTotal[],
  maxTotal: number
): DisplayQuote[] => {
  return quotes.map((quote) => ({
    ...quote,
    depth: maxTotal > 0 ? (quote.total / maxTotal) * 100 : 0,
  }));
};

// --- Animations ---

/**
 * 報價轉為Map格式
 * @param quotes - 報價陣列
 * @returns 價格為Key、數量為Value的 Map
 */
const createQuoteMap = (quotes: Quote[]): QuoteMap => {
  return new Map(quotes.map((q) => [q.price, q.size]));
};

/**
 * 比較兩個報價 Map 以識別變化（新增、數量增加、數量減少）
 * @param currentMap - 當前報價的 Map (price => size)
 * @param prevMap - 先前報價的 Map
 * @param side - 'buy' 或 'sell' 用於確定 CSS 類
 * @returns 一個將價格映射到已更改項目的 CSS 動畫類的 Map
 */
const getChangeAnimations = (
  currentMap: QuoteMap,
  prevMap: QuoteMap,
  side: "buy" | "sell"
): { rowAnimations: AnimationMap; cellAnimations: AnimationMap } => {
  const rowAnimations: AnimationMap = {};
  const cellAnimations: AnimationMap = {};
  const newFlashClass = side === "buy" ? "flash-new-buy" : "flash-new-sell";
  const sizeUpClass = "flash-size-up";
  const sizeDownClass = "flash-size-down";

  currentMap.forEach((size, price) => {
    const prevSizeStr = prevMap.get(price);

    if (prevSizeStr === undefined) {
      // 新報價：整行高亮
      rowAnimations[price] = newFlashClass;
    } else {
      // 現有報價：檢查數量變化
      const prevSize = parseFloat(prevSizeStr);
      const currentSize = parseFloat(size);
      if (currentSize > prevSize) {
        cellAnimations[price] = sizeUpClass; // 數量增加：單元格高亮
      } else if (currentSize < prevSize) {
        cellAnimations[price] = sizeDownClass; // 數量減少：單元格高亮
      }
    }
  });

  return { rowAnimations, cellAnimations };
};

// Main Func

/**
 * 原始買單與原始賣單轉換為UI顯示資料
 * @param buyData - 原始買單
 * @param sellData - 原始賣單
 * @returns 買入和賣出顯示資料
 */
export const formatQuotes = (
  buyData: Quote[],
  sellData: Quote[]
): { buy: DisplayQuote[]; sell: DisplayQuote[] } => {
  const sortedSells = [...sellData].sort(
    (a, b) => parseFloat(a.price) - parseFloat(b.price)
  );

  const buysWithTotals = addCumulativeTotals(buyData);
  const sellsWithTotals = addCumulativeTotals(sortedSells);

  const maxTotal = calculateMaxTotal(buysWithTotals, sellsWithTotals);

  const buyQuotes = addDepthToQuotes(buysWithTotals, maxTotal);
  const sellQuotes = addDepthToQuotes(sellsWithTotals, maxTotal).reverse();

  return { buy: buyQuotes, sell: sellQuotes };
};

/**
 * 比較先前和當前的報價，以確定哪些行需要閃爍動畫
 * @param currentBuys - 當前買單
 * @param currentSells - 當前賣單
 * @param prevBuys - 先前買單
 * @param prevSells - 先前賣單
 * @returns 一個將價格映射到 CSS 動畫類的物件
 */
export const calculateAnimations = (
  currentBuys: Quote[],
  currentSells: Quote[],
  prevBuys: Quote[],
  prevSells: Quote[]
): { rowAnimations: AnimationMap; cellAnimations: AnimationMap } => {
  const currentBuyMap = createQuoteMap(currentBuys);
  const prevBuyMap = createQuoteMap(prevBuys);
  const currentSellMap = createQuoteMap(currentSells);
  const prevSellMap = createQuoteMap(prevSells);

  const buyAnims = getChangeAnimations(currentBuyMap, prevBuyMap, "buy");
  const sellAnims = getChangeAnimations(currentSellMap, prevSellMap, "sell");

  return {
    rowAnimations: { ...buyAnims.rowAnimations, ...sellAnims.rowAnimations },
    cellAnimations: { ...buyAnims.cellAnimations, ...sellAnims.cellAnimations },
  };
};
