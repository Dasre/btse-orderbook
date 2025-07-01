import { useRef, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import { TradeHistoryDataSchema } from "../types/orderbook";

interface UseTradeWebSocketProps {
  onTradeUpdate: (lastPrice: number, direction: string | null) => void;
}

export const useTradeWebSocket = ({
  onTradeUpdate,
}: UseTradeWebSocketProps) => {
  const prevLastPriceRef = useRef<number | null>(null);

  const handleMessage = useCallback(
    (message: unknown) => {
      const result = TradeHistoryDataSchema.safeParse(message);

      if (!result.success) {
        console.error("Invalid trade history data received:", result.error);
        return;
      }

      const { data, topic } = result.data;

      if (topic === "tradeHistoryApi" && data.length > 0) {
        const lastPrice = data[0].price;
        let direction: string | null = null;

        if (prevLastPriceRef.current !== null) {
          if (lastPrice > prevLastPriceRef.current) {
            direction = "up";
          } else if (lastPrice < prevLastPriceRef.current) {
            direction = "down";
          } else {
            direction = "same";
          }
        }
        prevLastPriceRef.current = lastPrice;

        onTradeUpdate(lastPrice, direction);
      }
    },
    [onTradeUpdate]
  );

  const ws = useWebSocket({
    url: "wss://ws.btse.com/ws/futures",
    subscribeMessage: {
      op: "subscribe",
      args: ["tradeHistoryApi:BTCPFC"],
    },
    onMessage: handleMessage,
    connectionName: "Trade WebSocket",
  });

  return {
    connect: ws.connect,
    disconnect: ws.disconnect,
  };
};
