import { z } from "zod";

// WebSocket
const QuoteTupleSchema = z.tuple([z.string(), z.string()]);
const QuotesSchema = z.array(QuoteTupleSchema);

const OrderBookItemSchema = z.object({
  bids: QuotesSchema,
  asks: QuotesSchema,
  seqNum: z.number(),
  prevSeqNum: z.number(),
  type: z.enum(["snapshot", "delta"]),
  timestamp: z.number(),
  symbol: z.string(),
});

export const OrderBookDataSchema = z.object({
  topic: z.string(),
  data: OrderBookItemSchema,
});

const TradeHistoryItemSchema = z.object({
  symbol: z.string(),
  side: z.enum(["BUY", "SELL"]),
  size: z.number(),
  price: z.number(),
  tradeId: z.number(),
  timestamp: z.number(),
});

export const TradeHistoryDataSchema = z.object({
  topic: z.string(),
  data: z.array(TradeHistoryItemSchema),
});

export type QuoteTuple = z.infer<typeof QuoteTupleSchema>;
export type Quotes = z.infer<typeof QuotesSchema>;
export type OrderBookItem = z.infer<typeof OrderBookItemSchema>;
export type OrderBookWSResponse = z.infer<typeof OrderBookDataSchema>;
export type TradeHistoryItem = z.infer<typeof TradeHistoryItemSchema>;
export type TradeHistoryWSResponse = z.infer<typeof TradeHistoryDataSchema>;

// UI
export interface Quote {
  price: string;
  size: string;
}

export interface OrderBookData {
  buy: Quote[];
  sell: Quote[];
  lastPrice?: number;
}
