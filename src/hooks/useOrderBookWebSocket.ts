import { useRef, useCallback, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import { OrderBookDataSchema, type Quote } from "../types/orderbook";

export const useOrderBookWebSocket = () => {
  const [orderBook, setOrderBook] = useState<{ buy: Quote[]; sell: Quote[] }>({
    buy: [],
    sell: [],
  });

  const lastSeqNumRef = useRef<number | null>(null);
  const reconnectFunctionRef = useRef<(() => void) | null>(null);

  const mergeOrderBookUpdates = useCallback(
    (
      existing: Quote[],
      updates: { price: string; size: string }[]
    ): Quote[] => {
      const result = [...existing];

      updates.forEach((update) => {
        const existingIndex = result.findIndex(
          (quote) => quote.price === update.price
        );

        if (parseFloat(update.size) === 0) {
          if (existingIndex !== -1) {
            result.splice(existingIndex, 1);
          }
        } else {
          if (existingIndex !== -1) {
            result[existingIndex] = update;
          } else {
            result.push(update);
          }
        }
      });

      return result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    },
    []
  );

  const handleMessage = useCallback(
    (message: unknown) => {
      const result = OrderBookDataSchema.safeParse(message);

      if (!result.success) {
        console.error("Invalid order book data received:", result.error);
        return;
      }

      const { data } = result.data;

      if (result.data.topic !== "update:BTCPFC") return;

      if (data.type === "delta" && lastSeqNumRef.current !== null) {
        if (data.prevSeqNum !== lastSeqNumRef.current) {
          console.warn(
            `Sequence number mismatch. Expected ${lastSeqNumRef.current}, got ${data.prevSeqNum}. Re-subscribing...`
          );
          reconnectFunctionRef.current?.();
          return;
        }
      }

      lastSeqNumRef.current = data.seqNum;

      const buyUpdates = data.bids.map(([price, size]) => ({ price, size }));
      const sellUpdates = data.asks.map(([price, size]) => ({ price, size }));

      if (data.type === "snapshot") {
        setOrderBook({
          buy: buyUpdates.sort(
            (a, b) => parseFloat(b.price) - parseFloat(a.price)
          ),
          sell: sellUpdates.sort(
            (a, b) => parseFloat(b.price) - parseFloat(a.price)
          ),
        });
      } else if (data.type === "delta") {
        setOrderBook((prev) => ({
          buy: mergeOrderBookUpdates(prev.buy, buyUpdates),
          sell: mergeOrderBookUpdates(prev.sell, sellUpdates),
        }));
      }
    },
    [mergeOrderBookUpdates]
  );

  const handleConnect = useCallback(() => {
    lastSeqNumRef.current = null;
  }, []);

  const ws = useWebSocket({
    url: "wss://ws.btse.com/ws/oss/futures",
    subscribeMessage: {
      op: "subscribe",
      args: ["update:BTCPFC"],
    },
    onMessage: handleMessage,
    onConnect: handleConnect,
    connectionName: "OrderBook WebSocket",
  });

  reconnectFunctionRef.current = ws.connect;

  return {
    orderBook,
    connect: ws.connect,
    disconnect: ws.disconnect,
  };
};
