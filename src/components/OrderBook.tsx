import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import type { Quote, OrderBookData } from "../types/orderbook";
import { useOrderBookWebSocket } from "../hooks/useOrderBookWebSocket";
import { useTradeWebSocket } from "../hooks/useTradeWebSocket";
import { formatNumber } from "../utils/formatNumber";
import { formatQuotes, calculateAnimations } from "../utils/orderBookUtils";
import "./OrderBook.css";

const OrderBook: React.FC = () => {
  const {
    orderBook,
    connect: connectOrderBook,
    disconnect: disconnectOrderBook,
  } = useOrderBookWebSocket();

  const [lastPrice, setLastPrice] = useState(0);
  const [lastPriceDirection, setLastPriceDirection] = useState<string | null>(
    null
  );

  const [rowFlashAnimations, setRowFlashAnimations] = useState<{
    [key: string]: string;
  }>({});
  const [cellFlashAnimations, setCellFlashAnimations] = useState<{
    [key: string]: string;
  }>({});

  const animationTimers = useRef<{
    row: Map<string, number>;
    cell: Map<string, number>;
  }>({ row: new Map(), cell: new Map() });

  const handleTradeUpdate = useCallback(
    (price: number, direction: string | null) => {
      setLastPrice(price);
      if (direction) {
        setLastPriceDirection(direction);
      }
    },
    []
  );

  const { connect: connectTrade, disconnect: disconnectTrade } =
    useTradeWebSocket({ onTradeUpdate: handleTradeUpdate });

  const displayData: OrderBookData = useMemo(
    () => ({
      ...orderBook,
      lastPrice,
    }),
    [orderBook, lastPrice]
  );

  const prevQuotes = useRef<{ buy: Quote[]; sell: Quote[] }>({
    buy: [],
    sell: [],
  });

  useEffect(() => {
    connectOrderBook();
    return () => disconnectOrderBook();
  }, [connectOrderBook, disconnectOrderBook]);

  useEffect(() => {
    connectTrade();
    return () => disconnectTrade();
  }, [connectTrade, disconnectTrade]);

  // --- UI 動畫效果處理 --- //
  useEffect(() => {
    const { rowAnimations, cellAnimations } = calculateAnimations(
      displayData.buy,
      displayData.sell,
      prevQuotes.current.buy,
      prevQuotes.current.sell
    );

    prevQuotes.current = { buy: displayData.buy, sell: displayData.sell };

    // 整row動畫
    if (Object.keys(rowAnimations).length > 0) {
      setRowFlashAnimations((prev) => ({ ...prev, ...rowAnimations }));
      // 1.5s後清除動畫
      for (const price in rowAnimations) {
        const existingTimer = animationTimers.current.row.get(price);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        const timerId = window.setTimeout(() => {
          setRowFlashAnimations((prev) => {
            const { [price]: _, ...rest } = prev;
            return rest;
          });
          animationTimers.current.row.delete(price);
        }, 1500);
        animationTimers.current.row.set(price, timerId);
      }
    }

    // size動畫
    if (Object.keys(cellAnimations).length > 0) {
      setCellFlashAnimations((prev) => ({ ...prev, ...cellAnimations }));
      // 1.5s後清除動畫
      for (const price in cellAnimations) {
        const existingCellTimer = animationTimers.current.cell.get(price);
        if (existingCellTimer) {
          clearTimeout(existingCellTimer);
        }
        const cellTimerId = window.setTimeout(() => {
          setCellFlashAnimations((prev) => {
            const { [price]: _, ...rest } = prev;
            return rest;
          });
          animationTimers.current.cell.delete(price);
        }, 1500);
        animationTimers.current.cell.set(price, cellTimerId);
      }
    }
  }, [displayData.buy, displayData.sell]);

  useEffect(() => {
    const timersRef = animationTimers.current;

    return () => {
      timersRef.row.forEach((timerId) => clearTimeout(timerId));
      timersRef.cell.forEach((timerId) => clearTimeout(timerId));
      timersRef.row.clear();
      timersRef.cell.clear();
    };
  }, []);

  // Buy and sell data
  const { buyQuotes, sellQuotes } = useMemo(() => {
    const { buy: buyQuotes, sell: sellQuotes } = formatQuotes(
      displayData.buy,
      displayData.sell
    );
    return {
      buyQuotes: buyQuotes.slice(0, 8),
      sellQuotes: sellQuotes.slice(-8),
    };
  }, [displayData.buy, displayData.sell]);

  return (
    <div className="order-book">
      <div className="order-book-header">
        <h2>Order Book</h2>
      </div>

      <div className="order-book-table">
        <div className="order-book-headers">
          <span>Price (USD)</span>
          <span>Size</span>
          <span>Total</span>
        </div>

        {/* Sell Orders */}
        <div className="sell-orders">
          {sellQuotes.map((quote) => (
            <div
              key={quote.price}
              className={`quote-row ${rowFlashAnimations[quote.price] || ""}`}
            >
              <div
                className="depth-bar sell-depth"
                style={{ width: `${quote.depth}%` }}
              ></div>
              <span className="price sell-price">
                {formatNumber(quote.price, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span
                className={`size ${cellFlashAnimations[quote.price] || ""}`}
              >
                <span className="size-cell">
                  {formatNumber(quote.size, {})}
                </span>
              </span>
              <span className="total">{formatNumber(quote.total, {})}</span>
            </div>
          ))}
        </div>

        {/* Last Price */}
        {displayData.lastPrice && displayData.lastPrice > 0 && (
          <div className={`last-price ${lastPriceDirection || "same"}`}>
            <span>
              {formatNumber(displayData.lastPrice, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </span>
            {lastPriceDirection === "up" && <i className="arrow up-arrow" />}
            {lastPriceDirection === "down" && <i className="arrow" />}
          </div>
        )}

        {/* Buy Orders  */}
        <div className="buy-orders">
          {buyQuotes.map((quote) => (
            <div
              key={quote.price}
              className={`quote-row ${rowFlashAnimations[quote.price] || ""}`}
            >
              <div
                className="depth-bar buy-depth"
                style={{ width: `${quote.depth}%` }}
              ></div>
              <span className="price buy-price">
                {formatNumber(quote.price, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span
                className={`size ${cellFlashAnimations[quote.price] || ""}`}
              >
                <span className="size-cell">
                  {formatNumber(quote.size, {})}
                </span>
              </span>
              <span className="total">{formatNumber(quote.total, {})}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
